import type { CustomerInput, AdminConfig } from '@/lib/types';
import { BINDING_PERIODS } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw } from 'lucide-react';

interface CustomerFormProps {
  input: CustomerInput;
  onChange: (input: CustomerInput) => void;
  config: AdminConfig;
  onSaveScenario: () => void;
}

function formatSEK(n: number): string {
  return n.toLocaleString('sv-SE');
}

export function CustomerForm({ input, onChange, config, onSaveScenario }: CustomerFormProps) {
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
  const customerRate = listRate + input.rateDeviation;

  return (
    <div className="space-y-5">
      {/* Loan details */}
      <div className="metric-card space-y-4">
        <h3 className="section-header">Låneinformation</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Lånebelopp (SEK)</Label>
            <Input
              type="number"
              value={input.loanAmount}
              onChange={e => update('loanAmount', Number(e.target.value))}
              className="font-mono"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Marknadsvärde (SEK)</Label>
            <Input
              type="number"
              value={input.propertyValue}
              onChange={e => update('propertyValue', Number(e.target.value))}
              className="font-mono"
            />
          </div>
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

        {/* Rate slider */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Ränteavvikelse</Label>
            <span className="font-mono text-sm font-semibold text-foreground">
              {input.rateDeviation >= 0 ? '+' : ''}{input.rateDeviation.toFixed(2)}%
            </span>
          </div>
          <Slider
            min={-1.5}
            max={0.5}
            step={0.01}
            value={[input.rateDeviation]}
            onValueChange={([v]) => update('rateDeviation', v)}
            className="mt-1"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>-1.50%</span>
            <span className="font-mono font-semibold text-foreground">
              Kundränta: {customerRate.toFixed(2)}%
            </span>
            <span>+0.50%</span>
          </div>
        </div>
      </div>

      {/* Customer income */}
      <div className="metric-card space-y-4">
        <h3 className="section-header">Kundens ekonomi</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Månadsinkomst (SEK)</Label>
            <Input
              type="number"
              value={input.monthlyIncome}
              onChange={e => update('monthlyIncome', Number(e.target.value))}
              className="font-mono"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Inlåningssaldo (SEK)</Label>
            <Input
              type="number"
              value={input.depositBalance}
              onChange={e => update('depositBalance', Number(e.target.value))}
              className="font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={input.salaryDeposit}
            onCheckedChange={v => update('salaryDeposit', v)}
          />
          <Label className="text-sm">Lönen sätts in i banken</Label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Sparvolym (SEK)</Label>
            <Input
              type="number"
              value={input.savingsVolume}
              onChange={e => update('savingsVolume', Number(e.target.value))}
              className="font-mono"
            />
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
      </div>

      {/* Cross-selling products */}
      <div className="metric-card space-y-3">
        <h3 className="section-header">Produkter & Tjänster</h3>
        {config.crossSellingRules.filter(r => r.enabled).map(rule => (
          <label key={rule.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
            <Checkbox
              checked={input.activeProducts.includes(rule.id)}
              onCheckedChange={() => toggleProduct(rule.id)}
            />
            <div className="flex-1">
              <span className="text-sm font-medium">{rule.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                -{(rule.discountBps / 100).toFixed(2)}% | +{formatSEK(rule.annualIncomeContribution)} kr/år
              </span>
            </div>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onSaveScenario} variant="outline" className="flex-1">
          <Save className="mr-2 h-4 w-4" />
          Spara scenario
        </Button>
        <Button
          variant="ghost"
          onClick={() => onChange({
            loanAmount: 2500000, propertyValue: 3500000, bindingPeriod: '3m',
            rateDeviation: 0, monthlyIncome: 50000, salaryDeposit: false,
            depositBalance: 100000, activeProducts: [], savingsVolume: 0, savingsType: 'none',
          })}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
