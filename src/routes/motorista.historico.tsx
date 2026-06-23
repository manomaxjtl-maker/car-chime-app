import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { fmtKz, TRIP_HISTORY } from "@/lib/ryde-data";

export const Route = createFileRoute("/motorista/historico")({
  ssr: false,
  head: () => ({ meta: [{ title: "Corridas — Motorista" }] }),
  component: HistoricoMotorista,
});

function HistoricoMotorista() {
  const total = TRIP_HISTORY.reduce((s, t) => s + t.priceKz, 0);
  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background pb-28">
      <header className="px-5 pt-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Motorista</div>
        <h1 className="mt-1 text-2xl font-semibold">Corridas concluídas</h1>
      </header>

      <section className="mx-5 mt-5 grid grid-cols-2 gap-3">
        <Stat label="Faturado" value={fmtKz(total)} />
        <Stat label="Corridas" value={String(TRIP_HISTORY.length)} />
      </section>

      <ul className="mt-6 space-y-2 px-5">
        {TRIP_HISTORY.map((t) => (
          <li key={t.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>{t.date}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5">{t.type === "moto" ? "Moto" : "Carro"}</span>
            </div>
            <div className="mt-2 flex items-start gap-3">
              <div className="mt-1 flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-foreground" />
                <div className="my-1 h-5 w-px bg-border" />
                <div className="h-2 w-2 rounded-sm bg-foreground" />
              </div>
              <div className="flex-1 text-sm">
                <div className="font-medium">{t.from}</div>
                <div className="font-medium">{t.to}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">{fmtKz(t.priceKz)}</div>
                <div className="text-[11px] text-muted-foreground">Passageiro · {t.rating}★</div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <BottomNav variant="motorista" />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
