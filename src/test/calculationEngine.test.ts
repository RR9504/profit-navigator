import { describe, it, expect } from 'vitest';
import { calculateProfitability, suggestOptimization } from '../lib/calculationEngine';
import { defaultConfig } from '../lib/defaultConfig';
import type { CustomerInput, AdminConfig } from '../lib/types';

const baseInput: CustomerInput = {
  loanAmount: 2500000,
  propertyValue: 3500000,
  loanType: 'hypotek',
  isGreenLoan: false,
  bindingPeriod: '3m',
  rateDeviation: 0,
  monthlyIncome: 50000,
  salaryDeposit: false,
  depositBalance: 100000,
  coBorrower: { enabled: false, monthlyIncome: 0 },
  numberOfChildren: 0,
  activeProducts: [],
  savingsVolume: 0,
  savingsType: 'none',
  otherLoansMonthly: 0,
};

function calc(overrides: Partial<CustomerInput> = {}, configOverrides: Partial<AdminConfig> = {}) {
  return calculateProfitability(
    { ...baseInput, ...overrides },
    { ...defaultConfig, ...configOverrides },
  );
}

describe('Basic calculations', () => {
  it('produces a valid result with defaults', () => {
    const r = calc();
    expect(r.effectiveCustomerRate).toBeCloseTo(3.79);
    expect(r.listRate).toBe(3.79);
    expect(r.ftpRate).toBe(2.10);
    expect(r.ltvPercent).toBeCloseTo(71.43, 1);
    expect(r.dtiPercent).toBeCloseTo(416.67, 0);
    expect(r.signal).toBeDefined();
    expect(['green', 'yellow', 'red']).toContain(r.signal);
  });

  it('has positive total income with defaults', () => {
    const r = calc();
    expect(r.annualIncome.total).toBeGreaterThan(0);
  });

  it('has positive total expenses with defaults', () => {
    const r = calc();
    expect(r.annualExpenses.total).toBeGreaterThan(0);
  });

  it('NPV duration matches config', () => {
    const r = calc();
    expect(r.npv.durationYears).toBe(defaultConfig.expectedLoanDurationYears);
  });
});

describe('Rate deviation affects P&L', () => {
  it('negative deviation reduces income (Hypotek)', () => {
    const base = calc();
    const discounted = calc({ rateDeviation: -0.50 });
    expect(discounted.effectiveCustomerRate).toBeLessThan(base.effectiveCustomerRate);
    expect(discounted.annualIncome.netInterestIncome).toBeLessThan(base.annualIncome.netInterestIncome);
    expect(discounted.annualEconomicProfit).toBeLessThan(base.annualEconomicProfit);
  });

  it('positive deviation increases income (Hypotek)', () => {
    const base = calc();
    const premium = calc({ rateDeviation: 0.20 });
    expect(premium.effectiveCustomerRate).toBeGreaterThan(base.effectiveCustomerRate);
    expect(premium.annualIncome.netInterestIncome).toBeGreaterThan(base.annualIncome.netInterestIncome);
    expect(premium.annualEconomicProfit).toBeGreaterThan(base.annualEconomicProfit);
  });

  it('rate deviation affects KALP', () => {
    const base = calc();
    const higher = calc({ rateDeviation: 0.50 });
    expect(higher.kalp.surplus).toBeLessThan(base.kalp.surplus);
  });

  it('rate deviation affects stress test', () => {
    const base = calc();
    const higher = calc({ rateDeviation: 0.50 });
    expect(higher.stressTest.primaryStress.kalpSurplus).toBeLessThan(base.stressTest.primaryStress.kalpSurplus);
  });
});

