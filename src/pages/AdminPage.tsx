import { useState } from 'react';
import type { AdminConfig } from '@/lib/types';
import { BINDING_PERIODS } from '@/lib/types';
import { loadConfig, saveConfig, resetConfig } from '@/lib/configStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, RotateCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AdminConfig>(loadConfig);

  const updateRate = (type: 'listRates' | 'ftpRates', key: string, val: number) => {
    setConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], mortgage: { ...prev[type].mortgage, [key]: val } },
    }));
  };

  const updateRule = (id: string, field: string, val: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      crossSellingRules: prev.crossSellingRules.map(r =>
        r.id === id ? { ...r, [field]: val } : r
      ),
    }));
  };

  const handleSave = () => {
    saveConfig(config);
    toast.success('Konfiguration sparad');
  };

  const handleReset = () => {
    const fresh = resetConfig();
    setConfig(fresh);
    toast.info('Konfiguration återställd till standardvärden');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Administration</h1>
              <p className="text-sm text-muted-foreground">Kalkylpriser & Parametrar</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Återställ
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Spara
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] p-6 space-y-8">
        {/* Rates */}
        <div className="metric-card">
          <h3 className="section-header mb-4">Listräntor & FTP per bindningstid</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Bindning</th>
                  <th className="pb-2 text-right font-medium">Listränta (%)</th>
                  <th className="pb-2 text-right font-medium">FTP (%)</th>
                  <th className="pb-2 text-right font-medium">Spread (%)</th>
                </tr>
              </thead>
              <tbody>
                {BINDING_PERIODS.map(bp => {
                  const lr = config.listRates.mortgage[bp.key] ?? 0;
                  const ftp = config.ftpRates.mortgage[bp.key] ?? 0;
                  return (
                    <tr key={bp.key} className="border-b border-border/50">
                      <td className="py-2 font-medium">{bp.label}</td>
                      <td className="py-2">
                        <Input
                          type="number" step="0.01" value={lr}
                          onChange={e => updateRate('listRates', bp.key, Number(e.target.value))}
                          className="ml-auto w-24 text-right font-mono"
                        />
                      </td>
                      <td className="py-2">
                        <Input
                          type="number" step="0.01" value={ftp}
                          onChange={e => updateRate('ftpRates', bp.key, Number(e.target.value))}
                          className="ml-auto w-24 text-right font-mono"
                        />
                      </td>
                      <td className="py-2 text-right font-mono">{(lr - ftp).toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cross-selling */}
        <div className="metric-card">
          <h3 className="section-header mb-4">Cross-selling Regler</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 text-left font-medium">Aktiv</th>
                <th className="pb-2 text-left font-medium">Produkt</th>
                <th className="pb-2 text-right font-medium">Rabatt (bps)</th>
                <th className="pb-2 text-right font-medium">Intjäning (kr/år)</th>
              </tr>
            </thead>
            <tbody>
              {config.crossSellingRules.map(rule => (
                <tr key={rule.id} className="border-b border-border/50">
                  <td className="py-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={v => updateRule(rule.id, 'enabled', v)}
                    />
                  </td>
                  <td className="py-2 font-medium">{rule.name}</td>
                  <td className="py-2">
                    <Input
                      type="number" step="1" value={rule.discountBps}
                      onChange={e => updateRule(rule.id, 'discountBps', Number(e.target.value))}
                      className="ml-auto w-20 text-right font-mono"
                    />
                  </td>
                  <td className="py-2">
                    <Input
                      type="number" step="100" value={rule.annualIncomeContribution}
                      onChange={e => updateRule(rule.id, 'annualIncomeContribution', Number(e.target.value))}
                      className="ml-auto w-24 text-right font-mono"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kalkylpriser */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="metric-card space-y-4">
            <h3 className="section-header">Kalkylpriser (Sparbank)</h3>
            {([
              ['loanSetupCost', 'Bolån upplägg (kr)'],
              ['loanAnnualCost', 'Årskostnad krediter (kr)'],
              ['loanClosingCost', 'Avslutskostnad (kr)'],
              ['customerFixedCost', 'Fast kundkostnad (kr/år)'],
              ['overheadPerCustomer', 'OH-kostnad per kund (kr/år)'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input
                  type="number"
                  value={config.kalkylPrices[key]}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    kalkylPrices: { ...prev.kalkylPrices, [key]: Number(e.target.value) },
                  }))}
                  className="font-mono"
                />
              </div>
            ))}
          </div>

          <div className="metric-card space-y-4">
            <h3 className="section-header">Modellparametrar</h3>
            {([
              ['expectedLossRate', 'Förväntad förlust (% av lån)'],
              ['costOfCapitalRate', 'Avkastningskrav kapital (%)'],
              ['riskWeightPercent', 'Riskvikt bolån (%)'],
              ['capitalRequirementPercent', 'Kapitalkrav (%)'],
              ['taxRate', 'Skattesats (%)'],
              ['equityFTPRate', 'Equity FTP (%)'],
              ['depositFTPRate', 'FTP inlåning (%)'],
              ['depositInterestRate', 'Inlåningsränta till kund (%)'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input
                  type="number" step="0.01"
                  value={config[key]}
                  onChange={e => setConfig(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Thresholds */}
        <div className="metric-card space-y-4">
          <h3 className="section-header">Tröskelvärden (Trafikljus)</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">
                Grön marginal (≥ % av lån = godkänd)
              </Label>
              <Input
                type="number" step="0.01"
                value={config.thresholds.greenMinMarginPercent}
                onChange={e => setConfig(prev => ({
                  ...prev,
                  thresholds: { ...prev.thresholds, greenMinMarginPercent: Number(e.target.value) },
                }))}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Gul marginal (≥ % av lån = chefsbeslut)
              </Label>
              <Input
                type="number" step="0.01"
                value={config.thresholds.yellowMinMarginPercent}
                onChange={e => setConfig(prev => ({
                  ...prev,
                  thresholds: { ...prev.thresholds, yellowMinMarginPercent: Number(e.target.value) },
                }))}
                className="font-mono"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="signal-badge-green">● Grön: Godkänd</span>
            <span className="signal-badge-yellow">● Gul: Chefsbeslut</span>
            <span className="signal-badge-red">● Röd: Förlustaffär</span>
          </div>
        </div>
      </div>
    </div>
  );
}
