// ==========================================
// Profit Navigator — Type Definitions
// ==========================================

export interface ListRates {
  mortgage: Record<string, number>;
}

export interface FTPRates {
  mortgage: Record<string, number>;
}

export type ProductCategory =
  | 'insurance'
  | 'savings'
  | 'payment'
  | 'salary'
  | 'account'
  | 'pension'
  | 'digital'
  | 'credit'
  | 'other';

export interface CrossSellingRule {
  id: string;
  name: string;
  category: ProductCategory;
  discountBps: number;
  annualIncomeContribution: number;
  internalSetupCost: number;      // KRES internal cost
  internalAnnualCost: number;     // KRES annual cost
  enabled: boolean;
}

export type LoanType = 'hypotek' | 'bolan_bank';

export type IncomeModel = 'full_margin' | 'provision';

export interface LoanTypeConfig {
  key: LoanType;
  label: string;
  setupCost: number;
  annualCost: number;
  closingCost: number;
  incomeModel: IncomeModel;
  provisionRatePercent: number;     // Annual provision % of loan (for Hypotek)
  capitalAllocationFactor: number;  // 1.0 = full balance sheet, 0.0 = off-balance
  expectedLossFactor: number;       // 1.0 = full risk, 0.0 = no risk (Hypotek takes it)
}

export interface KalkylPrices {
  loanTypes: LoanTypeConfig[];
  customerFixedCost: number;
  arrangementFee: number;
  advisoryCostPerSession: number;  // Rådgivningskostnad
}

export interface Thresholds {
  greenMinMarginPercent: number;
  yellowMinMarginPercent: number;
}

export interface RiskWeightBand {
  maxLTV: number;
  riskWeightPercent: number;
}

export interface SavingsMargin {
  type: 'fund' | 'isk' | 'deposit' | 'pension';
  marginPercent: number;
  label: string;
}

export interface SavingsDiscountTier {
  minVolume: number;
  maxVolume: number;
  discountBps: number;
}

export interface OHModel {
  ancillaryRate: number;   // % of ancillary income
  financingRate: number;   // % of financing income
  exposureRate: number;    // % of loan volume (bps)
  capitalRate: number;     // % of allocated capital
}

export interface RegulatoryCosts {
  depositInsuranceRate: number;    // % of deposit volume
  bankTaxLendingRate: number;      // % of lending volume
  bankTaxDepositRate: number;      // % of deposit volume
  resolutionFundRate: number;      // % of lending volume
  greenLoanFTPDiscount: number;    // bps FTP discount for green loans
}

export interface KALPConfig {
  singleAdultMonthlyCost: number;
  coupleAdultMonthlyCost: number;
  childMonthlyCost: number;
  effectiveTaxRate: number;
  interestDeductionLow: number;
  interestDeductionHigh: number;
  interestDeductionThreshold: number;
  housingCostMonthly: number;
  stressRateAddon: number;
}

export interface AdminConfig {
  listRates: ListRates;
  ftpRates: FTPRates;
  crossSellingRules: CrossSellingRule[];
  kalkylPrices: KalkylPrices;
  thresholds: Thresholds;

  basePDPercent: number;
  lgdPercent: number;
  costOfCapitalRate: number;
  riskWeightBands: RiskWeightBand[];
  capitalRequirementPercent: number;
  taxRate: number;

  equityFTPRate: number;
  depositFTPRate: number;
  depositInterestRate: number;

  savingsMargins: SavingsMargin[];
  savingsDiscountTiers: SavingsDiscountTier[];

  ohModel: OHModel;
  regulatoryCosts: RegulatoryCosts;

  kalpConfig: KALPConfig;
  expectedLoanDurationYears: number;
  salaryDepositBalanceMonths: number;
}

export interface CoBorrower {
  enabled: boolean;
  monthlyIncome: number;
}

export interface CustomerInput {
  loanAmount: number;
  propertyValue: number;
  loanType: LoanType;
  isGreenLoan: boolean;
  bindingPeriod: string;
  rateDeviation: number;

  monthlyIncome: number;
  salaryDeposit: boolean;
  depositBalance: number;

