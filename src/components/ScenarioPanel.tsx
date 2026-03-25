import type { Scenario, ProfitabilityResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SignalIndicator } from '@/components/SignalIndicator';
import { Upload, Trash2 } from 'lucide-react';

interface ScenarioPanelProps {
  scenarios: Scenario[];
  currentResult: ProfitabilityResult;
  onLoad: (s: Scenario) => void;
  onRemove: (id: string) => void;
}

export function ScenarioPanel({ scenarios, currentResult, onLoad, onRemove }: ScenarioPanelProps) {
  return (
    <div className="metric-card space-y-4">
      <h3 className="section-header">Sparade Scenarion</h3>

      {scenarios.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Inga sparade scenarion ännu. Använd "Spara scenario" för att jämföra olika alternativ.
        </p>
      )}

      <div className="space-y-3">
        {scenarios.map(s => (
          <div key={s.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{s.name}</span>
              <SignalIndicator signal={s.result.signal} message="" size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Lån: </span>
                <span className="font-mono">{(s.input.loanAmount / 1e6).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ränta: </span>
                <span className="font-mono">{(s.result.customerRate).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">EP: </span>
                <span className="font-mono">{Math.round(s.result.economicProfit).toLocaleString('sv-SE')} kr</span>
              </div>
              <div>
                <span className="text-muted-foreground">Marginal: </span>
                <span className="font-mono">{s.result.netMarginPercent.toFixed(2)}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onLoad(s)} className="flex-1 text-xs">
                <Upload className="mr-1 h-3 w-3" /> Ladda
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onRemove(s.id)} className="text-xs text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Current summary */}
      <div className="border-t pt-4">
        <h4 className="section-header mb-2">Aktuellt resultat</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Economic Profit</span>
            <span className="font-mono font-semibold">{Math.round(currentResult.economicProfit).toLocaleString('sv-SE')} kr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nettomarginal</span>
            <span className="font-mono font-semibold">{currentResult.netMarginPercent.toFixed(3)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RAROC</span>
            <span className="font-mono font-semibold">{currentResult.returnOnCapital.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
