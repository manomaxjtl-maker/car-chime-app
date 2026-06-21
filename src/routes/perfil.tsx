import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { fmtKz, TRIP_HISTORY } from "@/lib/ryde-data";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Ryde" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background pb-28">
      <header className="px-5 pt-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">Passageiro</div>
        <h1 className="mt-1 text-2xl font-semibold">Olá, Helena</h1>
      </header>

      <section className="mx-5 mt-5 flex items-center gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
        <img src="https://i.pravatar.cc/120?img=47" alt="" className="h-14 w-14 rounded-full object-cover" />
        <div className="flex-1">
          <div className="text-sm font-semibold">Helena Cabral</div>
          <div className="text-xs text-muted-foreground">+244 923 401 882 · 4,98 ★</div>
        </div>
        <Link to="/auth" className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider">
          Sair
        </Link>
      </section>

      <Section title="Conta">
        <Row icon="user" label="Cadastro / Login" to="/auth" />
        <Row icon="pin"  label="Endereços salvos" />
        <Row icon="card" label="Métodos de pagamento" hint="Multicaixa Express" />
      </Section>

      <Section title="Atividade">
        <Row icon="route" label="Solicitar nova corrida" to="/" />
        <Row icon="clock" label="Histórico de viagens"   to="/historico" />
        <Row icon="map"   label="Acompanhar motorista"   to="/" />
      </Section>

      <Section title="Últimas viagens">
        <div className="mx-5 space-y-2">
          {TRIP_HISTORY.slice(0, 2).map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
              <div className="h-10 w-10 rounded-xl bg-secondary" />
              <div className="flex-1 text-sm">
                <div className="font-medium">{t.from} → {t.to}</div>
                <div className="text-xs text-muted-foreground">{t.date} · {t.driver}</div>
              </div>
              <div className="text-sm font-semibold tabular-nums">{fmtKz(t.priceKz)}</div>
            </div>
          ))}
        </div>
      </Section>

      <BottomNav />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="px-5 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Row({ icon, label, hint, to }: { icon: string; label: string; hint?: string; to?: string }) {
  const inner = (
    <div className="mx-5 flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border transition active:scale-[0.99]">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-accent">
        <Icon name={icon} />
      </span>
      <div className="flex-1 text-sm font-medium">{label}</div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M9 18l6-6-6-6"/></svg>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : <button className="w-full text-left">{inner}</button>;
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    user: "M20 21a8 8 0 1 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    pin:  "M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z",
    card: "M2 6h20v12H2zM2 10h20",
    route:"M5 19h14M5 5h14M9 5v14M15 5v14",
    clock:"M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2",
    map:  "M9 4 3 7v13l6-3 6 3 6-3V4l-6 3-6-3z",
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
