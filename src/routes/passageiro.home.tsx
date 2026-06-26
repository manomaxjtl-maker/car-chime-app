import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import mapBw from "@/assets/map-bw.jpg";
import { BottomNav } from "@/components/BottomNav";
import {
  DRIVERS, fmtKz, RIDES, SUGGESTIONS,
  type Ride, type Suggestion, type VehicleType,
} from "@/lib/ryde-data";
import { useNearbyDrivers, type NearbyDriver } from "@/lib/useNearbyDrivers";

// ---------- Simulated reverse geocoding (Luanda) ----------
const STREETS = [
  "Rua Cmdt. Valódia", "Av. 4 de Fevereiro", "Rua Amílcar Cabral",
  "Rua Rainha Ginga", "Av. Comandante Gika", "Av. Hoji-ya-Henda",
  "Rua Marien N'Gouabi", "Av. Deolinda Rodrigues", "Rua Kwame Nkrumah",
  "Av. Pedro de Castro V.-Dúnem", "Rua da Missão", "Av. Lenine",
  "Rua Salvador Allende", "Av. Revolução de Outubro",
];
const AREAS = ["Ingombota", "Maianga", "Talatona", "Alvalade", "Miramar", "Kinaxixi", "Sambizanga", "Rangel", "Camama", "Benfica"];

function reverseGeocode(wx: number, wy: number) {
  const h = Math.abs(Math.round(wx * 0.37 + wy * 0.51));
  const street = STREETS[h % STREETS.length];
  const num = 12 + (Math.abs(Math.round(wx * 0.91 - wy * 0.43)) % 988);
  const area = AREAS[(h >> 3) % AREAS.length];
  return { street, num, area };
}

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

type Stage = "home" | "explore" | "search" | "select" | "matching" | "trip";

const REFRESH_OPTIONS: { id: "slow" | "normal" | "fast"; label: string; ms: number }[] = [
  { id: "slow",   label: "Lento",  ms: 4000 },
  { id: "normal", label: "Normal", ms: 2200 },
  { id: "fast",   label: "Rápido", ms: 1100 },
];

