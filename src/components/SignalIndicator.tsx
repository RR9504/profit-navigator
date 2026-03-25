import { cn } from '@/lib/utils';

interface SignalIndicatorProps {
  signal: 'green' | 'yellow' | 'red';
  message: string;
  size?: 'sm' | 'lg';
}

export function SignalIndicator({ signal, message, size = 'sm' }: SignalIndicatorProps) {
  const dotSize = size === 'lg' ? 'h-3 w-3' : 'h-2 w-2';

  return (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-full px-3 py-1.5',
      signal === 'green' && 'signal-badge-green',
      signal === 'yellow' && 'signal-badge-yellow',
      signal === 'red' && 'signal-badge-red',
    )}>
      <span className={cn(
        'rounded-full',
        dotSize,
        signal === 'green' && 'bg-signal-green animate-pulse-green',
        signal === 'yellow' && 'bg-signal-yellow',
        signal === 'red' && 'bg-signal-red',
      )} />
      <span className={size === 'lg' ? 'text-sm font-semibold' : 'text-xs font-medium'}>
        {message}
      </span>
    </div>
  );
}
