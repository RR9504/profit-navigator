import { useState, useCallback, useMemo, useEffect } from 'react';
import type { CustomerInput, Scenario, AdminConfig } from '@/lib/types';
import { calculateProfitability, suggestOptimization } from '@/lib/calculationEngine';
import { loadConfig } from '@/lib/configStore';
import { SignalIndicator } from '@/components/SignalIndicator';
import { ProfitBreakdown } from '@/components/ProfitBreakdown';
import { CustomerForm, defaultInput } from '@/components/CustomerForm';
import { ScenarioPanel, loadSavedScenarios } from '@/components/ScenarioPanel';
import { OptimizationSuggestions } from '@/components/OptimizationSuggestions';
import { RateOverview } from '@/components/RateOverview';
import { KALPDisplay } from '@/components/KALPDisplay';
import { StressTestDisplay } from '@/components/StressTestDisplay';

export default function AdvisorPage() {
  const [config, setConfig] = useState<AdminConfig>(loadConfig);

  // Reload config when window regains focus (e.g. after admin changes)
  useEffect(() => {
    const onFocus = () => setConfig(loadConfig());
    window.addEventListener('focus', onFocus);
    // Also reload on visibility change (tab switching)
    const onVisible = () => { if (document.visibilityState === 'visible') setConfig(loadConfig()); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const [input, setInput] = useState<CustomerInput>(defaultInput);
  const [scenarios, setScenarios] = useState<Scenario[]>(loadSavedScenarios);

  const result = useMemo(() => calculateProfitability(input, config), [input, config]);
  const suggestions = useMemo(() => suggestOptimization(input, config), [input, config]);

  const saveScenario = useCallback(() => {
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      name: `Scenario ${scenarios.length + 1}`,
      timestamp: Date.now(),
      input: { ...input },
      result,
    };
    setScenarios(prev => [...prev, scenario]);
  }, [input, result, scenarios.length]);

  const loadScenario = useCallback((s: Scenario) => {
    setInput(s.input);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Kundkalkyl</h1>
            <p className="text-sm text-muted-foreground">Prissättningsstöd — Sparbanken</p>
          </div>
          <div className="flex items-center gap-4">
            <SignalIndicator signal={result.signal} message={result.signalMessage} size="lg" />
            <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Input */}
          <div className="space-y-6 lg:col-span-4">
            <CustomerForm input={input} onChange={setInput} config={config} onSaveScenario={saveScenario} />
          </div>

          {/* Center: Results */}
          <div className="space-y-6 lg:col-span-5">
            <RateOverview result={result} config={config} input={input} />
            <ProfitBreakdown result={result} />
            <KALPDisplay result={result} />
            <StressTestDisplay result={result} />
            <OptimizationSuggestions suggestions={suggestions} />
          </div>

          {/* Right: Scenarios */}
          <div className="lg:col-span-3">
            <ScenarioPanel
              scenarios={scenarios}
              currentResult={result}
              onLoad={loadScenario}
              onRemove={(id) => setScenarios(prev => prev.filter(s => s.id !== id))}
              onScenariosChange={setScenarios}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
