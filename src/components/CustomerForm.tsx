import { useState, useMemo } from 'react';
import type { CustomerInput, AdminConfig, ProductCategory } from '@/lib/types';
import { BINDING_PERIODS, PRODUCT_CATEGORIES } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, UserPlus, Search, Leaf } from 'lucide-react';

interface CustomerFormProps {
  input: CustomerInput;
  onChange: (input: CustomerInput) => void;
  config: AdminConfig;
  onSaveScenario: () => void;
}

function formatSEK(n: number): string {
  return n.toLocaleString('sv-SE');
}

const defaultInput: CustomerInput = {
  loanAmount: 2500000,
  propertyValue: 3500000,
  loanType: 'hypotek',
  isGreenLoan: false,
  bindingPeriod: '3m',
  rateDeviation: 0,
  monthlyIncome: 50000,
  salaryDeposit: false,
  depositBalance: 100000,
  coBorrower: { enabled: false, monthlyIncome: 0 },
  numberOfChildren: 0,
  activeProducts: [],
  savingsVolume: 0,
  savingsType: 'none',
  otherLoansMonthly: 0,
};

export { defaultInput };

export function CustomerForm({ input, onChange, config, onSaveScenario }: CustomerFormProps) {
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');

  const update = <K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) => {
    onChange({ ...input, [key]: value });
  };

  const toggleProduct = (id: string) => {
    const next = input.activeProducts.includes(id)
      ? input.activeProducts.filter(p => p !== id)
      : [...input.activeProducts, id];
    update('activeProducts', next);
  };

  const listRate = config.listRates.mortgage[input.bindingPeriod] ?? 3.79;
  const activeRules = config.crossSellingRules.filter(
    r => r.enabled && input.activeProducts.includes(r.id),
  );
  const autoDiscountBps = activeRules.reduce((sum, r) => sum + r.discountBps, 0);
  const autoDiscount = autoDiscountBps / 100;

  // Savings discount
  const savingsDiscountBps = useMemo(() => {
    for (const tier of config.savingsDiscountTiers) {
      if (input.savingsVolume >= tier.minVolume && input.savingsVolume < tier.maxVolume)
        return tier.discountBps;
    }
    return 0;
  }, [input.savingsVolume, config.savingsDiscountTiers]);
  const savingsDiscount = savingsDiscountBps / 100;

  const effectiveRate = Math.max(0, listRate - autoDiscount - savingsDiscount + input.rateDeviation);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return config.crossSellingRules.filter(r => {
      if (!r.enabled) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (productSearch) {
        const q = productSearch.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [config.crossSellingRules, categoryFilter, productSearch]);

  const activeCount = input.activeProducts.length;
  const totalDiscountBps = autoDiscountBps + savingsDiscountBps;

  return (
    <div className="space-y-5">
      {/* Loan details */}
      <div className="metric-card space-y-4">
        <h3 className="section-header">Låneinformation</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Lånebelopp (SEK)</Label>
            <Input type="number" min={0} value={input.loanAmount}
              onChange={e => update('loanAmount', Math.max(0, Number(e.target.value)))}
              className="font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Marknadsvärde (SEK)</Label>
            <Input type="number" min={0} value={input.propertyValue}
              onChange={e => update('propertyValue', Math.max(0, Number(e.target.value)))}
              className="font-mono" />
          </div>
        </div>

        {/* Loan type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Lånetyp</Label>
            <Select value={input.loanType} onValueChange={v => update('loanType', v as CustomerInput['loanType'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {config.kalkylPrices.loanTypes.map(lt => (
                  <SelectItem key={lt.key} value={lt.key}>{lt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Bindningstid</Label>
            <Select value={input.bindingPeriod} onValueChange={v => update('bindingPeriod', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BINDING_PERIODS.map(bp => (
                  <SelectItem key={bp.key} value={bp.key}>
                    {bp.label} — {(config.listRates.mortgage[bp.key] ?? 0).toFixed(2)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Green loan */}
        <div className="flex items-center gap-3">
          <Switch checked={input.isGreenLoan} onCheckedChange={v => update('isGreenLoan', v)} />
          <Label className="text-sm flex items-center gap-1">
            <Leaf className="h-4 w-4 text-signal-green" /> Grönt lån (FTP-rabatt)
          </Label>
        </div>

        {/* Rate slider */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Manuell räntejustering</Label>
            <span className="font-mono text-sm font-semibold">
              {input.rateDeviation >= 0 ? '+' : ''}{input.rateDeviation.toFixed(2)}%
            </span>
          </div>
          <Slider min={-1.5} max={0.5} step={0.01}
            value={[input.rateDeviation]}
            onValueChange={([v]) => update('rateDeviation', v)}
            className="mt-1" />
          <div className="mt-2 space-y-0.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Listränta</span>
              <span className="font-mono">{listRate.toFixed(2)}%</span>
            </div>
            {autoDiscount > 0 && (
              <div className="flex justify-between" style={{ color: 'hsl(var(--signal-green))' }}>
                <span>Produktrabatt ({autoDiscountBps} bps)</span>
                <span className="font-mono">-{autoDiscount.toFixed(2)}%</span>
              </div>
            )}
            {savingsDiscount > 0 && (
              <div className="flex justify-between" style={{ color: 'hsl(var(--signal-green))' }}>
                <span>Sparanderabatt ({savingsDiscountBps} bps)</span>
                <span className="font-mono">-{savingsDiscount.toFixed(2)}%</span>
              </div>
            )}
            {input.rateDeviation !== 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Manuell</span>
                <span className="font-mono">{input.rateDeviation >= 0 ? '+' : ''}{input.rateDeviation.toFixed(2)}%</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Kundränta</span>
              <span className="font-mono">{effectiveRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer income */}
      <div className="metric-card space-y-4">
        <h3 className="section-header">Kundens ekonomi</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Månadsinkomst (SEK)</Label>
            <Input type="number" min={0} value={input.monthlyIncome}
              onChange={e => update('monthlyIncome', Math.max(0, Number(e.target.value)))}
              className="font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Inlåningssaldo (SEK)</Label>
            <Input type="number" min={0} value={input.depositBalance}
              onChange={e => update('depositBalance', Math.max(0, Number(e.target.value)))}
              className="font-mono" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={input.salaryDeposit} onCheckedChange={v => update('salaryDeposit', v)} />
          <Label className="text-sm">Lönen sätts in i banken</Label>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Övriga lånekostnader (kr/mån)</Label>
          <Input type="number" min={0} value={input.otherLoansMonthly}
            onChange={e => update('otherLoansMonthly', Math.max(0, Number(e.target.value)))}
            className="font-mono" />
        </div>

        {/* Co-borrower */}
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center gap-3">
            <Switch checked={input.coBorrower.enabled}
              onCheckedChange={v => onChange({ ...input, coBorrower: { ...input.coBorrower, enabled: v } })} />
            <Label className="text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Medsökande
            </Label>
          </div>
          {input.coBorrower.enabled && (
            <div>
              <Label className="text-xs text-muted-foreground">Medsökandes månadsinkomst (SEK)</Label>
              <Input type="number" min={0} value={input.coBorrower.monthlyIncome}
                onChange={e => onChange({ ...input, coBorrower: { ...input.coBorrower, monthlyIncome: Math.max(0, Number(e.target.value)) } })}
                className="font-mono" />
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Antal barn i hushållet</Label>
          <Input type="number" min={0} max={10} value={input.numberOfChildren}
            onChange={e => update('numberOfChildren', Math.max(0, Math.min(10, Number(e.target.value))))}
            className="font-mono w-24" />
        </div>
      </div>

      {/* Savings */}
      <div className="metric-card space-y-4">
        <h3 className="section-header">Sparande</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Sparvolym (SEK)</Label>
            <Input type="number" min={0} value={input.savingsVolume}
              onChange={e => update('savingsVolume', Math.max(0, Number(e.target.value)))}
              className="font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Spartyp</Label>
            <Select value={input.savingsType} onValueChange={v => update('savingsType', v as CustomerInput['savingsType'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Inget</SelectItem>
                <SelectItem value="fund">Fond</SelectItem>
                <SelectItem value="isk">ISK</SelectItem>
                <SelectItem value="deposit">Sparkonto</SelectItem>
                <SelectItem value="pension">Pension</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {input.savingsVolume > 0 && (
          <div className="space-y-1">
            {input.savingsType !== 'none' && (
              <div className="rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
                Marginalintäkt: {(() => {
                  const m = config.savingsMargins.find(s => s.type === input.savingsType);
                  return m ? `${formatSEK(Math.round(input.savingsVolume * m.marginPercent / 100))} kr/år` : '—';
                })()}
              </div>
            )}
            {savingsDiscountBps > 0 && (
              <div className="rounded px-3 py-2 text-xs font-medium bg-signal-green-bg" style={{ color: 'hsl(var(--signal-green))' }}>
                Sparanderabatt: -{savingsDiscount.toFixed(2)}% ({savingsDiscountBps} bps) pga {formatSEK(input.savingsVolume)} kr sparvolym
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products & services - with search */}
      <div className="metric-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="section-header">Produkter & Tjänster</h3>
          {activeCount > 0 && (
            <span className="text-xs font-mono bg-primary/10 px-2 py-0.5 rounded text-primary">
              {activeCount} aktiva{totalDiscountBps > 0 && ` | -${(totalDiscountBps / 100).toFixed(2)}%`}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök produkt..."
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Alla
          </button>
          {PRODUCT_CATEGORIES.map(cat => {
            const count = config.crossSellingRules.filter(r => r.enabled && r.category === cat.key).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  categoryFilter === cat.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Product list */}
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {filteredProducts.map(rule => (
            <label key={rule.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
              <Checkbox
                checked={input.activeProducts.includes(rule.id)}
                onCheckedChange={() => toggleProduct(rule.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{rule.name}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded shrink-0">
                    {PRODUCT_CATEGORIES.find(c => c.key === rule.category)?.label}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {rule.discountBps > 0 && <span className="text-signal-green">-{(rule.discountBps / 100).toFixed(2)}%</span>}
                  {rule.discountBps > 0 && rule.annualIncomeContribution > 0 && ' · '}
                  {rule.annualIncomeContribution > 0 && `+${formatSEK(rule.annualIncomeContribution)} kr/år`}
                </div>
              </div>
            </label>
          ))}
          {filteredProducts.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">Inga produkter matchar sökningen</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onSaveScenario} variant="outline" className="flex-1">
          <Save className="mr-2 h-4 w-4" /> Spara scenario
        </Button>
        <Button variant="ghost" onClick={() => onChange(defaultInput)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