describe('Hypotek vs Bolån i banken', () => {
  it('Bolån i banken has higher net interest income (full margin)', () => {
    const hypotek = calc({ loanType: 'hypotek' });
    const bolan = calc({ loanType: 'bolan_bank' });
    expect(bolan.annualIncome.netInterestIncome).toBeGreaterThan(hypotek.annualIncome.netInterestIncome);
  });

  it('Bolån i banken has higher allocated capital', () => {
    const hypotek = calc({ loanType: 'hypotek' });
    const bolan = calc({ loanType: 'bolan_bank' });
    expect(bolan.allocatedCapital).toBeGreaterThan(hypotek.allocatedCapital);
  });

  it('Bolån i banken has higher expected loss', () => {
    const hypotek = calc({ loanType: 'hypotek' });
    const bolan = calc({ loanType: 'bolan_bank' });
    expect(bolan.expectedLoss.annualEL).toBeGreaterThan(hypotek.expectedLoss.annualEL);
  });

  it('Hypotek provision decreases when discount is given', () => {
    const noDiscount = calc({ loanType: 'hypotek', rateDeviation: 0 });
    const withDiscount = calc({ loanType: 'hypotek', rateDeviation: -0.30 });
    expect(withDiscount.annualIncome.netInterestIncome).toBeLessThan(noDiscount.annualIncome.netInterestIncome);
    // Provision should decrease by exactly 0.30% of loan amount
    const expectedDiff = 2500000 * 0.30 / 100;
    const actualDiff = noDiscount.annualIncome.netInterestIncome - withDiscount.annualIncome.netInterestIncome;
    expect(actualDiff).toBeCloseTo(expectedDiff, 0);
  });
});

describe('LTV affects risk weight', () => {
  it('higher LTV = higher risk weight', () => {
    const low = calc({ loanAmount: 1500000, propertyValue: 3500000 }); // LTV ~43%
    const high = calc({ loanAmount: 3000000, propertyValue: 3500000 }); // LTV ~86%
    expect(high.riskWeightPercent).toBeGreaterThan(low.riskWeightPercent);
  });

  it('higher LTV = higher expected loss (PD multiplier)', () => {
    const low = calc({ loanAmount: 1500000, propertyValue: 3500000 });
    const high = calc({ loanAmount: 3000000, propertyValue: 3500000 });
    expect(high.expectedLoss.adjustedPD).toBeGreaterThan(low.expectedLoss.adjustedPD);
  });
});

describe('Amortization rules', () => {
  it('LTV > 70% requires 2% amortization', () => {
    const r = calc({ loanAmount: 2500000, propertyValue: 3500000 }); // LTV 71.4%
    expect(r.amortizationRate).toBe(0.02);
  });

  it('LTV 50-70% requires 1% amortization', () => {
    const r = calc({ loanAmount: 2000000, propertyValue: 3500000 }); // LTV 57%
    expect(r.amortizationRate).toBe(0.01);
  });

  it('LTV < 50% requires no amortization', () => {
    const r = calc({ loanAmount: 1500000, propertyValue: 3500000 }); // LTV 43%
    expect(r.amortizationRate).toBe(0);
  });

  it('DTI > 450% adds 1% extra amortization', () => {
    const lowDTI = calc({ monthlyIncome: 60000 }); // DTI = 2.5M / 720k = 347%
    const highDTI = calc({ monthlyIncome: 40000 }); // DTI = 2.5M / 480k = 521%
    expect(highDTI.amortizationRate).toBeGreaterThan(lowDTI.amortizationRate);
  });
});

describe('Co-borrower affects DTI and KALP', () => {
  it('co-borrower reduces DTI', () => {
    const solo = calc();
    const co = calc({ coBorrower: { enabled: true, monthlyIncome: 40000 } });
    expect(co.dtiPercent).toBeLessThan(solo.dtiPercent);
  });

  it('co-borrower improves KALP surplus', () => {
    const solo = calc();
    const co = calc({ coBorrower: { enabled: true, monthlyIncome: 40000 } });
    expect(co.kalp.surplus).toBeGreaterThan(solo.kalp.surplus);
  });

  it('co-borrower increases living costs', () => {
    const solo = calc();
    const co = calc({ coBorrower: { enabled: true, monthlyIncome: 40000 } });
    expect(co.kalp.livingCosts).toBeGreaterThan(solo.kalp.livingCosts);
  });
});

