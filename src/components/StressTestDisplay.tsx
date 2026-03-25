import type { ProfitabilityResult } from '@/lib/types';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('sv-SE');
}

export function StressTestDisplay({ result }: { result: ProfitabilityResult }) {
  const { stressTest, kalp, effectiveCustomerRate } = result;

  return (
    <div className="metric-card space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-accent" />
        <h3 className="section-header">Stresstest (FI-krav)</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Finansinspektionens krav: kunden ska klara boendekostnaden vid ränteuppgång.
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-xs">
            <th className="pb-2 text-left font-medium">Scenario</th>
            <th className="pb-2 text-right font-medium">Ränta</th>
            <th className="pb-2 text-right font-medium">Mån.kostnad</th>
            <th className="pb-2 text-right font-medium">KALP</th>
            <th className="pb-2 text-center font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {/* Current */}
          <tr className="border-b border-border/50 bg-muted/50">
            <td className="py-2 font-medium">Nuvarande</td>
            <td className="py-2 text-right font-mono">{effectiveCustomerRate.toFixed(2)}%</td>
            <td className="py-2 text-right font-mono">
              {fmt(kalp.interestCostMonthly + kalp.amortizationMonthly + kalp.driftCostMonthly)} kr
            </td>
            <td className="py-2 text-right font-mono">{fmt(kalp.surplus)} kr</td>
            <td className="py-2 text-center">
              {kalp.approved ? (
                <CheckCircle className="inline h-4 w-4 text-signal-green" />
              ) : (
                <XCircle className="inline h-4 w-4 text-signal-red" />
              )}
            </td>
          </tr>

          {/* Stress scenarios */}
          {stressTest.scenarios.map(s => (
            <tr
              key={s.rateAddon}
              className={`border-b border-border/50 ${s.rateAddon === 3 ? 'font-semibold' : ''}`}
            >
              <td className="py-2">
                +{s.rateAddon}% ränta
                {s.rateAddon === 3 && (
                  <span className="ml-2 text-xs text-accent font-normal">(FI-krav)</span>
                )}
              </td>
              <td className="py-2 text-right font-mono">{s.stressedRate.toFixed(2)}%</td>
              <td className="py-2 text-right font-mono">{fmt(s.monthlyTotal)} kr</td>
              <td className={`py-2 text-right font-mono ${s.kalpSurplus < 0 ? 'text-signal-red' : ''}`}>
                {fmt(s.kalpSurplus)} kr
              </td>
              <td className="py-2 text-center">
                {s.approved ? (
                  <CheckCircle className="inline h-4 w-4 text-signal-green" />
                ) : (
                  <XCircle className="inline h-4 w-4 text-signal-red" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      {!stressTest.primaryStress.approved && (
        <div className="rounded-lg bg-signal-red-bg p-3 text-sm text-signal-red">
          Kunden klarar inte FI:s stresstest vid +{stressTest.primaryStress.rateAddon}% ränteuppgång.
          Underskott: {fmt(Math.abs(stressTest.primaryStress.kalpSurplus))} kr/mån.
        </div>
      )}

      {stressTest.primaryStress.approved && (
        <div className="rounded-lg bg-signal-green-bg p-3 text-sm" style={{ color: 'hsl(var(--signal-green))' }}>
          Kunden klarar stresstestet vid +{stressTest.primaryStress.rateAddon}% ränteuppgång
          med {fmt(stressTest.primaryStress.kalpSurplus)} kr/mån i marginal.
        </div>
      )}
    </div>
  );
}
