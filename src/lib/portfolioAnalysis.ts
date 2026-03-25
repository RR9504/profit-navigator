import type { AdminConfig, CustomerInput, ProfitabilityResult, SavingsEntry } from './types';
import { calculateProfitability } from './calculationEngine';

// ============================================
// Import parsing
// ============================================

export interface ImportRow {
  [key: string]: string | number | undefined;
}

export interface PortfolioCustomer {
  rowIndex: number;
  label: string;
  segment: string;
  region: string;
  advisor: string;
  bindingMaturity: string;
  input: CustomerInput;
  result: ProfitabilityResult;
}

const COLUMN_MAP: Record<string, keyof ImportRow> = {
  // Swedish
  'lånebelopp': 'loan_amount', 'lanebelopp': 'loan_amount', 'lån': 'loan_amount',
  'marknadsvärde': 'property_value', 'marknadsvrde': 'property_value', 'bostadens_värde': 'property_value',
  'lånetyp': 'loan_type', 'lanetyp': 'loan_type',
  'bindningstid': 'binding_period', 'bindning': 'binding_period',
  'kundränta': 'customer_rate', 'kundranta': 'customer_rate', 'ränta': 'customer_rate', 'ranta': 'customer_rate',
  'månadsinkomst': 'monthly_income', 'manadsinkomst': 'monthly_income', 'inkomst': 'monthly_income',
  'inlåning': 'deposit_balance', 'inlaning': 'deposit_balance', 'inlåningssaldo': 'deposit_balance',
  'medsökande_inkomst': 'co_borrower_income', 'medsokande_inkomst': 'co_borrower_income',
  'barn': 'children', 'antal_barn': 'children',
  'produkter': 'products',
  'sparande_isk': 'savings_isk', 'isk': 'savings_isk',
  'sparande_fond': 'savings_fund', 'fond': 'savings_fund',
  'sparande_pension': 'savings_pension', 'pension_sparande': 'savings_pension',
  'sparande_sparkonto': 'savings_deposit', 'sparkonto': 'savings_deposit',
  'övriga_lån': 'other_loans', 'ovriga_lan': 'other_loans', 'övriga_lånekostnader': 'other_loans',
  'löneinsättning': 'salary_deposit', 'loneinsattning': 'salary_deposit', 'lön': 'salary_deposit',
  'grönt_lån': 'green_loan', 'gront_lan': 'green_loan',
  'segment': 'segment', 'kundsegment': 'segment',
  'region': 'region', 'kontor': 'region',
  'rådgivare': 'advisor', 'radgivare': 'advisor',
  'omsättningsdatum': 'binding_maturity', 'omsattningsdatum': 'binding_maturity', 'förfallodatum': 'binding_maturity',
  'id': 'id', 'kundid': 'id', 'rad': 'id',
  // English
  'loan_amount': 'loan_amount', 'property_value': 'property_value', 'loan_type': 'loan_type',
  'binding_period': 'binding_period', 'customer_rate': 'customer_rate',
  'monthly_income': 'monthly_income', 'deposit_balance': 'deposit_balance',
  'co_borrower_income': 'co_borrower_income', 'children': 'children',
  'products': 'products', 'other_loans': 'other_loans',
  'savings_isk': 'savings_isk', 'savings_fund': 'savings_fund',
  'savings_pension': 'savings_pension', 'savings_deposit': 'savings_deposit',
  'salary_deposit': 'salary_deposit', 'green_loan': 'green_loan',
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s\-\.]+/g, '_').replace(/[åä]/g, 'a').replace(/[ö]/g, 'o');
}

function mapColumns(headers: string[]): Map<number, string> {
  const map = new Map<number, string>();
  headers.forEach((h, i) => {
    const norm = normalizeHeader(h);
    const mapped = COLUMN_MAP[norm];
    if (mapped) map.set(i, mapped as string);
    else if (COLUMN_MAP[h.toLowerCase().trim()]) map.set(i, COLUMN_MAP[h.toLowerCase().trim()] as string);
  });
  return map;
}

