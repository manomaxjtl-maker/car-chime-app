import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import mapBw from "@/assets/map-bw.jpg";
import sPressoAsset from "@/assets/s-presso.jpg.asset.json";
import motoAsset from "@/assets/moto_transparente.png.asset.json";
import motoVermelhaAsset from "@/assets/moto_vermelha_transparente.png.asset.json";
import { SnapSheet, type Snap } from "@/components/SnapSheet";
import { PriceNegotiation } from "@/components/PriceNegotiation";
import { RatingSheet } from "@/components/RatingSheet";
import { DriverArrivedNotice } from "@/components/DriverArrivedNotice";
import {
  DRIVERS, fmtKz, RIDES, SUGGESTIONS,
  type Driver, type Ride, type Suggestion, type VehicleType,
} from "@/lib/ryde-data";
import { usePaymentMethod, PAYMENT_METHODS } from "@/lib/payments";
import { useDynamicPrice, computeDynamicPrice as _computeDynamicPrice, type PricingFactor } from "@/lib/dynamic-pricing";
import { computeTrust, type TrustResult } from "@/lib/driver-trust";

const DRIVER_META: Record<VehicleType, { joinedMonths: number; cancelRate: number }> = {
  car:  { joinedMonths: 26, cancelRate: 0.03 },
  moto: { joinedMonths: 14, cancelRate: 0.05 },
};


export const Route = createFileRoute("/passageiro/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ryde — peça uma corrida" },
      { name: "description", content: "Peça a sua corrida em segundos." },
    ],
  }),
  component: RideApp,
});

type Stage = "home" | "search" | "select" | "matching" | "trip";

function RideApp() {
  const [stage, setStage] = useState<Stage>("home");
  const [destination, setDestination] = useState<Suggestion | null>(null);
  const [selected, setSelected] = useState<Ride>(RIDES[0]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [snap, setSnap] = useState<Snap>("half");
  const [showArrived, setShowArrived] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);

  // Reset snap on stage transitions so each new sheet starts at "half".
  useEffect(() => {
    if (stage === "search" || stage === "select" || stage === "matching" || stage === "trip") {
      setSnap("half");
    }
  }, [stage]);


  useEffect(() => {
    if (stage !== "matching") return;
    const t = setTimeout(() => setStage("trip"), 2400);
    return () => clearTimeout(t);
  }, [stage]);

  // Show "driver arrived" notice ~2.5s into trip
  useEffect(() => {
    if (stage !== "trip") return;
    const t = setTimeout(() => setShowArrived(true), 2500);
    return () => clearTimeout(t);
  }, [stage]);

  function reset() {
    setStage("home");
    setDestination(null);
    setSelected(RIDES[0]);
    setConfirmCancel(false);
    setChatOpen(false);
    setShowArrived(false);
    setShowRating(false);
    setAgreedPrice(null);
  }

  function finishTrip() {
    setShowRating(true);
  }

  const canChat = stage === "matching" || stage === "trip";
  const chatDriver = canChat ? DRIVERS[selected.type] : null;
  const usesSnap = stage === "select" || stage === "matching" || stage === "trip";

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[#f0f0f0]" aria-hidden />
      <TopBar stage={stage} onBack={() => (stage === "home" ? null : stage === "trip" || stage === "matching" ? setConfirmCancel(true) : setStage("home"))} />

      <AnimatePresence mode="wait">
        {stage === "home" && (
          <Sheet key="home">
            <HomeSheet onSearch={() => setStage("search")} />
          </Sheet>
        )}
        {stage === "search" && (
          <SnapSheet key="search" snap={snap} onSnapChange={setSnap} onClose={() => setStage("home")}>
            <SearchSheet
              onConfirm={(s) => { setDestination(s); setStage("select"); }}
              onShowMap={() => setSnap("collapsed")}
            />
          </SnapSheet>
        )}

      </AnimatePresence>

      {usesSnap && stage === "select" && destination && (
        <SnapSheet snap={snap} onSnapChange={setSnap} onClose={() => setStage("home")}>
          <SelectSheet
            destination={destination}
            selected={selected}
            onSelect={setSelected}
            onConfirm={(finalPrice) => { setAgreedPrice(finalPrice); setStage("matching"); }}
          />
        </SnapSheet>
      )}
      {usesSnap && stage === "matching" && (
        <SnapSheet snap={snap} onSnapChange={setSnap} onClose={() => setConfirmCancel(true)}>
          <MatchingSheet ride={selected} agreedPrice={agreedPrice} onCancel={() => setConfirmCancel(true)} onChat={() => setChatOpen(true)} />
        </SnapSheet>
      )}
      {usesSnap && stage === "trip" && destination && (
        <SnapSheet snap={snap} onSnapChange={setSnap} onClose={() => setConfirmCancel(true)}>
          <TripSheet ride={selected} destination={destination} agreedPrice={agreedPrice} onCancel={() => setConfirmCancel(true)} onFinish={finishTrip} onChat={() => setChatOpen(true)} />
        </SnapSheet>
      )}

      <AnimatePresence>
        {confirmCancel && <CancelModal onClose={() => setConfirmCancel(false)} onConfirm={reset} />}
        {chatOpen && chatDriver && destination && (
          <ChatOverlay driver={chatDriver} destination={destination} onClose={() => setChatOpen(false)} />
        )}
        {showArrived && stage === "trip" && (
          <DriverArrivedNotice key="arrived" onClose={() => setShowArrived(false)} />
        )}
      </AnimatePresence>

      {showRating && chatDriver && (
        <RatingSheet driver={chatDriver} onClose={reset} />
      )}

    </main>
  );
}

