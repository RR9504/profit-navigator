// ==========================================
// Sparbank Kundkalkyl - Type Definitions
// ==========================================

// Admin-configurable parameters
export interface ListRates {
  mortgage: Record<string, number>; // bindningstid -> listränta (e.g., "3m": 3.79)
}

export interface FTPRates {
  mortgage: Record<string, number>; // bindningstid -> FTP-ränta
}

export interface CrossSellingRule {
  id: string;
  name: string;
  category: 'insurance' | 'savings' | 'payment' | 'salary' | 'other';
  discountBps: number; // rabatt i baspunkter
  annualIncomeContribution: number; // årlig intjäning i SEK
  enabled: boolean;
}

export interface KalkylPrices {
  loanSetupCost: number;       // Bolån upplägg
  loanAnnualCost: number;      // Årskostnad krediter
  loanClosingCost: number;     // Avslutskostnad
  customerFixedCost: number;   // Fast kundkostnad
  overheadPerCustomer: number; // OH-kostnad per kund
}

export interface Thresholds {
  greenMinMarginPercent: number;   // Grön: marginal >= X%
  yellowMinMarginPercent: number;  // Gul: marginal >= Y% (kräver chefsbeslut)
  // Under yellow = röd (förlustaffär)
}

export interface AdminConfig {
  listRates: ListRates;
  ftpRates: FTPRates;
  crossSellingRules: CrossSellingRule[];
  kalkylPrices: KalkylPrices;
  thresholds: Thresholds;
  expectedLossRate: number;        // EL i % av lånevolym
  costOfCapitalRate: number;       // Kapitalkostnad i %
  riskWeightPercent: number;       // Riskvikt i %
  capitalRequirementPercent: number; // Kapitalkrav i %
  taxRate: number;                  // Skattesats
  equityFTPRate: number;           // Ränta på eget kapital
  depositFTPRate: number;          // FTP inlåning
  depositInterestRate: number;     // Inlåningsränta till kund
}

// Customer/Advisor input
export interface CustomerInput {
  // Loan details
  loanAmount: number;
  propertyValue: number;
  bindingPeriod: string; // "3m", "1y", "2y", etc.
  rateDeviation: number; // Ränteavvikelse i procentenheter (negativ = rabatt)

  // Income
  monthlyIncome: number;
  salaryDeposit: boolean;
  depositBalance: number; // Inlåningssaldo

  // Cross-selling
  activeProducts: string[]; // IDs of CrossSellingRules

  // Savings
  savingsVolume: number;
  savingsType: 'fund' | 'isk' | 'deposit' | 'pension' | 'none';
}

// Calculation results
export interface ProfitabilityResult {
  // Key metrics
  customerRate: number;
  listRate: number;
  rateDeviation: number;
  maxAllowedDeviation: number;

  // Income breakdown
  financingIncome: {
    grossInterestIncome: number;
    ftpCost: number;
    netInterestIncome: number;
    arrangementFee: number;
    equityFTP: number;
    total: number;
  };
  depositIncome: {
    grossInterest: number;
    ftpIncome: number;
    total: number;
  };
  ancillaryIncome: {
    crossSellingIncome: number;
    total: number;
  };
  totalIncome: number;

  // Expenses
  totalExpenses: {
    distributionCost: number;
    productCosts: number;
    overheadCosts: number;
    total: number;
  };

  // Bottom line
  operatingProfitBeforeTax: number;
  expectedLoss: number;
  taxCharge: number;
  operatingProfitAfterTax: number;
  costOfCapital: number;
  economicProfit: number;

  // KPIs
  netMarginPercent: number;
  returnOnCapital: number;
  costIncomeRatio: number;

  // Signal
  signal: 'green' | 'yellow' | 'red';
  signalMessage: string;

  // LTV & DTI
  ltvPercent: number;
  dtiPercent: number;
  monthlyAmortization: number;
}

export interface Scenario {
  id: string;
  name: string;
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