export function parseImportData(rows: string[][], config: AdminConfig): PortfolioCustomer[] {
  if (rows.length < 2) return [];
  const headers = rows[0];
  const colMap = mapColumns(headers);
  const customers: PortfolioCustomer[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const get = (key: string): string => {
      for (const [col, mapped] of colMap) {
        if (mapped === key) return String(row[col] ?? '').trim();
      }
      return '';
    };
    const num = (key: string): number => {
      const v = get(key).replace(/\s/g, '').replace(',', '.');
      return Number(v) || 0;
    };
    const bool = (key: string): boolean => {
      const v = get(key).toLowerCase();
      return v === 'ja' || v === 'yes' || v === '1' || v === 'true' || v === 'x';
    };

    const loanAmount = num('loan_amount');
    if (loanAmount <= 0) continue;

    const listRate = config.listRates.mortgage[get('binding_period') || '3m'] ?? 3.79;
    const customerRate = num('customer_rate');
    const rateDeviation = customerRate > 0 ? customerRate - listRate : 0;

    const products = get('products').split(/[,;]+/).map(p => p.trim()).filter(Boolean);

    const savings: SavingsEntry[] = [];
    if (num('savings_isk') > 0) savings.push({ id: `isk-${i}`, type: 'isk', volume: num('savings_isk') });
    if (num('savings_fund') > 0) savings.push({ id: `fund-${i}`, type: 'fund', volume: num('savings_fund') });
    if (num('savings_pension') > 0) savings.push({ id: `pen-${i}`, type: 'pension', volume: num('savings_pension') });
    if (num('savings_deposit') > 0) savings.push({ id: `dep-${i}`, type: 'deposit', volume: num('savings_deposit') });

    const input: CustomerInput = {
      loanAmount,
      propertyValue: num('property_value') || loanAmount * 1.4,
      loanType: (get('loan_type') || 'hypotek') as CustomerInput['loanType'],
      isGreenLoan: bool('green_loan'),
      bindingPeriod: get('binding_period') || '3m',
      rateDeviation,
      monthlyIncome: num('monthly_income'),
      salaryDeposit: bool('salary_deposit'),
      depositBalance: num('deposit_balance'),
      coBorrower: {
        enabled: num('co_borrower_income') > 0,
        monthlyIncome: num('co_borrower_income'),
      },
      numberOfChildren: num('children'),
      activeProducts: products,
      appliedProductDiscountBps: 0,
      savings,
      applySavingsDiscount: false,
      otherLoansMonthly: num('other_loans'),
    };

    const result = calculateProfitability(input, config);
    customers.push({
      rowIndex: i,
      label: get('id') || `Kund ${i}`,
      segment: get('segment') || 'Okänt',
      region: get('region') || 'Okänt',
      advisor: get('advisor') || 'Okänt',
      bindingMaturity: get('binding_maturity') || '',
      input,
      result,
    });
  }
  return customers;
}

// ============================================
// Portfolio aggregation
// ============================================

export interface PortfolioSummary {
  totalCustomers: number;
  totalLoanVolume: number;
  totalAnnualEP: number;
  totalNPV: number;
  avgNetMargin: number;
  avgRAROC: number;
  avgCostIncome: number;
  signalDistribution: { green: number; yellow: number; red: number };
  kalpFailCount: number;
  stressFailCount: number;
  totalAnnualIncome: number;
  totalAnnualExpenses: number;
  incomeMix: {
    netInterest: number;
    equityFTP: number;
    deposit: number;
    savings: number;
    crossSelling: number;
  };
}

export function summarizePortfolio(customers: PortfolioCustomer[]): PortfolioSummary {
  const n = customers.length;
  if (n === 0) return emptySummary();

  let totalLoan = 0, totalEP = 0, totalNPV = 0;
  let totalIncome = 0, totalExpenses = 0;
  let sumMargin = 0, sumRAROC = 0, sumCI = 0;
  const signals = { green: 0, yellow: 0, red: 0 };
  let kalpFail = 0, stressFail = 0;
  const mix = { netInterest: 0, equityFTP: 0, deposit: 0, savings: 0, crossSelling: 0 };

  for (const c of customers) {
    const r = c.result;
    totalLoan += c.input.loanAmount;
    totalEP += r.annualEconomicProfit;
    totalNPV += r.npv.totalNPV;
    totalIncome += r.annualIncome.total;
    totalExpenses += r.annualExpenses.total;
    sumMargin += r.netMarginPercent;
    sumRAROC += r.returnOnCapital;
    sumCI += r.costIncomeRatio;
    signals[r.signal]++;
    if (!r.kalp.approved) kalpFail++;
    if (!r.stressTest.primaryStress.approved) stressFail++;
    mix.netInterest += r.annualIncome.netInterestIncome;
    mix.equityFTP += r.annualIncome.equityFTP;
    mix.deposit += r.annualIncome.depositNetIncome;
    mix.savings += r.annualIncome.savingsIncome;
    mix.crossSelling += r.annualIncome.crossSellingIncome;
  }

  return {
    totalCustomers: n,
    totalLoanVolume: totalLoan,
    totalAnnualEP: totalEP,
    totalNPV: totalNPV,
    avgNetMargin: sumMargin / n,
    avgRAROC: sumRAROC / n,
    avgCostIncome: sumCI / n,
    signalDistribution: signals,
    kalpFailCount: kalpFail,
    stressFailCount: stressFail,
    totalAnnualIncome: totalIncome,
    totalAnnualExpenses: totalExpenses,
    incomeMix: mix,
  };
}