function RideApp() {
  const [stage, setStage] = useState<Stage>("home");
  const [destination, setDestination] = useState<Suggestion | null>(null);
  const [selected, setSelected] = useState<Ride>(RIDES[0]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [refreshId, setRefreshId] = useState<"slow" | "normal" | "fast">("normal");
  const refreshMs = REFRESH_OPTIONS.find((o) => o.id === refreshId)!.ms;
  const nearby = useNearbyDrivers(refreshMs);
  const typeFilter: VehicleType | null =
    stage === "select" || stage === "matching" || stage === "trip" ? selected.type : null;
  const visibleDrivers = nearby.filter(
    (d) => d.online && (typeFilter ? d.type === typeFilter : true),
  );

  useEffect(() => {
    if (stage !== "matching") return;
    const t = setTimeout(() => setStage("trip"), 2400);
    return () => clearTimeout(t);
  }, [stage]);

  function reset() {
    setStage("home");
    setDestination(null);
    setSelected(RIDES[0]);
    setConfirmCancel(false);
  }

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background pb-16">
      <MapCanvas stage={stage} drivers={visibleDrivers} refreshMs={refreshMs} />
      <TopBar stage={stage} onBack={() => (stage === "home" ? null : stage === "trip" || stage === "matching" ? setConfirmCancel(true) : setStage("home"))} />

      <AnimatePresence mode="wait">
        {stage === "home" && (
          <Sheet key="home">
            <HomeSheet
              onSearch={() => setStage("search")}
              onExplore={() => setStage("explore")}
              drivers={visibleDrivers}
              refreshId={refreshId}
              onRefreshChange={setRefreshId}
            />
          </Sheet>
        )}
        {stage === "explore" && (
          <ExploreMap
            key="explore"
            onClose={() => setStage("home")}
            onConfirm={(s) => { setDestination(s); setStage("select"); }}
          />
        )}
        {stage === "search" && (
          <Sheet key="search" peek onDismiss={() => setStage("home")}>
            <SearchSheet
              onPick={(s) => { setDestination(s); setStage("select"); }}
              onClose={() => setStage("home")}
            />
          </Sheet>
        )}
        {stage === "select" && destination && (
          <Sheet key="select">
            <SelectSheet
              destination={destination}
              selected={selected}
              onSelect={setSelected}
              onConfirm={() => setStage("matching")}
            />
          </Sheet>
        )}
        {stage === "matching" && (
          <Sheet key="matching"><MatchingSheet ride={selected} onCancel={() => setConfirmCancel(true)} /></Sheet>
        )}
        {stage === "trip" && destination && (
          <Sheet key="trip">
            <TripSheet ride={selected} destination={destination} onCancel={() => setConfirmCancel(true)} onFinish={reset} />
          </Sheet>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmCancel && <CancelModal onClose={() => setConfirmCancel(false)} onConfirm={reset} />}
      </AnimatePresence>

      <BottomNav variant="passageiro" />
    </main>
  );
}

function MapCanvas({ stage, drivers, refreshMs }: { stage: Stage; drivers: NearbyDriver[]; refreshMs: number }) {
  return (
    <div className="absolute inset-0">
      <motion.img
        src={mapBw}
        alt=""
        width={1024}
        height={1536}
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        animate={{ scale: stage === "trip" ? 1.18 : 1.06, x: stage === "select" ? -16 : 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-background)_85%)]" />

      <div className="absolute left-1/2 top-20 z-10 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow ring-1 ring-border backdrop-blur">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        Mapa ao vivo · {Math.round(refreshMs / 100) / 10}s
      </div>

      <motion.div className="absolute left-1/2 top-[38%] -translate-x-1/2" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="relative">
          <div className="absolute -inset-3 animate-ping rounded-full bg-foreground/20" />
          <div className="h-3.5 w-3.5 rounded-full bg-foreground ring-4 ring-background" />
        </div>
      </motion.div>

      <AnimatePresence>
        {stage !== "trip" && drivers.map((d) => (
          <motion.div
            key={d.id}
            className="absolute z-[5] -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ left: `${d.x}%`, top: `${d.y}%`, scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              left:  { type: "spring", stiffness: 38, damping: 20, mass: 1.1 },
              top:   { type: "spring", stiffness: 38, damping: 20, mass: 1.1 },
              scale: { type: "spring", stiffness: 320, damping: 22 },
              opacity: { duration: 0.28 },
            }}
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-background text-foreground shadow ring-1 ring-border">
              <span className="absolute -inset-1 rounded-full bg-foreground/10 animate-ping" />
              {d.type === "car" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17h14l-1.5-6a2 2 0 0 0-2-1.5h-7a2 2 0 0 0-2 1.5L5 17Z"/>
                  <circle cx="8" cy="17" r="1.4"/><circle cx="16" cy="17" r="1.4"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5" cy="14" r="2.5"/><circle cx="19" cy="14" r="2.5"/><path d="M8 14h6l3-6h-3l-2-3h-3"/>
                </svg>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>


      {(stage === "select" || stage === "matching" || stage === "trip") && (
        <>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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
        "absolute inset-x-0 bottom-16 z-30 rounded-t-3xl bg-card ring-1 ring-border",
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


function HomeSheet({
  onSearch, onExplore, drivers, refreshId, onRefreshChange,
}: {
  onSearch: () => void;
  onExplore: () => void;
  drivers: NearbyDriver[];
  refreshId: "slow" | "normal" | "fast";
  onRefreshChange: (id: "slow" | "normal" | "fast") => void;
}) {
  const onlineCount = drivers.length;
  const top = drivers.slice(0, 4);
  return (
    <div className="px-5 pb-7 pt-5">
      <h1 className="text-[26px] font-semibold leading-tight tracking-tight">Para onde, hoje?</h1>

      <button onClick={onSearch} className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-secondary px-4 py-4 text-left transition active:scale-[0.99]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span className="text-sm text-muted-foreground">Buscar destino</span>
        <span className="ml-auto rounded-md bg-background px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border">Agora</span>
      </button>

      <button onClick={onExplore} className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-foreground px-4 py-3.5 text-left text-background transition active:scale-[0.99]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
        <span className="text-sm font-semibold">Escolher no mapa</span>
        <span className="ml-auto text-[10px] font-medium uppercase tracking-wider opacity-70">Arraste · Toque · Zoom</span>
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

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Motoristas perto de si</div>
          <motion.div
            key={onlineCount}
            initial={{ scale: 0.85, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {onlineCount} online
          </motion.div>
        </div>

        <div className="mb-2 flex items-center gap-1 rounded-2xl bg-secondary p-1">
          {REFRESH_OPTIONS.map((opt) => {
            const active = opt.id === refreshId;
            return (
              <button
                key={opt.id}
                onClick={() => onRefreshChange(opt.id)}
                className={`flex-1 rounded-xl py-1.5 text-[11px] font-medium transition ${active ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground"}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
          {top.map((d) => (
            <motion.li
              key={d.id}
              layout
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="flex items-center gap-3 rounded-2xl bg-secondary px-3 py-2.5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-[11px] font-semibold ring-1 ring-border">
                {d.initials}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {d.name}
                  <span className="rounded-md bg-background px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground ring-1 ring-border">
                    {d.type === "moto" ? "Moto" : "Carro"}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {d.rating.toFixed(2)} ★ · {d.distanceKm.toFixed(1)} km
                </div>
              </div>
              <div className="text-right">
                <motion.div
                  key={d.etaMin}
                  initial={{ y: -4, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="text-sm font-semibold tabular-nums"
                >
                  {d.etaMin} min
                </motion.div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">a chegar</div>
              </div>
            </motion.li>
          ))}
          </AnimatePresence>
          {top.length === 0 && (
            <li className="rounded-2xl bg-secondary px-3 py-4 text-center text-xs text-muted-foreground">
              Nenhum motorista online por perto.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}


function SearchSheet({ onPick, onClose }: { onPick: (s: Suggestion) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = SUGGESTIONS.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 pt-6 pb-4">
        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Fechar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Destino</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex flex-col items-center pt-1">
              <div className="h-2 w-2 rounded-full bg-foreground" />
              <div className="my-1 h-4 w-px bg-border" />
              <div className="h-2 w-2 rounded-sm bg-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <input className="w-full bg-transparent text-sm font-medium outline-none" defaultValue="Localização atual" readOnly />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Para onde?" className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 py-2">
        {list.map((s) => (
          <li key={s.title}>
            <button onClick={() => onPick(s)} className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-secondary">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{s.title}</span>
                <span className="block text-xs text-muted-foreground">{s.subtitle}</span>
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.eta}</span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhum resultado.</li>}
      </ul>
    </div>
  );
}

function SelectSheet({
  destination, selected, onSelect, onConfirm,
}: { destination: Suggestion; selected: Ride; onSelect: (r: Ride) => void; onConfirm: () => void }) {
  const [type, setType] = useState<VehicleType>(selected.type);
  const filtered = RIDES.filter((r) => r.type === type);
  const activeRide = filtered.some((r) => r.id === selected.id) ? selected : filtered[0];
  const driver = DRIVERS[type];

  function switchType(t: VehicleType) {
    setType(t);
    const next = RIDES.find((r) => r.type === t);
    if (next) onSelect(next);
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
          <div className="text-sm font-semibold">{driver.name}</div>
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

      <div className="mt-3 max-h-[28dvh] overflow-y-auto -mx-1 px-1">
        {filtered.map((r) => {
          const active = r.id === activeRide.id;
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
                <div className="text-[14px] font-semibold tabular-nums">{fmtKz(r.priceKz)}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">estimado</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
          <span className="text-sm font-medium">Multicaixa Express</span>
        </div>
        <Link to="/passageiro/pagamentos" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Trocar</Link>
      </div>

      <button
        onClick={onConfirm}
        className="mt-3 w-full rounded-2xl bg-foreground py-4 text-[15px] font-semibold text-background transition active:scale-[0.99]"
      >
        Confirmar {activeRide.name} · {fmtKz(activeRide.priceKz)}
      </button>
    </div>
  );
}

function MatchingSheet({ ride, onCancel }: { ride: Ride; onCancel: () => void }) {
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
        Pedido enviado apenas a {label} disponíveis. {fmtKz(ride.priceKz)} · chega em {ride.eta}.
      </p>
      <button onClick={onCancel} className="mt-5 w-full rounded-2xl bg-secondary py-3 text-sm font-medium">
        Cancelar pedido
      </button>
    </div>
  );
}

function TripSheet({
  ride, destination, onCancel, onFinish,
}: { ride: Ride; destination: Suggestion; onCancel: () => void; onFinish: () => void }) {
  const d = DRIVERS[ride.type];
  return (
    <div className="px-5 pb-6 pt-4">
      <div className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Chega em</div>
      <div className="mt-1 text-center text-3xl font-semibold tabular-nums">{ride.eta}</div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary p-3">
        <img src={d.photo} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-border" />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {d.name}
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border">
              {ride.type === "moto" ? "Moto" : "Carro"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-foreground"><path d="m12 2 3 7 7 .6-5.3 4.7L18 22l-6-3.6L6 22l1.3-7.7L2 9.6 9 9z"/></svg>
            <span className="font-medium text-foreground">{d.rating.toFixed(2)}</span> · {d.trips.toLocaleString("pt-AO")} viagens
          </div>
          <div className="text-[11px] text-muted-foreground">{d.vehicle} · {d.plate}</div>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background" aria-label="Ligar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9Z"/></svg>
        </button>
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
          <div className="text-sm font-semibold tabular-nums">{fmtKz(ride.priceKz)}</div>
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

// ============================================================
// Explore Map — pan, zoom, tap-to-pin, reverse-geocode, recenter
// ============================================================
function ExploreMap({
  onClose, onConfirm,
}: { onClose: () => void; onConfirm: (s: Suggestion) => void }) {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const [scale, setScale] = useState(1.35);
  const [addr, setAddr] = useState(() => reverseGeocode(0, 0));
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<"origem" | "destino">("destino");
  const [recentering, setRecentering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const downPos = useRef<{ x: number; y: number; t: number } | null>(null);

  function refreshAddr(wx: number, wy: number) {
    setAddr(reverseGeocode(wx, wy));
  }

  // Update address from current pan (center pin) — debounced
  useMotionValueEvent(px, "change", () => {
    if (marker) return;
    const wx = -px.get() / scale;
    const wy = -py.get() / scale;
    refreshAddr(wx, wy);
  });
  useMotionValueEvent(py, "change", () => {
    if (marker) return;
    const wx = -px.get() / scale;
    const wy = -py.get() / scale;
    refreshAddr(wx, wy);
  });

  function onPointerDown(e: React.PointerEvent) {
    downPos.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  }
  function onPointerUp(e: React.PointerEvent) {
    const d = downPos.current;
    downPos.current = null;
    if (!d || !containerRef.current) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const moved = Math.hypot(dx, dy);
    if (moved > 6 || Date.now() - d.t > 500) return; // it was a drag
    const rect = containerRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left - rect.width / 2;
    const sy = e.clientY - rect.top - rect.height / 2;
    const wx = (sx - px.get()) / scale;
    const wy = (sy - py.get()) / scale;
    setMarker({ x: wx, y: wy });
    refreshAddr(wx, wy);
  }

  function zoomBy(delta: number) {
    setScale((s) => Math.max(0.8, Math.min(2.6, +(s + delta).toFixed(2))));
  }

  function centerOnMe() {
    setRecentering(true);
    setMarker(null);
    animate(px, 0, { type: "spring", stiffness: 220, damping: 28 });
    animate(py, 0, { type: "spring", stiffness: 220, damping: 28 });
    refreshAddr(0, 0);
    setTimeout(() => setRecentering(false), 700);
  }

  function clearMarker() {
    setMarker(null);
    refreshAddr(-px.get() / scale, -py.get() / scale);
  }

  function confirmPick() {
    const subtitle = `${addr.area}, Luanda`;
    onConfirm({
      title: `${addr.street}, ${addr.num}`,
      subtitle,
      eta: "— min",
    });
  }

  return (
    <motion.div
      key="explore-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-30"
    >
      {/* Interactive map */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden bg-background touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <motion.div
          drag
          dragMomentum
          dragTransition={{ power: 0.25, timeConstant: 280 }}
          style={{ x: px, y: py, scale }}
          className="absolute inset-0 will-change-transform"
        >
          <img
            src={mapBw}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
            draggable={false}
          />
          {/* Tapped marker — anchored in world coordinates so it pans/zooms with the map */}
          {marker && (
            <motion.div
              initial={{ scale: 0, y: -10, opacity: 0 }}
              animate={{ scale: 1 / scale, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="absolute left-1/2 top-1/2 origin-bottom"
              style={{ transform: `translate(${marker.x}px, ${marker.y}px) translate(-50%, -100%) scale(${1 / scale})` }}
            >
              <PinShape variant="solid" />
            </motion.div>
          )}
        </motion.div>

        {/* Center pin (only when no marker dropped) */}
        <AnimatePresence>
          {!marker && (
            <motion.div
              key="center-pin"
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: recentering ? -4 : 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full"
            >
              <PinShape variant="outline" />
              <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-foreground/60 shadow" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Soft vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,var(--color-background)_95%)]" />
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-6">
        <button
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-md ring-1 ring-border"
          aria-label="Voltar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="rounded-full bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground shadow-md ring-1 ring-border">
          Escolher no mapa
        </div>
        <div className="h-11 w-11" />
      </div>

      {/* Right-side controls */}
      <div className="absolute right-4 top-24 z-20 flex flex-col gap-2">
        <button
          onClick={() => zoomBy(0.3)}
          aria-label="Aproximar"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-lg font-semibold shadow-md ring-1 ring-border active:scale-95 transition"
        >+</button>
        <button
          onClick={() => zoomBy(-0.3)}
          aria-label="Afastar"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-lg font-semibold shadow-md ring-1 ring-border active:scale-95 transition"
        >−</button>
        <motion.button
          onClick={centerOnMe}
          aria-label="Centralizar minha localização"
          whileTap={{ scale: 0.92 }}
          animate={recentering ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-md ring-1 ring-border"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        </motion.button>
      </div>

      {/* Quick search shortcut floating above card */}
      <button
        onClick={onClose}
        className="absolute left-4 top-24 z-20 flex items-center gap-2 rounded-full bg-card/95 px-3 py-2 text-[12px] font-medium shadow-md ring-1 ring-border backdrop-blur active:scale-95 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        Buscar por endereço
      </button>

      {/* Bottom address card */}
      <motion.div
        layout
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="absolute inset-x-3 bottom-20 z-20 rounded-3xl bg-card p-4 ring-1 ring-border"
        style={{ boxShadow: "var(--shadow-sheet)" }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {marker ? "Local selecionado" : "Endereço no centro"}
            </div>
            <motion.div
              key={`${addr.street}-${addr.num}`}
              initial={{ y: -4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="truncate text-[15px] font-semibold"
            >
              {addr.street}, {addr.num}
            </motion.div>
            <div className="truncate text-[12px] text-muted-foreground">{addr.area}, Luanda</div>
          </div>
          {marker && (
            <button
              onClick={clearMarker}
              className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              limpar
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
          {([
            { id: "origem" as const,  label: "Definir como origem" },
            { id: "destino" as const, label: "Definir como destino" },
          ]).map((opt) => {
            const active = mode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id)}
                className={`rounded-xl py-2 text-[12px] font-medium transition ${active ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground"}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={confirmPick}
          className="mt-3 w-full rounded-2xl bg-foreground py-3.5 text-[14px] font-semibold text-background transition active:scale-[0.99]"
        >
          Confirmar {mode} aqui
        </button>
      </motion.div>
    </motion.div>
  );
}

function PinShape({ variant }: { variant: "solid" | "outline" }) {
  return (
    <div className="relative">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none">
        <path
          d="M17 2c8.3 0 15 6.6 15 14.7C32 27.5 17 42 17 42S2 27.5 2 16.7C2 8.6 8.7 2 17 2Z"
          fill={variant === "solid" ? "currentColor" : "var(--color-card)"}
          stroke="currentColor"
          strokeWidth="2.4"
          className="text-foreground drop-shadow"
        />
        <circle cx="17" cy="16" r="5" fill={variant === "solid" ? "var(--color-card)" : "currentColor"} className="text-foreground" />
      </svg>
    </div>
  );
}
