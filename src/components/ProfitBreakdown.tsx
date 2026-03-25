import type { ProfitabilityResult } from '@/lib/types';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('sv-SE');
}

function pct(n: number): string {
  return n.toFixed(3) + '%';
}

function Row({ label, value, indent = false, bold = false, highlight = false, tooltip }: {
  label: string; value: number; indent?: boolean; bold?: boolean; highlight?: boolean;
  tooltip?: React.ReactNode;
}) {
  const content = (
    <div className={`flex items-center justify-between py-1 ${indent ? 'pl-4' : ''} ${bold ? 'font-semibold' : ''} ${highlight ? 'rounded bg-muted px-2 py-1.5' : ''} ${tooltip ? 'cursor-help' : ''}`}>
      <span className={`text-sm ${indent ? 'text-muted-foreground' : 'text-foreground'}`}>{label}</span>
      <span className={`font-mono text-sm ${value < 0 ? 'text-signal-red' : 'text-foreground'}`}>
        {fmt(value)} kr
      </span>
    </div>
  );

  if (!tooltip) return content;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <div className="space-y-1 text-xs">{tooltip}</div>
      </TooltipContent>
    </Tooltip>
  );
}

function TipLine({ label, value, unit = 'kr' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono whitespace-nowrap">{typeof value === 'number' ? fmt(value) : value} {unit}</span>
    </div>
  );
}

