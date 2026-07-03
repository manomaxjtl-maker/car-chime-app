import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EARNINGS, fmtKz, PENDING_REQUESTS, type RideRequest } from "@/lib/ryde-data";

export const Route = createFileRoute("/motorista/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel — Motorista Ryde" }] }),
  component: DashboardPage,
});

type TripPhase = "to_pickup" | "to_destination";

function DashboardPage() {
  const [online, setOnline] = useState(true);
  const [requests, setRequests] = useState<RideRequest[]>(PENDING_REQUESTS);
  const [accepted, setAccepted] = useState<RideRequest | null>(null);
  const [phase, setPhase] = useState<TripPhase>("to_pickup");

  const todayKz = useMemo(() => EARNINGS[0].amountKz, []);

  function accept(r: RideRequest) {
    setAccepted(r);
    setPhase("to_pickup");
    setRequests((all) => all.filter((x) => x.id !== r.id));
  }
  function refuse(id: string) {
    setRequests((all) => all.filter((x) => x.id !== id));
  }
  function finish() {
    setAccepted(null);
    setPhase("to_pickup");
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background pb-28">
      <header className="flex items-center justify-between px-5 pt-8">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Motorista</div>
          <h1 className="mt-1 text-2xl font-semibold">Painel</h1>
        </div>
        <button
          onClick={() => setOnline((v) => !v)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ring-1 transition ${
            online
              ? "bg-foreground text-background ring-foreground"
              : "bg-secondary text-muted-foreground ring-border"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-muted-foreground"}`} />
          {online ? "Online" : "Offline"}
        </button>
      </header>

      <section className="mx-5 mt-5 grid grid-cols-3 gap-3">
        <Stat label="Hoje" value={fmtKz(todayKz)} />
        <Stat label="Corridas" value="9" />
        <Stat label="Nota" value="4,93 ★" />
      </section>

      {!online && (
        <div className="mx-5 mt-5 rounded-2xl border border-dashed border-border bg-card p-5 text-center text-sm text-muted-foreground">
          Está <span className="font-semibold text-foreground">offline</span>. Active para receber pedidos.
        </div>
      )}

      <AnimatePresence mode="wait">
        {online && accepted && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-5 mt-5 rounded-3xl bg-foreground p-5 text-background"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
              {phase === "to_pickup" ? "Navegando até o passageiro" : "Navegando até o destino"}
            </div>
            <div className="mt-1 text-lg font-semibold">{accepted.rider}</div>
            <div className="mt-2 text-sm opacity-90">
              {phase === "to_pickup" ? `Recolher em ${accepted.from}` : `Levar a ${accepted.to}`}
            </div>
            <div className="mt-1 text-sm font-semibold">{fmtKz(accepted.priceKz)} · {accepted.etaMin} min · {accepted.distanceKm} km</div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-2xl bg-background/15 py-3 text-sm font-medium">Abrir mapa</button>
              {phase === "to_pickup" ? (
                <button onClick={() => setPhase("to_destination")} className="rounded-2xl bg-background py-3 text-sm font-semibold text-foreground">
                  Iniciar viagem
                </button>
              ) : (
                <button onClick={finish} className="rounded-2xl bg-background py-3 text-sm font-semibold text-foreground">
                  Concluir corrida
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {online && !accepted && (
        <div className="mx-5 mt-5 space-y-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Pedidos próximos</div>
          {requests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhum pedido no momento.
            </div>
          )}
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{r.rider}</div>
                <div className="text-xs text-muted-foreground">{r.ratingRider} ★</div>
              </div>
              <div className="mt-2 text-sm">
                <div className="text-muted-foreground text-xs">{r.from} → {r.to}</div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{r.distanceKm} km</span> · <span>{r.etaMin} min</span> ·{" "}
                  <span className="font-semibold text-foreground">{fmtKz(r.priceKz)}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => refuse(r.id)} className="rounded-xl bg-secondary py-2.5 text-sm font-medium">
                  Recusar
                </button>
                <button onClick={() => accept(r)} className="rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background">
                  Aceitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
