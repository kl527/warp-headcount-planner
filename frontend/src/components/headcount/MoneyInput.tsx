import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const COUNT_UP_MS = 1000;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

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

export function MoneyInput({
  value,
  onChange,
  onFocus,
  onBlur,
  ...rest
}: MoneyInputProps) {
  const ref = useRef<HTMLInputElement | null>(null);
  const pendingCursor = useRef<number | null>(null);

  const [displayed, setDisplayed] = useState(value);
  const displayedRef = useRef(value);
  const lastSentRef = useRef(value);
  const focusedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const apply = () => {
      reducedMotionRef.current = mq.matches;
    };
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    // If this prop change matches what we just sent via onChange (user typing),
    // no tween — just track the value.
    if (value === lastSentRef.current) {
      displayedRef.current = value;
      setDisplayed(value);
      return;
    }
    // Don't tween into a field the user is actively editing.
    if (focusedRef.current || reducedMotionRef.current) {
      displayedRef.current = value;
      setDisplayed(value);
      lastSentRef.current = value;
      return;
    }

    const from = displayedRef.current;
    const to = value;
    if (from === to) {
      lastSentRef.current = value;
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      const eased = easeOutCubic(t);
      const raw = from + (to - from) * eased;
      // Round during tween for clean integer counting; snap to exact target
      // at the end so fractional values (e.g. YoY %) land precisely.
      const settled = t >= 1 ? to : Math.round(raw);
      displayedRef.current = settled;
      setDisplayed(settled);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        lastSentRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value]);

  const display = formatWithCommas(displayed);

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

    // Cancel any running tween — the user is driving the value now.
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastSentRef.current = numeric;
    displayedRef.current = numeric;
    setDisplayed(numeric);
    onChange(numeric);
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={(e) => {
        focusedRef.current = true;
        onFocus?.(e);
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        onBlur?.(e);
      }}
      {...rest}
    />
  );
}
