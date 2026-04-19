import { useEffect, useRef } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import { MONTH_LABELS } from '../../data/headcount';
import { AnimatedBalance } from './balance';
import { RolePill, type MonthAssignment } from './RolePill';

interface MonthCardProps {
  monthIndex: number;
  balanceUsd?: number;
  assignments?: MonthAssignment[];
  isDropTarget?: boolean;
  onRegister?: (index: number, el: HTMLElement | null) => void;
  onFlipDone?: (assignmentId: string) => void;
}

export function MonthCard({
  monthIndex,
  balanceUsd,
  assignments,
  isDropTarget,
  onRegister,
  onFlipDone,
}: MonthCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onRegister) return;
    onRegister(monthIndex, ref.current);
    return () => onRegister(monthIndex, null);
  }, [monthIndex, onRegister]);

  return (
    <div
      ref={ref}
      className="min-h-[90px] tablet:min-h-[140px] laptop:min-h-[200px]"
      style={{
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: isDropTarget
          ? '0 0 0 1.5px var(--color-accent-9), 0 6px 14px rgba(0, 0, 0, 0.08)'
          : '0 2px 4px rgba(0, 0, 0, 0.05)',
        transition: 'box-shadow 160ms ease',
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 14,
          fontWeight: 500,
          color: '#000',
        }}
      >
        {MONTH_LABELS[monthIndex % 12]}
      </div>

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
        }}
      >
        monthly expenses.
      </div>

      {assignments && assignments.length > 0 && (
        <div className="flex flex-col gap-[4px]">
          {assignments.map((a) => (
            <RolePill
              key={a.id}
              assignment={a}
              monthIndex={monthIndex}
              onFlipDone={onFlipDone}
            />
          ))}
        </div>
      )}

      {balanceUsd !== undefined && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
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
              transition: 'background 180ms ease, color 180ms ease',
            }}
          >
            <AnimatedBalance value={balanceUsd} />
          </span>
        </div>
      )}
    </div>
  );
}
