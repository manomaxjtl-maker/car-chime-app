import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { fmtKz, TRIP_HISTORY } from "@/lib/ryde-data";
import { PAYMENT_METHODS, usePaymentMethod, type PaymentMethod } from "@/lib/payments";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/passageiro/pagamentos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Pagamentos — Ryde" }] }),
  component: PagamentosPage,
});

function MethodIcon({ method }: { method: PaymentMethod }) {
  if (method.logo) {
    return <img src={method.logo} alt={method.label} className="h-full w-full rounded-lg object-cover" />;
  }
  if (method.icon === "cash") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
  );
}


function PagamentosPage() {
  const total = TRIP_HISTORY.reduce((s, t) => s + t.priceKz, 0);
  const { method, setMethod } = usePaymentMethod();
  const { theme, toggle } = useTheme();

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="px-5 pt-8"
      >
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Passageiro</div>
        <h1 className="mt-1 text-2xl font-semibold">Pagamentos</h1>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04 }}
        className="mx-5 mt-5 rounded-3xl bg-card p-5 ring-1 ring-border"
      >
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Gasto no mês</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums">{fmtKz(total)}</div>
        <div className="mt-1 text-xs text-muted-foreground">{TRIP_HISTORY.length} viagens</div>
      </motion.section>

      <div className="mt-6 px-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Métodos</div>
      <ul className="mt-2 space-y-2 px-5">
        <AnimatePresence initial={false}>
          {PAYMENT_METHODS.map((m, i) => {
            const active = m.id === method.id;
            return (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onClick={() => setMethod(m.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ${active ? "ring-foreground" : "ring-border"}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <MethodIcon kind={m.icon} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.hint}</div>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    {active ? (
                      <motion.span
                        key="active"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 24 }}
                        className="rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-background"
                      >
                        Padrão
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-full bg-secondary px-3 py-1 text-[10px] font-medium uppercase tracking-wider"
                      >
                        Usar
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className="mt-8 px-5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Aparência</div>
      <div className="mx-5 mt-2 flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Tema</div>
          <div className="text-xs text-muted-foreground">
            {theme === "dark" ? "Modo preto" : "Modo branco"}
          </div>
        </div>
        <button
          onClick={toggle}
          className="relative flex h-7 w-12 items-center rounded-full bg-secondary ring-1 ring-border"
          aria-label="Alternar tema"
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={`absolute h-5 w-5 rounded-full bg-foreground ${theme === "dark" ? "left-1" : "left-[26px]"}`}
          />
        </button>
      </div>

    </main>
  );
}
