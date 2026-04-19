import { CalendarRange, TrendingDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import type { MonthAssignment } from './RolePill';
import { RunwayChart } from './RunwayChart';

interface CardDef {
  id: string;
  icon: React.ReactNode;
  headerText: string;
  balances: number[];
  startMonthIndex: number;
  xTickMode: 'year' | 'month';
}

interface RunwayCardStackProps {
  balances: number[];
  assignments: Record<number, MonthAssignment[]>;
  baseYear: number;
}

const CARD_HEIGHT = 200;
const STACK_PEEK = 10;
const TILT_PER_DEPTH = 1.8; // degrees
const SCALE_PER_DEPTH = 0.025;
const MAX_VISIBLE_STACK = 3;
const CYCLE_MS = 620;
const AUTO_INTERVAL_MS = 3000;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interp(
  t: number,
  xs: readonly [number, number, number],
  ys: readonly [number, number, number],
) {
  if (t <= xs[0]) return ys[0];
  if (t >= xs[2]) return ys[2];
  if (t <= xs[1]) return lerp(ys[0], ys[1], (t - xs[0]) / (xs[1] - xs[0]));
  return lerp(ys[1], ys[2], (t - xs[1]) / (xs[2] - xs[1]));
}

function Chip({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#f5fcf3',
        borderRadius: 20,
        height: 21,
        padding: '0 12px',
        fontFamily: FONT_FAMILIES.sans,
        fontSize: 10,
        fontWeight: 600,
        color: '#008500',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex' }}>
        {icon}
      </span>
      {text}
    </span>
  );
}

function ChartFace({
  card,
  assignments,
  baseYear,
}: {
  card: CardDef;
  assignments: Record<number, MonthAssignment[]>;
  baseYear: number;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        border: '0.5px solid #eee',
        borderRadius: RADIUS.lg,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.07)',
        padding: '14px 16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        textAlign: 'left',
        boxSizing: 'border-box',
      }}
    >
      <Chip icon={card.icon} text={card.headerText} />
      <div style={{ flex: 1, minHeight: 120 }}>
        <RunwayChart
          balances={card.balances}
          assignments={assignments}
          baseYear={baseYear}
          startMonthIndex={card.startMonthIndex}
          xTickMode={card.xTickMode}
          showYAxis
        />
      </div>
    </div>
  );
}

export function RunwayCardStack({
  balances,
  assignments,
  baseYear,
}: RunwayCardStackProps) {
  const cards = useMemo<CardDef[]>(() => {
    const horizonYears = Math.max(1, Math.round(balances.length / 12));
    const lastYear = baseYear + horizonYears - 1;
    return [
      {
        id: 'horizon',
        icon: <TrendingDown size={11} strokeWidth={2.2} />,
        headerText: `${baseYear}–${lastYear} cash runway`,
        balances,
        startMonthIndex: 0,
        xTickMode: 'year',
      },
      ...Array.from({ length: horizonYears }).map<CardDef>((_, y) => ({
        id: `year-${baseYear + y}`,
        icon: <CalendarRange size={11} strokeWidth={2.2} />,
        headerText: `${baseYear + y} monthly cash`,
        balances: balances.slice(y * 12, y * 12 + 12),
        startMonthIndex: y * 12,
        xTickMode: 'month',
      })),
    ];
  }, [balances, baseYear]);

  const total = cards.length;
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [frac, setFrac] = useState(0);
  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startCycle = () => {
    if (runningRef.current || total < 2) return;
    runningRef.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / CYCLE_MS);
      if (t >= 1) {
        setFrac(0);
        setOrder((prev) => [...prev.slice(1), prev[0]]);
        runningRef.current = false;
        rafRef.current = null;
        return;
      }
      setFrac(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (total < 2) return;
    let interval: number | undefined;
    const first = window.setTimeout(() => {
      startCycle();
      interval = window.setInterval(() => {
        startCycle();
      }, AUTO_INTERVAL_MS);
    }, 1000);
    return () => {
      window.clearTimeout(first);
      if (interval !== undefined) window.clearInterval(interval);
    };
    // startCycle is stable in behavior; capturing it directly to satisfy lint
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const visibleInStack = Math.min(MAX_VISIBLE_STACK, total);
  const stackHeight = CARD_HEIGHT + STACK_PEEK * Math.max(0, visibleInStack - 1);

  return (
    <div
      style={{
        position: 'relative',
        height: stackHeight,
        perspective: 1400,
      }}
    >
      <button
        type="button"
        onClick={startCycle}
        disabled={total < 2}
        aria-label="Show next runway card"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: total + 10,
          background: 'transparent',
          border: 0,
          padding: 0,
          margin: 0,
          cursor: total > 1 ? 'pointer' : 'default',
        }}
      />

      {cards.map((card, cardIdx) => {
        const basePos = order.indexOf(cardIdx);
        const isDeparting = basePos === 0 && frac > 0;

        let displayPos: number;
        let exitAmt = 0;
        let enterAmt = 0;

        if (isDeparting && frac <= 0.5) {
          displayPos = 0;
          exitAmt = frac * 2;
        } else if (isDeparting) {
          displayPos = total - 1;
          enterAmt = (frac - 0.5) * 2;
        } else if (frac > 0 && basePos > 0) {
          displayPos = basePos - frac;
        } else {
          displayPos = basePos;
        }

        const clampedPos = Math.min(displayPos, MAX_VISIBLE_STACK - 1);
        const top = clampedPos * STACK_PEEK;
        const scale = 1 - clampedPos * SCALE_PER_DEPTH;
        const rotate = clampedPos * TILT_PER_DEPTH;

        const exitTranslateX = lerp(0, -36, exitAmt);
        const exitTranslateY = lerp(0, -18, exitAmt);
        const exitRotate = lerp(0, -6, exitAmt);
        const exitOpacity = interp(exitAmt, [0, 0.3, 1], [1, 1, 0]);

        const enterTranslateY = lerp(18, 0, enterAmt);
        const enterOpacity = lerp(0, 1, enterAmt);

        const stackOpacity = Math.max(
          0,
          Math.min(1, MAX_VISIBLE_STACK - displayPos),
        );

        const baseOpacity = isDeparting
          ? exitAmt > 0
            ? exitOpacity
            : enterOpacity
          : 1;
        const opacity = baseOpacity * stackOpacity;

        const translateX = isDeparting && exitAmt > 0 ? exitTranslateX : 0;
        const translateY =
          isDeparting && exitAmt > 0
            ? exitTranslateY
            : isDeparting && enterAmt > 0
              ? enterTranslateY
              : 0;
        const rotateFinal = rotate + (isDeparting && exitAmt > 0 ? exitRotate : 0);

        const zIndex = total - Math.round(displayPos);

        return (
          <div
            key={card.id}
            aria-hidden={basePos !== 0}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: CARD_HEIGHT,
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotateFinal}deg)`,
              transformOrigin: 'top center',
              zIndex,
              opacity,
              pointerEvents: 'none',
            }}
          >
            <ChartFace card={card} assignments={assignments} baseYear={baseYear} />
          </div>
        );
      })}
    </div>
  );
}