describe('Children affect KALP', () => {
  it('more children reduces KALP surplus', () => {
    const noKids = calc({ numberOfChildren: 0 });
    const twoKids = calc({ numberOfChildren: 2 });
    expect(twoKids.kalp.surplus).toBeLessThan(noKids.kalp.surplus);
    expect(twoKids.kalp.livingCosts).toBe(noKids.kalp.livingCosts + 2 * defaultConfig.kalpConfig.childMonthlyCost);
  });
});

describe('Cross-selling products', () => {
  it('active products give auto rate discount', () => {
    const noProducts = calc();
    const withProducts = calc({ activeProducts: ['salary', 'home-insurance-villa'] });
    expect(withProducts.autoDiscount).toBeGreaterThan(0);
    expect(withProducts.effectiveCustomerRate).toBeLessThan(noProducts.effectiveCustomerRate);
  });

  it('active products generate cross-selling income', () => {
    const noProducts = calc();
    const withProducts = calc({ activeProducts: ['salary', 'home-insurance-villa'] });
    expect(withProducts.annualIncome.crossSellingIncome).toBeGreaterThan(0);
    expect(noProducts.annualIncome.crossSellingIncome).toBe(0);
  });

  it('active products add internal costs', () => {
    const noProducts = calc();
    const withProducts = calc({ activeProducts: ['card-mastercard', 'card-visa'] });
    expect(withProducts.annualExpenses.productInternalCosts).toBeGreaterThan(0);
    expect(noProducts.annualExpenses.productInternalCosts).toBe(0);
  });

  it('active products add setup costs in one-time items', () => {
    const withProducts = calc({ activeProducts: ['card-mastercard'] });
    expect(withProducts.oneTimeItems.productSetupCosts).toBe(135);
  });
});

describe('Savings volume', () => {
  it('savings volume generates margin income', () => {
    const noSavings = calc();
    const withSavings = calc({ savingsVolume: 500000, savingsType: 'fund' });
    expect(withSavings.annualIncome.savingsIncome).toBeGreaterThan(0);
    expect(noSavings.annualIncome.savingsIncome).toBe(0);
  });

  it('savings volume gives rate discount at tiers', () => {
    const small = calc({ savingsVolume: 50000 });
    const large = calc({ savingsVolume: 1000000 });
    expect(large.savingsDiscount).toBeGreaterThan(small.savingsDiscount);
    expect(large.effectiveCustomerRate).toBeLessThan(small.effectiveCustomerRate);
  });

  it('fund margin = 0.80% on volume', () => {
    const r = calc({ savingsVolume: 1000000, savingsType: 'fund' });
    expect(r.annualIncome.savingsIncome).toBeCloseTo(8000, 0);
  });
});

describe('Deposit balance', () => {
  it('salary deposit increases effective deposit balance', () => {
    const noSalary = calc({ salaryDeposit: false });
    const withSalary = calc({ salaryDeposit: true });
    expect(withSalary.annualIncome.depositNetIncome).toBeGreaterThan(noSalary.annualIncome.depositNetIncome);
  });

  it('higher deposit balance increases deposit income', () => {
    const low = calc({ depositBalance: 50000 });
    const high = calc({ depositBalance: 500000 });
    expect(high.annualIncome.depositNetIncome).toBeGreaterThan(low.annualIncome.depositNetIncome);
  });

  it('deposit balance affects regulatory costs', () => {
    const low = calc({ depositBalance: 50000 });
    const high = calc({ depositBalance: 500000 });
    expect(high.annualExpenses.regulatoryCosts.depositInsurance).toBeGreaterThan(low.annualExpenses.regulatoryCosts.depositInsurance);
  });
});

describe('Green loan', () => {
  it('green loan gives FTP discount', () => {
    const normal = calc({ isGreenLoan: false });
    const green = calc({ isGreenLoan: true });
    expect(green.ftpGreenDiscount).toBeGreaterThan(0);
    expect(green.effectiveFTPRate).toBeLessThan(normal.effectiveFTPRate);
    expect(green.spread).toBeGreaterThan(normal.spread);
  });
});

describe('Binding period', () => {
  it('different binding period changes list rate and FTP', () => {
    const short = calc({ bindingPeriod: '3m' });
    const long = calc({ bindingPeriod: '5y' });
    expect(short.listRate).not.toBe(long.listRate);
    expect(short.ftpRate).not.toBe(long.ftpRate);
  });
});

