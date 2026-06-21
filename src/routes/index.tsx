import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import mapBw from "@/assets/map-bw.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ryde — peça uma corrida" },
      { name: "description", content: "Peça uma corrida em segundos. Design minimalista, preto e branco." },
      { property: "og:title", content: "Ryde — peça uma corrida" },
      { property: "og:description", content: "Peça uma corrida em segundos." },
    ],
  }),
  component: RideApp,
});

type Stage = "home" | "search" | "select" | "matching" | "trip";

type Suggestion = { title: string; subtitle: string; eta: string };
type VehicleType = "car" | "moto";
type Ride = { id: string; name: string; tag: string; eta: string; price: string; capacity: string; type: VehicleType };

const SUGGESTIONS: Suggestion[] = [
  { title: "Aeroporto de Congonhas", subtitle: "Av. Washington Luís — São Paulo", eta: "22 min" },
  { title: "Allianz Parque", subtitle: "Rua Palestra Itália, 200", eta: "14 min" },
  { title: "MASP", subtitle: "Av. Paulista, 1578", eta: "9 min" },
  { title: "Mercado Municipal", subtitle: "Rua da Cantareira, 306", eta: "18 min" },
];

const RIDES: Ride[] = [
  { id: "x", name: "RydeX", tag: "Econômico", eta: "3 min", price: "R$ 18,90", capacity: "4", type: "car" },
  { id: "comfort", name: "Comfort", tag: "Mais espaço", eta: "5 min", price: "R$ 26,40", capacity: "4", type: "car" },
  { id: "black", name: "Black", tag: "Premium", eta: "7 min", price: "R$ 42,10", capacity: "4", type: "car" },
  { id: "xl", name: "XL", tag: "Até 6 pessoas", eta: "9 min", price: "R$ 51,80", capacity: "6", type: "car" },
  { id: "moto", name: "Moto", tag: "Mais rápido no trânsito", eta: "2 min", price: "R$ 9,90", capacity: "1", type: "moto" },
  { id: "moto-pro", name: "Moto Pro", tag: "Motociclistas 4,9+", eta: "4 min", price: "R$ 13,50", capacity: "1", type: "moto" },
];

const DRIVERS: Record<VehicleType, { name: string; initials: string; rating: string; vehicle: string; plate: string }> = {
  car: { name: "Marco R.", initials: "MR", rating: "4,93", vehicle: "Honda Civic preto", plate: "ABC 1D23" },
  moto: { name: "Diego S.", initials: "DS", rating: "4,97", vehicle: "Honda CG 160 vermelha", plate: "MOT 2K45" },
};

function RideApp() {
  const [stage, setStage] = useState<Stage>("home");
  const [destination, setDestination] = useState<Suggestion | null>(null);
  const [selected, setSelected] = useState<Ride>(RIDES[0]);

  useEffect(() => {
    if (stage !== "matching") return;
    const t = setTimeout(() => setStage("trip"), 2400);
    return () => clearTimeout(t);
  }, [stage]);

  function reset() {
    setStage("home");
    setDestination(null);
    setSelected(RIDES[0]);
  }

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background">
      <MapCanvas stage={stage} />
      <TopBar stage={stage} onBack={() => (stage === "trip" ? reset() : setStage("home"))} />

      <AnimatePresence mode="wait">
        {stage === "home" && (
          <Sheet key="home">
            <HomeSheet onSearch={() => setStage("search")} />
          </Sheet>
        )}
        {stage === "search" && (
          <Sheet key="search" full>
            <SearchSheet
              onPick={(s) => {
                setDestination(s);
                setStage("select");
              }}
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
          <Sheet key="matching">
            <MatchingSheet ride={selected} />
          </Sheet>
        )}
        {stage === "trip" && destination && (
          <Sheet key="trip">
            <TripSheet ride={selected} destination={destination} onFinish={reset} />
          </Sheet>
        )}
      </AnimatePresence>
    </main>
  );
}

/* -------------------- map + chrome -------------------- */

