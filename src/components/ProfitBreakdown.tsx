import type { ProfitabilityResult } from '@/lib/types';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('sv-SE');
}

function Row({ label, value, indent = false, bold = false, highlight = false }: {
  label: string; value: number; indent?: boolean; bold?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-1 ${indent ? 'pl-4' : ''} ${bold ? 'font-semibold' : ''} ${highlight ? 'rounded bg-muted px-2 py-1.5' : ''}`}>
      <span className={`text-sm ${indent ? 'text-muted-foreground' : 'text-foreground'}`}>{label}</span>
      <span className={`font-mono text-sm ${value < 0 ? 'text-signal-red' : 'text-foreground'}`}>
        {fmt(value)} kr
      </span>
    </div>
  );
}

export function ProfitBreakdown({ result }: { result: ProfitabilityResult }) {
  return (
    <div className="metric-card space-y-4">
      <h3 className="section-header">Resultaträkning (Årsbasis)</h3>

      {/* Financing Income */}
      <div>
        <Row label="Finansieringsintäkt" value={result.financingIncome.total} bold />
        <Row label="Ränteintäkt (brutto)" value={result.financingIncome.grossInterestIncome} indent />
        <Row label="FTP-kostnad" value={result.financingIncome.ftpCost} indent />
        <Row label="Uppläggningsavgift" value={result.financingIncome.arrangementFee} indent />
        <Row label="Equity FTP" value={result.financingIncome.equityFTP} indent />
      </div>

      <div className="border-t" />

      {/* Deposit Income */}
      <div>
        <Row label="Inlåningsintäkt" value={result.depositIncome.total} bold />
        <Row label="Ränta till kund" value={result.depositIncome.grossInterest} indent />
        <Row label="FTP inlåning" value={result.depositIncome.ftpIncome} indent />
      </div>

      <div className="border-t" />

      {/* Ancillary */}
      <div>
        <Row label="Övriga intäkter (cross-selling)" value={result.ancillaryIncome.total} bold />
      </div>

      <div className="border-t" />

      <Row label="Total intäkt" value={result.totalIncome} bold highlight />

      <div className="border-t" />

      {/* Expenses */}
      <div>
        <Row label="Totala kostnader" value={-result.totalExpenses.total} bold />
        <Row label="Distributions-/uppläggskostnad" value={-result.totalExpenses.distributionCost} indent />
        <Row label="Produktkostnader" value={-result.totalExpenses.productCosts} indent />
        <Row label="Overhead" value={-result.totalExpenses.overheadCosts} indent />
      </div>

      <div className="border-t" />

      <Row label="Rörelseresultat före skatt" value={result.operatingProfitBeforeTax} bold />
      <Row label="Förväntad förlust (EL)" value={-result.expectedLoss} indent />
      <Row label="Skatt" value={-result.taxCharge} indent />
      <Row label="Rörelseresultat efter skatt" value={result.operatingProfitAfterTax} bold highlight />
      <Row label="Kapitalkostnad" value={-result.costOfCapital} indent />

      <div className="border-t border-foreground/30" />

      <Row label="Economic Profit" value={result.economicProfit} bold highlight />

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <KPI label="Nettomarginal" value={`${result.netMarginPercent.toFixed(2)}%`} />
        <KPI label="Avkastning kapital" value={`${result.returnOnCapital.toFixed(1)}%`} />
        <KPI label="K/I-tal" value={`${result.costIncomeRatio.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
