import { useLayoutEffect, useRef } from 'react';

function formatWithCommas(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function parseLoose(s: string): number {
  const cleaned = s.replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

type NativeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'defaultValue' | 'type'
>;

interface MoneyInputProps extends NativeInputProps {
  value: number;
  onChange: (next: number) => void;
}

export function MoneyInput({ value, onChange, ...rest }: MoneyInputProps) {
  const ref = useRef<HTMLInputElement | null>(null);
  const pendingCursor = useRef<number | null>(null);

  const display = formatWithCommas(value);

  useLayoutEffect(() => {
    const input = ref.current;
    const pos = pendingCursor.current;
    if (input && pos !== null) {
      input.setSelectionRange(pos, pos);
      pendingCursor.current = null;
    }
  }, [display]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const selection = e.target.selectionStart ?? raw.length;
    const digitsBeforeCursor = raw
      .slice(0, selection)
      .replace(/,/g, '').length;

    const numeric = parseLoose(raw);
    const newDisplay = formatWithCommas(numeric);

    let nextPos = 0;
    let seen = 0;
    while (nextPos < newDisplay.length && seen < digitsBeforeCursor) {
      if (newDisplay[nextPos] !== ',') seen++;
      nextPos++;
    }
    pendingCursor.current = nextPos;

    onChange(numeric);
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      {...rest}
    />
  );
}
