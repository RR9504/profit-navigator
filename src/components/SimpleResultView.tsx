import type { ProfitabilityResult, CustomerInput } from '@/lib/types';
import { SignalIndicator } from '@/components/SignalIndicator';
import { CheckCircle, XCircle } from 'lucide-react';

function fmt(n: number): string {
  return Math.round(n).toLocaleString('sv-SE');
}

export function SimpleResultView({ result, input }: { result: ProfitabilityResult; input: CustomerInput }) {
  const r = result;

  // Monthly cost for the customer
  const monthlyInterest = (input.loanAmount * r.effectiveCustomerRate / 100) / 12;
  const monthlyTotal = monthlyInterest + r.monthlyAmortization;

  return (
    <div className="space-y-5">
      {/* Big signal */}
      <div className={`metric-card text-center py-8 ${
        r.signal === 'green' ? 'bg-signal-green-bg' : r.signal === 'yellow' ? 'bg-signal-yellow-bg' : 'bg-signal-red-bg'
      }`}>
        <SignalIndicator signal={r.signal} message={r.signalMessage} size="lg" />
      </div>

      {/* Customer rate - the key number */}
      <div className="metric-card text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Kundränta</div>
        <div className="text-4xl font-bold font-mono mt-2">{r.effectiveCustomerRate.toFixed(2)}%</div>
        {r.autoDiscount > 0 && (
          <div className="text-sm mt-2" style={{ color: 'hsl(var(--signal-green))' }}>
            inkl. {(r.autoDiscount * 100).toFixed(0)} bps produktrabatt
          </div>
        )}
        {r.savingsDiscount > 0 && (
          <div className="text-sm" style={{ color: 'hsl(var(--signal-green))' }}>
            inkl. {(r.savingsDiscount * 100).toFixed(0)} bps sparanderabatt
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          Listränta: {r.listRate.toFixed(2)}%
        </div>
      </div>

      {/* Monthly cost for customer */}
      <div className="metric-card">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Månadskostnad för kunden</div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{fmt(monthlyInterest)}</div>
            <div className="text-xs text-muted-foreground">Ränta/mån</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{fmt(r.monthlyAmortization)}</div>
            <div className="text-xs text-muted-foreground">Amortering/mån</div>
          </div>
        </div>
        <div className="border-t mt-3 pt-3 text-center">
          <div className="text-3xl font-bold font-mono">{fmt(monthlyTotal)} kr</div>
          <div className="text-xs text-muted-foreground">Total månadskostnad</div>
        </div>
      </div>

      {/* Key metrics - simplified */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Belåningsgrad" value={`${r.ltvPercent.toFixed(0)}%`} warn={r.ltvPercent > 85} />
        <MetricCard label="Skuldkvot" value={`${r.dtiPercent.toFixed(0)}%`} warn={r.dtiPercent > 450} />
      </div>

      {/* Amortization rule */}
      {r.amortizationRate > 0 && (
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Amorteringskrav</div>
              <div className="text-xs text-muted-foreground">
                {r.ltvPercent > 70 ? 'Belåningsgrad > 70%' : 'Belåningsgrad 50-70%'}
                {r.dtiPercent > 450 ? ' + skuldkvot > 450%' : ''}
              </div>
            </div>
            <div className="font-mono text-lg font-bold">{(r.amortizationRate * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* KALP - simple pass/fail */}
      <div className={`metric-card ${r.kalp.approved ? 'border-signal-green/30' : 'border-signal-red/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {r.kalp.approved
              ? <CheckCircle className="h-5 w-5 text-signal-green" />
              : <XCircle className="h-5 w-5 text-signal-red" />
            }
            <div>
              <div className="text-sm font-medium">KALP</div>
              <div className="text-xs text-muted-foreground">Kvar att leva på</div>
            </div>
          </div>
          <div className={`font-mono text-lg font-bold ${r.kalp.surplus >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
            {fmt(r.kalp.surplus)} kr/mån
          </div>
        </div>
      </div>

      {/* Stress test - simple */}
      <div className={`metric-card ${r.stressTest.primaryStress.approved ? 'border-signal-green/30' : 'border-signal-red/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {r.stressTest.primaryStress.approved
              ? <CheckCircle className="h-5 w-5 text-signal-green" />
              : <XCircle className="h-5 w-5 text-signal-red" />
            }
            <div>
              <div className="text-sm font-medium">Stresstest (+3%)</div>
              <div className="text-xs text-muted-foreground">
                Klarar kunden {r.stressTest.primaryStress.stressedRate.toFixed(2)}% ränta?
              </div>
            </div>
          </div>
          <div className={`font-mono text-lg font-bold ${r.stressTest.primaryStress.kalpSurplus >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
            {r.stressTest.primaryStress.approved ? 'Ja' : 'Nej'}
          </div>
        </div>
      </div>

      {/* Available discount info */}
      {r.maxProductDiscountBps > 0 && r.appliedProductDiscountBps < r.maxProductDiscountBps && (
        <div className="rounded-lg border border-accent/30 bg-signal-yellow-bg p-4 text-sm">
          <div className="font-medium">Möjlig ytterligare rabatt</div>
          <div className="text-xs text-muted-foreground mt-1">
            Kunden kvalificerar för {r.maxProductDiscountBps - r.appliedProductDiscountBps} bps
            till i produktrabatt. Justera slidern för att ge rabatten.
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`metric-card text-center ${warn ? 'border-signal-red/30' : ''}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-mono text-xl font-bold mt-1 ${warn ? 'text-signal-red' : ''}`}>{value}</div>
    </div>
  );
}
