import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { EARNINGS, fmtKz, PENDING_REQUESTS, type RideRequest } from "@/lib/ryde-data";

export const Route = createFileRoute("/motorista")({
  head: () => ({ meta: [{ title: "Motorista — Ryde" }] }),
  component: MotoristaPage,
});

type Tab = "inicio" | "ganhos" | "documentos" | "cadastro";

function MotoristaPage() {
  const [tab, setTab] = useState<Tab>("inicio");
  const [online, setOnline] = useState(true);
  const [requests, setRequests] = useState<RideRequest[]>(PENDING_REQUESTS);
  const [accepted, setAccepted] = useState<RideRequest | null>(null);

  const todayKz = useMemo(() => EARNINGS[0].amountKz, []);
  const weekKz = useMemo(() => EARNINGS.reduce((s, e) => s + e.amountKz, 0), []);

  function accept(r: RideRequest) {
    setAccepted(r);
    setRequests((all) => all.filter((x) => x.id !== r.id));
  }
  function refuse(id: string) {
    setRequests((all) => all.filter((x) => x.id !== id));
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background pb-28">
      <header className="flex items-center justify-between px-5 pt-8">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">Motorista</div>
          <h1 className="mt-1 text-2xl font-semibold">Painel</h1>
        </div>
        <button
          onClick={() => setOnline((v) => !v)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ring-1 transition ${
            online
              ? "bg-accent text-accent-foreground ring-accent"
              : "bg-secondary text-muted-foreground ring-border"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-muted-foreground"}`} />
          {online ? "Online" : "Offline"}
        </button>
      </header>

      <section className="mx-5 mt-5 flex items-center gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
        <img src="https://i.pravatar.cc/200?img=12" alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-accent/40" />
        <div className="flex-1">
          <div className="text-sm font-semibold">Marco Almeida</div>
          <div className="text-xs text-muted-foreground">4,93 ★ · 2 841 viagens · Toyota Corolla</div>
        </div>
      </section>

      <nav className="mx-5 mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-secondary p-1 text-[11px] font-semibold uppercase tracking-wider">
        {(["inicio","ganhos","documentos","cadastro"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2 transition ${tab === t ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground"}`}
          >
            {t === "inicio" ? "Início" : t === "ganhos" ? "Ganhos" : t === "documentos" ? "Docs" : "Conta"}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="mt-5"
        >
          {tab === "inicio" && (
            <Inicio
              online={online}
              accepted={accepted}
              requests={requests}
              onAccept={accept}
              onRefuse={refuse}
              onFinish={() => setAccepted(null)}
              todayKz={todayKz}
            />
          )}
          {tab === "ganhos" && <Ganhos weekKz={weekKz} />}
          {tab === "documentos" && <Documentos />}
          {tab === "cadastro" && <Cadastro />}
        </motion.div>
      </AnimatePresence>

      <BottomNav />
    </main>
  );
}

/* ------ Início (corridas) ------ */

function Inicio({
  online, accepted, requests, onAccept, onRefuse, onFinish, todayKz,
}: {
  online: boolean;
  accepted: RideRequest | null;
  requests: RideRequest[];
  onAccept: (r: RideRequest) => void;
  onRefuse: (id: string) => void;
  onFinish: () => void;
  todayKz: number;
}) {
  return (
    <div className="px-5">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Hoje"   value={fmtKz(todayKz)} accent />
        <Stat label="Corridas hoje" value="9" />
      </div>

      {!online && (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-5 text-center text-sm text-muted-foreground">
          Está <span className="font-semibold text-foreground">offline</span>. Active para receber pedidos.
        </div>
      )}

      {online && accepted && (
        <div className="mt-5 rounded-3xl bg-accent p-5 text-accent-foreground">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Corrida aceite</div>
          <div className="mt-1 text-lg font-semibold">{accepted.rider}</div>
          <div className="mt-2 text-sm opacity-90">{accepted.from} → {accepted.to}</div>
          <div className="mt-1 text-sm font-semibold">{fmtKz(accepted.priceKz)} · {accepted.etaMin} min</div>
          <button onClick={onFinish} className="mt-4 w-full rounded-2xl bg-background py-3 text-sm font-semibold text-foreground">
            Concluir corrida
          </button>
        </div>
      )}

      {online && !accepted && (
        <div className="mt-5 space-y-3">
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
                <button onClick={() => onRefuse(r.id)} className="rounded-xl bg-secondary py-2.5 text-sm font-medium">
                  Recusar
                </button>
                <button onClick={() => onAccept(r)} className="rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground">
                  Aceitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Ganhos({ weekKz }: { weekKz: number }) {
  return (
    <div className="px-5">
      <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Esta semana</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums text-accent">{fmtKz(weekKz)}</div>
        <div className="mt-1 text-xs text-muted-foreground">A receber na segunda-feira</div>
      </div>

      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Por dia</div>
      <ul className="mt-2 space-y-2">
        {EARNINGS.map((e) => (
          <li key={e.id} className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
            <div>
              <div className="text-sm font-medium">{e.date}</div>
              <div className="text-xs text-muted-foreground">{e.trips} viagens</div>
            </div>
            <div className="text-sm font-semibold tabular-nums">{fmtKz(e.amountKz)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Documentos() {
  const docs = [
    { name: "Bilhete de identidade",  status: "ok"      },
    { name: "Carta de condução",      status: "ok"      },
    { name: "Livrete do veículo",     status: "pending" },
    { name: "Seguro automóvel",       status: "missing" },
  ];
  return (
    <div className="px-5 space-y-2">
      {docs.map((d) => (
        <div key={d.name} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          </div>
          <div className="flex-1 text-sm font-medium">{d.name}</div>
          {d.status === "ok"      && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Aprovado</span>}
          {d.status === "pending" && <span className="rounded-full bg-amber-500/15  px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">Em análise</span>}
          {d.status === "missing" && <button className="rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">Enviar</button>}
        </div>
      ))}
      <button className="mt-3 w-full rounded-2xl border border-dashed border-border bg-card py-4 text-sm font-medium text-muted-foreground">
        + Adicionar novo documento
      </button>
    </div>
  );
}

function Cadastro() {
  return (
    <form className="space-y-3 px-5">
      <Field label="Nome completo"        placeholder="Marco Almeida" />
      <Field label="Telefone"             placeholder="+244 9__ ___ ___" />
      <Field label="Email"                placeholder="marco@email.com" />
      <Field label="Cidade de operação"   placeholder="Luanda" />
      <Field label="Tipo de veículo"      placeholder="Carro · Moto" />
      <Field label="Modelo"               placeholder="Toyota Corolla 2019" />
      <Field label="Matrícula"            placeholder="LD-00-00-AA" />
      <button type="button" className="mt-4 w-full rounded-2xl bg-accent py-4 text-sm font-semibold text-accent-foreground">
        Guardar perfil
      </button>
    </form>
  );
}

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label className="block rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <input placeholder={placeholder} className="mt-1 w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground" />
    </label>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${accent ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
}
