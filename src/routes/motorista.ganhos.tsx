import { createFileRoute } from "@tanstack/react-router";
import { EARNINGS, fmtKz } from "@/lib/ryde-data";

export const Route = createFileRoute("/motorista/ganhos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Ganhos — Motorista Ryde" }] }),
  component: GanhosPage,
});

function GanhosPage() {
  const dia = EARNINGS[0].amountKz;
  const semana = EARNINGS.reduce((s, e) => s + e.amountKz, 0);
  const mes = Math.round(semana * 4.2);

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background pb-28">
      <header className="px-5 pt-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Motorista</div>
        <h1 className="mt-1 text-2xl font-semibold">Ganhos</h1>
      </header>

      <section className="mx-5 mt-5 rounded-3xl bg-card p-5 ring-1 ring-border">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Esta semana</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums">{fmtKz(semana)}</div>
        <div className="mt-1 text-xs text-muted-foreground">A receber na segunda-feira</div>
      </section>

      <section className="mx-5 mt-3 grid grid-cols-2 gap-3">
        <Stat label="Hoje" value={fmtKz(dia)} />
        <Stat label="Mês"  value={fmtKz(mes)} />
      </section>

      <div className="mt-6 px-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Por dia</div>
      <ul className="mt-2 space-y-2 px-5">
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
