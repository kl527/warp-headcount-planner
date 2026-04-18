import { useEffect, useRef } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { AnimatedBalance } from './balance';
import { RolePill, type MonthAssignment } from './RolePill';

interface YearCardProps {
  yearIndex: number;
  balanceUsd?: number;
  assignments?: MonthAssignment[];
  isDropTarget?: boolean;
  onRegister?: (index: number, el: HTMLElement | null) => void;
  onFlipDone?: (assignmentId: string) => void;
  onSelect?: (yearIndex: number) => void;
}

export function YearCard({
  yearIndex,
  balanceUsd,
  assignments,
  isDropTarget,
  onRegister,
  onFlipDone,
  onSelect,
}: YearCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onRegister) return;
    onRegister(yearIndex, ref.current);
    return () => onRegister(yearIndex, null);
  }, [yearIndex, onRegister]);

  const year = new Date().getFullYear() + yearIndex;
  const sourceMonth = yearIndex * 12;

  return (
    <div
      ref={ref}
      className="min-h-[96px]"
      style={{
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        boxShadow: isDropTarget
          ? '0 0 0 1.5px var(--color-accent-9), 0 6px 14px rgba(0, 0, 0, 0.08)'
          : '0 2px 4px rgba(0, 0, 0, 0.05)',
        transition: 'box-shadow 160ms ease',
      }}
    >
      <button
        type="button"
        onClick={() => onSelect?.(yearIndex)}
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 20,
          fontWeight: 600,
          color: '#000',
          flexShrink: 0,
          minWidth: 56,
          background: 'transparent',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: onSelect ? 'pointer' : 'default',
        }}
        aria-label={`Open ${year} monthly view`}
      >
        {year}
      </button>

      <div
        className="truncate"
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 10,
          lineHeight: '14px',
          fontWeight: 500,
          color: 'rgba(0, 0, 0, 0.72)',
          background: '#f2f2f2',
          padding: '2px 6px',
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        yearly expenses.
      </div>

      <div className="flex flex-row flex-wrap gap-[4px] flex-1 min-w-0">
        {assignments?.map((a) => (
          <RolePill
            key={a.id}
            assignment={a}
            monthIndex={sourceMonth}
            onFlipDone={onFlipDone}
          />
        ))}
      </div>

      {balanceUsd !== undefined && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: balanceUsd < 0 ? '#fcf3f3' : '#f5fcf3',
            borderRadius: 20,
            height: 30,
            padding: '0 14px',
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 12,
            fontWeight: 600,
            color: balanceUsd < 0 ? '#850000' : '#008500',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'background 180ms ease, color 180ms ease',
          }}
        >
          <AnimatedBalance value={balanceUsd} />
        </span>
      )}
    </div>
  );
}
