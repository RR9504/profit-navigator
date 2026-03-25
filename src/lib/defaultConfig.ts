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

  // =============================================
  // Full product catalog (KRES Sparbank 2022 +)
  // =============================================
  crossSellingRules: [
    // --- Lön ---
    { id: 'salary', name: 'Löneinbetalning', category: 'salary', discountBps: 10, annualIncomeContribution: 1200, internalSetupCost: 0, internalAnnualCost: 0, enabled: true },

    // --- Försäkring ---
    { id: 'home-insurance-villa', name: 'Hemförsäkring villa', category: 'insurance', discountBps: 5, annualIncomeContribution: 3500, internalSetupCost: 204, internalAnnualCost: 0, enabled: true },
    { id: 'home-insurance-brf', name: 'Hemförsäkring BRF', category: 'insurance', discountBps: 5, annualIncomeContribution: 2800, internalSetupCost: 204, internalAnnualCost: 0, enabled: true },
    { id: 'home-insurance-fritid', name: 'Hemförsäkring fritidshus', category: 'insurance', discountBps: 3, annualIncomeContribution: 2200, internalSetupCost: 204, internalAnnualCost: 0, enabled: true },
    { id: 'life-insurance', name: 'Trygghetsförsäkring', category: 'insurance', discountBps: 3, annualIncomeContribution: 2800, internalSetupCost: 221, internalAnnualCost: 0, enabled: true },
    { id: 'car-insurance', name: 'Fordonsförsäkring bil', category: 'insurance', discountBps: 3, annualIncomeContribution: 4200, internalSetupCost: 179, internalAnnualCost: 0, enabled: true },
    { id: 'mc-insurance', name: 'Fordonsförsäkring MC/snöskoter', category: 'insurance', discountBps: 2, annualIncomeContribution: 1800, internalSetupCost: 179, internalAnnualCost: 0, enabled: true },

    // --- Sparande ---
    { id: 'isk-sparkonto', name: 'ISK sparkonto', category: 'savings', discountBps: 2, annualIncomeContribution: 400, internalSetupCost: 143, internalAnnualCost: 0, enabled: true },
    { id: 'isk-depa', name: 'ISK depå', category: 'savings', discountBps: 3, annualIncomeContribution: 800, internalSetupCost: 123, internalAnnualCost: 0, enabled: true },
    { id: 'isk-fond', name: 'ISK fondkonto', category: 'savings', discountBps: 3, annualIncomeContribution: 1500, internalSetupCost: 143, internalAnnualCost: 0, enabled: true },
    { id: 'fund', name: 'Fondsparande (ej ISK)', category: 'savings', discountBps: 3, annualIncomeContribution: 1500, internalSetupCost: 810, internalAnnualCost: 0, enabled: true },
    { id: 'kapitalspar-barn', name: 'Kapitalspar Barn', category: 'savings', discountBps: 1, annualIncomeContribution: 600, internalSetupCost: 1186, internalAnnualCost: 0, enabled: true },

    // --- Pension ---
    { id: 'pension-privat', name: 'Privat pension/Kapitalpension', category: 'pension', discountBps: 5, annualIncomeContribution: 2000, internalSetupCost: 1186, internalAnnualCost: 0, enabled: true },
    { id: 'pension-tjanst', name: 'Tjänstepension', category: 'pension', discountBps: 3, annualIncomeContribution: 1800, internalSetupCost: 613, internalAnnualCost: 0, enabled: true },
    { id: 'pension-avtal', name: 'Avtalspension', category: 'pension', discountBps: 3, annualIncomeContribution: 1600, internalSetupCost: 961, internalAnnualCost: 0, enabled: true },

    // --- Kort & Betalning ---
    // Swedbank invoice: Mastercard 2.80 kr/kort/mån = 33.6 kr/år, Maestro 2.80 = 33.6, Visa inkl. KRES
    { id: 'card-maestro', name: 'Bankkort Maestro', category: 'payment', discountBps: 1, annualIncomeContribution: 400, internalSetupCost: 135, internalAnnualCost: 199, enabled: true },
    { id: 'card-mastercard', name: 'Bankkort Mastercard', category: 'payment', discountBps: 2, annualIncomeContribution: 600, internalSetupCost: 135, internalAnnualCost: 199, enabled: true },
    { id: 'card-visa', name: 'Bankkort Visa', category: 'payment', discountBps: 2, annualIncomeContribution: 700, internalSetupCost: 135, internalAnnualCost: 213, enabled: true },
    { id: 'card-visa-ung', name: 'Bankkort Visa Ung', category: 'payment', discountBps: 0, annualIncomeContribution: 200, internalSetupCost: 135, internalAnnualCost: 213, enabled: true },

    // --- Konto ---
    // Swedbank invoice: privatkonton 0.57 kr/konto/mån = 6.84 kr/år (+ KRES årskostnad)
    { id: 'konto-transaktion', name: 'Transaktionskonto', category: 'account', discountBps: 0, annualIncomeContribution: 100, internalSetupCost: 143, internalAnnualCost: 225, enabled: true },
    { id: 'konto-pmk', name: 'Penningmarknadskonto', category: 'account', discountBps: 0, annualIncomeContribution: 200, internalSetupCost: 188, internalAnnualCost: 356, enabled: true },

    // --- Digitalt ---
    // Swedbank invoice: Bank-ID 1.83 kr/kund/mån = 22 kr/år, Swish 0.18-0.48/transaktion
    { id: 'internetbank', name: 'Internetbank/Mobilbank', category: 'digital', discountBps: 0, annualIncomeContribution: 200, internalSetupCost: 143, internalAnnualCost: 0, enabled: true },
    { id: 'bankid', name: 'Bank-ID', category: 'digital', discountBps: 0, annualIncomeContribution: 0, internalSetupCost: 0, internalAnnualCost: 22, enabled: true },
    { id: 'swish', name: 'Swish', category: 'digital', discountBps: 0, annualIncomeContribution: 50, internalSetupCost: 0, internalAnnualCost: 40, enabled: true },
    { id: 'e-bokforing', name: 'e-bokföring', category: 'digital', discountBps: 0, annualIncomeContribution: 300, internalSetupCost: 666, internalAnnualCost: 140, enabled: false },

    // --- Kredit ---
    { id: 'lanlofte', name: 'Lånelöfte', category: 'credit', discountBps: 0, annualIncomeContribution: 0, internalSetupCost: 1635, internalAnnualCost: 0, enabled: true },
    { id: 'kortkredit', name: 'Kortkredit', category: 'credit', discountBps: 1, annualIncomeContribution: 500, internalSetupCost: 573, internalAnnualCost: 800, enabled: true },
    { id: 'privatlan-blanco', name: 'Privatkredit blanco', category: 'credit', discountBps: 0, annualIncomeContribution: 1200, internalSetupCost: 1022, internalAnnualCost: 800, enabled: true },

    // --- Övrigt ---
    { id: 'bankfack', name: 'Bankfack/servicefack', category: 'other', discountBps: 0, annualIncomeContribution: 500, internalSetupCost: 327, internalAnnualCost: 126, enabled: false },
  ],

  kalkylPrices: {
    loanTypes: [
      {
        key: 'hypotek', label: 'Swedbank Hypotek Privat',
        setupCost: 2248, annualCost: 283, closingCost: 286,
        incomeModel: 'provision', provisionRatePercent: 0.20,
        capitalAllocationFactor: 0.10, expectedLossFactor: 0.10,
      },
      {
        key: 'bolan_bank', label: 'Bolån i banken',
        setupCost: 2249, annualCost: 800, closingCost: 286,
        incomeModel: 'full_margin', provisionRatePercent: 0,
        capitalAllocationFactor: 1.0, expectedLossFactor: 1.0,
      },
    ],
    customerFixedCost: 3000,
    arrangementFee: 1500,
    advisoryCostPerSession: 1235,
  },

  thresholds: {
    greenMinMarginPercent: 0.40,
    yellowMinMarginPercent: 0.15,
  },

  basePDPercent: 0.10,
  lgdPercent: 12.0,
  costOfCapitalRate: 10.0,
  riskWeightBands: [
    { maxLTV: 50, riskWeightPercent: 10 },
    { maxLTV: 60, riskWeightPercent: 15 },
    { maxLTV: 70, riskWeightPercent: 20 },
    { maxLTV: 85, riskWeightPercent: 25 },
    { maxLTV: 100, riskWeightPercent: 35 },
  ],
  capitalRequirementPercent: 8.0,
  taxRate: 20.6,

  equityFTPRate: 1.5,
  depositFTPRate: 1.8,
  depositInterestRate: 0.5,

  savingsMargins: [
    { type: 'fund', marginPercent: 0.80, label: 'Fondsparande' },
    { type: 'isk', marginPercent: 0.30, label: 'ISK' },
    { type: 'deposit', marginPercent: 1.20, label: 'Sparkonto' },
    { type: 'pension', marginPercent: 0.60, label: 'Pension' },
  ],

  // Savings volume → rate discount
  savingsDiscountTiers: [
    { minVolume: 0, maxVolume: 100000, discountBps: 0 },
    { minVolume: 100000, maxVolume: 500000, discountBps: 2 },
    { minVolume: 500000, maxVolume: 1000000, discountBps: 5 },
    { minVolume: 1000000, maxVolume: 5000000, discountBps: 8 },
    { minVolume: 5000000, maxVolume: 999999999, discountBps: 12 },
  ],

  // OH distributed by activity (calibrated against actual Swedbank invoice Nov 2024)
  // Invoice total: ~1.29M kr/mån for 15,854 customers, 11,161 Mkr volume
  // Per-kund items: ~640k/mån → ~484 kr/kund/år (captured via financing+capital rates)
  // Per-volym items: ~320k/mån on 11,161 Mkr → ~0.034%/år (captured via exposureRate)
  ohModel: {
    ancillaryRate: 10,     // % of ancillary income (product-related OH)
    financingRate: 3,      // % of financing income (per-kund OH component)
    exposureRate: 0.035,   // % of loan volume (risk, AML, IRB, reporting)
    capitalRate: 3,        // % of allocated capital (capital management OH)
  },

  // Regulatory costs
  regulatoryCosts: {
    depositInsuranceRate: 0.05,   // % of deposit volume
    bankTaxLendingRate: 0.02,     // % of lending volume
    bankTaxDepositRate: 0.01,     // % of deposit volume
    resolutionFundRate: 0.01,     // % of lending volume
    greenLoanFTPDiscount: 5,      // bps FTP discount
  },

  kalpConfig: {
    singleAdultMonthlyCost: 6500,
    coupleAdultMonthlyCost: 11000,
    childMonthlyCost: 3500,
    effectiveTaxRate: 30,
    interestDeductionLow: 30,
    interestDeductionHigh: 21,
    interestDeductionThreshold: 100000,
    housingCostMonthly: 4000,
    stressRateAddon: 3.0,
  },

  expectedLoanDurationYears: 7,
  salaryDepositBalanceMonths: 2.5,
};
