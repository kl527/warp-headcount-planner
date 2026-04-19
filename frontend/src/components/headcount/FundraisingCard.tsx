import { HandCoins, Check } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { FONT_FAMILIES, RADIUS, SHADOWS } from '../../constants/design';
import {
  computeRequiredRaise,
  formatCompactUsd,
  monthIndexToLabel,
} from '../../lib/fundraising';
import { track } from '../../lib/analytics';

interface FundraisingCardProps {
  runwayMonths: number | null;
  endOfMonthBalances: number[];
  baseYear: number;
}

const TARGET_OPTIONS: { months: number; label: string }[] = [
  { months: 12, label: '12' },
  { months: 18, label: '18' },
  { months: 24, label: '24' },
  { months: 36, label: '36' },
];

const DEFAULT_TARGET = 18;
const BUFFER_PCT = 0.2;
const START_RAISING_LEAD_MONTHS = 6;

function formatRunway(months: number | null): { text: string; color: string } {
  if (months === null) return { text: 'Cash flow positive', color: '#008500' };
  if (months <= 0) return { text: '0 months', color: '#e21200' };
  if (months >= 12) return { text: '12+ months', color: '#008500' };
  return { text: `${months.toFixed(1)} months`, color: '#e21200' };
}

function FundedChip() {
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
      <Check size={11} strokeWidth={2.4} />
      No raise needed
    </span>
  );
}

function RaiseChip() {
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#fff5e6',
        borderRadius: 20,
        height: 21,
        padding: '0 12px',
        fontFamily: FONT_FAMILIES.sans,
        fontSize: 10,
        fontWeight: 600,
        color: '#ac6500',
        whiteSpace: 'nowrap',
      }}
    >
      <HandCoins size={11} strokeWidth={2.2} />
      Fundraising
    </span>
  );
}

function TargetSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (months: number) => void;
}) {
  const activeIndex = TARGET_OPTIONS.findIndex((o) => o.months === value);
  const pct = 100 / TARGET_OPTIONS.length;
  return (
    <div
      role="tablist"
      aria-label="Target runway months"
      className="relative"
      style={{
        padding: 3,
        background: 'var(--color-gray-2)',
        borderRadius: 10,
        display: 'grid',
        gridAutoColumns: '1fr',
        gridAutoFlow: 'column',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 3,
          bottom: 3,
          left: 3,
          width: `calc(${pct}% - 2px)`,
          background: 'var(--color-card)',
          borderRadius: 7,
          boxShadow: SHADOWS.border,
          transform: `translateX(${activeIndex * 100}%)`,
          transition: 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
        }}
      />
      {TARGET_OPTIONS.map((o) => {
        const active = value === o.months;
        return (
          <button
            key={o.months}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.months)}
            className="relative cursor-pointer inline-flex items-center justify-center"
            style={{
              zIndex: 1,
              height: 22,
              padding: '0 6px',
              fontFamily: FONT_FAMILIES.brand,
              fontSize: 11,
              fontWeight: 500,
              color: active ? 'var(--color-gray-12)' : 'var(--color-gray-10)',
              background: 'transparent',
              border: 'none',
              transition: 'color 200ms ease',
              outline: 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FundraisingCard({
  runwayMonths,
  endOfMonthBalances,
  baseYear,
}: FundraisingCardProps) {
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const interactedRef = useRef(false);

  const handleTargetChange = (months: number) => {
    if (months === target) return;
    if (!interactedRef.current) {
      interactedRef.current = true;
      track.firstInteraction('fundraising_interacted');
    }
    setTarget(months);
    track.fundraisingTargetChanged({ target_months: months });
  };

  const raise = useMemo(
    () =>
      computeRequiredRaise({
        endOfMonthBalances,
        targetMonths: target,
        bufferPct: BUFFER_PCT,
      }),
    [endOfMonthBalances, target],
  );

  const runway = formatRunway(runwayMonths);
  const displayRaise = raise.bufferedRaise;
  const startRaisingMonthIndex = Math.max(
    0,
    raise.worstDeficitMonth - START_RAISING_LEAD_MONTHS,
  );
  const startRaisingLabel = monthIndexToLabel(startRaisingMonthIndex, baseYear);
  const cashOutLabel = monthIndexToLabel(raise.worstDeficitMonth, baseYear);

  return (
    <div
      style={{
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(0, 0, 0, 0.61)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Runway remaining
        </span>
        <span
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: runwayMonths === null ? 22 : 32,
            lineHeight: 1.1,
            fontWeight: 700,
            color: runway.color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {runway.text}
        </span>
      </div>

      <div
        style={{
          borderTop: '0.5px solid var(--color-gray-4)',
          paddingTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {raise.alreadyFunded ? <FundedChip /> : <RaiseChip />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: FONT_FAMILIES.sans,
              fontSize: 24,
              fontWeight: 600,
              color: 'var(--color-gray-12)',
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {raise.alreadyFunded
              ? `Covered past ${target} mo`
              : `Raise ${formatCompactUsd(displayRaise)}`}
          </span>
          <span
            style={{
              fontFamily: FONT_FAMILIES.sans,
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--color-gray-10)',
              lineHeight: 1.4,
            }}
          >
            {raise.alreadyFunded
              ? `Cash stays positive for ${target}+ months.`
              : `to reach ${target} months of runway (incl. 20% buffer)`}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILIES.sans,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-gray-10)',
            }}
          >
            Target runway
          </span>
          <TargetSelector value={target} onChange={handleTargetChange} />
        </div>

        {!raise.alreadyFunded && (
          <div
            style={{
              paddingTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILIES.sans,
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--color-gray-10)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Start raising by
            </span>
            <span
              style={{
                fontFamily: FONT_FAMILIES.sans,
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-gray-12)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {startRaisingLabel}
              <span
                style={{
                  fontWeight: 500,
                  color: 'var(--color-gray-10)',
                  fontSize: 11,
                  marginLeft: 6,
                }}
              >
                · cash out {cashOutLabel}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
