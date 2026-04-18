import { useEffect, useState } from 'react';

const BALANCE_ANIM_MS = 180;

function fmtBalance(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n <= -1_000_000_000) return `-$${(-n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n <= -1_000_000) return `-$${(-n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  if (n <= -1_000) return `-$${Math.round(-n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

export function AnimatedBalance({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const [prev, setPrev] = useState<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [tick, setTick] = useState(0);

  if (value !== displayed) {
    setDirection(value > displayed ? 'up' : 'down');
    setPrev(displayed);
    setDisplayed(value);
    setTick((t) => t + 1);
  }

  useEffect(() => {
    if (prev === null) return;
    const id = setTimeout(() => setPrev(null), BALANCE_ANIM_MS + 20);
    return () => clearTimeout(id);
  }, [tick, prev]);

  const currentText = fmtBalance(displayed);
  const prevText = prev !== null ? fmtBalance(prev) : null;
  const animating = prevText !== null;

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden',
        lineHeight: '14px',
        height: 14,
        minWidth: '4ch',
      }}
    >
      <span style={{ visibility: 'hidden', display: 'inline-block' }}>
        {currentText.length >= (prevText?.length ?? 0) ? currentText : prevText}
      </span>
      {prevText !== null && (
        <span
          key={`prev-${tick}`}
          style={{
            position: 'absolute',
            inset: 0,
            animation: `money-exit-${direction} ${BALANCE_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
          }}
        >
          {prevText}
        </span>
      )}
      <span
        key={`cur-${tick}`}
        style={{
          position: 'absolute',
          inset: 0,
          animation: animating
            ? `money-enter-${direction} ${BALANCE_ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
            : undefined,
        }}
      >
        {currentText}
      </span>
    </span>
  );
}

