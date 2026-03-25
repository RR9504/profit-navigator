import type { ProfitabilityResult } from '@/lib/types';
import { CheckCircle, XCircle } from 'lucide-react';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('sv-SE');
}

function Row({ label, value, indent = false, bold = false, negative = false }: {
  label: string; value: number; indent?: boolean; bold?: boolean; negative?: boolean;
}) {
  const displayValue = negative ? -Math.abs(value) : value;
  return (
    <div className={`flex items-center justify-between py-0.5 ${indent ? 'pl-4' : ''} ${bold ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${indent ? 'text-muted-foreground' : ''}`}>{label}</span>
      <span className={`font-mono text-sm ${displayValue < 0 ? 'text-signal-red' : ''}`}>
        {fmt(displayValue)} kr
      </span>
    </div>
  );
}

export function KALPDisplay({ result }: { result: ProfitabilityResult }) {
  const { kalp } = result;

  return (
    <div className="metric-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-header">KALP — Kvar att leva på</h3>
        {kalp.approved ? (
          <span className="signal-badge-green text-xs">
            <CheckCircle className="h-3 w-3" /> Godkänd
          </span>
        ) : (
          <span className="signal-badge-red text-xs">
            <XCircle className="h-3 w-3" /> Underskott
          </span>
        )}
      </div>

      <Row label="Bruttoinkomst (hushåll/mån)" value={kalp.totalGrossMonthlyIncome} bold />
      <Row label="Skatt" value={kalp.tax} indent negative />
      <Row label="Nettoinkomst" value={kalp.netMonthlyIncome} bold />

      <div className="border-t" />

      <Row label="Levnadskostnader" value={kalp.livingCosts} negative />

      <div className="border-t" />

      <Row label="Boendekostnader" value={kalp.housingCosts} bold negative />
      <Row label="Räntekostnad (efter avdrag)" value={kalp.interestCostMonthly} indent negative />
      <Row label="Amortering" value={kalp.amortizationMonthly} indent negative />
      <Row label="Drift & underhåll" value={kalp.driftCostMonthly} indent negative />

      {kalp.interestDeduction > 0 && (
        <div className="pl-4 text-xs text-signal-green">
          Ränteavdrag: +{fmt(Math.round(kalp.interestDeduction / 12))} kr/mån ({fmt(Math.round(kalp.interestDeduction))} kr/år)
        </div>
      )}

      {kalp.otherLoanCosts > 0 && (
        <>
          <div className="border-t" />
          <Row label="Övriga lånekostnader" value={kalp.otherLoanCosts} negative />
        </>
      )}

      <div className="border-t border-foreground/30" />

      <div className={`flex items-center justify-between rounded-lg p-3 ${kalp.surplus >= 0 ? 'bg-signal-green-bg' : 'bg-signal-red-bg'}`}>
        <span className="text-sm font-bold">KALP-överskott</span>
        <span className={`font-mono text-lg font-bold ${kalp.surplus >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
          {fmt(kalp.surplus)} kr/mån
        </span>
      </div>
    </div>
  );
}
