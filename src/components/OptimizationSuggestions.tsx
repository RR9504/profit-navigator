import { Lightbulb } from 'lucide-react';

export function OptimizationSuggestions({ suggestions }: { suggestions: string[] }) {
  if (suggestions.length === 0) return null;

  return (
    <div className="metric-card space-y-3">
      <h3 className="section-header flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        Optimeringsförslag
      </h3>
      {suggestions.map((s, i) => (
        <div key={i} className="rounded-lg border border-accent/20 bg-signal-yellow-bg p-3 text-sm text-foreground">
          {s}
        </div>
      ))}
    </div>
  );
}
