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
  const { annualExpenses: exp } = result;

  return (
    <div className="metric-card space-y-4">
      <h3 className="section-header">Resultaträkning (Årsbasis)</h3>

      {/* Income */}
      <div>
        <Row label="Räntenetto" value={result.annualIncome.netInterestIncome} bold />
        {result.annualIncome.discountEffect < -1 && (
          <>
            <Row label="Räntenetto före rabatter" value={result.annualIncome.grossInterestIncome} indent />
            <div className="flex items-center justify-between py-1 pl-4">
              <span className="text-sm text-signal-red">Rabatteffekt (produkter & sparande)</span>
              <span className="font-mono text-sm text-signal-red">{fmt(result.annualIncome.discountEffect)} kr</span>
            </div>
          </>
        )}
        <Row label="Equity FTP" value={result.annualIncome.equityFTP} indent />
        <Row label="Inlåningsintjäning" value={result.annualIncome.depositNetIncome} indent />
        {result.annualIncome.savingsIncome > 0 && (
          <Row label="Sparandeintjäning" value={result.annualIncome.savingsIncome} indent />
        )}
        {result.annualIncome.crossSellingIncome > 0 && (
          <Row label="Övriga produktintäkter" value={result.annualIncome.crossSellingIncome} indent />
        )}
      </div>
      <div className="border-t" />
      <Row label="Totala årliga intäkter" value={result.annualIncome.total} bold highlight />

      <div className="border-t" />

      {/* Expenses */}
      <div>
        <Row label="Årliga kostnader" value={-exp.total} bold />
        <Row label="Kreditkostnad (lånetyp)" value={-exp.loanAnnualCost} indent />
        <Row label="Fast kundkostnad" value={-exp.customerCost} indent />
        <Row label="Rådgivningskostnad" value={-exp.advisoryCost} indent />
        {exp.productInternalCosts > 0 && (
          <Row label="Produktkostnader (KRES)" value={-exp.productInternalCosts} indent />
        )}
      </div>

      {/* OH breakdown */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          OH-kostnad: {fmt(-exp.overhead)} kr (aktivitetsbaserad)
        </summary>
        <div className="mt-1 pl-4 space-y-0.5 text-muted-foreground">
          <div className="flex justify-between"><span>Övriga produktintäkter</span><span className="font-mono">{fmt(-exp.ohBreakdown.ancillary)} kr</span></div>
          <div className="flex justify-between"><span>Finansiering</span><span className="font-mono">{fmt(-exp.ohBreakdown.financing)} kr</span></div>
          <div className="flex justify-between"><span>Exponering/lånevolym</span><span className="font-mono">{fmt(-exp.ohBreakdown.exposure)} kr</span></div>
          <div className="flex justify-between"><span>Allokerat kapital</span><span className="font-mono">{fmt(-exp.ohBreakdown.capital)} kr</span></div>
        </div>
      </details>

      {/* Regulatory costs */}
      {exp.regulatoryCosts.total > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Regulatoriska kostnader: {fmt(-exp.regulatoryCosts.total)} kr
          </summary>
          <div className="mt-1 pl-4 space-y-0.5 text-muted-foreground">
            <div className="flex justify-between"><span>Insättningsgaranti</span><span className="font-mono">{fmt(-exp.regulatoryCosts.depositInsurance)} kr</span></div>
            <div className="flex justify-between"><span>Bankskatt utlåning</span><span className="font-mono">{fmt(-exp.regulatoryCosts.bankTaxLending)} kr</span></div>
            <div className="flex justify-between"><span>Bankskatt inlåning</span><span className="font-mono">{fmt(-exp.regulatoryCosts.bankTaxDeposit)} kr</span></div>
            <div className="flex justify-between"><span>Resolutionsfond</span><span className="font-mono">{fmt(-exp.regulatoryCosts.resolutionFund)} kr</span></div>
          </div>
        </details>
      )}

      <div className="border-t" />

      {/* Expected loss */}
      <Row label="Förväntad förlust (EL)" value={-result.expectedLoss.annualEL} bold />
      <div className="pl-4 text-xs text-muted-foreground">
        PD: {result.expectedLoss.adjustedPD.toFixed(3)}% · LGD: {result.expectedLoss.lgd.toFixed(1)}% · EAD: {fmt(result.expectedLoss.ead)} kr
      </div>

      <div className="border-t" />

      <Row label="Rörelseresultat" value={result.annualOperatingProfit} bold />
      <Row label="Skatt" value={-result.annualTax} indent />
      <Row label="Resultat efter skatt" value={result.annualProfitAfterTax} bold highlight />
      <Row label="Kapitalkostnad" value={-result.annualCapitalCharge} indent />

      <div className="border-t border-foreground/30" />
      <Row label="Ekonomiskt resultat (årligt)" value={result.annualEconomicProfit} bold highlight />

      {/* One-time items */}
      <div className="border-t" />
      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
          Engångsposter (netto: {fmt(result.oneTimeItems.netUpfront - result.oneTimeItems.closingCost)} kr)
        </summary>
        <div className="mt-1 space-y-0.5">
          <Row label="Uppläggningsavgift (kund)" value={result.oneTimeItems.arrangementFee} indent />
          <Row label="Uppläggskostnad (intern)" value={-result.oneTimeItems.setupCost} indent />
          {result.oneTimeItems.productSetupCosts > 0 && (
            <Row label="Produktupplägg (KRES)" value={-result.oneTimeItems.productSetupCosts} indent />
          )}
          <Row label="Avslutskostnad" value={-result.oneTimeItems.closingCost} indent />
        </div>
      </details>

      {/* NPV */}
      <div className="border-t" />
      <div className="rounded-lg bg-primary/5 p-3 space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nuvärde ({result.npv.durationYears} år)
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Totalt nuvärde ekonomiskt resultat</span>
          <span className={`font-mono text-lg font-bold ${result.npv.totalNPV < 0 ? 'text-signal-red' : 'text-foreground'}`}>
            {fmt(result.npv.totalNPV)} kr
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Annualiserat ekonomiskt resultat</span>
          <span className="font-mono">{fmt(result.npv.annualizedEP)} kr/år</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <KPI label="Nettomarginal" value={`${result.netMarginPercent.toFixed(2)}%`} warn={result.netMarginPercent < 0.15} />
        <KPI label="RAROC" value={`${result.returnOnCapital.toFixed(1)}%`} />
        <KPI label="K/I-tal" value={`${result.costIncomeRatio.toFixed(1)}%`} warn={result.costIncomeRatio > 60} />
      </div>
    </div>
  );
}

function KPI({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${warn ? 'bg-signal-red-bg' : 'bg-muted'}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${warn ? 'text-signal-red' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
