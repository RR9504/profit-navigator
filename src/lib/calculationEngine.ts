import type { AdminConfig, CustomerInput, ProfitabilityResult, StressScenario } from './types';

// =========================================
// Helpers
// =========================================

function lookupRiskWeight(ltvPercent: number, bands: AdminConfig['riskWeightBands']): number {
  const sorted = [...bands].sort((a, b) => a.maxLTV - b.maxLTV);
  for (const band of sorted) {
    if (ltvPercent <= band.maxLTV) return band.riskWeightPercent;
  }
  return sorted[sorted.length - 1]?.riskWeightPercent ?? 35;
}

function calcAmortizationRate(ltvPercent: number, dtiPercent: number): number {
  let rate = 0;
  if (ltvPercent > 70) rate = 0.02;
  else if (ltvPercent > 50) rate = 0.01;
  if (dtiPercent > 450) rate += 0.01;
  return rate;
}

function calcInterestDeduction(annualInterest: number, config: AdminConfig['kalpConfig']): number {
  if (annualInterest <= 0) return 0;
  if (annualInterest <= config.interestDeductionThreshold) {
    return annualInterest * (config.interestDeductionLow / 100);
  }
  const lowPart = config.interestDeductionThreshold * (config.interestDeductionLow / 100);
  const highPart = (annualInterest - config.interestDeductionThreshold) * (config.interestDeductionHigh / 100);
  return lowPart + highPart;
}

function lookupSavingsDiscount(volume: number, tiers: AdminConfig['savingsDiscountTiers']): number {
  for (const tier of tiers) {
    if (volume >= tier.minVolume && volume < tier.maxVolume) return tier.discountBps;
  }
  return 0;
}

function calcKALP(
  input: CustomerInput,
  config: AdminConfig,
  rateForCalc: number,
  amortizationRate: number,
) {
  const totalGrossMonthlyIncome = input.monthlyIncome + (input.coBorrower.enabled ? input.coBorrower.monthlyIncome : 0);
  const tax = totalGrossMonthlyIncome * (config.kalpConfig.effectiveTaxRate / 100);
  const netMonthlyIncome = totalGrossMonthlyIncome - tax;

  const adults = input.coBorrower.enabled ? 2 : 1;
  const adultCost = adults === 2 ? config.kalpConfig.coupleAdultMonthlyCost : config.kalpConfig.singleAdultMonthlyCost;
  const livingCosts = adultCost + input.numberOfChildren * config.kalpConfig.childMonthlyCost;

  const annualInterest = input.loanAmount * (rateForCalc / 100);
  const interestDeduction = calcInterestDeduction(annualInterest, config.kalpConfig);
  const interestCostMonthly = (annualInterest - interestDeduction) / 12;
  const amortizationMonthly = (input.loanAmount * amortizationRate) / 12;
  const driftCostMonthly = config.kalpConfig.housingCostMonthly;
  const housingCosts = interestCostMonthly + amortizationMonthly + driftCostMonthly;

  const otherLoanCosts = input.otherLoansMonthly;
  const surplus = netMonthlyIncome - livingCosts - housingCosts - otherLoanCosts;

  return {
    totalGrossMonthlyIncome,
    tax,
    netMonthlyIncome,
    livingCosts,
    housingCosts,
    interestCostMonthly,
    amortizationMonthly,
    driftCostMonthly,
    interestDeduction,
    otherLoanCosts,
    surplus,
    approved: surplus >= 0,
  };
}

// =========================================
// Main calculation
// =========================================

