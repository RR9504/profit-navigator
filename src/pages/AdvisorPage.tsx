import { useState, useCallback, useMemo } from 'react';
import type { CustomerInput, ProfitabilityResult, Scenario, AdminConfig } from '@/lib/types';
import { BINDING_PERIODS } from '@/lib/types';
import { calculateProfitability, suggestOptimization } from '@/lib/calculationEngine';
import { loadConfig } from '@/lib/configStore';
import { SignalIndicator } from '@/components/SignalIndicator';
import { ProfitBreakdown } from '@/components/ProfitBreakdown';
import { CustomerForm } from '@/components/CustomerForm';
import { ScenarioPanel } from '@/components/ScenarioPanel';
import { OptimizationSuggestions } from '@/components/OptimizationSuggestions';
import { RateOverview } from '@/components/RateOverview';

const defaultInput: CustomerInput = {
  loanAmount: 2500000,
  propertyValue: 3500000,
  bindingPeriod: '3m',
  rateDeviation: 0,
  monthlyIncome: 50000,
  salaryDeposit: false,
  depositBalance: 100000,
  activeProducts: [],
  savingsVolume: 0,
  savingsType: 'none',
};

export default function AdvisorPage() {
  const [config] = useState<AdminConfig>(loadConfig);
  const [input, setInput] = useState<CustomerInput>(defaultInput);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const result = useMemo(() => calculateProfitability(input, config), [input, config]);
  const suggestions = useMemo(() => suggestOptimization(input, config), [input, config]);

  const saveScenario = useCallback(() => {
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      name: `Scenario ${scenarios.length + 1}`,
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
            <OptimizationSuggestions suggestions={suggestions} />
          </div>

          {/* Right: Scenarios */}
          <div className="lg:col-span-3">
            <ScenarioPanel
              scenarios={scenarios}
              currentResult={result}
              onLoad={loadScenario}
              onRemove={(id) => setScenarios(prev => prev.filter(s => s.id !== id))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
