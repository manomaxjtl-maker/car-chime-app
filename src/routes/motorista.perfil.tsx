import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { clearUser, getUser, type SessionUser } from "@/lib/auth";

export const Route = createFileRoute("/motorista/perfil")({
  ssr: false,
  head: () => ({ meta: [{ title: "Perfil — Motorista Ryde" }] }),
  component: PerfilMotorista,
});

type Tab = "perfil" | "documentos" | "cadastro";

function PerfilMotorista() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("perfil");
  const [user, setU] = useState<SessionUser | null>(null);
  useEffect(() => { setU(getUser()); }, []);

  function logout() {
    clearUser();
    navigate({ to: "/auth" });
  }

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-md bg-background pb-28">
      <header className="px-5 pt-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Motorista</div>
        <h1 className="mt-1 text-2xl font-semibold">Perfil</h1>
      </header>

      <section className="mx-5 mt-5 flex items-center gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
        <img src="https://i.pravatar.cc/200?img=12" alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-border" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{user?.name ?? "Marco Almeida"}</div>
          <div className="text-xs text-muted-foreground">4,93 ★ · 2 841 viagens · Toyota Corolla</div>
        </div>
        <button onClick={logout} className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider">
          Sair
        </button>
      </section>

      <nav className="mx-5 mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-secondary p-1 text-[11px] font-semibold uppercase tracking-wider">
        {(["perfil","documentos","cadastro"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2 transition ${tab === t ? "bg-background text-foreground ring-1 ring-border" : "text-muted-foreground"}`}
          >
            {t === "perfil" ? "Perfil" : t === "documentos" ? "Docs" : "Cadastro"}
          </button>
        ))}
      </nav>

      <div className="mt-5">
        {tab === "perfil" && <Info user={user} />}
        {tab === "documentos" && <Documentos />}
        {tab === "cadastro" && <Cadastro />}
      </div>

      <BottomNav variant="motorista" />
    </main>
  );
}

function Info({ user }: { user: SessionUser | null }) {
  return (
    <div className="px-5 space-y-2">
      <Row label="Nome"     value={user?.name ?? "Marco Almeida"} />
      <Row label="Telefone" value={user?.phone ?? "+244 923 110 552"} />
      <Row label="Cidade"   value="Luanda" />
      <Row label="Veículo"  value="Toyota Corolla 2019 · LD-42-18-AB" />
      <Row label="Tipo"     value="Carro" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function Documentos() {
  const docs = [
    { name: "Bilhete de identidade",  status: "ok" as const },
    { name: "Carta de condução",      status: "ok" as const },
    { name: "Livrete do veículo",     status: "pending" as const },
    { name: "Seguro automóvel",       status: "missing" as const },
  ];
  return (
    <div className="px-5 space-y-2">
      {docs.map((d) => (
        <div key={d.name} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          </div>
          <div className="flex-1 text-sm font-medium">{d.name}</div>
          {d.status === "ok"      && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Aprovado</span>}
          {d.status === "pending" && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">Em análise</span>}
          {d.status === "missing" && <button className="rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">Enviar</button>}
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
      <Field label="Nome completo"      placeholder="Marco Almeida" />
      <Field label="Telefone"           placeholder="+244 9__ ___ ___" />
      <Field label="Email"              placeholder="marco@email.com" />
      <Field label="Cidade de operação" placeholder="Luanda" />
      <Field label="Tipo de veículo"    placeholder="Carro · Moto" />
      <Field label="Modelo"             placeholder="Toyota Corolla 2019" />
      <Field label="Matrícula"          placeholder="LD-00-00-AA" />
      <button type="button" className="mt-4 w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background">
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