export function ProfitBreakdown({ result }: { result: ProfitabilityResult }) {
  const { annualExpenses: exp } = result;
  const r = result;

  return (
    <div className="metric-card space-y-4">
      <h3 className="section-header">Resultaträkning (Årsbasis)</h3>

      {/* Income */}
      <div>
        <Row label="Räntenetto" value={r.annualIncome.netInterestIncome} bold tooltip={
          <>
            <TipLine label="Lånevolym" value={fmt(r.expectedLoss.ead)} />
            <TipLine label="Kundränta" value={pct(r.effectiveCustomerRate * 100)} unit="" />
            <TipLine label="FTP-ränta" value={pct(r.effectiveFTPRate * 100)} unit="" />
            <TipLine label="Räntespread" value={pct(r.spread * 100)} unit="" />
            {r.autoDiscount > 0 && <TipLine label="Produktrabatt" value={`-${pct(r.autoDiscount * 100)}`} unit="" />}
            {r.savingsDiscount > 0 && <TipLine label="Sparanderabatt" value={`-${pct(r.savingsDiscount * 100)}`} unit="" />}
            <div className="border-t my-1" />
            <TipLine label="= Lån × spread" value={r.annualIncome.netInterestIncome} />
          </>
        } />
        {r.annualIncome.discountEffect < -1 && (
          <>
            <Row label="Räntenetto före rabatter" value={r.annualIncome.grossInterestIncome} indent />
            <div className="flex items-center justify-between py-1 pl-4">
              <span className="text-sm text-signal-red">Rabatteffekt (produkter & sparande)</span>
              <span className="font-mono text-sm text-signal-red">{fmt(r.annualIncome.discountEffect)} kr</span>
            </div>
          </>
        )}
        <Row label="Equity FTP" value={r.annualIncome.equityFTP} indent tooltip={
          <>
            <TipLine label="Allokerat kapital" value={r.allocatedCapital} />
            <TipLine label="Equity FTP-sats" value={`${result.effectiveFTPRate.toFixed(2)}`} unit="%" />
            <div className="border-t my-1" />
            <TipLine label="= Kapital × sats" value={r.annualIncome.equityFTP} />
          </>
        } />
        <Row label="Inlåningsintjäning" value={r.annualIncome.depositNetIncome} indent tooltip={
          <>
            <TipLine label="Inlåningssaldo" value={fmt(Math.round(r.annualIncome.depositNetIncome / ((result.annualIncome.depositNetIncome !== 0 ? 1 : 0.01) * 0.013) * 0.013))} />
            <TipLine label="FTP inlåning − kundränta" value="spread" unit="" />
            <div className="border-t my-1" />
            <TipLine label="= Saldo × (FTP − kundränta)" value={r.annualIncome.depositNetIncome} />
          </>
        } />
        {r.annualIncome.savingsIncome > 0 && (
          <Row label="Sparandeintjäning" value={r.annualIncome.savingsIncome} indent tooltip={
            <>
              <TipLine label="Sparvolym × marginal" value={r.annualIncome.savingsIncome} />
            </>
          } />
        )}
        {r.annualIncome.crossSellingIncome > 0 && (
          <Row label="Övriga produktintäkter" value={r.annualIncome.crossSellingIncome} indent tooltip={
            <>
              <p className="font-semibold mb-1">Årlig intjäning per aktiv produkt:</p>
              <TipLine label="Summa" value={r.annualIncome.crossSellingIncome} />
            </>
          } />
        )}
      </div>
      <div className="border-t" />
      <Row label="Totala årliga intäkter" value={r.annualIncome.total} bold highlight tooltip={
        <>
          <TipLine label="Räntenetto" value={r.annualIncome.netInterestIncome} />
          <TipLine label="Equity FTP" value={r.annualIncome.equityFTP} />
          <TipLine label="Inlåning" value={r.annualIncome.depositNetIncome} />
          <TipLine label="Sparande" value={r.annualIncome.savingsIncome} />
          <TipLine label="Produktintäkter" value={r.annualIncome.crossSellingIncome} />
          <div className="border-t my-1" />
          <TipLine label="Totalt" value={r.annualIncome.total} />
        </>
      } />

      <div className="border-t" />

      {/* Expenses */}
      <div>
        <Row label="Årliga kostnader" value={-exp.total} bold tooltip={
          <>
            <TipLine label="Kreditkostnad" value={-exp.loanAnnualCost} />
            <TipLine label="Fast kundkostnad" value={-exp.customerCost} />
            <TipLine label="Rådgivning" value={-exp.advisoryCost} />
            <TipLine label="Produktkostnader" value={-exp.productInternalCosts} />
            <TipLine label="OH-kostnad" value={-exp.overhead} />
            <TipLine label="Regulatoriskt" value={-exp.regulatoryCosts.total} />
            <div className="border-t my-1" />
            <TipLine label="Totalt" value={-exp.total} />
          </>
        } />
        <Row label="Kreditkostnad (lånetyp)" value={-exp.loanAnnualCost} indent />
        <Row label="Fast kundkostnad" value={-exp.customerCost} indent />
        <Row label="Rådgivningskostnad" value={-exp.advisoryCost} indent />
        {exp.productInternalCosts > 0 && (
          <Row label="Produktkostnader (KRES)" value={-exp.productInternalCosts} indent tooltip={
            <p>Summa av aktiva produkters interna årskostnader från KRES-prislistan</p>
          } />
        )}
      </div>

      {/* OH breakdown */}
      <Row label="OH-kostnad (aktivitetsbaserad)" value={-exp.overhead} indent tooltip={
        <>
          <TipLine label="Övriga produktintäkter" value={-exp.ohBreakdown.ancillary} />
          <TipLine label="Finansiering" value={-exp.ohBreakdown.financing} />
          <TipLine label="Exponering/lånevolym" value={-exp.ohBreakdown.exposure} />
          <TipLine label="Allokerat kapital" value={-exp.ohBreakdown.capital} />
          <div className="border-t my-1" />
          <TipLine label="Summa OH" value={-exp.overhead} />
        </>
      } />

      {/* Regulatory costs */}
      {exp.regulatoryCosts.total > 0 && (
        <Row label="Regulatoriska kostnader" value={-exp.regulatoryCosts.total} indent tooltip={
          <>
            <TipLine label="Insättningsgaranti" value={-exp.regulatoryCosts.depositInsurance} />
            <TipLine label="Bankskatt utlåning" value={-exp.regulatoryCosts.bankTaxLending} />
            <TipLine label="Bankskatt inlåning" value={-exp.regulatoryCosts.bankTaxDeposit} />
            <TipLine label="Resolutionsfond" value={-exp.regulatoryCosts.resolutionFund} />
            <div className="border-t my-1" />
            <TipLine label="Totalt" value={-exp.regulatoryCosts.total} />
          </>
        } />
      )}

      <div className="border-t" />

      {/* Expected loss */}
      <Row label="Förväntad förlust (EL)" value={-r.expectedLoss.annualEL} bold tooltip={
        <>
          <TipLine label="PD (justerad)" value={`${r.expectedLoss.adjustedPD.toFixed(3)}`} unit="%" />
          <TipLine label="LGD" value={`${r.expectedLoss.lgd.toFixed(1)}`} unit="%" />
          <TipLine label="EAD" value={r.expectedLoss.ead} />
          <div className="border-t my-1" />
          <TipLine label="= EAD × PD × LGD" value={-r.expectedLoss.annualEL} />
        </>
      } />

      <div className="border-t" />

      <Row label="Rörelseresultat" value={r.annualOperatingProfit} bold tooltip={
        <>
          <TipLine label="Intäkter" value={r.annualIncome.total} />
          <TipLine label="Kostnader" value={-exp.total} />
          <TipLine label="Förväntad förlust" value={-r.expectedLoss.annualEL} />
          <div className="border-t my-1" />
          <TipLine label="= Intäkter − kostn. − EL" value={r.annualOperatingProfit} />
        </>
      } />
      <Row label="Skatt" value={-r.annualTax} indent tooltip={
        <TipLine label={`${r.annualTax > 0 ? '20.6% av rörelseresultat' : 'Ingen skatt (förlust)'}`} value={-r.annualTax} />
      } />
      <Row label="Resultat efter skatt" value={r.annualProfitAfterTax} bold highlight tooltip={
        <>
          <TipLine label="Rörelseresultat" value={r.annualOperatingProfit} />
          <TipLine label="Skatt" value={-r.annualTax} />
          <div className="border-t my-1" />
          <TipLine label="= Resultat − skatt" value={r.annualProfitAfterTax} />
        </>
      } />
      <Row label="Kapitalkostnad" value={-r.annualCapitalCharge} indent tooltip={
        <>
          <TipLine label="Allokerat kapital" value={r.allocatedCapital} />
          <TipLine label="Avkastningskrav" value="10" unit="%" />
          <div className="border-t my-1" />
          <TipLine label="= Kapital × krav" value={-r.annualCapitalCharge} />
        </>
      } />

      <div className="border-t border-foreground/30" />
      <Row label="Ekonomiskt resultat (årligt)" value={r.annualEconomicProfit} bold highlight tooltip={
        <>
          <TipLine label="Resultat efter skatt" value={r.annualProfitAfterTax} />
          <TipLine label="Kapitalkostnad" value={-r.annualCapitalCharge} />
          <div className="border-t my-1" />
          <TipLine label="= Resultat − kapitalkostnad" value={r.annualEconomicProfit} />
        </>
      } />

      {/* One-time items */}
      <div className="border-t" />
      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
          Engångsposter (netto: {fmt(r.oneTimeItems.netUpfront - r.oneTimeItems.closingCost)} kr)
        </summary>
        <div className="mt-1 space-y-0.5">
          <Row label="Uppläggningsavgift (kund)" value={r.oneTimeItems.arrangementFee} indent />
          <Row label="Uppläggskostnad (intern)" value={-r.oneTimeItems.setupCost} indent />
          {r.oneTimeItems.productSetupCosts > 0 && (
            <Row label="Produktupplägg (KRES)" value={-r.oneTimeItems.productSetupCosts} indent />
          )}
          <Row label="Avslutskostnad" value={-r.oneTimeItems.closingCost} indent />
        </div>
      </details>

      {/* NPV */}
      <div className="border-t" />
      <div className="rounded-lg bg-primary/5 p-3 space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nuvärde ({r.npv.durationYears} år)
        </div>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-between cursor-help">
              <span className="text-sm font-semibold">Totalt nuvärde ekonomiskt resultat</span>
              <span className={`font-mono text-lg font-bold ${r.npv.totalNPV < 0 ? 'text-signal-red' : 'text-foreground'}`}>
                {fmt(r.npv.totalNPV)} kr
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <TipLine label="Engångsposter (år 0)" value={r.oneTimeItems.netUpfront} />
              <TipLine label={`Ekon. resultat × ${r.npv.durationYears} år (diskonterat)`} value={r.npv.totalNPV - r.oneTimeItems.netUpfront + r.oneTimeItems.closingCost} />
              <TipLine label="Avslutskostnad (diskonterad)" value={-r.oneTimeItems.closingCost} />
              <div className="border-t my-1" />
              <TipLine label="Nuvärde" value={r.npv.totalNPV} />
            </div>
          </TooltipContent>
        </Tooltip>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Annualiserat ekonomiskt resultat</span>
          <span className="font-mono">{fmt(r.npv.annualizedEP)} kr/år</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <KPI label="Nettomarginal" value={`${r.netMarginPercent.toFixed(2)}%`} warn={r.netMarginPercent < 0.15}
          tooltip={`Ekon. resultat / Lånevolym = ${fmt(r.annualEconomicProfit)} / ${fmt(r.expectedLoss.ead)}`} />
        <KPI label="RAROC" value={`${r.returnOnCapital.toFixed(1)}%`}
          tooltip={`Resultat e. skatt / Allok. kapital = ${fmt(r.annualProfitAfterTax)} / ${fmt(r.allocatedCapital)}`} />
        <KPI label="K/I-tal" value={`${r.costIncomeRatio.toFixed(1)}%`} warn={r.costIncomeRatio > 60}
          tooltip={`Kostnader / Intäkter = ${fmt(exp.total)} / ${fmt(r.annualIncome.total)}`} />
      </div>
    </div>
  );
}

function KPI({ label, value, warn = false, tooltip }: { label: string; value: string; warn?: boolean; tooltip?: string }) {
  const content = (
    <div className={`rounded-lg p-3 text-center ${warn ? 'bg-signal-red-bg' : 'bg-muted'} ${tooltip ? 'cursor-help' : ''}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${warn ? 'text-signal-red' : 'text-foreground'}`}>{value}</div>
    </div>
  );

  if (!tooltip) return content;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
