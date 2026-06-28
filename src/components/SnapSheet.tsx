import { useEffect, useRef, useState } from "react";

export type Snap = "collapsed" | "half" | "expanded";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

function getGeom(vh: number) {
  const sheetH = vh * 0.9;
  return {
    sheetH,
    // translateY values (px from the sheet's own top). Higher = more hidden.
    collapsed: sheetH - 120,
    half: sheetH - vh * 0.45,
    expanded: 0,
  };
}

export function SnapSheet({
  snap,
  onSnapChange,
  onClose,
  children,
  bottomOffset = 64,
}: {
  snap: Snap;
  onSnapChange: (s: Snap) => void;
  onClose?: () => void;
  children: React.ReactNode;
  bottomOffset?: number;
}) {
  const [vh, setVh] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 800,
  );
  const [drag, setDrag] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const st = useRef({ startY: 0, baseT: 0, lastY: 0, lastT: 0, vy: 0 });

  useEffect(() => {
    const r = () => setVh(window.innerHeight);
    window.addEventListener("resize", r);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", r);
    return () => {
      window.removeEventListener("resize", r);
      vv?.removeEventListener("resize", r);
    };
  }, []);

  const g = getGeom(vh - bottomOffset);
  const snapY = g[snap];
  const y = drag ?? snapY;

  // Backdrop targets per snap; interpolate while dragging.
  const targetBackdrop = snap === "collapsed" ? 0 : snap === "half" ? 0.3 : 0.5;
  const liveBackdrop = (() => {
    if (!dragging) return targetBackdrop;
    if (y >= g.half) {
      // between collapsed and half: 0 -> 0.3
      const t = (g.collapsed - y) / (g.collapsed - g.half);
      return Math.max(0, Math.min(0.3, t * 0.3));
    }
    // between half and expanded: 0.3 -> 0.5
    const t = (g.half - y) / (g.half - g.expanded);
    return Math.max(0.3, Math.min(0.5, 0.3 + t * 0.2));
  })();

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDragging(true);
    st.current.startY = e.clientY;
    st.current.baseT = y;
    st.current.lastY = e.clientY;
    st.current.lastT = performance.now();
    st.current.vy = 0;
    setDrag(y);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dy = e.clientY - st.current.startY;
    let next = st.current.baseT + dy;
    if (next < g.expanded) next = g.expanded;
    if (next > g.collapsed) next = g.collapsed; // never closes
    setDrag(next);
    const now = performance.now();
    const dt = Math.max(1, now - st.current.lastT);
    st.current.vy = (e.clientY - st.current.lastY) / dt;
    st.current.lastY = e.clientY;
    st.current.lastT = now;
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    const vy = st.current.vy;
    const cur = drag ?? y;
    let target: Snap;
    if (vy < -0.5) target = "expanded";
    else if (vy > 0.5) target = "collapsed";
    else {
      const arr: { s: Snap; d: number }[] = [
        { s: "collapsed", d: Math.abs(g.collapsed - cur) },
        { s: "half", d: Math.abs(g.half - cur) },
        { s: "expanded", d: Math.abs(g.expanded - cur) },
      ];
      arr.sort((a, b) => a.d - b.d);
      target = arr[0].s;
    }
    onSnapChange(target);
    setDrag(null);
  }

  const transition = dragging ? "none" : `transform 350ms ${EASE}`;
  const backdropTransition = dragging ? "none" : `opacity 350ms ${EASE}`;

  return (
    <>
      <div
        aria-hidden
        onClick={() => onSnapChange("collapsed")}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 25,
          background: "#000",
          opacity: liveBackdrop,
          transition: backdropTransition,
          pointerEvents: liveBackdrop > 0.01 ? "auto" : "none",
        }}
      />
      <section
        className="absolute inset-x-0 z-30 rounded-t-3xl bg-card ring-1 ring-border"
        style={{
          bottom: bottomOffset,
          height: g.sheetH,
          transform: `translate3d(0, ${y}px, 0)`,
          transition,
          willChange: "transform",
          boxShadow: "var(--shadow-sheet)",
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex w-full cursor-grab justify-center"
          style={{ touchAction: "none" }}
          role="button"
          aria-label="Arrastar"
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              margin: "8px auto",
              background: "var(--color-border)",
            }}
          />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="h-[calc(100%-28px)] overflow-y-auto overscroll-contain">
          {children}
        </div>
      </section>
    </>
  );
}