function emptySummary(): PortfolioSummary {
  return {
    totalCustomers: 0, totalLoanVolume: 0, totalAnnualEP: 0, totalNPV: 0,
    avgNetMargin: 0, avgRAROC: 0, avgCostIncome: 0,
    signalDistribution: { green: 0, yellow: 0, red: 0 },
    kalpFailCount: 0, stressFailCount: 0,
    totalAnnualIncome: 0, totalAnnualExpenses: 0,
    incomeMix: { netInterest: 0, equityFTP: 0, deposit: 0, savings: 0, crossSelling: 0 },
  };
}

// ============================================
// Cross-selling potential
// ============================================

export interface CrossSellingOpportunity {
  customer: PortfolioCustomer;
  missingProducts: { id: string; name: string; annualIncome: number; discountBps: number }[];
  potentialIncome: number;
}

export function analyzeCrossSelling(customers: PortfolioCustomer[], config: AdminConfig): CrossSellingOpportunity[] {
  const allProducts = config.crossSellingRules.filter(r => r.enabled && r.annualIncomeContribution > 0);

  return customers.map(c => {
    const missing = allProducts
      .filter(p => !c.input.activeProducts.includes(p.id))
      .map(p => ({ id: p.id, name: p.name, annualIncome: p.annualIncomeContribution, discountBps: p.discountBps }));
    const potentialIncome = missing.reduce((sum, p) => sum + p.annualIncome, 0);
    return { customer: c, missingProducts: missing, potentialIncome };
  })
  .filter(o => o.potentialIncome > 0)
  .sort((a, b) => b.potentialIncome - a.potentialIncome);
}

// ============================================
// Repricing analysis
// ============================================

export interface RepricingOpportunity {
  customer: PortfolioCustomer;
  currentRate: number;
  listRate: number;
  deviation: number;
  epImpactPerBps: number;
}

export function analyzeRepricing(customers: PortfolioCustomer[], config: AdminConfig): RepricingOpportunity[] {
  return customers
    .filter(c => c.bindingMaturity !== '')
    .map(c => {
      const r = c.result;
      const epImpactPerBps = c.input.loanAmount / 10000; // 1 bps = loan/10000
      return {
        customer: c,
        currentRate: r.effectiveCustomerRate,
        listRate: r.listRate,
        deviation: r.rateDeviation,
        epImpactPerBps,
      };
    })
    .sort((a, b) => a.deviation - b.deviation); // most discounted first
}

// ============================================
// Portfolio stress test
// ============================================

export interface PortfolioStressResult {
  rateAddon: number;
  totalEP: number;
  epChange: number;
  customersGreen: number;
  customersYellow: number;
  customersRed: number;
  kalpFailCount: number;
}

export function stressTestPortfolio(
  customers: PortfolioCustomer[],
  config: AdminConfig,
  addons: number[] = [0.5, 1, 1.5, 2, 3],
): PortfolioStressResult[] {
  const baseEP = customers.reduce((s, c) => s + c.result.annualEconomicProfit, 0);

  return addons.map(addon => {
    const stressedConfig = {
      ...config,
      listRates: {
        mortgage: Object.fromEntries(
          Object.entries(config.listRates.mortgage).map(([k, v]) => [k, v + addon])
        ),
      },
    };
    let totalEP = 0;
    const signals = { green: 0, yellow: 0, red: 0 };
    let kalpFail = 0;

    for (const c of customers) {
      const r = calculateProfitability(c.input, stressedConfig);
      totalEP += r.annualEconomicProfit;
      signals[r.signal]++;
      if (!r.kalp.approved) kalpFail++;
    }

    return {
      rateAddon: addon,
      totalEP,
      epChange: totalEP - baseEP,
      customersGreen: signals.green,
      customersYellow: signals.yellow,
      customersRed: signals.red,
      kalpFailCount: kalpFail,
    };
  });
}

