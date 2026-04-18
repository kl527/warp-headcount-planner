import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DRAG_THRESHOLD,
  DROP_FADE_DURATION,
  POOF_DURATION,
  RETURN_DURATION,
  RoleDndContext,
  type DragSource,
  type DragState,
  type DropHandler,
  type DroppingState,
  type ReturnState,
  type RoleCard,
  type RoleDndCtx,
} from './roleDnd';

export function RoleDndProvider({ children }: { children: ReactNode }) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [returning, setReturning] = useState<ReturnState | null>(null);
  const [dropping, setDropping] = useState<DroppingState | null>(null);
  const monthEls = useRef<Map<number, HTMLElement>>(new Map());
  const monthRects = useRef<Map<number, DOMRect>>(new Map());
  const dropHandler = useRef<DropHandler | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const returnTimer = useRef<number | null>(null);
  const returnKey = useRef(0);
  const dropTimer = useRef<number | null>(null);
  const dropKey = useRef(0);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  useEffect(() => {
    return () => {
      if (returnTimer.current !== null) {
        window.clearTimeout(returnTimer.current);
      }
      if (dropTimer.current !== null) {
        window.clearTimeout(dropTimer.current);
      }
    };
  }, []);

  const registerMonth = useCallback(
    (index: number, el: HTMLElement | null) => {
      if (el) monthEls.current.set(index, el);
      else monthEls.current.delete(index);
    },
    [],
  );

  const setDropHandler = useCallback((fn: DropHandler | null) => {
    dropHandler.current = fn;
  }, []);

  const hitTest = useCallback((x: number, y: number): number | null => {
    for (const [idx, rect] of monthRects.current) {
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return idx;
      }
    }
    return null;
  }, []);

  const beginDrag = useCallback(
    (
      card: RoleCard,
      source: DragSource,
      event: React.PointerEvent<HTMLElement>,
      sourceEl: HTMLElement,
    ) => {
      const rect = sourceEl.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;

      monthRects.current.clear();
      for (const [idx, el] of monthEls.current) {
        monthRects.current.set(idx, el.getBoundingClientRect());
      }

      const initial: DragState = {
        card,
        source,
        pointerId: event.pointerId,
        sourceRect: rect,
        offsetX: startX - rect.left,
        offsetY: startY - rect.top,
        x: startX,
        y: startY,
        dropTarget: null,
        armed: false,
      };
      setDrag(initial);
      dragRef.current = initial;

      const onMove = (e: PointerEvent) => {
        const cur = dragRef.current;
        if (!cur || e.pointerId !== cur.pointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const armed =
          cur.armed || Math.hypot(dx, dy) >= DRAG_THRESHOLD;
        const dropTarget = armed ? hitTest(e.clientX, e.clientY) : null;
        const next: DragState = {
          ...cur,
          x: e.clientX,
          y: e.clientY,
          armed,
          dropTarget,
        };
        dragRef.current = next;
        setDrag(next);
      };

      const scheduleDropping = (state: DroppingState, duration: number) => {
        setDropping(state);
        if (dropTimer.current !== null) {
          window.clearTimeout(dropTimer.current);
        }
        dropTimer.current = window.setTimeout(() => {
          setDropping((d) => (d && d.key === state.key ? null : d));
          dropTimer.current = null;
        }, duration + 40);
      };

      const scheduleReturning = (state: ReturnState) => {
        setReturning(state);
        if (returnTimer.current !== null) {
          window.clearTimeout(returnTimer.current);
        }
        returnTimer.current = window.setTimeout(() => {
          setReturning((r) => (r && r.key === state.key ? null : r));
          returnTimer.current = null;
        }, RETURN_DURATION + 40);
      };

      const finish = (e: PointerEvent) => {
        const cur = dragRef.current;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);
        if (!cur || e.pointerId !== cur.pointerId) {
          setDrag(null);
          dragRef.current = null;
          return;
        }
        if (cur.armed) {
          const ghostRect = new DOMRect(
            cur.x - cur.offsetX,
            cur.y - cur.offsetY,
            cur.sourceRect.width,
            cur.sourceRect.height,
          );
          if (dropHandler.current) {
            dropHandler.current({
              target: cur.dropTarget,
              card: cur.card,
              source: cur.source,
              ghostRect,
            });
          }

          const isMiss = cur.dropTarget === null;
          const fromSidebar = cur.source.kind === 'sidebar';

          if (isMiss && fromSidebar) {
            // Sidebar + miss: fly back to the source row.
            scheduleReturning({
              key: ++returnKey.current,
              card: cur.card,
              source: cur.source,
              width: cur.sourceRect.width,
              height: cur.sourceRect.height,
              fromX: cur.x - cur.offsetX,
              fromY: cur.y - cur.offsetY,
              toX: cur.sourceRect.left,
              toY: cur.sourceRect.top,
            });
          } else if (isMiss) {
            // Month pill + miss = delete: poof in place.
            scheduleDropping(
              {
                key: ++dropKey.current,
                card: cur.card,
                source: cur.source,
                width: cur.sourceRect.width,
                height: cur.sourceRect.height,
                fromX: cur.x - cur.offsetX,
                fromY: cur.y - cur.offsetY,
                poof: true,
              },
              POOF_DURATION,
            );
          } else {
            // Hit: quick fade in place as the pill grows into the slot.
            scheduleDropping(
              {
                key: ++dropKey.current,
                card: cur.card,
                source: cur.source,
                width: cur.sourceRect.width,
                height: cur.sourceRect.height,
                fromX: cur.x - cur.offsetX,
                fromY: cur.y - cur.offsetY,
                poof: false,
              },
              DROP_FADE_DURATION,
            );
          }
        }
        setDrag(null);
        dragRef.current = null;
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
    },
    [hitTest],
  );

  const value = useMemo<RoleDndCtx>(
    () => ({
      drag,
      returning,
      dropping,
      beginDrag,
      registerMonth,
      setDropHandler,
    }),
    [drag, returning, dropping, beginDrag, registerMonth, setDropHandler],
  );

  return (
    <RoleDndContext.Provider value={value}>{children}</RoleDndContext.Provider>
  );
}
