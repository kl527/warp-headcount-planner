import { CHIP, RADIUS } from '../../constants/design';
import { TEAM_COLOR, type Team } from '../../data/headcount';

interface TeamChipProps {
  team: Team;
  size?: 'sm' | 'md';
}

export function TeamChip({ team, size = 'md' }: TeamChipProps) {
  const color = TEAM_COLOR[team];
  const padY = size === 'sm' ? 1 : 2;
  const padX = size === 'sm' ? 8 : 10;
  const fontSize = size === 'sm' ? 12 : CHIP.textSize;
  const lineHeight = size === 'sm' ? '16px' : `${CHIP.lineHeight}px`;
  return (
    <span
      className="inline-flex items-center gap-[6px] whitespace-nowrap"
      style={{
        background: color.bg,
        color: color.fg,
        padding: `${padY}px ${padX}px`,
        borderRadius: RADIUS.lg,
        fontSize,
        lineHeight,
        fontWeight: CHIP.weight,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: color.dot,
        }}
      />
      {team}
    </span>
  );
}
