import { createContext, useContext } from 'react';
import type { Team as SalaryTeam } from '../../lib/salaryApi';

export interface RoleCard {
  roleKey: string;
  label: string;
  team: SalaryTeam;
}

export type DragSource =
  | { kind: 'sidebar' }
  | { kind: 'month'; monthIndex: number; assignmentId: string };

export interface DragState {
  card: RoleCard;
  source: DragSource;
  pointerId: number;
  sourceRect: DOMRect;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  dropTarget: number | null;
  armed: boolean;
}

export interface DropResult {
  target: number | null;
  card: RoleCard;
  source: DragSource;
  ghostRect: DOMRect;
}

export type DropHandler = (result: DropResult) => void;

export interface ReturnState {
  key: number;
  card: RoleCard;
  source: DragSource;
  width: number;
  height: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface DroppingState {
  key: number;
  card: RoleCard;
  source: DragSource;
  width: number;
  height: number;
  fromX: number;
  fromY: number;
  // Whether this is a "poof" delete (stronger visual) vs a normal hand-off.
  poof: boolean;
}

export interface RoleDndCtx {
  drag: DragState | null;
  returning: ReturnState | null;
  dropping: DroppingState | null;
  beginDrag: (
    card: RoleCard,
    source: DragSource,
    event: React.PointerEvent<HTMLElement>,
    sourceEl: HTMLElement,
  ) => void;
  registerMonth: (index: number, el: HTMLElement | null) => void;
  setDropHandler: (fn: DropHandler | null) => void;
}

export const RoleDndContext = createContext<RoleDndCtx | null>(null);

export const DRAG_THRESHOLD = 4;
export const RETURN_DURATION = 220;
export const DROP_FADE_DURATION = 200;
export const POOF_DURATION = 280;

export function useRoleDnd(): RoleDndCtx {
  const ctx = useContext(RoleDndContext);
  if (!ctx) throw new Error('useRoleDnd must be used inside RoleDndProvider');
  return ctx;
}