describe('OH model (activity-based)', () => {
  it('OH has all four components', () => {
    const r = calc({ activeProducts: ['salary'] });
    expect(r.annualExpenses.ohBreakdown.financing).toBeGreaterThan(0);
    expect(r.annualExpenses.ohBreakdown.exposure).toBeGreaterThan(0);
    expect(r.annualExpenses.ohBreakdown.capital).toBeGreaterThanOrEqual(0);
  });

  it('OH increases with ancillary income when products active', () => {
    const noProducts = calc();
    const withProducts = calc({ activeProducts: ['salary', 'home-insurance-villa', 'car-insurance'] });
    expect(withProducts.annualExpenses.ohBreakdown.ancillary).toBeGreaterThan(noProducts.annualExpenses.ohBreakdown.ancillary);
  });

  it('OH exposure scales with loan amount', () => {
    const small = calc({ loanAmount: 1000000 });
    const large = calc({ loanAmount: 5000000 });
    expect(large.annualExpenses.ohBreakdown.exposure).toBeGreaterThan(small.annualExpenses.ohBreakdown.exposure);
  });
});

describe('Regulatory costs', () => {
  it('bank tax lending scales with loan amount', () => {
    const small = calc({ loanAmount: 1000000 });
    const large = calc({ loanAmount: 5000000 });
    expect(large.annualExpenses.regulatoryCosts.bankTaxLending).toBeGreaterThan(small.annualExpenses.regulatoryCosts.bankTaxLending);
  });

  it('resolution fund scales with loan amount', () => {
    const small = calc({ loanAmount: 1000000 });
    const large = calc({ loanAmount: 5000000 });
    expect(large.annualExpenses.regulatoryCosts.resolutionFund).toBeGreaterThan(small.annualExpenses.regulatoryCosts.resolutionFund);
  });
});

describe('KALP calculation', () => {
  it('KALP uses correct tax rate', () => {
    const r = calc();
    expect(r.kalp.tax).toBeCloseTo(r.kalp.totalGrossMonthlyIncome * defaultConfig.kalpConfig.effectiveTaxRate / 100);
  });

  it('KALP includes interest deduction', () => {
    const r = calc();
    expect(r.kalp.interestDeduction).toBeGreaterThan(0);
  });

  it('KALP interest deduction uses 30%/21% threshold correctly', () => {
    // 2.5M × 3.79% = 94,750 kr annual interest (under 100k threshold)
    const r = calc();
    const expectedDeduction = 94750 * 0.30; // all at 30%
    expect(r.kalp.interestDeduction).toBeCloseTo(expectedDeduction, -2);
  });

  it('KALP interest deduction above threshold uses both rates', () => {
    // 4M × 3.79% = 151,600 kr annual interest (over 100k threshold)
    const r = calc({ loanAmount: 4000000, propertyValue: 6000000 });
    const expected = 100000 * 0.30 + 51600 * 0.21;
    expect(r.kalp.interestDeduction).toBeCloseTo(expected, -2);
  });

  it('other loans reduce KALP surplus', () => {
    const noLoans = calc({ otherLoansMonthly: 0 });
    const withLoans = calc({ otherLoansMonthly: 5000 });
    expect(withLoans.kalp.surplus).toBe(noLoans.kalp.surplus - 5000);
  });
});

describe('Stress test', () => {
  it('generates 3 scenarios (+1, +2, +3)', () => {
    const r = calc();
    expect(r.stressTest.scenarios).toHaveLength(3);
    expect(r.stressTest.scenarios[0].rateAddon).toBe(1);
    expect(r.stressTest.scenarios[1].rateAddon).toBe(2);
    expect(r.stressTest.scenarios[2].rateAddon).toBe(3);
  });

  it('stressed rate = effective rate + addon', () => {
    const r = calc();
    for (const s of r.stressTest.scenarios) {
      expect(s.stressedRate).toBeCloseTo(r.effectiveCustomerRate + s.rateAddon);
    }
  });

  it('higher stress = lower KALP surplus', () => {
    const r = calc();
    for (let i = 1; i < r.stressTest.scenarios.length; i++) {
      expect(r.stressTest.scenarios[i].kalpSurplus).toBeLessThan(r.stressTest.scenarios[i - 1].kalpSurplus);
    }
  });

  it('primary stress is +3pp', () => {
    const r = calc();
    expect(r.stressTest.primaryStress.rateAddon).toBe(3);
  });
});

