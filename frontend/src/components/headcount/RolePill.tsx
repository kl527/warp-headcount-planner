import { useLayoutEffect, useRef } from 'react';
import { FONT_FAMILIES } from '../../constants/design';
import {
  TEAM_PILL_BG,
  TEAM_PILL_DOT,
  TEAM_PILL_FG,
} from '../../constants/roleDisplay';
import type { Team as SalaryTeam } from '../../lib/salaryApi';
import { useRoleDnd } from './roleDnd';

export interface MonthAssignment {
  id: string;
  roleKey: string;
  label: string;
  team: SalaryTeam;
  // If set, the pill FLIP-animates from this viewport rect into place.
  flipFrom?: DOMRect;
}

interface RolePillProps {
  assignment: MonthAssignment;
  monthIndex: number;
  onFlipDone?: (id: string) => void;
}

// Spring-ish ease with a gentle overshoot so the pill "settles" into place
// instead of arriving flat. Pairs with the ghost fade-out in DragGhost.
const SNAP_EASING = 'cubic-bezier(0.34, 1.36, 0.64, 1)';
const SNAP_DURATION = 380;
const FADE_DURATION = 220;

export function RolePill({ assignment, monthIndex, onFlipDone }: RolePillProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { team, label, flipFrom, id } = assignment;
  const { beginDrag, drag } = useRoleDnd();

  const beingDragged =
    drag?.source.kind === 'month' &&
    drag.source.monthIndex === monthIndex &&
    drag.source.assignmentId === id;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !flipFrom) return;
    const now = el.getBoundingClientRect();
    const ghostCx = flipFrom.left + flipFrom.width / 2;
    const ghostCy = flipFrom.top + flipFrom.height / 2;
    const pillCx = now.left + now.width / 2;
    const pillCy = now.top + now.height / 2;
    const dx = ghostCx - pillCx;
    const dy = ghostCy - pillCy;
    const startScale = 0.55;

    el.style.transformOrigin = 'center center';
    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${startScale})`;
    el.style.opacity = '0';
    el.style.willChange = 'transform, opacity';

    const raf = requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.transition = `transform ${SNAP_DURATION}ms ${SNAP_EASING}, opacity ${FADE_DURATION}ms ease-out`;
      ref.current.style.transform = 'translate(0, 0) scale(1)';
      ref.current.style.opacity = '1';
    });

    const handleEnd = (ev: TransitionEvent) => {
      if (ev.propertyName !== 'transform') return;
      if (ref.current) {
        ref.current.style.transition = '';
        ref.current.style.transform = '';
        ref.current.style.transformOrigin = '';
        ref.current.style.willChange = '';
      }
      el.removeEventListener('transitionend', handleEnd);
      onFlipDone?.(id);
    };
    el.addEventListener('transitionend', handleEnd);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('transitionend', handleEnd);
    };
  }, [flipFrom, id, onFlipDone]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    // Don't start a drag while the intro FLIP is still running.
    if (flipFrom) return;
    e.stopPropagation();
    beginDrag(
      { roleKey: assignment.roleKey, label, team },
      { kind: 'month', monthIndex, assignmentId: id },
      e,
      el,
    );
  };

  return (
    <div
      ref={ref}
      data-role-pill=""
      onPointerDown={handlePointerDown}
      className="flex items-center gap-[6px] truncate"
      style={{
        fontFamily: FONT_FAMILIES.sans,
        fontSize: 10,
        lineHeight: '14px',
        fontWeight: 500,
        color: TEAM_PILL_FG[team],
        background: TEAM_PILL_BG[team],
        padding: '2px 6px',
        borderRadius: 4,
        cursor: flipFrom ? 'default' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        opacity: beingDragged ? 0 : undefined,
        transition: beingDragged ? 'none' : 'opacity 120ms ease',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: TEAM_PILL_DOT[team],
          flexShrink: 0,
        }}
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