  coBorrower: CoBorrower;
  numberOfChildren: number;

  activeProducts: string[];

  savingsVolume: number;
  savingsType: 'fund' | 'isk' | 'deposit' | 'pension' | 'none';

  otherLoansMonthly: number;
}

// --- Results ---

export interface StressScenario {
  rateAddon: number;
  stressedRate: number;
  monthlyInterestCost: number;
  monthlyTotal: number;
  kalpSurplus: number;
  approved: boolean;
}

export interface ProfitabilityResult {
  listRate: number;
  autoDiscount: number;
  savingsDiscount: number;
  rateDeviation: number;
  effectiveCustomerRate: number;
  ftpRate: number;
  ftpGreenDiscount: number;
  effectiveFTPRate: number;
  spread: number;

  ltvPercent: number;
  dtiPercent: number;
  riskWeightPercent: number;
  riskWeightedAssets: number;
  allocatedCapital: number;

  amortizationRate: number;
  monthlyAmortization: number;

  annualIncome: {
    netInterestIncome: number;
    equityFTP: number;
    depositNetIncome: number;
    savingsIncome: number;
    crossSellingIncome: number;
    total: number;
  };

  annualExpenses: {
    loanAnnualCost: number;
    customerCost: number;
    advisoryCost: number;
    overhead: number;
    ohBreakdown: {
      ancillary: number;
      financing: number;
      exposure: number;
      capital: number;
    };
    regulatoryCosts: {
      depositInsurance: number;
      bankTaxLending: number;
      bankTaxDeposit: number;
      resolutionFund: number;
      total: number;
    };
    productInternalCosts: number;
    total: number;
  };

  oneTimeItems: {
    arrangementFee: number;
    setupCost: number;
    closingCost: number;
    productSetupCosts: number;
    netUpfront: number;
  };

  expectedLoss: {
    basePD: number;
    adjustedPD: number;
    lgd: number;
    ead: number;
    annualEL: number;
  };

  annualOperatingProfit: number;
  annualTax: number;
  annualProfitAfterTax: number;
  annualCapitalCharge: number;
  annualEconomicProfit: number;

  npv: {
    totalNPV: number;
    durationYears: number;
    annualizedEP: number;
  };

  kalp: {
    totalGrossMonthlyIncome: number;
    tax: number;
    netMonthlyIncome: number;
    livingCosts: number;
    housingCosts: number;
    interestCostMonthly: number;
    amortizationMonthly: number;
    driftCostMonthly: number;
    interestDeduction: number;
    otherLoanCosts: number;
    surplus: number;
    approved: boolean;
  };

  stressTest: {
    scenarios: StressScenario[];
    primaryStress: StressScenario;
  };

  netMarginPercent: number;
  returnOnCapital: number;
  costIncomeRatio: number;

  signal: 'green' | 'yellow' | 'red';
  signalMessage: string;
}

export interface Scenario {
  id: string;
  name: string;
  timestamp: number;
  input: CustomerInput;
  result: ProfitabilityResult;
}

export const BINDING_PERIODS: { key: string; label: string }[] = [
  { key: '3m', label: '3 mån' },
  { key: '1y', label: '1 år' },
  { key: '2y', label: '2 år' },
  { key: '3y', label: '3 år' },
  { key: '4y', label: '4 år' },
  { key: '5y', label: '5 år' },
  { key: '6y', label: '6 år' },
  { key: '7y', label: '7 år' },
  { key: '8y', label: '8 år' },
  { key: '9y', label: '9 år' },
  { key: '10y', label: '10 år' },
];

export const PRODUCT_CATEGORIES: { key: ProductCategory; label: string }[] = [
  { key: 'salary', label: 'Lön' },
  { key: 'insurance', label: 'Försäkring' },
  { key: 'savings', label: 'Sparande' },
  { key: 'pension', label: 'Pension' },
  { key: 'payment', label: 'Kort & Betalning' },
  { key: 'account', label: 'Konto' },
  { key: 'digital', label: 'Digitalt' },
  { key: 'credit', label: 'Kredit' },
  { key: 'other', label: 'Övrigt' },
];
