import { Link, useRouterState } from "@tanstack/react-router";

const items = [
  { to: "/",          label: "Viajar",   icon: "M3 12h18M3 6h18M3 18h18" },
  { to: "/historico", label: "Viagens",  icon: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" },
  { to: "/motorista", label: "Motorista",icon: "M5 17h14l-1.5-6a2 2 0 0 0-2-1.5h-7a2 2 0 0 0-2 1.5L5 17Z M8 17h.01 M16 17h.01" },
  { to: "/perfil",    label: "Perfil",   icon: "M20 21a8 8 0 1 0-16 0 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-md justify-around border-t border-border bg-background/95 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur">
      {items.map((it) => {
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium uppercase tracking-wider transition ${
              active ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {it.icon.split(" M").map((d, i) => (
                <path key={i} d={i === 0 ? d : `M${d}`} />
              ))}
            </svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
