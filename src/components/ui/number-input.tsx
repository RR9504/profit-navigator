import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  suffix?: string;
}

function formatWithThousands(n: number): string {
  if (n === 0) return '0';
  return n.toLocaleString('sv-SE');
}

export function NumberInput({ value, onChange, min = 0, max, step, className, placeholder, suffix }: NumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [rawText, setRawText] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value when not focused
  useEffect(() => {
    if (!focused) {
      setRawText(String(value));
    }
  }, [value, focused]);

  const handleFocus = useCallback(() => {
    setFocused(true);
    setRawText(String(value));
  }, [value]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    const parsed = parseNumber(rawText);
    const clamped = clamp(parsed, min, max);
    onChange(clamped);
    setRawText(String(clamped));
  }, [rawText, onChange, min, max]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setRawText(text);
    const parsed = parseNumber(text);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed, min, max));
    }
  }, [onChange, min, max]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const displayValue = focused ? rawText : formatWithThousands(value);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('font-mono', suffix ? 'pr-10' : '', className)}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

function parseNumber(text: string): number {
  // Remove thousand separators (space, non-breaking space, dot as thousand sep)
  const cleaned = text.replace(/[\s\u00a0]/g, '').replace(',', '.');
  return Number(cleaned) || 0;
}

function clamp(n: number, min?: number, max?: number): number {
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}
