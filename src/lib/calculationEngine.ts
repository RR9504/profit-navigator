import type { AdminConfig, CustomerInput, ProfitabilityResult } from './types';

export function calculateProfitability(
  input: CustomerInput,
  config: AdminConfig
): ProfitabilityResult {
  // --- Basic metrics ---
  const listRate = config.listRates.mortgage[input.bindingPeriod] ?? 3.79;
  const ftpRate = config.ftpRates.mortgage[input.bindingPeriod] ?? 2.10;
  const customerRate = listRate + input.rateDeviation;
  const ltvPercent = input.propertyValue > 0 ? (input.loanAmount / input.propertyValue) * 100 : 0;
  const dtiPercent = input.monthlyIncome > 0 ? (input.loanAmount / (input.monthlyIncome * 12)) * 100 : 0;

  // Amortization requirement (Swedish rules)
  let amortizationRate = 0;
  if (ltvPercent > 70) amortizationRate = 0.02;
  else if (ltvPercent > 50) amortizationRate = 0.01;
  if (dtiPercent > 450) amortizationRate += 0.01;
  const monthlyAmortization = (input.loanAmount * amortizationRate) / 12;

  // --- Cross-selling ---
  const activeRules = config.crossSellingRules.filter(
    r => r.enabled && input.activeProducts.includes(r.id)
  );
  const totalCrossSellingDiscount = activeRules.reduce((sum, r) => sum + r.discountBps, 0) / 100;
  const maxAllowedDeviation = -totalCrossSellingDiscount;

  // --- FINANCING INCOME ---
  const grossInterestIncome = (input.loanAmount * customerRate) / 100;
  const ftpCost = -(input.loanAmount * ftpRate) / 100;
  const netInterestIncome = grossInterestIncome + ftpCost;

  const arrangementFee = config.kalkylPrices.loanSetupCost; // Amortized as yearly (simplification: one-time in year 1)

  // Equity FTP: return on capital allocated
  const riskWeightedAssets = input.loanAmount * (config.riskWeightPercent / 100);
  const allocatedCapital = riskWeightedAssets * (config.capitalRequirementPercent / 100);
  const equityFTP = allocatedCapital * (config.equityFTPRate / 100);

  const financingIncome = {
    grossInterestIncome,
    ftpCost,
    netInterestIncome,
    arrangementFee,
    equityFTP,
    total: netInterestIncome + arrangementFee + equityFTP,
  };

  // --- DEPOSIT INCOME ---
  const depositBalance = input.depositBalance + (input.salaryDeposit ? input.monthlyIncome * 3 : 0);
  const depositGrossInterest = -(depositBalance * config.depositInterestRate) / 100; // cost to bank
  const depositFTPIncome = (depositBalance * config.depositFTPRate) / 100; // internal income
  const depositIncome = {
    grossInterest: depositGrossInterest,
    ftpIncome: depositFTPIncome,
    total: depositFTPIncome + depositGrossInterest,
  };

  // --- ANCILLARY INCOME ---
  const crossSellingIncome = activeRules.reduce((sum, r) => sum + r.annualIncomeContribution, 0);
  const ancillaryIncome = {
    crossSellingIncome,
    total: crossSellingIncome,
  };

  // --- TOTAL INCOME ---
  const totalIncome = financingIncome.total + depositIncome.total + ancillaryIncome.total;

  // --- EXPENSES ---
  const distributionCost = config.kalkylPrices.loanSetupCost + config.kalkylPrices.loanClosingCost;
  const productCosts = config.kalkylPrices.loanAnnualCost;
  const overheadCosts = config.kalkylPrices.customerFixedCost + config.kalkylPrices.overheadPerCustomer;
  const totalExpenses = {
    distributionCost,
    productCosts,
    overheadCosts,
    total: distributionCost + productCosts + overheadCosts,
  };

  // --- BOTTOM LINE ---
  const operatingProfitBeforeTax = totalIncome - totalExpenses.total;
  const expectedLoss = (input.loanAmount * config.expectedLossRate) / 100;
  const taxCharge = Math.max(0, (operatingProfitBeforeTax - expectedLoss) * (config.taxRate / 100));
  const operatingProfitAfterTax = operatingProfitBeforeTax - expectedLoss - taxCharge;
  const costOfCapital = allocatedCapital * (config.costOfCapitalRate / 100);
  const economicProfit = operatingProfitAfterTax - costOfCapital;

  // --- KPIs ---
  const netMarginPercent = input.loanAmount > 0 ? (economicProfit / input.loanAmount) * 100 : 0;
  const returnOnCapital = allocatedCapital > 0 ? (operatingProfitAfterTax / allocatedCapital) * 100 : 0;
  const costIncomeRatio = totalIncome > 0 ? (totalExpenses.total / totalIncome) * 100 : 0;

  // --- SIGNAL ---
  let signal: 'green' | 'yellow' | 'red';
  let signalMessage: string;
  if (netMarginPercent >= config.thresholds.greenMinMarginPercent) {
    signal = 'green';
    signalMessage = 'Godkänd marginal — affären kan genomföras';
  } else if (netMarginPercent >= config.thresholds.yellowMinMarginPercent) {
    signal = 'yellow';
    signalMessage = 'Kräver chefsbeslut — marginalen under gränsvärde';
  } else {
    signal = 'red';
    signalMessage = 'Förlustaffär — kan inte godkännas utan åtgärd';
  }

  return {
    customerRate, listRate, rateDeviation: input.rateDeviation, maxAllowedDeviation,
    financingIncome, depositIncome, ancillaryIncome, totalIncome,
    totalExpenses,
    operatingProfitBeforeTax, expectedLoss, taxCharge, operatingProfitAfterTax,
    costOfCapital, economicProfit,
    netMarginPercent, returnOnCapital, costIncomeRatio,
    signal, signalMessage,
    ltvPercent, dtiPercent, monthlyAmortization,
  };
}

export function suggestOptimization(
  input: CustomerInput,
  config: AdminConfig
): string[] {
  const suggestions: string[] = [];
  const unusedRules = config.crossSellingRules.filter(
    r => r.enabled && !input.activeProducts.includes(r.id)
  );

  for (const rule of unusedRules) {
    if (rule.discountBps > 0) {
      suggestions.push(
        `Om kunden tecknar ${rule.name} kan räntan sänkas med ${(rule.discountBps / 100).toFixed(2)}% och intjäningen ökar med ${rule.annualIncomeContribution.toLocaleString('sv-SE')} kr/år.`
      );
    }
  }

  if (!input.salaryDeposit) {
    suggestions.push('Om kunden flyttar sin lön till banken ökar inlåningsvolymen och förbättrar inlåningsintjäningen.');
  }

  return suggestions;
}