// ============================================
// What-if analysis
// ============================================

export function whatIfAnalysis(
  customers: PortfolioCustomer[],
  baseConfig: AdminConfig,
  modifiedConfig: AdminConfig,
): { base: PortfolioSummary; modified: PortfolioSummary; delta: PortfolioSummary } {
  const baseResults = customers.map(c => ({
    ...c,
    result: calculateProfitability(c.input, baseConfig),
  }));
  const modResults = customers.map(c => ({
    ...c,
    result: calculateProfitability(c.input, modifiedConfig),
  }));

  const base = summarizePortfolio(baseResults);
  const modified = summarizePortfolio(modResults);
  const delta: PortfolioSummary = {
    totalCustomers: 0,
    totalLoanVolume: 0,
    totalAnnualEP: modified.totalAnnualEP - base.totalAnnualEP,
    totalNPV: modified.totalNPV - base.totalNPV,
    avgNetMargin: modified.avgNetMargin - base.avgNetMargin,
    avgRAROC: modified.avgRAROC - base.avgRAROC,
    avgCostIncome: modified.avgCostIncome - base.avgCostIncome,
    signalDistribution: {
      green: modified.signalDistribution.green - base.signalDistribution.green,
      yellow: modified.signalDistribution.yellow - base.signalDistribution.yellow,
      red: modified.signalDistribution.red - base.signalDistribution.red,
    },
    kalpFailCount: modified.kalpFailCount - base.kalpFailCount,
    stressFailCount: modified.stressFailCount - base.stressFailCount,
    totalAnnualIncome: modified.totalAnnualIncome - base.totalAnnualIncome,
    totalAnnualExpenses: modified.totalAnnualExpenses - base.totalAnnualExpenses,
    incomeMix: {
      netInterest: modified.incomeMix.netInterest - base.incomeMix.netInterest,
      equityFTP: modified.incomeMix.equityFTP - base.incomeMix.equityFTP,
      deposit: modified.incomeMix.deposit - base.incomeMix.deposit,
      savings: modified.incomeMix.savings - base.incomeMix.savings,
      crossSelling: modified.incomeMix.crossSelling - base.incomeMix.crossSelling,
    },
  };
  return { base, modified, delta };
}

// ============================================
// Segmentation
// ============================================

export interface SegmentGroup {
  key: string;
  customers: PortfolioCustomer[];
  summary: PortfolioSummary;
}

export function segmentBy(customers: PortfolioCustomer[], field: 'segment' | 'region' | 'advisor' | 'signal'): SegmentGroup[] {
  const groups = new Map<string, PortfolioCustomer[]>();
  for (const c of customers) {
    const key = field === 'signal' ? c.result.signal : c[field];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  return Array.from(groups.entries())
    .map(([key, custs]) => ({ key, customers: custs, summary: summarizePortfolio(custs) }))
    .sort((a, b) => b.summary.totalAnnualEP - a.summary.totalAnnualEP);
}

// ============================================
// CSV template generator
// ============================================

export function generateCSVTemplate(): string {
  const headers = [
    'id', 'lånebelopp', 'marknadsvärde', 'lånetyp', 'bindningstid', 'kundränta',
    'månadsinkomst', 'inlåning', 'medsökande_inkomst', 'barn',
    'löneinsättning', 'produkter', 'sparande_isk', 'sparande_fond',
    'sparande_pension', 'sparande_sparkonto', 'övriga_lån', 'grönt_lån',
    'segment', 'region', 'rådgivare', 'omsättningsdatum',
  ];
  const exampleRow = [
    '1', '2500000', '3500000', 'hypotek', '3m', '3.64',
    '50000', '100000', '0', '0',
    'ja', 'card-visa,home-insurance-villa', '500000', '0',
    '0', '0', '0', 'nej',
    'Privat Premium', 'Stockholm', 'Anna Svensson', '2025-06',
  ];
  return headers.join(';') + '\n' + exampleRow.join(';') + '\n';
}