function MapCanvas({ stage }: { stage: Stage }) {
  return (
    <div className="absolute inset-0">
      <motion.img
        src={mapBw}
        alt=""
        width={1024}
        height={1536}
        className="absolute inset-0 h-full w-full object-cover"
        animate={{ scale: stage === "trip" ? 1.15 : 1.04, x: stage === "select" ? -20 : 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/30" />

      {/* pickup pin */}
      <motion.div
        className="absolute left-1/2 top-[38%] -translate-x-1/2"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="relative">
          <div className="absolute -inset-3 animate-ping rounded-full bg-foreground/10" />
          <div className="h-3.5 w-3.5 rounded-full bg-foreground ring-4 ring-background" />
        </div>
      </motion.div>

      {/* route line + drop pin in trip stages */}
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

      {/* moving car in trip */}
      {stage === "trip" && (
        <motion.div
          initial={{ left: "50%", top: "38%" }}
          animate={{ left: ["50%", "57%", "52%", "55%"], top: ["38%", "52%", "65%", "75%"] }}
          transition={{ duration: 8, ease: "easeInOut" }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
        className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-border"
        aria-label="Voltar"
      >
        {stage === "home" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        )}
      </button>
      <div className="rounded-full bg-background px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground shadow-md ring-1 ring-border">
        Ryde
      </div>
      <div className="h-11 w-11 rounded-full bg-foreground text-background shadow-md ring-1 ring-border flex items-center justify-center text-sm font-semibold">
        L
      </div>
    </div>
  );
}

/* -------------------- bottom sheet wrapper -------------------- */

function Sheet({ children, full = false }: { children: React.ReactNode; full?: boolean }) {
  return (
    <motion.section
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className={`absolute inset-x-0 bottom-0 z-30 rounded-t-3xl bg-card ${full ? "top-0" : ""}`}
      style={{ boxShadow: "var(--shadow-sheet)" }}
    >
      {!full && <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border" />}
      {children}
    </motion.section>
  );
}

/* -------------------- HOME -------------------- */

function HomeSheet({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="px-5 pb-8 pt-5">
      <h1 className="text-[26px] font-semibold leading-tight tracking-tight">
        Para onde, hoje?
      </h1>

      <button
        onClick={onSearch}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-secondary px-4 py-4 text-left transition active:scale-[0.99]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span className="text-sm text-muted-foreground">Buscar destino</span>
        <span className="ml-auto rounded-md bg-background px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border">Agora</span>
      </button>

      <div className="mt-6">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Atalhos
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Casa", icon: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1Z" },
            { label: "Trabalho", icon: "M3 7h18v13H3zM8 7V4h8v3" },
            { label: "Salvos", icon: "M6 3h12v18l-6-4-6 4z" },
          ].map((s) => (
            <button key={s.label} className="flex flex-col items-start gap-3 rounded-2xl bg-secondary p-3 text-left transition active:scale-[0.97]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background ring-1 ring-border">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
              </span>
              <span className="text-sm font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border p-4">
        <div>
          <div className="text-sm font-medium">Programe uma corrida</div>
          <div className="text-xs text-muted-foreground">Garanta seu carro com antecedência</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>
  );
}

/* -------------------- SEARCH -------------------- */

function SearchSheet({ onPick, onClose }: { onPick: (s: Suggestion) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = SUGGESTIONS.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 pt-5 pb-4">
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
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Para onde?"
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 py-2">
        {list.map((s) => (
          <li key={s.title}>
            <button onClick={() => onPick(s)} className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-secondary">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
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
        {list.length === 0 && (
          <li className="px-5 py-12 text-center text-sm text-muted-foreground">Nenhum resultado.</li>
        )}
      </ul>
    </div>
  );
}

/* -------------------- SELECT -------------------- */

function SelectSheet({
  destination, selected, onSelect, onConfirm,
}: { destination: Suggestion; selected: Ride; onSelect: (r: Ride) => void; onConfirm: () => void }) {
  const [type, setType] = useState<VehicleType>(selected.type);
  const filtered = RIDES.filter((r) => r.type === type);
  const activeRide = filtered.some((r) => r.id === selected.id) ? selected : filtered[0];

  function switchType(t: VehicleType) {
    setType(t);
    const next = RIDES.find((r) => r.type === t);
    if (next) onSelect(next);
  }

  return (
    <div className="flex flex-col px-5 pb-7 pt-4">
      <div className="rounded-xl bg-secondary px-3 py-2.5">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Indo para</div>
        <div className="truncate text-sm font-semibold">{destination.title}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {([
          { id: "car" as const, label: "Carro", icon: <svg width="16" height="14" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h40l-3-9a3 3 0 0 0-3-2H10a3 3 0 0 0-3 2L4 20Z"/><circle cx="13" cy="22" r="3"/><circle cx="35" cy="22" r="3"/></svg> },
          { id: "moto" as const, label: "Moto", icon: <svg width="18" height="14" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="14" r="3"/><circle cx="19" cy="14" r="3"/><path d="M8 14h6l3-6h-3l-2-3h-3"/></svg> },
        ]).map((opt) => {
          const active = type === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => switchType(opt.id)}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
                active ? "bg-background shadow-sm ring-1 ring-border" : "text-muted-foreground"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 max-h-[36dvh] overflow-y-auto -mx-1 px-1">
        {filtered.map((r) => {
          const active = r.id === activeRide.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                active ? "border-foreground bg-secondary" : "border-transparent hover:bg-secondary/60"
              }`}
            >
              <div className="flex h-14 w-16 items-center justify-center rounded-xl bg-background ring-1 ring-border">
                {r.type === "car" ? (
                  <svg width="34" height="20" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h40l-3-9a3 3 0 0 0-3-2H10a3 3 0 0 0-3 2L4 20Z"/>
                    <circle cx="13" cy="22" r="3"/><circle cx="35" cy="22" r="3"/>
                  </svg>
                ) : (
                  <svg width="32" height="22" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="14" r="3"/><circle cx="19" cy="14" r="3"/><path d="M8 14h6l3-6h-3l-2-3h-3"/>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold">{r.name}</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="7" r="4"/><path d="M2 22c0-4 4-7 7-7s7 3 7 7"/></svg>
                    {r.capacity}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Chega em {r.eta} · {r.tag}</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-semibold tabular-nums">{r.price}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">estimado</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
          <span className="text-sm font-medium">Visa •• 4242</span>
        </div>
        <button className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trocar</button>
      </div>

      <button
        onClick={onConfirm}
        className="mt-4 w-full rounded-2xl bg-foreground py-4 text-[15px] font-semibold text-background transition active:scale-[0.99]"
      >
        Confirmar {activeRide.name} · {activeRide.price}
      </button>
    </div>
  );
}

/* -------------------- MATCHING -------------------- */

function MatchingSheet({ ride }: { ride: Ride }) {
  return (
    <div className="px-5 pb-8 pt-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-foreground/10" />
        <div className="relative h-12 w-12 rounded-full bg-foreground" />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Procurando</div>
      <div className="mt-1 text-lg font-semibold">Encontrando um {ride.name} perto de você…</div>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Estamos avisando os motoristas mais próximos. Isso costuma levar poucos segundos.
      </p>
    </div>
  );
}

/* -------------------- TRIP -------------------- */

function TripSheet({ ride, destination, onFinish }: { ride: Ride; destination: Suggestion; onFinish: () => void }) {
  return (
    <div className="px-5 pb-7 pt-4">
      <div className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Chega em
      </div>
      <div className="mt-1 text-center text-3xl font-semibold tabular-nums">{ride.eta}</div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-secondary p-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
          MR
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Marco R.</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7 7 .6-5.3 4.7L18 22l-6-3.6L6 22l1.3-7.7L2 9.6 9 9z"/></svg>
            4,93 · Honda Civic preto · ABC 1D23
          </div>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-background ring-1 ring-border" aria-label="Ligar">
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
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="rounded-2xl bg-secondary py-3 text-sm font-medium">Compartilhar</button>
        <button onClick={onFinish} className="rounded-2xl bg-foreground py-3 text-sm font-medium text-background">
          Cancelar
        </button>
      </div>
    </div>
  );
}
