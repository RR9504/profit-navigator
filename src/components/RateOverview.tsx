import type { ProfitabilityResult, AdminConfig, CustomerInput } from '@/lib/types';
import { BINDING_PERIODS } from '@/lib/types';

export function RateOverview({ result, config, input }: {
  result: ProfitabilityResult;
  config: AdminConfig;
  input: CustomerInput;
}) {
  return (
    <div className="metric-card space-y-4">
      <h3 className="section-header">Ränte- & Risköversikt</h3>

      {/* Main metrics row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricBox label="Kundränta" value={`${result.customerRate.toFixed(2)}%`} />
        <MetricBox label="Listränta" value={`${result.listRate.toFixed(2)}%`} />
        <MetricBox label="Belåningsgrad" value={`${result.ltvPercent.toFixed(1)}%`} warn={result.ltvPercent > 85} />
        <MetricBox label="Skuldkvot" value={`${result.dtiPercent.toFixed(0)}%`} warn={result.dtiPercent > 450} />
      </div>

      {/* Amortization */}
      {result.monthlyAmortization > 0 && (
        <div className="rounded-lg bg-muted p-3">
          <span className="text-xs text-muted-foreground">Månatlig amortering (lagkrav):</span>
          <span className="ml-2 font-mono text-sm font-semibold">{Math.round(result.monthlyAmortization).toLocaleString('sv-SE')} kr</span>
        </div>
      )}

      {/* Rate table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="pb-2 text-left font-medium">Bindning</th>
              <th className="pb-2 text-right font-medium">Listpris</th>
              <th className="pb-2 text-right font-medium">FTP</th>
              <th className="pb-2 text-right font-medium">Spread</th>
            </tr>
          </thead>
          <tbody>
            {BINDING_PERIODS.map(bp => {
              const lr = config.listRates.mortgage[bp.key] ?? 0;
              const ftp = config.ftpRates.mortgage[bp.key] ?? 0;
              const isActive = bp.key === input.bindingPeriod;
              return (
                <tr key={bp.key} className={`border-b border-border/50 ${isActive ? 'bg-primary/5 font-semibold' : ''}`}>
                  <td className="py-1.5">{bp.label}</td>
                  <td className="py-1.5 text-right font-mono">{lr.toFixed(2)}%</td>
                  <td className="py-1.5 text-right font-mono">{ftp.toFixed(2)}%</td>
                  <td className="py-1.5 text-right font-mono">{(lr - ftp).toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricBox({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${warn ? 'bg-signal-red-bg' : 'bg-muted'}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold ${warn ? 'text-signal-red' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
