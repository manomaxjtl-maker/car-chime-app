import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { fmtKz, TRIP_HISTORY } from "@/lib/ryde-data";

export const Route = createFileRoute("/passageiro/pagamentos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Pagamentos — Ryde" }] }),
  component: PagamentosPage,
});

const METHODS = [
  { id: "mcx",   label: "Multicaixa Express",  hint: "•••• 8821", active: true },
  { id: "visa",  label: "Visa",                hint: "•••• 4412", active: false },
  { id: "cash",  label: "Dinheiro",            hint: "Pagar no destino", active: false },
];

function PagamentosPage() {
  const total = TRIP_HISTORY.reduce((s, t) => s + t.priceKz, 0);
  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background pb-28">
      <header className="px-5 pt-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Passageiro</div>
        <h1 className="mt-1 text-2xl font-semibold">Pagamentos</h1>
      </header>

      <section className="mx-5 mt-5 rounded-3xl bg-card p-5 ring-1 ring-border">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Gasto no mês</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums">{fmtKz(total)}</div>
        <div className="mt-1 text-xs text-muted-foreground">{TRIP_HISTORY.length} viagens</div>
      </section>

      <div className="mt-6 px-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Métodos</div>
      <ul className="mt-2 space-y-2 px-5">
        {METHODS.map((m) => (
          <li key={m.id} className={`flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ${m.active ? "ring-foreground" : "ring-border"}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{m.label}</div>
              <div className="text-xs text-muted-foreground">{m.hint}</div>
            </div>
            {m.active ? (
              <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">Padrão</span>
            ) : (
              <button className="rounded-full bg-secondary px-3 py-1 text-[10px] font-medium uppercase tracking-wider">Usar</button>
            )}
          </li>
        ))}
      </ul>

      <button className="mx-5 mt-4 w-[calc(100%-2.5rem)] rounded-2xl border border-dashed border-border bg-card py-4 text-sm font-medium text-muted-foreground">
        + Adicionar método de pagamento
      </button>

      <BottomNav variant="passageiro" />
    </main>
  );
}
