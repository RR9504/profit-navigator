import { useState } from 'react';
import type { AdminConfig } from '@/lib/types';
import { BINDING_PERIODS, PRODUCT_CATEGORIES } from '@/lib/types';
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

  const handleSave = () => { saveConfig(config); toast.success('Konfiguration sparad'); };
  const handleReset = () => { setConfig(resetConfig()); toast.info('Konfiguration återställd'); };

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
              <p className="text-sm text-muted-foreground">Kalkylpriser, Risk, OH, Regulatoriskt & KALP</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4" /> Återställ</Button>
            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Spara</Button>
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
                      <td className="py-2"><Input type="number" step="0.01" value={lr} onChange={e => updateRate('listRates', bp.key, Number(e.target.value))} className="ml-auto w-24 text-right font-mono" /></td>
                      <td className="py-2"><Input type="number" step="0.01" value={ftp} onChange={e => updateRate('ftpRates', bp.key, Number(e.target.value))} className="ml-auto w-24 text-right font-mono" /></td>
                      <td className="py-2 text-right font-mono">{(lr - ftp).toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loan types */}
        <div className="metric-card space-y-4">
          <h3 className="section-header">Lånetyper & Kalkylpriser (KRES)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="pb-2 text-left font-medium">Typ</th>
                <th className="pb-2 text-right font-medium">Upplägg (kr)</th>
                <th className="pb-2 text-right font-medium">Årskostnad (kr)</th>
                <th className="pb-2 text-right font-medium">Avslut (kr)</th>
              </tr>
            </thead>
            <tbody>
              {config.kalkylPrices.loanTypes.map((lt, i) => (
                <tr key={lt.key} className="border-b border-border/50">
                  <td className="py-2 font-medium">{lt.label}</td>
                  <td className="py-2"><Input type="number" value={lt.setupCost} onChange={e => { const lts = [...config.kalkylPrices.loanTypes]; lts[i] = { ...lts[i], setupCost: Number(e.target.value) }; setConfig(p => ({ ...p, kalkylPrices: { ...p.kalkylPrices, loanTypes: lts } })); }} className="ml-auto w-24 text-right font-mono" /></td>
                  <td className="py-2"><Input type="number" value={lt.annualCost} onChange={e => { const lts = [...config.kalkylPrices.loanTypes]; lts[i] = { ...lts[i], annualCost: Number(e.target.value) }; setConfig(p => ({ ...p, kalkylPrices: { ...p.kalkylPrices, loanTypes: lts } })); }} className="ml-auto w-24 text-right font-mono" /></td>
                  <td className="py-2"><Input type="number" value={lt.closingCost} onChange={e => { const lts = [...config.kalkylPrices.loanTypes]; lts[i] = { ...lts[i], closingCost: Number(e.target.value) }; setConfig(p => ({ ...p, kalkylPrices: { ...p.kalkylPrices, loanTypes: lts } })); }} className="ml-auto w-24 text-right font-mono" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label className="text-xs text-muted-foreground">Fast kundkostnad (kr/år)</Label>
              <Input type="number" value={config.kalkylPrices.customerFixedCost} onChange={e => setConfig(p => ({ ...p, kalkylPrices: { ...p.kalkylPrices, customerFixedCost: Number(e.target.value) } }))} className="font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Uppläggningsavgift till kund (kr)</Label>
              <Input type="number" value={config.kalkylPrices.arrangementFee} onChange={e => setConfig(p => ({ ...p, kalkylPrices: { ...p.kalkylPrices, arrangementFee: Number(e.target.value) } }))} className="font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rådgivningskostnad (kr/tillfälle)</Label>
              <Input type="number" value={config.kalkylPrices.advisoryCostPerSession} onChange={e => setConfig(p => ({ ...p, kalkylPrices: { ...p.kalkylPrices, advisoryCostPerSession: Number(e.target.value) } }))} className="font-mono" />
            </div>
          </div>
        </div>

        {/* Cross-selling - grouped by category */}
        <div className="metric-card">
          <h3 className="section-header mb-4">Produktkatalog</h3>
          {PRODUCT_CATEGORIES.map(cat => {
            const rules = config.crossSellingRules.filter(r => r.category === cat.key);
            if (rules.length === 0) return null;
            return (
              <div key={cat.key} className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">{cat.label}</h4>
                <table className="w-full text-xs mb-2">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-1 text-left font-medium w-8">On</th>
                      <th className="pb-1 text-left font-medium">Produkt</th>
                      <th className="pb-1 text-right font-medium">Rabatt (bps)</th>
                      <th className="pb-1 text-right font-medium">Intjäning/år</th>
                      <th className="pb-1 text-right font-medium">KRES upplägg</th>
                      <th className="pb-1 text-right font-medium">KRES åk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(rule => (
                      <tr key={rule.id} className="border-b border-border/50">
                        <td className="py-1"><Switch checked={rule.enabled} onCheckedChange={v => updateRule(rule.id, 'enabled', v)} /></td>
                        <td className="py-1 font-medium">{rule.name}</td>
                        <td className="py-1"><Input type="number" step="1" value={rule.discountBps} onChange={e => updateRule(rule.id, 'discountBps', Number(e.target.value))} className="ml-auto w-16 text-right font-mono" /></td>
                        <td className="py-1"><Input type="number" step="100" value={rule.annualIncomeContribution} onChange={e => updateRule(rule.id, 'annualIncomeContribution', Number(e.target.value))} className="ml-auto w-20 text-right font-mono" /></td>
                        <td className="py-1 text-right font-mono text-muted-foreground">{rule.internalSetupCost} kr</td>
                        <td className="py-1 text-right font-mono text-muted-foreground">{rule.internalAnnualCost} kr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Risk & Capital */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="metric-card space-y-4">
            <h3 className="section-header">Kreditrisk & Kapital</h3>
            {([
              ['basePDPercent', 'Bas-PD (%)'],
              ['lgdPercent', 'LGD (%)'],
              ['costOfCapitalRate', 'Avkastningskrav (%)'],
              ['capitalRequirementPercent', 'Kapitalkrav (%)'],
              ['taxRate', 'Skattesats (%)'],
              ['equityFTPRate', 'Equity FTP (%)'],
              ['depositFTPRate', 'FTP inlåning (%)'],
              ['depositInterestRate', 'Inlåningsränta till kund (%)'],
              ['expectedLoanDurationYears', 'Förväntad lånetid (år)'],
              ['salaryDepositBalanceMonths', 'Löneinlåning snittsaldo (mån)'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input type="number" step="0.01" value={config[key]} onChange={e => setConfig(p => ({ ...p, [key]: Number(e.target.value) }))} className="font-mono" />
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="metric-card space-y-4">
              <h3 className="section-header">Riskvikter per LTV-band</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="pb-2 text-left font-medium">Max LTV (%)</th>
                    <th className="pb-2 text-right font-medium">Riskvikt (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {config.riskWeightBands.map((band, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1"><Input type="number" value={band.maxLTV} onChange={e => { const b = [...config.riskWeightBands]; b[i] = { ...b[i], maxLTV: Number(e.target.value) }; setConfig(p => ({ ...p, riskWeightBands: b })); }} className="w-20 font-mono" /></td>
                      <td className="py-1"><Input type="number" value={band.riskWeightPercent} onChange={e => { const b = [...config.riskWeightBands]; b[i] = { ...b[i], riskWeightPercent: Number(e.target.value) }; setConfig(p => ({ ...p, riskWeightBands: b })); }} className="ml-auto w-20 text-right font-mono" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Savings discount tiers */}
            <div className="metric-card space-y-4">
              <h3 className="section-header">Sparanderabatt per volymtrappa</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="pb-1 text-left font-medium">Från (kr)</th>
                    <th className="pb-1 text-left font-medium">Till (kr)</th>
                    <th className="pb-1 text-right font-medium">Rabatt (bps)</th>
                  </tr>
                </thead>
                <tbody>
                  {config.savingsDiscountTiers.map((tier, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1 font-mono text-xs">{tier.minVolume.toLocaleString('sv-SE')}</td>
                      <td className="py-1 font-mono text-xs">{tier.maxVolume >= 999999999 ? '∞' : tier.maxVolume.toLocaleString('sv-SE')}</td>
                      <td className="py-1"><Input type="number" value={tier.discountBps} onChange={e => { const t = [...config.savingsDiscountTiers]; t[i] = { ...t[i], discountBps: Number(e.target.value) }; setConfig(p => ({ ...p, savingsDiscountTiers: t })); }} className="ml-auto w-20 text-right font-mono" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* OH Model */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="metric-card space-y-4">
            <h3 className="section-header">OH-modell (aktivitetsbaserad)</h3>
            <p className="text-xs text-muted-foreground">Overhead fördelas per 2022-ramverket: % av respektive dimension.</p>
            {([
              ['ancillaryRate', 'OH på Ancillary Income (%)'],
              ['financingRate', 'OH på Financing Income (%)'],
              ['exposureRate', 'OH på Exposure/lånevolym (%)'],
              ['capitalRate', 'OH på Allokerat kapital (%)'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input type="number" step="0.01" value={config.ohModel[key]} onChange={e => setConfig(p => ({ ...p, ohModel: { ...p.ohModel, [key]: Number(e.target.value) } }))} className="font-mono" />
              </div>
            ))}
          </div>

          <div className="metric-card space-y-4">
            <h3 className="section-header">Regulatoriska kostnader</h3>
            {([
              ['depositInsuranceRate', 'Insättningsgaranti (% av inlåning)'],
              ['bankTaxLendingRate', 'Bankskatt utlåning (% av lån)'],
              ['bankTaxDepositRate', 'Bankskatt inlåning (% av inlåning)'],
              ['resolutionFundRate', 'Resolutionsfond (% av lån)'],
              ['greenLoanFTPDiscount', 'Grön lån FTP-rabatt (bps)'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input type="number" step="0.001" value={config.regulatoryCosts[key]} onChange={e => setConfig(p => ({ ...p, regulatoryCosts: { ...p.regulatoryCosts, [key]: Number(e.target.value) } }))} className="font-mono" />
              </div>
            ))}
          </div>
        </div>

        {/* Savings margins */}
        <div className="metric-card space-y-4">
          <h3 className="section-header">Sparandemarginaler</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="pb-2 text-left font-medium">Spartyp</th>
                <th className="pb-2 text-right font-medium">Marginal (%/år)</th>
              </tr>
            </thead>
            <tbody>
              {config.savingsMargins.map((m, i) => (
                <tr key={m.type} className="border-b border-border/50">
                  <td className="py-2 font-medium">{m.label}</td>
                  <td className="py-2"><Input type="number" step="0.01" value={m.marginPercent} onChange={e => { const ms = [...config.savingsMargins]; ms[i] = { ...ms[i], marginPercent: Number(e.target.value) }; setConfig(p => ({ ...p, savingsMargins: ms })); }} className="ml-auto w-24 text-right font-mono" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* KALP */}
        <div className="metric-card space-y-4">
          <h3 className="section-header">KALP-parametrar</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {([
              ['singleAdultMonthlyCost', 'Levnadskostnad ensamstående (kr/mån)'],
              ['coupleAdultMonthlyCost', 'Levnadskostnad par (kr/mån)'],
              ['childMonthlyCost', 'Kostnad per barn (kr/mån)'],
              ['effectiveTaxRate', 'Effektiv skattesats (%)'],
              ['interestDeductionLow', 'Ränteavdrag ≤100k (%)'],
              ['interestDeductionHigh', 'Ränteavdrag >100k (%)'],
              ['interestDeductionThreshold', 'Ränteavdragsgräns (kr/år)'],
              ['housingCostMonthly', 'Drift boende (kr/mån)'],
              ['stressRateAddon', 'Stresstest räntetillägg (pp)'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input type="number" step="0.1" value={config.kalpConfig[key]} onChange={e => setConfig(p => ({ ...p, kalpConfig: { ...p.kalpConfig, [key]: Number(e.target.value) } }))} className="font-mono" />
              </div>
            ))}
          </div>
        </div>

        {/* Thresholds */}
        <div className="metric-card space-y-4">
          <h3 className="section-header">Tröskelvärden (Trafikljus)</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Grön marginal (&#8805; %)</Label>
              <Input type="number" step="0.01" value={config.thresholds.greenMinMarginPercent} onChange={e => setConfig(p => ({ ...p, thresholds: { ...p.thresholds, greenMinMarginPercent: Number(e.target.value) } }))} className="font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Gul marginal (&#8805; %)</Label>
              <Input type="number" step="0.01" value={config.thresholds.yellowMinMarginPercent} onChange={e => setConfig(p => ({ ...p, thresholds: { ...p.thresholds, yellowMinMarginPercent: Number(e.target.value) } }))} className="font-mono" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="signal-badge-green">Grön: Godkänd</span>
            <span className="signal-badge-yellow">Gul: Chefsbeslut</span>
            <span className="signal-badge-red">Röd: Avslag</span>
          </div>
          <p className="text-xs text-muted-foreground">Signalen tar hänsyn till KALP, stresstest och marginal.</p>
        </div>
      </div>
    </div>
  );
}
