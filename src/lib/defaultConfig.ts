import type { AdminConfig } from './types';

export const defaultConfig: AdminConfig = {
  listRates: {
    mortgage: {
      '3m': 3.79, '1y': 3.28, '2y': 3.34, '3y': 3.44, '4y': 3.54,
      '5y': 3.69, '6y': 3.89, '7y': 3.89, '8y': 3.89, '9y': 3.89, '10y': 3.89,
    },
  },
  ftpRates: {
    mortgage: {
      '3m': 2.10, '1y': 2.00, '2y': 2.05, '3y': 2.15, '4y': 2.25,
      '5y': 2.35, '6y': 2.50, '7y': 2.55, '8y': 2.60, '9y': 2.65, '10y': 2.70,
    },
  },
  crossSellingRules: [
    { id: 'salary', name: 'Löneinbetalning', category: 'salary', discountBps: 10, annualIncomeContribution: 1200, enabled: true },
    { id: 'home-insurance', name: 'Hemförsäkring (villa/BRF)', category: 'insurance', discountBps: 5, annualIncomeContribution: 3500, enabled: true },
    { id: 'life-insurance', name: 'Trygghetsförsäkring', category: 'insurance', discountBps: 3, annualIncomeContribution: 2800, enabled: true },
    { id: 'car-insurance', name: 'Fordonsförsäkring', category: 'insurance', discountBps: 3, annualIncomeContribution: 4200, enabled: true },
    { id: 'pension', name: 'Pensionssparande', category: 'savings', discountBps: 5, annualIncomeContribution: 2000, enabled: true },
    { id: 'isk', name: 'ISK-sparande', category: 'savings', discountBps: 3, annualIncomeContribution: 800, enabled: true },
    { id: 'fund', name: 'Fondsparande', category: 'savings', discountBps: 3, annualIncomeContribution: 1500, enabled: true },
    { id: 'card', name: 'Bankkort (Mastercard/Visa)', category: 'payment', discountBps: 2, annualIncomeContribution: 600, enabled: true },
    { id: 'digital-banking', name: 'Internetbank/Mobilbank', category: 'payment', discountBps: 0, annualIncomeContribution: 200, enabled: true },
  ],
  kalkylPrices: {
    loanSetupCost: 2249,     // Bolån upplägg - Sparbank
    loanAnnualCost: 800,     // Årskostnad krediter
    loanClosingCost: 286,    // Avslutskostnad
    customerFixedCost: 3000, // Fast kundkostnad
    overheadPerCustomer: 1500,
  },
  thresholds: {
    greenMinMarginPercent: 0.40,
    yellowMinMarginPercent: 0.15,
  },
  expectedLossRate: 0.05,       // 5 bps
  costOfCapitalRate: 10.0,      // 10% avkastningskrav
  riskWeightPercent: 15.0,      // 15% riskvikt bolån
  capitalRequirementPercent: 8.0, // 8% kapitalkrav
  taxRate: 20.6,                 // Bolagsskatt
  equityFTPRate: 1.5,
  depositFTPRate: 1.8,
  depositInterestRate: 0.5,
};
