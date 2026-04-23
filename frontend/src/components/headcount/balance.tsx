import { useEffect, useRef, useState } from 'react';

const COUNT_UP_MS = 1000;

function fmtBalance(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n <= -1_000_000_000) return `-$${(-n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n <= -1_000_000) return `-$${(-n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  if (n <= -1_000) return `-$${Math.round(-n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

// Fast-in, slow-out — numbers race toward the target and decelerate.
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedBalance({ value }: { value: number }) {
  // Start displayed at 0 so the mount "count-up" tween has something to
  // animate from. Subsequent value changes tween from whatever's on screen.
  const [displayed, setDisplayed] = useState(0);
  const displayedRef = useRef(0);
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
    if (reducedMotionRef.current) {
      displayedRef.current = value;
      setDisplayed(value);
      return;
    }

    const from = displayedRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      const eased = easeOutCubic(t);
      const current = t >= 1 ? to : from + (to - from) * eased;
      displayedRef.current = current;
      setDisplayed(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
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

  return (
    <span
      style={{
        display: 'inline-block',
        lineHeight: '14px',
        minWidth: '4ch',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {fmtBalance(displayed)}
    </span>
  );
}
