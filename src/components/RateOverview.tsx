import type { ProfitabilityResult, AdminConfig, CustomerInput } from '@/lib/types';
import { BINDING_PERIODS } from '@/lib/types';

export function RateOverview({ result, config, input }: {
  result: ProfitabilityResult;
  config: AdminConfig;
  input: CustomerInput;
}) {
  const totalMonthlyIncome = input.monthlyIncome + (input.coBorrower.enabled ? input.coBorrower.monthlyIncome : 0);
  const loanTypeLabel = config.kalkylPrices.loanTypes.find(lt => lt.key === input.loanType)?.label ?? input.loanType;

  return (
    <div className="metric-card space-y-4">
      <h3 className="section-header">Ränte- & Risköversikt</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricBox label="Kundränta" value={`${result.effectiveCustomerRate.toFixed(2)}%`} />
        <MetricBox label="Spread" value={`${result.spread.toFixed(2)}%`} warn={result.spread < 0.5} />
        <MetricBox label="Belåningsgrad" value={`${result.ltvPercent.toFixed(1)}%`} warn={result.ltvPercent > 85} />
        <MetricBox label="Skuldkvot" value={`${result.dtiPercent.toFixed(0)}%`} warn={result.dtiPercent > 450} />
      </div>

      {/* Rate breakdown */}
      <div className="rounded-lg bg-muted p-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Listränta</span>
          <span className="font-mono">{result.listRate.toFixed(2)}%</span>
        </div>
        {result.autoDiscount > 0 && (
          <div className="flex justify-between" style={{ color: 'hsl(var(--signal-green))' }}>
            <span>Produktrabatt</span>
            <span className="font-mono">-{result.autoDiscount.toFixed(2)}%</span>
          </div>
        )}
        {result.savingsDiscount > 0 && (
          <div className="flex justify-between" style={{ color: 'hsl(var(--signal-green))' }}>
            <span>Sparanderabatt</span>
            <span className="font-mono">-{result.savingsDiscount.toFixed(2)}%</span>
          </div>
        )}
        {result.rateDeviation !== 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Manuell</span>
            <span className="font-mono">{result.rateDeviation >= 0 ? '+' : ''}{result.rateDeviation.toFixed(2)}%</span>
          </div>
        )}
        <div className="flex justify-between font-semibold border-t pt-1">
          <span>Effektiv kundränta</span>
          <span className="font-mono">{result.effectiveCustomerRate.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>FTP{result.ftpGreenDiscount > 0 ? ' (inkl. grön rabatt)' : ''}</span>
          <span className="font-mono">{result.effectiveFTPRate.toFixed(2)}%</span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricBox label="Riskvikt" value={`${result.riskWeightPercent}%`} small />
        <MetricBox label="Allok. kapital" value={`${Math.round(result.allocatedCapital).toLocaleString('sv-SE')} kr`} small />
        <MetricBox label="Amortering" value={result.amortizationRate > 0 ? `${(result.amortizationRate * 100).toFixed(0)}%` : 'Nej'} small />
        <MetricBox label="Mån. amor." value={result.monthlyAmortization > 0 ? `${Math.round(result.monthlyAmortization).toLocaleString('sv-SE')} kr` : '—'} small />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-muted px-2 py-1">{loanTypeLabel}</span>
        {input.isGreenLoan && (
          <span className="rounded bg-signal-green-bg px-2 py-1" style={{ color: 'hsl(var(--signal-green))' }}>Grönt lån</span>
        )}
        {input.coBorrower.enabled && (
          <span className="rounded bg-muted px-2 py-1">Medsökande: {totalMonthlyIncome.toLocaleString('sv-SE')} kr/mån</span>
        )}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Räntetabell alla bindningstider
        </summary>
        <table className="w-full mt-2">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="pb-1 text-left font-medium">Bindning</th>
              <th className="pb-1 text-right font-medium">Lista</th>
              <th className="pb-1 text-right font-medium">FTP</th>
              <th className="pb-1 text-right font-medium">Spread</th>
            </tr>
          </thead>
          <tbody>
            {BINDING_PERIODS.map(bp => {
              const lr = config.listRates.mortgage[bp.key] ?? 0;
              const ftp = config.ftpRates.mortgage[bp.key] ?? 0;
              const isActive = bp.key === input.bindingPeriod;
              return (
                <tr key={bp.key} className={`border-b border-border/50 ${isActive ? 'bg-primary/5 font-semibold' : ''}`}>
                  <td className="py-1">{bp.label}</td>
                  <td className="py-1 text-right font-mono">{lr.toFixed(2)}%</td>
                  <td className="py-1 text-right font-mono">{ftp.toFixed(2)}%</td>
                  <td className="py-1 text-right font-mono">{(lr - ftp).toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function MetricBox({ label, value, warn = false, small = false }: {
  label: string; value: string; warn?: boolean; small?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 text-center ${warn ? 'bg-signal-red-bg' : 'bg-muted'}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono font-semibold ${warn ? 'text-signal-red' : 'text-foreground'} ${small ? 'text-sm' : 'text-lg'}`}>
        {value}
      </div>
    </div>
  );
}