export function calculateProfitability(
  input: CustomerInput,
  config: AdminConfig,
): ProfitabilityResult {
  // --- Loan type config ---
  const loanTypeConfig = config.kalkylPrices.loanTypes.find(lt => lt.key === input.loanType)
    ?? config.kalkylPrices.loanTypes[0];

  // --- Rates ---
  const listRate = config.listRates.mortgage[input.bindingPeriod] ?? 3.79;
  const ftpRate = config.ftpRates.mortgage[input.bindingPeriod] ?? 2.10;

  // FTP green loan discount
  const ftpGreenDiscount = input.isGreenLoan ? config.regulatoryCosts.greenLoanFTPDiscount / 100 : 0;
  const effectiveFTPRate = ftpRate - ftpGreenDiscount;

  // Auto discount from active cross-selling products
  const activeRules = config.crossSellingRules.filter(
    r => r.enabled && input.activeProducts.includes(r.id),
  );
  const autoDiscountBps = activeRules.reduce((sum, r) => sum + r.discountBps, 0);
  const autoDiscount = autoDiscountBps / 100;

  // Savings volume discount
  const savingsDiscountBps = lookupSavingsDiscount(input.savingsVolume, config.savingsDiscountTiers);
  const savingsDiscount = savingsDiscountBps / 100;

  // Effective rate = list - product discounts - savings discount + manual deviation
  const effectiveCustomerRate = Math.max(0, listRate - autoDiscount - savingsDiscount + input.rateDeviation);
  const spread = effectiveCustomerRate - effectiveFTPRate;

  // --- Combined income ---
  const totalMonthlyIncome = input.monthlyIncome + (input.coBorrower.enabled ? input.coBorrower.monthlyIncome : 0);
  const totalAnnualIncome = totalMonthlyIncome * 12;

  // --- LTV & DTI ---
  const ltvPercent = input.propertyValue > 0 ? (input.loanAmount / input.propertyValue) * 100 : 0;
  const dtiPercent = totalAnnualIncome > 0 ? (input.loanAmount / totalAnnualIncome) * 100 : 0;

  // --- Amortization ---
  const amortizationRate = calcAmortizationRate(ltvPercent, dtiPercent);
  const monthlyAmortization = (input.loanAmount * amortizationRate) / 12;

  // --- Risk weight (scaled by loan type capital factor) ---
  const riskWeightPercent = lookupRiskWeight(ltvPercent, config.riskWeightBands);
  const riskWeightedAssets = input.loanAmount * (riskWeightPercent / 100) * loanTypeConfig.capitalAllocationFactor;
  const allocatedCapital = riskWeightedAssets * (config.capitalRequirementPercent / 100);

  // --- Expected loss (PD × LGD × EAD, scaled by loan type risk factor) ---
  const basePD = config.basePDPercent;
  let pdMultiplier = 1.0;
  if (ltvPercent > 85) pdMultiplier = 2.0;
  else if (ltvPercent > 70) pdMultiplier = 1.5;
  else if (ltvPercent > 50) pdMultiplier = 1.2;
  if (dtiPercent > 500) pdMultiplier *= 1.8;
  else if (dtiPercent > 450) pdMultiplier *= 1.4;
  else if (dtiPercent > 350) pdMultiplier *= 1.2;
  const adjustedPD = basePD * pdMultiplier;
  const lgd = config.lgdPercent;
  const ead = input.loanAmount;
  const annualEL = ead * (adjustedPD / 100) * (lgd / 100) * loanTypeConfig.expectedLossFactor;

  // --- ANNUAL INCOME ---
  // Income model: full_margin = own balance sheet, provision = Hypotek commission
  const netInterestIncome = loanTypeConfig.incomeModel === 'full_margin'
    ? input.loanAmount * (spread / 100)
    : input.loanAmount * (loanTypeConfig.provisionRatePercent / 100);
  const equityFTP = allocatedCapital * (config.equityFTPRate / 100);

  const depositBalance = input.depositBalance +
    (input.salaryDeposit ? input.monthlyIncome * config.salaryDepositBalanceMonths : 0);
  const depositGrossInterest = depositBalance * (config.depositInterestRate / 100);
  const depositFTPIncome = depositBalance * (config.depositFTPRate / 100);
  const depositNetIncome = depositFTPIncome - depositGrossInterest;

  let savingsIncome = 0;
  if (input.savingsType !== 'none' && input.savingsVolume > 0) {
    const margin = config.savingsMargins.find(m => m.type === input.savingsType);
    if (margin) savingsIncome = input.savingsVolume * (margin.marginPercent / 100);
  }

  const crossSellingIncome = activeRules.reduce((sum, r) => sum + r.annualIncomeContribution, 0);

  const totalAnnualIncomeFigure = netInterestIncome + equityFTP + depositNetIncome + savingsIncome + crossSellingIncome;

  const annualIncome = {
    netInterestIncome, equityFTP, depositNetIncome, savingsIncome, crossSellingIncome,
    total: totalAnnualIncomeFigure,
  };

  // --- ANNUAL EXPENSES ---
  // Loan annual cost (from loan type)
  const loanAnnualCost = loanTypeConfig.annualCost;
  const customerCost = config.kalkylPrices.customerFixedCost;
  const advisoryCost = config.kalkylPrices.advisoryCostPerSession;

  // OH model (activity-based per 2022 framework)
  const ohAncillary = (crossSellingIncome + savingsIncome) * (config.ohModel.ancillaryRate / 100);
  const ohFinancing = netInterestIncome * (config.ohModel.financingRate / 100);
  const ohExposure = input.loanAmount * (config.ohModel.exposureRate / 100);
  const ohCapital = allocatedCapital * (config.ohModel.capitalRate / 100);
  const overhead = ohAncillary + ohFinancing + ohExposure + ohCapital;

  // Regulatory costs
  const depositInsurance = depositBalance * (config.regulatoryCosts.depositInsuranceRate / 100);
  const bankTaxLending = input.loanAmount * (config.regulatoryCosts.bankTaxLendingRate / 100);
  const bankTaxDeposit = depositBalance * (config.regulatoryCosts.bankTaxDepositRate / 100);
  const resolutionFund = input.loanAmount * (config.regulatoryCosts.resolutionFundRate / 100);
  const totalRegulatory = depositInsurance + bankTaxLending + bankTaxDeposit + resolutionFund;

  // Product internal annual costs
  const productInternalCosts = activeRules.reduce((sum, r) => sum + r.internalAnnualCost, 0);

  const totalAnnualExpenses = loanAnnualCost + customerCost + advisoryCost + overhead + totalRegulatory + productInternalCosts;

  const annualExpenses = {
    loanAnnualCost,
    customerCost,
    advisoryCost,
    overhead,
    ohBreakdown: { ancillary: ohAncillary, financing: ohFinancing, exposure: ohExposure, capital: ohCapital },
    regulatoryCosts: {
      depositInsurance, bankTaxLending, bankTaxDeposit, resolutionFund,
      total: totalRegulatory,
    },
    productInternalCosts,
    total: totalAnnualExpenses,
  };

  // --- ONE-TIME ITEMS ---
  const productSetupCosts = activeRules.reduce((sum, r) => sum + r.internalSetupCost, 0);
  const oneTimeItems = {
    arrangementFee: config.kalkylPrices.arrangementFee,
    setupCost: loanTypeConfig.setupCost,
    closingCost: loanTypeConfig.closingCost,
    productSetupCosts,
    netUpfront: config.kalkylPrices.arrangementFee - loanTypeConfig.setupCost - productSetupCosts,
  };

  // --- ANNUAL P&L ---
  const annualOperatingProfit = totalAnnualIncomeFigure - totalAnnualExpenses - annualEL;
  const annualTax = Math.max(0, annualOperatingProfit * (config.taxRate / 100));
  const annualProfitAfterTax = annualOperatingProfit - annualTax;
  const annualCapitalCharge = allocatedCapital * (config.costOfCapitalRate / 100);
  const annualEconomicProfit = annualProfitAfterTax - annualCapitalCharge;

  // --- NPV ---
  const N = config.expectedLoanDurationYears;
  const r = config.costOfCapitalRate / 100;
  let totalNPV = oneTimeItems.netUpfront;
  for (let t = 1; t <= N; t++) {
    totalNPV += annualEconomicProfit / Math.pow(1 + r, t);
  }
  totalNPV -= oneTimeItems.closingCost / Math.pow(1 + r, N);
  const annualizedEP = N > 0 ? totalNPV * r / (1 - Math.pow(1 + r, -N)) : 0;

  // --- KPIs ---
  const netMarginPercent = input.loanAmount > 0 ? (annualEconomicProfit / input.loanAmount) * 100 : 0;
  const returnOnCapital = allocatedCapital > 0 ? (annualProfitAfterTax / allocatedCapital) * 100 : 0;
  const costIncomeRatio = totalAnnualIncomeFigure > 0 ? (totalAnnualExpenses / totalAnnualIncomeFigure) * 100 : 0;

  // --- KALP ---
  const kalp = calcKALP(input, config, effectiveCustomerRate, amortizationRate);

  // --- STRESS TEST ---
  const stressAddons = [1, 2, 3];
  const scenarios: StressScenario[] = stressAddons.map(addon => {
    const stressedRate = effectiveCustomerRate + addon;
    const stressedAnnualInterest = input.loanAmount * (stressedRate / 100);
    const stressedDeduction = calcInterestDeduction(stressedAnnualInterest, config.kalpConfig);
    const monthlyInterestCost = (stressedAnnualInterest - stressedDeduction) / 12;
    const monthlyTotal = monthlyInterestCost + monthlyAmortization + config.kalpConfig.housingCostMonthly;
    const stressedKalp = calcKALP(input, config, stressedRate, amortizationRate);
    return {
      rateAddon: addon, stressedRate, monthlyInterestCost, monthlyTotal,
      kalpSurplus: stressedKalp.surplus, approved: stressedKalp.surplus >= 0,
    };
  });
  const primaryStress = scenarios.find(s => s.rateAddon === config.kalpConfig.stressRateAddon) ?? scenarios[scenarios.length - 1];

  // --- SIGNAL ---
  let signal: 'green' | 'yellow' | 'red';
  let signalMessage: string;
  if (!kalp.approved) {
    signal = 'red';
    signalMessage = 'KALP underskott — kunden klarar inte boendekostnaden';
  } else if (!primaryStress.approved) {
    signal = netMarginPercent >= config.thresholds.greenMinMarginPercent ? 'yellow' : 'red';
    signalMessage = signal === 'yellow'
      ? 'Marginal OK men stresstest underkänt — kräver chefsbeslut'
      : 'Förlustaffär & stresstest underkänt';
  } else if (netMarginPercent >= config.thresholds.greenMinMarginPercent) {
    signal = 'green';
    signalMessage = 'Godkänd — marginal och stresstest OK';
  } else if (netMarginPercent >= config.thresholds.yellowMinMarginPercent) {
    signal = 'yellow';
    signalMessage = 'Kräver chefsbeslut — marginalen under gränsvärde';
  } else {
    signal = 'red';
    signalMessage = 'Förlustaffär — kan inte godkännas utan åtgärd';
  }

  return {
    listRate, autoDiscount, savingsDiscount, rateDeviation: input.rateDeviation,
    effectiveCustomerRate, ftpRate, ftpGreenDiscount, effectiveFTPRate, spread,
    ltvPercent, dtiPercent, riskWeightPercent, riskWeightedAssets, allocatedCapital,
    amortizationRate, monthlyAmortization,
    annualIncome, annualExpenses, oneTimeItems,
    expectedLoss: { basePD, adjustedPD, lgd, ead, annualEL },
    annualOperatingProfit, annualTax, annualProfitAfterTax, annualCapitalCharge, annualEconomicProfit,
    npv: { totalNPV, durationYears: N, annualizedEP },
    kalp, stressTest: { scenarios, primaryStress },
    netMarginPercent, returnOnCapital, costIncomeRatio,
    signal, signalMessage,
  };
}