function MapCanvas({ stage }: { stage: Stage }) {
  // Pan + pinch-zoom state. Transform applies to the inner map layer only;
  // the user pin and live HUD stay fixed on top.
  const [t, setT] = useState({ x: 0, y: 0, scale: 1 });
  const [active, setActive] = useState(false);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    pointers: new Map<number, { x: number; y: number }>(),
    startMidX: 0, startMidY: 0,
    baseX: 0, baseY: 0,
    startDist: 0, baseScale: 1,
    lastX: 0, lastY: 0, lastT: 0,
    vx: 0, vy: 0,
  });

  function clampScale(s: number) { return Math.max(0.8, Math.min(3, s)); }

  function stopInertia() {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }

  function startInertia() {
    const s = stateRef.current;
    const step = () => {
      s.vx *= 0.92; s.vy *= 0.92;
      if (Math.abs(s.vx) < 0.2 && Math.abs(s.vy) < 0.2) { rafRef.current = null; return; }
      setT((p) => ({ ...p, x: p.x + s.vx, y: p.y + s.vy }));
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function onPointerDown(e: React.PointerEvent) {
    stopInertia();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const s = stateRef.current;
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    s.baseX = t.x; s.baseY = t.y; s.baseScale = t.scale;
    s.lastX = e.clientX; s.lastY = e.clientY; s.lastT = performance.now();
    s.vx = 0; s.vy = 0;
    if (s.pointers.size === 2) {
      const [a, b] = Array.from(s.pointers.values());
      s.startDist = Math.hypot(b.x - a.x, b.y - a.y);
      s.startMidX = (a.x + b.x) / 2; s.startMidY = (a.y + b.y) / 2;
    } else {
      s.startMidX = e.clientX; s.startMidY = e.clientY;
    }
    setActive(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = stateRef.current;
    if (!s.pointers.has(e.pointerId)) return;
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (s.pointers.size >= 2) {
      const [a, b] = Array.from(s.pointers.values());
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const midX = (a.x + b.x) / 2; const midY = (a.y + b.y) / 2;
      const scale = clampScale(s.baseScale * (dist / (s.startDist || dist)));
      const dx = midX - s.startMidX; const dy = midY - s.startMidY;
      setT({ x: s.baseX + dx, y: s.baseY + dy, scale });
    } else {
      const dx = e.clientX - s.startMidX; const dy = e.clientY - s.startMidY;
      setT((p) => ({ ...p, x: s.baseX + dx, y: s.baseY + dy }));
      const now = performance.now();
      const dt = Math.max(1, now - s.lastT);
      s.vx = ((e.clientX - s.lastX) / dt) * 16;
      s.vy = ((e.clientY - s.lastY) / dt) * 16;
      s.lastX = e.clientX; s.lastY = e.clientY; s.lastT = now;
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const s = stateRef.current;
    s.pointers.delete(e.pointerId);
    if (s.pointers.size === 0) {
      setActive(false);
      if (Math.hypot(s.vx, s.vy) > 1) startInertia();
    } else {
      const next = Array.from(s.pointers.values())[0];
      s.startMidX = next.x; s.startMidY = next.y;
      s.baseX = t.x; s.baseY = t.y;
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setT((p) => ({ ...p, scale: clampScale(p.scale * (e.deltaY < 0 ? 1.1 : 0.9)) }));
  }

  function resetView() { stopInertia(); setT({ x: 0, y: 0, scale: 1 }); }
  function zoom(delta: number) { setT((p) => ({ ...p, scale: clampScale(p.scale * delta) })); }

  useEffect(() => () => stopInertia(), []);

  const layerStyle: React.CSSProperties = {
    transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`,
    transformOrigin: "50% 50%",
    transition: active ? "transform 0.1s ease-out" : "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
    willChange: "transform",
  };

  return (
    <div
      className="absolute inset-0 touch-none select-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      {/* Pan/zoom layer */}
      <div className="absolute inset-0" style={layerStyle}>
        <img
          src={mapBw}
          alt=""
          width={1024}
          height={1536}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover opacity-60 pointer-events-none"
        />

        {/* Driver pins removed — nearby-drivers flow disabled */}

        {(stage === "select" || stage === "matching" || stage === "trip") && (
          <>
            <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path
                d="M 50 38 C 60 50, 35 60, 55 78"
                stroke="currentColor"
                strokeWidth="0.6"
                strokeLinecap="round"
                strokeDasharray="2 1.5"
                fill="none"
                className="text-foreground"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
            </svg>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 280, damping: 18 }}
              className="absolute left-[55%] top-[78%] -translate-x-1/2 -translate-y-full"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-foreground text-background">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" /></svg>
              </div>
            </motion.div>
          </>
        )}

        {(stage === "matching" || stage === "trip") && (
          <motion.div
            initial={{ left: "30%", top: "60%" }}
            animate={
              stage === "trip"
                ? { left: ["30%", "40%", "48%", "55%"], top: ["60%", "55%", "50%", "42%"] }
                : { left: ["30%", "35%", "30%"], top: ["60%", "62%", "60%"] }
            }
            transition={{ duration: stage === "trip" ? 8 : 2.4, repeat: stage === "trip" ? 0 : Infinity, ease: "easeInOut" }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17h14l-1.5-6a2 2 0 0 0-2-1.5h-7a2 2 0 0 0-2 1.5L5 17Z"/>
                <circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>
              </svg>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed overlays */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-background)_85%)]" />

      <div className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow ring-1 ring-border backdrop-blur">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        Mapa ao vivo
      </div>

      {/* User pin — fixed at center */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 z-[6]">
        <div className="relative">
          <div className="absolute -inset-3 animate-ping rounded-full bg-foreground/20" />
          <div className="h-3.5 w-3.5 rounded-full bg-foreground ring-4 ring-background" />
        </div>
      </div>

      {/* Map controls */}
      <div className="absolute right-3 top-32 z-10 flex flex-col gap-1.5">
        <button onClick={() => zoom(1.2)} aria-label="Aproximar" className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow ring-1 ring-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button onClick={() => zoom(1/1.2)} aria-label="Afastar" className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow ring-1 ring-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14"/></svg>
        </button>
        <button onClick={resetView} aria-label="Centrar" className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow ring-1 ring-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
        </button>
      </div>
    </div>
  );
}

function TopBar({ stage, onBack }: { stage: Stage; onBack: () => void }) {
  return (
    <div className="relative z-20 flex items-center justify-between px-5 pt-6">
      <button
        onClick={onBack}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-md ring-1 ring-border"
        aria-label="Voltar"
      >
        {stage === "home" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        )}
      </button>
      <div className="rounded-full bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground shadow-md ring-1 ring-border">
        Ryde
      </div>
      <Link to="/passageiro/perfil" className="h-11 w-11 overflow-hidden rounded-full bg-card shadow-md ring-1 ring-border">
        <img src="https://i.pravatar.cc/120?img=47" alt="" className="h-full w-full object-cover" />
      </Link>
    </div>
  );
}

function Sheet({
  children, full = false, peek = false, onDismiss,
}: { children: React.ReactNode; full?: boolean; peek?: boolean; onDismiss?: () => void }) {
  const dismissible = Boolean(onDismiss);
  return (
    <motion.section
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      drag={dismissible ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={(_, info) => {
        if (onDismiss && (info.offset.y > 110 || info.velocity.y > 600)) onDismiss();
      }}
      className={[
        "absolute inset-x-0 bottom-0 z-30 rounded-t-3xl bg-card ring-1 ring-border",
        full ? "top-0 bottom-0 rounded-none" : "",
        peek ? "top-[40%]" : "",
        dismissible ? "touch-none" : "",
      ].join(" ")}
      style={{ boxShadow: "var(--shadow-sheet)" }}
    >
      {!full && <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-border" />}
      {children}
    </motion.section>
  );
}


function HomeSheet({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="px-5 pb-7 pt-5">
      <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Para onde, hoje?</h1>

      <button onClick={onSearch} className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-secondary px-4 py-4 text-left transition active:scale-[0.99]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span className="text-sm text-muted-foreground">Buscar destino</span>
        <span className="ml-auto rounded-md bg-background px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border">Agora</span>
      </button>

      <div className="mt-5">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Atalhos</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Casa", icon: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1Z" },
            { label: "Trabalho", icon: "M3 7h18v13H3zM8 7V4h8v3" },
            { label: "Salvos", icon: "M6 3h12v18l-6-4-6 4z" },
          ].map((s) => (
            <button key={s.label} className="flex flex-col items-start gap-3 rounded-2xl bg-secondary p-3 text-left transition active:scale-[0.97]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background ring-1 ring-border text-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
              </span>
              <span className="text-sm font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


function SearchSheet({ onConfirm, onShowMap }: { onConfirm: (s: Suggestion) => void; onShowMap: () => void }) {
  const [origem, setOrigem] = useState("24, Ocean avenue");
  const [destino, setDestino] = useState("");
  const [focus, setFocus] = useState<"origem" | "destino">("destino");

  const query = (focus === "origem" ? origem : destino).trim().toLowerCase();
  const suggestions = query.length === 0
    ? SUGGESTIONS.slice(0, 5)
    : SUGGESTIONS.filter((s) =>
        s.title.toLowerCase().includes(query) || s.subtitle.toLowerCase().includes(query)
      );

  const canConfirm = origem.trim().length > 0 && destino.trim().length > 0;

  function pickSuggestion(s: Suggestion) {
    if (focus === "origem") {
      setOrigem(s.title);
      setFocus("destino");
    } else {
      setDestino(s.title);
    }
  }

  function handleConfirm() {
    if (!canConfirm) return;
    const match = SUGGESTIONS.find((s) => s.title.toLowerCase() === destino.trim().toLowerCase());
    onConfirm(match ?? { title: destino.trim(), subtitle: origem.trim(), eta: "—" });
  }

  return (
    <div className="flex h-full flex-col bg-[#F4F6FA]">
      {/* Header */}
      <div className="relative flex items-center justify-center px-4 pb-3 pt-1">
        <h2 className="text-[15px] font-bold text-[#111]">Select Ride</h2>
      </div>

      {/* Address card with editable inputs */}
      <div className="mx-4 mt-2 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-3 flex flex-col items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
            <div className="my-1 h-8 w-px bg-[#E4E7EC]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#111]" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="block">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8A94A6]">Origem</div>
              <input
                type="text"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                onFocus={() => setFocus("origem")}
                placeholder="Ponto de partida"
                className="w-full bg-transparent text-[14px] font-semibold text-[#111] outline-none placeholder:text-[#B6BEC9]"
              />
            </label>
            <div className="h-px bg-[#F0F2F6]" />
            <label className="block">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8A94A6]">Destino</div>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                onFocus={() => setFocus("destino")}
                placeholder="Para onde vai?"
                autoFocus
                className="w-full bg-transparent text-[14px] font-semibold text-[#111] outline-none placeholder:text-[#B6BEC9]"
              />
            </label>
          </div>
        </div>

        <div className="mt-3 h-px bg-[#F0F2F6]" />

        <button onClick={onShowMap} className="mt-1 flex w-full items-center gap-2 py-2 text-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
          <span className="flex-1 text-[13px] font-semibold text-[#2563EB]">Mostrar em um mapa</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
        </button>
      </div>

      {/* Suggestions */}
      <div className="mt-4 px-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A94A6]">
        {query.length === 0 ? "Recent" : "Sugestões"}
      </div>
      <ul className="mt-1 flex-1 overflow-y-auto px-4">
        {suggestions.length === 0 && (
          <li className="px-2 py-6 text-center text-[13px] text-[#8A94A6]">Sem sugestões</li>
        )}
        {suggestions.map((s, i) => (
          <li key={s.title} className={i > 0 ? "border-t border-[#EBEEF3]" : ""}>
            <button onClick={() => pickSuggestion(s)} className="flex w-full items-center gap-3 py-3 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDF1F7] text-[#8A94A6]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-[14px] font-bold text-[#111]">{s.title}</span>
                <span className="block truncate text-[12px] text-[#8A94A6]">{s.subtitle}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Confirmar destino */}
      <div className="border-t border-[#EBEEF3] bg-[#F4F6FA] px-4 pb-6 pt-3">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className={[
            "flex h-12 w-full items-center justify-center rounded-2xl text-[14px] font-semibold transition",
            canConfirm ? "bg-[#111] text-white active:scale-[0.99]" : "bg-[#D6DBE3] text-[#8A94A6]",
          ].join(" ")}
        >
          Confirmar destino
        </button>
      </div>
    </div>
  );
}



function SelectSheet({
  destination, selected, onSelect, onConfirm,
}: { destination: Suggestion; selected: Ride; onSelect: (r: Ride) => void; onConfirm: (finalPrice: number) => void }) {
  const [type, setType] = useState<VehicleType>(selected.type);
  const [discount, setDiscount] = useState(0);
  const [sending, setSending] = useState(false);
  const filtered = RIDES.filter((r) => r.type === type);
  const activeRide = filtered.some((r) => r.id === selected.id) ? selected : filtered[0];
  const driver = DRIVERS[type];
  const pricing = computeRowPricing(activeRide.priceKz, destination.title + ":" + activeRide.id);
  const basePrice = pricing.finalPrice;
  const offerPrice = Math.round(basePrice * (1 - discount / 100));

  function switchType(t: VehicleType) {
    setType(t);
    setDiscount(0);
    const next = RIDES.find((r) => r.type === t);
    if (next) onSelect(next);
  }

  function handleCta() {
    if (discount === 0) {
      onConfirm(basePrice);
      return;
    }
    setSending(true);
    // Simulate driver response
    const accepts = Math.random() > 0.3;
    setTimeout(() => {
      setSending(false);
      if (accepts) {
        toast.success(`Oferta aceite · ${fmtKz(offerPrice)}`);
        onConfirm(offerPrice);
      } else {
        toast.error("Motorista recusou a oferta");
      }
    }, 1500);
  }

  return (
    <div className="flex flex-col px-5 pb-6 pt-4">
      <div className="rounded-xl bg-secondary px-3 py-2.5">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Indo para</div>
        <div className="truncate text-sm font-semibold">{destination.title}</div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-secondary p-3">
        <img src={driver.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-border" />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {driver.name}
            <TrustBadge driver={driver} />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-foreground"><path d="m12 2 3 7 7 .6-5.3 4.7L18 22l-6-3.6L6 22l1.3-7.7L2 9.6 9 9z"/></svg>
            <span className="font-medium text-foreground">{driver.rating.toFixed(2)}</span>
            <span>·</span><span>{driver.trips.toLocaleString("pt-AO")} viagens</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{driver.vehicle} · {driver.plate}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {([
          { id: "car" as const, label: "Carro" },
          { id: "moto" as const, label: "Moto" },
        ]).map((opt) => {
          const active = type === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => switchType(opt.id)}
              className={`rounded-xl py-2.5 text-sm font-medium transition ${active ? "bg-background shadow-sm ring-1 ring-border text-foreground" : "text-muted-foreground"}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {type === "car" && (
        <div className="mt-3 -mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2.5 pb-1">
            {filtered.map((r) => {
              const active = r.id === activeRide.id;
              const rowPricing = computeRowPricing(r.priceKz, destination.title + ":" + r.id);
              const imgSrc = r.id === "moto-nx" ? motoVermelhaAsset.url : r.type === "moto" ? motoAsset.url : sPressoAsset.url;
              return (
                <button
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className="flex shrink-0 flex-col overflow-hidden rounded-2xl p-2 text-left transition"
                  style={{
                    width: 140,
                    height: 158,
                    border: active ? "2px solid #000" : "2px solid transparent",
                    background: active ? "#EEEEEE" : "#ffffff",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    className="flex items-center justify-center overflow-hidden rounded-2xl"
                    style={{ background: "#F5F5F5", height: "68%" }}
                  >
                    <img
                      src={imgSrc}
                      alt={r.name}
                      className="h-full w-full object-contain p-1"
                      style={{ mixBlendMode: "multiply" }}
                    />
                  </div>
                  <div className="mt-1.5 px-1 text-center">
                    <div className="text-[13px] font-bold leading-tight text-[#1a1a1a]">{r.name}</div>
                    <div className="text-[12px] tabular-nums text-black">{fmtKz(rowPricing.finalPrice)} · {r.eta}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}





      <div className="mt-3 max-h-[28dvh] overflow-y-auto -mx-1 px-1">
        {filtered.map((r) => {
          const active = r.id === activeRide.id;
          const rowPricing = computeRowPricing(r.priceKz, destination.title + ":" + r.id);
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${active ? "border-foreground bg-secondary" : "border-transparent hover:bg-secondary/60"}`}
            >
              <div className="flex h-12 w-14 items-center justify-center rounded-xl bg-background ring-1 ring-border">
                {r.type === "car" ? (
                  <svg width="30" height="18" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h40l-3-9a3 3 0 0 0-3-2H10a3 3 0 0 0-3 2L4 20Z"/><circle cx="13" cy="22" r="3"/><circle cx="35" cy="22" r="3"/>
                  </svg>
                ) : (
                  <svg width="28" height="20" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="14" r="3"/><circle cx="19" cy="14" r="3"/><path d="M8 14h6l3-6h-3l-2-3h-3"/>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[14px] font-semibold">{r.name}
                  <span className="text-[11px] font-normal text-muted-foreground">· {r.capacity} lug.</span>
                </div>
                <div className="text-[11px] text-muted-foreground">Chega em {r.eta} · {r.tag}</div>
              </div>
              <div className="text-right">
                {rowPricing.surgePct > 0 ? (
                  <>
                    <div className="text-[11px] tabular-nums text-muted-foreground line-through">{fmtKz(rowPricing.basePrice)}</div>
                    <div className="text-[14px] font-semibold tabular-nums">{fmtKz(rowPricing.finalPrice)}</div>
                  </>
                ) : (
                  <div className="text-[14px] font-semibold tabular-nums">{fmtKz(r.priceKz)}</div>
                )}
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">estimado</div>
              </div>
            </button>
          );
        })}
      </div>

      <SurgePanel basePrice={activeRide.priceKz} keyHint={destination.title + ":" + activeRide.id} />

      <PriceNegotiation originalPrice={basePrice} discount={discount} onChange={setDiscount} />

      <PaymentRow />


      <button
        onClick={handleCta}
        disabled={sending}
        className="mt-3 w-full rounded-2xl bg-foreground py-4 text-[15px] font-semibold text-background transition active:scale-[0.99] disabled:opacity-60"
      >
        {sending
          ? "A enviar oferta…"
          : discount > 0
            ? `Enviar oferta · ${fmtKz(offerPrice)}`
            : `Solicitar corrida · ${fmtKz(basePrice)}`}
      </button>

      <div className="mt-2 text-center text-[10.5px] text-muted-foreground">
        O preço pode variar conforme a demanda
      </div>
    </div>
  );
}

// Stable helper so rows and panel agree on the same factors/price.
function computeRowPricing(basePrice: number, keyHint: string) {
  return computeDynamicPriceMemo(basePrice, keyHint);
}

const _cache = new Map<string, ReturnType<typeof _computeDynamicPrice>>();
function computeDynamicPriceMemo(basePrice: number, keyHint: string) {
  const k = `${basePrice}|${keyHint}`;
  let v = _cache.get(k);
  if (!v) { v = _computeDynamicPrice(basePrice, keyHint); _cache.set(k, v); }
  return v;
}

function FactorIcon({ kind }: { kind: PricingFactor["icon"] }) {
  if (kind === "rain") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 14a5 5 0 1 0-9.5-2A4 4 0 0 0 7 20h9a4 4 0 0 0 0-6Z"/>
      <path d="M8 22l-1 2M12 22l-1 2M16 22l-1 2"/>
    </svg>
  );
  if (kind === "clock") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
    </svg>
  );
  if (kind === "calendar") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-1 6 3 6 4-4 4-7c0-3-4-4-4-4Z"/>
    </svg>
  );
}

function SurgePanel({ basePrice, keyHint }: { basePrice: number; keyHint: string }) {
  const pricing = useDynamicPrice(basePrice, keyHint);
  if (pricing.surgePct === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="mt-3 overflow-hidden rounded-2xl bg-secondary ring-1 ring-border"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Preço dinâmico</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-[12px] tabular-nums text-muted-foreground line-through">{fmtKz(pricing.basePrice)}</span>
            <span className="text-lg font-semibold tabular-nums">{fmtKz(pricing.finalPrice)}</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white shadow-sm">
          +{pricing.surgePct}%
        </span>
      </div>
      <ul className="divide-y divide-border">
        {pricing.factors.map((f) => (
          <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground ring-1 ring-border">
              <FactorIcon kind={f.icon} />
            </span>
            <div className="flex-1">
              <div className="text-[13px] font-medium">{f.label}</div>
              <div className="text-[11px] text-muted-foreground">{f.description}</div>
            </div>
            <span className="rounded-md bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums text-orange-600 ring-1 ring-border">
              +{Math.round(f.surge * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function PaymentRow() {
  const { method, setMethod } = usePaymentMethod();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-secondary">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-w-0 items-center gap-3"
          >
            <img src={method.logo} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-border" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{method.label}</div>
              <div className="truncate text-[11px] text-muted-foreground">{method.hint}</div>
            </div>
          </motion.div>
        </AnimatePresence>
        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-full bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border"
        >
          Trocar
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-border"
          >
            {PAYMENT_METHODS.map((m) => {
              const active = m.id === method.id;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => { setMethod(m.id); setOpen(false); }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${active ? "bg-background" : "hover:bg-background/60"}`}
                  >
                    <img src={m.logo} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-border" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{m.label}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{m.hint}</div>
                    </div>
                    {active && (
                      <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                        Ativo
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}



function MatchingSheet({ ride, agreedPrice, onCancel, onChat }: { ride: Ride; agreedPrice: number | null; onCancel: () => void; onChat: () => void }) {
  const shownPrice = agreedPrice ?? ride.priceKz;
  const label = ride.type === "moto" ? "motociclistas" : "motoristas";
  return (
    <div className="px-5 pb-7 pt-6 text-center">
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-foreground/20" />
        <div className="relative h-12 w-12 rounded-full bg-foreground" />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Procurando</div>
      <div className="mt-1 text-lg font-semibold">A encontrar um {ride.name} perto de si…</div>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Pedido enviado apenas a {label} disponíveis. {fmtKz(shownPrice)} · chega em {ride.eta}.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button onClick={onChat} className="rounded-2xl bg-secondary py-3 text-sm font-medium">
          Falar com motorista
        </button>
        <button onClick={onCancel} className="rounded-2xl bg-secondary py-3 text-sm font-medium">
          Cancelar pedido
        </button>
      </div>
    </div>
  );
}

function TripSheet({
  ride, destination, agreedPrice, onCancel, onFinish, onChat,
}: { ride: Ride; destination: Suggestion; agreedPrice: number | null; onCancel: () => void; onFinish: () => void; onChat: () => void }) {
  const d = DRIVERS[ride.type];
  const shownPrice = agreedPrice ?? ride.priceKz;
  return (
    <div className="px-5 pb-6 pt-4">
      <div className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Chega em</div>
      <div className="mt-1 text-center text-3xl font-semibold tabular-nums">{ride.eta}</div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary p-3">
        <img src={d.photo} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-border" />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {d.name}
            <TrustBadge driver={d} />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-foreground"><path d="m12 2 3 7 7 .6-5.3 4.7L18 22l-6-3.6L6 22l1.3-7.7L2 9.6 9 9z"/></svg>
            <span className="font-medium text-foreground">{d.rating.toFixed(2)}</span> · {d.trips.toLocaleString("pt-AO")} viagens
          </div>
          <div className="text-[11px] text-muted-foreground">{d.vehicle} · {d.plate}</div>
        </div>
        <button onClick={onChat} className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background" aria-label="Conversar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z"/></svg>
        </button>
        <a href="tel:+244923000000" className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background" aria-label="Ligar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9Z"/></svg>
        </a>
      </div>


      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-border p-3">
        <div className="mt-1 flex flex-col items-center">
          <div className="h-2 w-2 rounded-full bg-foreground" />
          <div className="my-1 h-6 w-px bg-border" />
          <div className="h-2 w-2 rounded-sm bg-foreground" />
        </div>
        <div className="flex-1 space-y-2 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Embarque</div>
            <div className="font-medium">Sua localização atual</div>
          </div>
          <div className="h-px bg-border" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Destino</div>
            <div className="font-medium">{destination.title}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums">{fmtKz(shownPrice)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">total</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button className="rounded-2xl bg-secondary py-3 text-sm font-medium">Partilhar</button>
        <button onClick={onFinish} className="rounded-2xl bg-secondary py-3 text-sm font-medium">Concluir</button>
        <button onClick={onCancel} className="rounded-2xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground">Cancelar</button>
      </div>
    </div>
  );
}

function CancelModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="mx-4 mb-24 w-full max-w-sm rounded-3xl bg-card p-5 ring-1 ring-border"
      >
        <div className="text-base font-semibold">Cancelar a corrida?</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Cancelar agora pode gerar uma pequena taxa para compensar o motorista.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onClose} className="rounded-2xl bg-secondary py-3 text-sm font-medium">Manter</button>
          <button onClick={onConfirm} className="rounded-2xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground">
            Sim, cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TrustBadge({ driver }: { driver: Driver }) {
  const meta = DRIVER_META[driver.type];
  const trust: TrustResult = computeTrust({
    rating: driver.rating,
    trips: driver.trips,
    joinedMonths: meta.joinedMonths,
    cancelRate: meta.cancelRate,
  });
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1"
      style={{ background: trust.bg, color: trust.color, borderColor: trust.ring, boxShadow: "inset 0 0 0 1px " + trust.ring }}
      title={`Confiança ${trust.score}/100`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 5.96L21 9l-5 4.6L17.5 21 12 17.7 6.5 21 8 13.6 3 9l6.61-1.04L12 2z"/></svg>
      {trust.medal}
      <span className="tabular-nums opacity-80">· {trust.score}</span>
    </span>
  );
}

type ChatMessage =
  | { id: string; from: "me" | "driver"; kind: "text"; text: string; time: string }
  | { id: string; from: "me" | "driver"; kind: "audio"; url: string; duration: number; time: string };

function ChatOverlay({
  driver, destination, onClose,
}: { driver: Driver; destination: Suggestion; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m0", from: "driver", kind: "text", text: `Olá! Estou a caminho de ${destination.title.split(",")[0]}.`, time: nowHM() },
  ]);
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const id = "m" + Date.now();
    setMessages((m) => [...m, { id, from: "me", kind: "text", text, time: nowHM() }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [...m, { id: id + "r", from: "driver", kind: "text", text: pickReply(text), time: nowHM() }]);
    }, 900 + Math.random() * 700);
  }

  async function startRecording() {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
        const url = URL.createObjectURL(blob);
        const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        const id = "a" + Date.now();
        setMessages((m) => [...m, { id, from: "me", kind: "audio", url, duration, time: nowHM() }]);
        setTimeout(() => {
          setMessages((m) => [...m, { id: id + "r", from: "driver", kind: "text", text: "Recebido, obrigado!", time: nowHM() }]);
        }, 900);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      rec.start();
      recRef.current = rec;
      startTimeRef.current = Date.now();
      setRecording(true);
      setRecSecs(0);
      tickRef.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecSecs(s);
        if (s >= 60) stopRecording();
      }, 200);
    } catch {
      toast.error("Não foi possível aceder ao microfone");
    }
  }

  function stopRecording() {
    if (!recording) return;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    try { recRef.current?.stop(); } catch { /* noop */ }
    recRef.current = null;
    setRecording(false);
  }

  function cancelRecording() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (recRef.current) {
      recRef.current.onstop = null;
      try { recRef.current.stop(); } catch { /* noop */ }
      recRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
    setRecSecs(0);
  }

  useEffect(() => () => cancelRecording(), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] bg-background"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="flex h-full flex-col"
      >
        {/* Header */}
        <div className="border-b border-border bg-card px-4 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <button onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div className="relative">
              <img src={driver.photo} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-border" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold">{driver.name}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
              </div>
            </div>
            <a href="tel:+244923000000" aria-label="Ligar" className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9Z"/></svg>
            </a>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Local solicitado</div>
              <div className="truncate text-[13px] font-medium">{destination.title}</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <div className="space-y-2">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={m.from === "me" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.from === "me"
                      ? "max-w-[78%] rounded-2xl rounded-br-md bg-black px-3.5 py-2 text-sm text-white shadow-sm"
                      : "max-w-[78%] rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2 text-sm text-foreground ring-1 ring-border"
                  }
                >
                  {m.kind === "text" ? (
                    <div>{m.text}</div>
                  ) : (
                    <AudioBubble url={m.url} duration={m.duration} mine={m.from === "me"} />
                  )}
                  <div className={"mt-0.5 text-[10px] tabular-nums " + (m.from === "me" ? "text-white/60" : "text-muted-foreground")}>{m.time}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-card px-3 py-3 pb-5">
          {recording ? (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelRecording}
                aria-label="Cancelar"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
              <div className="flex flex-1 items-center gap-3 rounded-full bg-secondary px-4 py-2.5">
                <Waveform />
                <div className="text-[12px] font-semibold tabular-nums text-foreground">
                  {fmtSecs(recSecs)} / 1:00
                </div>
              </div>
              <button
                onClick={stopRecording}
                aria-label="Enviar áudio"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7Z"/></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Escreva uma mensagem…"
                className="flex-1 rounded-full bg-secondary px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              {draft.trim() ? (
                <button
                  onClick={send}
                  aria-label="Enviar"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7Z"/></svg>
                </button>
              ) : (
                <button
                  onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
                  onPointerUp={stopRecording}
                  onPointerLeave={() => { if (recording) stopRecording(); }}
                  aria-label="Gravar áudio"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function fmtSecs(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function Waveform() {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setSeed((x) => x + 1), 90);
    return () => clearInterval(id);
  }, []);
  const bars = 22;
  return (
    <div className="flex h-6 flex-1 items-center gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => {
        const h = 20 + Math.abs(Math.sin((seed + i) * 0.9) * 60) + Math.random() * 20;
        return (
          <span
            key={i}
            className="w-[3px] rounded-full bg-black"
            style={{ height: `${Math.min(100, h)}%` }}
          />
        );
      })}
    </div>
  );
}

function AudioBubble({ url, duration, mine }: { url: string; duration: number; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const a = new Audio(url);
    audioRef.current = a;
    a.addEventListener("timeupdate", () => {
      const d = a.duration || duration;
      setCurrent(a.currentTime);
      setProgress(Math.min(1, a.currentTime / d));
    });
    a.addEventListener("ended", () => { setPlaying(false); setProgress(1); });
    return () => { a.pause(); audioRef.current = null; };
  }, [url, duration]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  }

  const barBg = mine ? "bg-white/25" : "bg-foreground/20";
  const fillBg = mine ? "bg-white" : "bg-foreground";
  const timeText = mine ? "text-white/70" : "text-muted-foreground";
  const shown = playing || progress > 0 ? current : duration;

  return (
    <div className="flex items-center gap-2 py-0.5">
      <button
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Reproduzir"}
        className={"flex h-8 w-8 items-center justify-center rounded-full " + (mine ? "bg-white text-black" : "bg-black text-white")}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <div className={"relative h-1 w-32 rounded-full " + barBg}>
        <div className={"absolute inset-y-0 left-0 rounded-full " + fillBg} style={{ width: `${progress * 100}%` }} />
      </div>
      <div className={"text-[11px] font-medium tabular-nums " + timeText}>{fmtSecs(Math.round(shown))}</div>
    </div>
  );
}

function nowHM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const REPLIES = [
  "Ok, estou a chegar!",
  "Confirmado. Já saí.",
  "Pode aguardar um minuto, por favor.",
  "Estou no portão principal.",
  "Obrigado pela informação!",
];
function pickReply(_t: string) {
  return REPLIES[Math.floor(Math.random() * REPLIES.length)];
}