describe('NPV calculation', () => {
  it('positive EP = positive NPV', () => {
    const r = calc({ loanType: 'bolan_bank' });
    if (r.annualEconomicProfit > 0) {
      expect(r.npv.totalNPV).toBeGreaterThan(0);
    }
  });

  it('NPV includes one-time items', () => {
    // NPV should differ from simple EP × years because of one-time items
    const r = calc();
    const simpleMultiple = r.annualEconomicProfit * r.npv.durationYears;
    expect(r.npv.totalNPV).not.toBeCloseTo(simpleMultiple, 0);
  });
});

describe('Signal logic', () => {
  it('KALP deficit always gives red', () => {
    // Very high loan, low income → KALP deficit
    const r = calc({ loanAmount: 8000000, propertyValue: 10000000, monthlyIncome: 30000 });
    if (!r.kalp.approved) {
      expect(r.signal).toBe('red');
    }
  });

  it('good margin + stress OK = green', () => {
    // Low loan, high income → everything good
    const r = calc({ loanAmount: 1000000, propertyValue: 3500000, monthlyIncome: 80000, loanType: 'bolan_bank' });
    if (r.kalp.approved && r.stressTest.primaryStress.approved && r.netMarginPercent >= defaultConfig.thresholds.greenMinMarginPercent) {
      expect(r.signal).toBe('green');
    }
  });
});

describe('Optimization suggestions', () => {
  it('suggests unused products', () => {
    const suggestions = suggestOptimization(baseInput, defaultConfig);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('fewer suggestions when more products active', () => {
    const few = suggestOptimization(baseInput, defaultConfig);
    const many = suggestOptimization(
      { ...baseInput, activeProducts: ['salary', 'home-insurance-villa', 'car-insurance', 'pension-privat', 'card-visa'] },
      defaultConfig,
    );
    expect(many.length).toBeLessThanOrEqual(few.length);
  });

  it('suggests salary deposit if not active', () => {
    const suggestions = suggestOptimization({ ...baseInput, salaryDeposit: false }, defaultConfig);
    expect(suggestions.some(s => s.toLowerCase().includes('lön'))).toBe(true);
  });
});

describe('Edge cases', () => {
  it('zero loan amount does not crash', () => {
    const r = calc({ loanAmount: 0 });
    expect(r.netMarginPercent).toBe(0);
    expect(r.annualIncome.netInterestIncome).toBe(0);
  });

  it('zero income does not crash', () => {
    const r = calc({ monthlyIncome: 0 });
    expect(r.dtiPercent).toBe(0);
    expect(r.kalp.netMonthlyIncome).toBe(0);
  });

  it('zero property value does not crash', () => {
    const r = calc({ propertyValue: 0 });
    expect(r.ltvPercent).toBe(0);
  });

  it('very large loan does not crash', () => {
    const r = calc({ loanAmount: 50000000, propertyValue: 60000000 });
    expect(r.annualIncome.total).toBeDefined();
    expect(r.npv.totalNPV).toBeDefined();
  });

  it('max rate deviation does not produce negative rate', () => {
    const r = calc({ rateDeviation: -1.5 });
    expect(r.effectiveCustomerRate).toBeGreaterThanOrEqual(0);
  });
});

describe('Loan amount affects everything', () => {
  it('doubling loan doubles NII proportionally', () => {
    const small = calc({ loanAmount: 1000000, propertyValue: 2000000 });
    const large = calc({ loanAmount: 2000000, propertyValue: 4000000 });
    // Same LTV so same rates, NII should scale linearly
    expect(large.annualIncome.netInterestIncome / small.annualIncome.netInterestIncome).toBeCloseTo(2, 0);
  });
});
