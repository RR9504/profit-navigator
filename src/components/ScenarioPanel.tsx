import { useEffect } from 'react';
import type { Scenario, ProfitabilityResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SignalIndicator } from '@/components/SignalIndicator';
import { Upload, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'sparbank-scenarios';

interface ScenarioPanelProps {
  scenarios: Scenario[];
  currentResult: ProfitabilityResult;
  onLoad: (s: Scenario) => void;
  onRemove: (id: string) => void;
  onScenariosChange: (scenarios: Scenario[]) => void;
}

export function ScenarioPanel({ scenarios, currentResult, onLoad, onRemove, onScenariosChange }: ScenarioPanelProps) {
  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    } catch { /* ignore quota errors */ }
  }, [scenarios]);

  return (
    <div className="metric-card space-y-4">
      <h3 className="section-header">Sparade Scenarion</h3>

      {scenarios.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Inga sparade scenarion ännu. Använd &quot;Spara scenario&quot; för att jämföra olika alternativ.
        </p>
      )}

      <div className="space-y-3">
        {scenarios.map(s => (
          <div key={s.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{s.name}</span>
                <div className="text-xs text-muted-foreground">
                  {new Date(s.timestamp).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
              <SignalIndicator signal={s.result.signal} message="" size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Lån: </span>
                <span className="font-mono">{(s.input.loanAmount / 1e6).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ränta: </span>
                <span className="font-mono">{(s.result.effectiveCustomerRate).toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">EP: </span>
                <span className="font-mono">{Math.round(s.result.annualEconomicProfit).toLocaleString('sv-SE')} kr</span>
              </div>
              <div>
                <span className="text-muted-foreground">NPV: </span>
                <span className="font-mono">{Math.round(s.result.npv.totalNPV).toLocaleString('sv-SE')} kr</span>
              </div>
              <div>
                <span className="text-muted-foreground">Marginal: </span>
                <span className="font-mono">{s.result.netMarginPercent.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">KALP: </span>
                <span className={`font-mono ${s.result.kalp.surplus < 0 ? 'text-signal-red' : ''}`}>
                  {Math.round(s.result.kalp.surplus).toLocaleString('sv-SE')} kr
                </span>
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

      {scenarios.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-destructive"
          onClick={() => onScenariosChange([])}
        >
          Rensa alla scenarion
        </Button>
      )}

      {/* Current summary */}
      <div className="border-t pt-4">
        <h4 className="section-header mb-2">Aktuellt resultat</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ekon. resultat (år)</span>
            <span className="font-mono font-semibold">{Math.round(currentResult.annualEconomicProfit).toLocaleString('sv-SE')} kr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nuvärde ({currentResult.npv.durationYears} år)</span>
            <span className="font-mono font-semibold">{Math.round(currentResult.npv.totalNPV).toLocaleString('sv-SE')} kr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nettomarginal</span>
            <span className="font-mono font-semibold">{currentResult.netMarginPercent.toFixed(3)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RAROC</span>
            <span className="font-mono font-semibold">{currentResult.returnOnCapital.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">KALP-överskott</span>
            <span className={`font-mono font-semibold ${currentResult.kalp.surplus < 0 ? 'text-signal-red' : ''}`}>
              {Math.round(currentResult.kalp.surplus).toLocaleString('sv-SE')} kr/mån
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function loadSavedScenarios(): Scenario[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}
