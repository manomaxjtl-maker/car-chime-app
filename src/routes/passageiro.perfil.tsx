import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { clearUser, getUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";

export const Route = createFileRoute("/passageiro/perfil")({
  ssr: false,
  head: () => ({ meta: [{ title: "Perfil — Ryde" }] }),
  component: PerfilPage,
});

type MenuItem = {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  badge?: string;
  to?: "/auth" | "/passageiro/home" | "/passageiro/historico" | "/passageiro/pagamentos";
};

const MENU: MenuItem[] = [
  { key: "pay",   label: "Pagamento",  subtitle: "Saldo · 3 250 Kz",             icon: "card",   to: "/passageiro/pagamentos" },
  { key: "hist",  label: "Histórico",  subtitle: "Ver todas as corridas",         icon: "clock",  to: "/passageiro/historico" },
  { key: "sec",   label: "Segurança",  subtitle: "Contactos e SOS",               icon: "shield", badge: "Novo" },
  { key: "addr",  label: "Endereços",  subtitle: "Casa e trabalho",               icon: "pin" },
  { key: "promo", label: "Promoções",  subtitle: "Códigos e descontos",           icon: "gift" },
  { key: "set",   label: "Definições", subtitle: "Notificações e idioma",         icon: "gear" },
];

function PerfilPage() {
  const navigate = useNavigate();
  const [user, setU] = useState<SessionUser | null>(null);
  useEffect(() => { setU(getUser()); }, []);

  function logout() {
    clearUser();
    navigate({ to: "/auth" });
  }

  const name = user?.name ?? "Helena Cabral";
  const phone = user?.phone ?? "+244 923 401 882";
  const initial = name.trim().charAt(0).toUpperCase();

  const stats = [
    { value: "128",   label: "Corridas" },
    { value: "4,98", label: "Avaliação" },
    { value: "312 km", label: "Distância" },
  ];

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-white pb-28">
      {/* Hero */}
      <section
        className="relative flex flex-col items-center bg-black px-7 pt-10 pb-7 text-white"
        style={{ minHeight: "45vh" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-black"
          style={{ border: "3px solid #333" }}
        >
          <span className="text-[26px] font-bold leading-none">{initial}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 text-center"
        >
          <div className="text-[16px] font-bold">{name}</div>
          <div className="mt-0.5 text-[11px]" style={{ color: "#888" }}>{phone}</div>
          <div className="mt-2 flex justify-center gap-0.5 text-white">
            {[0,1,2,3,4].map((i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="m12 2 3 7 7 .6-5.3 4.7L18 22l-6-3.6L6 22l1.3-7.7L2 9.6 9 9z"/>
              </svg>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 grid w-full grid-cols-3 gap-2 rounded-[10px] bg-[#111] p-3"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[15px] font-bold text-white">{s.value}</div>
              <div className="mt-0.5 text-[9px] uppercase tracking-wider" style={{ color: "#666" }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Menu */}
      <section className="bg-white">
        <ul>
          {MENU.map((m, i) => (
            <motion.li
              key={m.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ borderBottom: "1px solid #f5f5f5" }}
            >
              <MenuRow item={m} />
            </motion.li>
          ))}
        </ul>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 + MENU.length * 0.05 }}
          onClick={logout}
          className="block w-[calc(100%-32px)] mx-4 mt-4 rounded-[12px] py-3 text-[13px]"
          style={{ border: "1.5px solid #f0f0f0", color: "#888" }}
        >
          Terminar sessão
        </motion.button>
      </section>

      <BottomNav variant="passageiro" />
    </main>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
        style={{ background: "#f5f5f5", color: "#555" }}
      >
        <MenuIcon name={item.icon} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-[#1a1a1a]">{item.label}</div>
        <div className="mt-0.5 text-[10px]" style={{ color: "#999" }}>{item.subtitle}</div>
      </div>
      {item.badge ? (
        <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
          {item.badge}
        </span>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      )}
    </div>
  );
  return item.to ? <Link to={item.to} className="block">{inner}</Link> : <button className="block w-full text-left">{inner}</button>;
}

function MenuIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    card:   "M2 6h20v12H2zM2 10h20",
    clock:  "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2",
    shield: "M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3z",
    pin:    "M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12ZM12 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
    gift:   "M3 12h18v9H3zM3 8h18v4H3zM12 8v13M8 8a2.5 2.5 0 0 1 0-5c2 0 4 5 4 5s2-5 4-5a2.5 2.5 0 0 1 0 5",
    gear:   "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || paths.pin} />
    </svg>
  );
}
