import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const SWIPE_THRESHOLD = 72;
const MAX_ROTATION = 14;
const FLY_MS = 340;
const NUDGE_MS = 30_000;
const NUDGE_DONE_KEY = "guatemala-today-nudge-done";

type DaySwipeCardProps = {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Day 1 only: brief swipe hint for new users */
  showSwipeHint?: boolean;
  peekPrev?: ReactNode;
  peekNext?: ReactNode;
  children: ReactNode;
};

export function DaySwipeCard({
  canPrev,
  canNext,
  onPrev,
  onNext,
  showSwipeHint = false,
  peekPrev,
  peekNext,
  children,
}: DaySwipeCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [nudgeActive, setNudgeActive] = useState(false);
  const nudgeDoneRef = useRef(
    typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(NUDGE_DONE_KEY) === "1",
  );
  const skipTransitionRef = useRef(false);

  const dismissNudge = useCallback(() => {
    nudgeDoneRef.current = true;
    setNudgeActive(false);
    try {
      sessionStorage.setItem(NUDGE_DONE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!showSwipeHint || nudgeDoneRef.current) {
      setNudgeActive(false);
      return;
    }
    setNudgeActive(true);
    const id = window.setTimeout(dismissNudge, NUDGE_MS);
    return () => window.clearTimeout(id);
  }, [showSwipeHint, dismissNudge]);
  const offsetXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    axis: null as "x" | null,
  });

  const resist = useCallback(
    (dx: number) => {
      if (dx > 0 && !canPrev) return dx * 0.22;
      if (dx < 0 && !canNext) return dx * 0.22;
      return dx;
    },
    [canPrev, canNext],
  );

  const rotation = Math.max(
    -MAX_ROTATION,
    Math.min(MAX_ROTATION, offsetX * 0.045),
  );

  const flyDistance = () => (cardRef.current?.offsetWidth ?? 360) * 1.15;

  const runTransition = useCallback(
    (targetX: number, onDone?: () => void) => {
      setTransitioning(true);
      offsetXRef.current = targetX;
      setOffsetX(targetX);
      window.setTimeout(() => {
        onDone?.();
        offsetXRef.current = 0;
        setOffsetX(0);
        requestAnimationFrame(() => setTransitioning(false));
      }, FLY_MS);
    },
    [],
  );

  const commitPrev = useCallback(() => {
    const fly = flyDistance();
    runTransition(fly, () => {
      skipTransitionRef.current = true;
      onPrev();
      requestAnimationFrame(() => {
        skipTransitionRef.current = false;
      });
    });
  }, [onPrev, runTransition]);

  const commitNext = useCallback(() => {
    const fly = flyDistance();
    runTransition(-fly, () => {
      skipTransitionRef.current = true;
      onNext();
      requestAnimationFrame(() => {
        skipTransitionRef.current = false;
      });
    });
  }, [onNext, runTransition]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (transitioning) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      axis: null,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.axis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        d.pointerId = -1;
        setIsDragging(false);
        return;
      }
      d.axis = "x";
      setIsDragging(true);
      dismissNudge();
    }

    e.preventDefault();
    const next = resist(dx);
    offsetXRef.current = next;
    setOffsetX(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    d.pointerId = -1;
    setIsDragging(false);

    if (d.axis !== "x") return;

    const x = offsetXRef.current;

    if (x > SWIPE_THRESHOLD && canPrev) {
      commitPrev();
      return;
    }
    if (x < -SWIPE_THRESHOLD && canNext) {
      commitNext();
      return;
    }
    runTransition(0);
  };

  const useTransition =
    transitioning && !skipTransitionRef.current;

  const activeStyle: CSSProperties = {
    transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
    transition: useTransition
      ? `transform ${FLY_MS}ms cubic-bezier(0.33, 1, 0.68, 1)`
      : "none",
  };

  const draggingPrev = offsetX > 0;
  const draggingNext = offsetX < 0;
  const idleStack = offsetX === 0;

  const prevReveal = draggingPrev
    ? Math.min(offsetX / SWIPE_THRESHOLD, 1)
    : 0;
  const nextReveal = draggingNext
    ? Math.min(-offsetX / SWIPE_THRESHOLD, 1)
    : 0;

  const showPrevLayer = canPrev && peekPrev && draggingPrev;
  const showNextLayer = canNext && peekNext && (draggingNext || idleStack);

  const showNudge =
    showSwipeHint &&
    nudgeActive &&
    !isDragging &&
    !transitioning &&
    offsetX === 0;
  const nudgeClass = showNudge ? "day-swipe-inner--nudge-next" : "";

  const layerScale = (reveal: number, idle: boolean) =>
    idle ? 0.96 : 0.96 + reveal * 0.04;

  const layerStyle = (
    reveal: number,
    idle: boolean,
  ): CSSProperties => ({
    transform: `scale(${layerScale(reveal, idle)})`,
    opacity: idle ? 1 : Math.max(reveal, 0.4),
    transition: useTransition
      ? `transform ${FLY_MS}ms cubic-bezier(0.33, 1, 0.68, 1), opacity 0.18s ease`
      : "none",
    pointerEvents: "none",
  });

  return (
    <div className="day-swipe-stack">
      {showPrevLayer && (
        <div
          className="day-swipe-card day-swipe-card--behind day-swipe-card--behind-prev"
          style={layerStyle(prevReveal, false)}
          aria-hidden
        >
          {peekPrev}
        </div>
      )}
      {showNextLayer && (
        <div
          className="day-swipe-card day-swipe-card--behind day-swipe-card--behind-next"
          style={layerStyle(nextReveal, idleStack && !draggingNext)}
          aria-hidden
        >
          {peekNext}
        </div>
      )}
      <div
        ref={cardRef}
        className={`day-swipe-card day-swipe-card--active${isDragging || transitioning ? " day-swipe-card--moving" : ""}`}
        style={activeStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className={`day-swipe-inner ${nudgeClass}`.trim()}>{children}</div>
      </div>
    </div>
  );
}
