import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

type AnyPath = string;
type Item = { to: AnyPath; label: string; icon: ReactNode };

const ICONS = {
  home: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1Z"/></svg>,
  clock: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>,
  card: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>,
  user: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>,
  car: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14l-1.5-6a2 2 0 0 0-2-1.5h-7a2 2 0 0 0-2 1.5L5 17Z"/><circle cx="8" cy="17" r="1.3"/><circle cx="16" cy="17" r="1.3"/></svg>,
  cash: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>,
};

const PASSAGEIRO: Item[] = [
  { to: "/passageiro/home",       label: "Início",     icon: ICONS.home },
  { to: "/passageiro/historico",  label: "Viagens",    icon: ICONS.clock },
  { to: "/passageiro/pagamentos", label: "Pagamentos", icon: ICONS.card },
  { to: "/passageiro/perfil",     label: "Perfil",     icon: ICONS.user },
];

const MOTORISTA: Item[] = [
  { to: "/motorista/dashboard", label: "Painel",    icon: ICONS.car },
  { to: "/motorista/historico", label: "Corridas",  icon: ICONS.clock },
  { to: "/motorista/ganhos",    label: "Ganhos",    icon: ICONS.cash },
  { to: "/motorista/perfil",    label: "Perfil",    icon: ICONS.user },
];

export function BottomNav({ variant }: { variant: "passageiro" | "motorista" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = variant === "motorista" ? MOTORISTA : PASSAGEIRO;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-md justify-around border-t border-border bg-background/95 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur">
      {items.map((it) => {
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium uppercase tracking-wider transition ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {it.icon}
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
