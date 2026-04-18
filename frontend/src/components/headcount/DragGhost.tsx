import { useLayoutEffect, useRef } from 'react';
import { FONT_FAMILIES, RADIUS } from '../../constants/design';
import {
  TEAM_ICON,
  TEAM_ICON_BG,
  TEAM_PILL_BG,
  TEAM_PILL_DOT,
  TEAM_PILL_FG,
} from '../../constants/roleDisplay';
import {
  DROP_FADE_DURATION,
  POOF_DURATION,
  RETURN_DURATION,
  useRoleDnd,
  type RoleCard,
} from './roleDnd';

const RETURN_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const DROP_EASING = 'cubic-bezier(0.4, 0, 1, 1)';
const POOF_EASING = 'cubic-bezier(0.36, 0, 0.66, -0.2)';

export function DragGhost() {
  const { drag, returning, dropping } = useRoleDnd();
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!returning || !ref.current) return;
    const el = ref.current;
    el.style.transition = 'none';
    el.style.transform = `translate(${returning.fromX}px, ${returning.fromY}px)`;
    el.style.opacity = '0.95';
    const raf = requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.transition = `transform ${RETURN_DURATION}ms ${RETURN_EASING}, opacity ${RETURN_DURATION}ms ${RETURN_EASING}`;
      ref.current.style.transform = `translate(${returning.toX}px, ${returning.toY}px)`;
      ref.current.style.opacity = '0';
    });
    return () => cancelAnimationFrame(raf);
  }, [returning]);

  useLayoutEffect(() => {
    if (!dropping || !ref.current) return;
    const el = ref.current;
    el.style.transition = 'none';
    el.style.transform = `translate(${dropping.fromX}px, ${dropping.fromY}px) scale(1)`;
    el.style.opacity = dropping.poof ? '1' : '0.9';
    const raf = requestAnimationFrame(() => {
      if (!ref.current) return;
      if (dropping.poof) {
        // Delete "poof": slight upward drift + aggressive shrink + fade.
        ref.current.style.transition = `transform ${POOF_DURATION}ms ${POOF_EASING}, opacity ${POOF_DURATION}ms ${POOF_EASING}`;
        ref.current.style.transform = `translate(${dropping.fromX}px, ${dropping.fromY - 6}px) scale(0.3)`;
        ref.current.style.opacity = '0';
      } else {
        // Hand-off fade: stay put, soft shrink + fade while the pill grows in.
        ref.current.style.transition = `transform ${DROP_FADE_DURATION}ms ${DROP_EASING}, opacity ${DROP_FADE_DURATION}ms ${DROP_EASING}`;
        ref.current.style.transform = `translate(${dropping.fromX}px, ${dropping.fromY}px) scale(0.6)`;
        ref.current.style.opacity = '0';
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [dropping]);

  if (!drag?.armed && !returning && !dropping) return null;

  const active = drag?.armed ? drag : null;
  const card = active?.card ?? returning?.card ?? dropping?.card;
  const source = active?.source ?? returning?.source ?? dropping?.source;
  if (!card || !source) return null;

  const width = active
    ? active.sourceRect.width
    : (returning?.width ?? dropping!.width);
  const height = active
    ? active.sourceRect.height
    : (returning?.height ?? dropping!.height);

  const translate = active
    ? `translate(${active.x - active.offsetX}px, ${
        active.y - active.offsetY
      }px)`
    : undefined;

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width,
        height,
        transform: translate,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: active ? 0.95 : undefined,
        transition: active ? 'none' : undefined,
        willChange: 'transform, opacity',
      }}
    >
      {source.kind === 'sidebar' ? (
        <SidebarGhostBody card={card} />
      ) : (
        <PillGhostBody card={card} />
      )}
    </div>
  );
}

function SidebarGhostBody({ card }: { card: RoleCard }) {
  const Icon = TEAM_ICON[card.team];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: 10,
        background: '#fff',
        border: '0.5px solid #f9f9f9',
        borderRadius: RADIUS.lg,
        boxShadow:
          '0 10px 24px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        style={{
          width: 31,
          height: 31,
          borderRadius: '50%',
          background: TEAM_ICON_BG[card.team],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#fff',
        }}
      >
        <Icon size={14} />
      </div>
      <span
        style={{
          flex: 1,
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 12,
          color: '#000',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {card.label}
      </span>
    </div>
  );
}

function PillGhostBody({ card }: { card: RoleCard }) {
  return (
    <div
      className="flex items-center gap-[6px]"
      style={{
        width: '100%',
        height: '100%',
        fontFamily: FONT_FAMILIES.sans,
        fontSize: 10,
        lineHeight: '14px',
        fontWeight: 500,
        color: TEAM_PILL_FG[card.team],
        background: TEAM_PILL_BG[card.team],
        padding: '2px 6px',
        borderRadius: 4,
        boxShadow: '0 6px 14px rgba(0, 0, 0, 0.14)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: TEAM_PILL_DOT[card.team],
          flexShrink: 0,
        }}
      />
      <span className="truncate">{card.label}</span>
    </div>
  );
}
