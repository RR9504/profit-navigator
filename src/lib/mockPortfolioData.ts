import { generateCSVTemplate } from './portfolioAnalysis';

const FIRST_NAMES = ['Anna', 'Erik', 'Maria', 'Johan', 'Sara', 'Lars', 'Emma', 'Karl', 'Lisa', 'Per', 'Karin', 'Anders', 'Eva', 'Mikael', 'Sofia', 'Olof', 'Helena', 'Jonas', 'Ingrid', 'Fredrik'];
const LAST_NAMES = ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Lindberg', 'Magnusson', 'Lindström'];
const SEGMENTS = ['Privat Premium', 'Privat Bas', 'Privat Ung', 'Wealth', 'Privat Senior'];
const REGIONS = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping', 'Örebro', 'Västerås', 'Norrköping', 'Umeå', 'Jönköping'];
const ADVISORS = ['Anna Svensson', 'Erik Lindberg', 'Maria Johansson', 'Johan Karlsson', 'Sara Nilsson', 'Lars Pettersson', 'Emma Gustafsson', 'Karl Olsson'];
const BINDING_PERIODS = ['3m', '1y', '2y', '3y', '5y'];
const PRODUCTS_POOL = [
  'card-visa', 'card-mastercard', 'home-insurance-villa', 'home-insurance-brf',
  'life-insurance', 'car-insurance', 'internetbank', 'bankid', 'swish',
  'salary', 'pension-privat', 'pension-tjanst', 'isk-fond', 'isk-depa',
  'tre-kronor', 'digital-support', 'konto-transaktion',
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], min: number, max: number): T[] {
  const n = rand(min, max);
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function futureDate(): string {
  const months = rand(1, 24);
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function generateMockCSV(count: number = 500): string {
  const headers = [
    'id', 'lånebelopp', 'marknadsvärde', 'lånetyp', 'bindningstid', 'kundränta',
    'månadsinkomst', 'inlåning', 'medsökande_inkomst', 'barn',
    'löneinsättning', 'produkter', 'sparande_isk', 'sparande_fond',
    'sparande_pension', 'sparande_sparkonto', 'övriga_lån', 'grönt_lån',
    'segment', 'region', 'rådgivare', 'omsättningsdatum',
  ];

  const rows: string[] = [headers.join(';')];

  // List rates for calculating customer rate deviations
  const listRates: Record<string, number> = {
    '3m': 3.79, '1y': 3.28, '2y': 3.34, '3y': 3.44, '5y': 3.69,
  };

  for (let i = 1; i <= count; i++) {
    const advisor = pick(ADVISORS);
    const segment = pick(SEGMENTS);
    const region = pick(REGIONS);
    const binding = pick(BINDING_PERIODS);
    const listRate = listRates[binding] ?? 3.79;

    // Loan amount: 500k to 8M, weighted toward 1.5-3.5M
    const loanAmount = Math.round((rand(5, 80) * 100000) * (0.7 + Math.random() * 0.6));

    // Property value: loan / (0.40 to 0.90 LTV)
    const ltv = 0.40 + Math.random() * 0.50;
    const propertyValue = Math.round(loanAmount / ltv / 100000) * 100000;

    // Income: 25k to 120k
    const monthlyIncome = rand(25, 120) * 1000;

    // Co-borrower: 40% chance
    const coBorrowerIncome = Math.random() < 0.40 ? rand(25, 80) * 1000 : 0;

    // Rate deviation: -0.80 to +0.20, most between -0.30 and 0
    const deviation = -0.30 + (Math.random() * 0.50 - 0.10) + (Math.random() < 0.15 ? -0.40 : 0);
    const customerRate = Math.max(listRate - 1.0, listRate + deviation);

    // Products: 0 to 8 random products
    const isGoodCustomer = Math.random() < 0.6;
    const products = pickN(PRODUCTS_POOL, isGoodCustomer ? 3 : 0, isGoodCustomer ? 10 : 4);

    // Salary deposit: 50% chance
    const salaryDeposit = Math.random() < 0.50;

    // Deposit balance
    const depositBalance = rand(0, 50) * 10000;

    // Savings
    const savingsISK = Math.random() < 0.35 ? rand(1, 30) * 50000 : 0;
    const savingsFond = Math.random() < 0.25 ? rand(1, 20) * 50000 : 0;
    const savingsPension = Math.random() < 0.20 ? rand(1, 15) * 50000 : 0;
    const savingsSparkonto = Math.random() < 0.30 ? rand(1, 10) * 50000 : 0;

    // Other loans
    const otherLoans = Math.random() < 0.25 ? rand(1, 10) * 1000 : 0;

    // Children
    const children = Math.random() < 0.40 ? rand(1, 3) : 0;

    // Green loan: 10% chance
    const greenLoan = Math.random() < 0.10;

    // Maturity date: 60% have one
    const maturity = Math.random() < 0.60 ? futureDate() : '';

    const row = [
      i,
      loanAmount,
      propertyValue,
      Math.random() < 0.75 ? 'hypotek' : 'bolan_bank',
      binding,
      customerRate.toFixed(2),
      monthlyIncome,
      depositBalance,
      coBorrowerIncome,
      children,
      salaryDeposit ? 'ja' : 'nej',
      products.join(','),
      savingsISK,
      savingsFond,
      savingsPension,
      savingsSparkonto,
      otherLoans,
      greenLoan ? 'ja' : 'nej',
      segment,
      region,
      advisor,
      maturity,
    ];

    rows.push(row.join(';'));
  }

  return rows.join('\n');
}