export function suggestOptimization(
  input: CustomerInput,
  config: AdminConfig,
): string[] {
  const suggestions: string[] = [];
  const unusedRules = config.crossSellingRules.filter(
    r => r.enabled && !input.activeProducts.includes(r.id),
  );

  // Top 5 most impactful unused products
  const ranked = [...unusedRules]
    .filter(r => r.discountBps > 0 || r.annualIncomeContribution > 0)
    .sort((a, b) => (b.discountBps + b.annualIncomeContribution / 1000) - (a.discountBps + a.annualIncomeContribution / 1000))
    .slice(0, 5);

  for (const rule of ranked) {
    const parts: string[] = [];
    if (rule.discountBps > 0) parts.push(`-${(rule.discountBps / 100).toFixed(2)}% ränterabatt`);
    if (rule.annualIncomeContribution > 0) parts.push(`+${rule.annualIncomeContribution.toLocaleString('sv-SE')} kr/år`);
    suggestions.push(`${rule.name}: ${parts.join(', ')}.`);
  }

  if (!input.salaryDeposit) {
    suggestions.push('Löneinbetalning ökar inlåningsvolymen och ger bättre FTP-intjäning.');
  }

  if (input.savingsVolume > 0) {
    const currentBps = lookupSavingsDiscount(input.savingsVolume, config.savingsDiscountTiers);
    const nextTier = config.savingsDiscountTiers.find(t => t.minVolume > input.savingsVolume && t.discountBps > currentBps);
    if (nextTier) {
      suggestions.push(
        `Öka sparvolymen till ${(nextTier.minVolume / 1000).toFixed(0)}k kr för ytterligare ${nextTier.discountBps - currentBps} bps ränterabatt.`
      );
    }
  } else {
    suggestions.push('Sparande (fond, ISK, pension) ger marginalintäkt och kan ge ränterabatt vid större volymer.');
  }

  return suggestions;
}
