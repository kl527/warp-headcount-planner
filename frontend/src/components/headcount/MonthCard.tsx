import { useState } from 'react';
import { BRAND_CTA, FONT_FAMILIES } from '../../constants/design';
import { MONTH_LABELS, type Hire, type Team } from '../../data/headcount';
import { TeamChip } from './TeamChip';

interface MonthCardProps {
  monthIndex: number;
  year: number;
  hires: Hire[];
  isCurrent: boolean;
  onClick: () => void;
}

export function MonthCard({
  monthIndex,
  year,
  hires,
  isCurrent,
  onClick,
}: MonthCardProps) {
  const [hover, setHover] = useState(false);

  const filled = hires.filter((h) => h.status === 'filled').length;
  const open = hires.filter((h) => h.status === 'open').length;

  const teams: Team[] = [];
  for (const h of hires) {
    if (!teams.includes(h.team)) teams.push(h.team);
  }
  const visibleTeams = teams.slice(0, 3);
  const overflow = teams.length - visibleTeams.length;

  const background = isCurrent
    ? 'var(--color-accent-2)'
    : hover
      ? 'var(--color-gray-2)'
      : 'var(--color-card)';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="text-left flex flex-col justify-between cursor-pointer transition-colors relative"
      style={{
        background,
        padding: '16px 18px',
        minHeight: 152,
      }}
    >
      {isCurrent && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: BRAND_CTA.bg,
          }}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <div
            style={{
              fontFamily: FONT_FAMILIES.sans,
              fontSize: 15,
              lineHeight: '20px',
              fontWeight: 500,
              color: 'var(--color-gray-12)',
            }}
          >
            {MONTH_LABELS[monthIndex]}
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILIES.mono,
              fontSize: 12,
              lineHeight: '16px',
              color: 'var(--color-gray-10)',
              marginTop: 2,
              letterSpacing: '0.02em',
            }}
          >
            {year}
          </div>
        </div>
        {isCurrent && (
          <span
            style={{
              fontSize: 11,
              lineHeight: '16px',
              color: BRAND_CTA.bg,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Now
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-[8px] mt-[10px]">
        <span
          style={{
            fontFamily: FONT_FAMILIES.brand,
            fontSize: 28,
            lineHeight: '32px',
            fontWeight: 500,
            letterSpacing: '-0.022em',
            color:
              hires.length === 0
                ? 'var(--color-gray-8)'
                : 'var(--color-gray-12)',
          }}
        >
          {hires.length}
        </span>
        <span
          style={{
            fontSize: 12,
            lineHeight: '16px',
            color: 'var(--color-gray-10)',
            fontWeight: 450,
          }}
        >
          {hires.length === 1 ? 'hire' : 'hires'}
        </span>
      </div>

      <div
        className="flex items-center gap-[12px] mt-[8px]"
        style={{
          fontSize: 13,
          lineHeight: '18px',
          color: 'var(--color-gray-11)',
        }}
      >
        <span>
          <span style={{ color: 'var(--color-gray-12)', fontWeight: 500 }}>
            {filled}
          </span>{' '}
          filled
        </span>
        <span style={{ color: 'var(--color-gray-7)' }}>·</span>
        <span>
          <span style={{ color: 'var(--color-amber-11)', fontWeight: 500 }}>
            {open}
          </span>{' '}
          open
        </span>
      </div>

      <div className="flex flex-wrap gap-[6px] mt-[14px]">
        {visibleTeams.map((t) => (
          <TeamChip key={t} team={t} size="sm" />
        ))}
        {overflow > 0 && (
          <span
            style={{
              fontSize: 12,
              lineHeight: '16px',
              color: 'var(--color-gray-10)',
              alignSelf: 'center',
            }}
          >
            +{overflow}
          </span>
        )}
        {visibleTeams.length === 0 && (
          <span
            style={{
              fontSize: 12,
              lineHeight: '16px',
              color: 'var(--color-gray-9)',
            }}
          >
            No hires scheduled
          </span>
        )}
      </div>
    </button>
  );
}
