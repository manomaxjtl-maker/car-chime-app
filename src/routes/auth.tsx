import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { homeFor, setUser, type UserType } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Ryde" },
      { name: "description", content: "Crie a sua conta ou entre no Ryde." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [tipo, setTipo] = useState<UserType>("passageiro");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setUser({
      name: name || (tipo === "motorista" ? "Marco Almeida" : "Helena Cabral"),
      phone: phone || "+244 923 000 000",
      tipo_usuario: tipo,
    });
    navigate({ to: homeFor(tipo) });
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pt-10 pb-8">
      <Link to="/" className="self-start text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        ← Voltar
      </Link>

      <div className="mt-10">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-foreground">Ryde</div>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">
          {mode === "login" ? "Bem-vindo de volta." : "Crie a sua conta."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha o seu perfil e continue.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {(["passageiro", "motorista"] as UserType[]).map((t) => {
          const active = tipo === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`rounded-xl py-2.5 text-sm font-medium capitalize transition ${active ? "bg-background ring-1 ring-border text-foreground" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        {mode === "signup" && (
          <Field label="Nome completo" value={name} onChange={setName} placeholder={tipo === "motorista" ? "Marco Almeida" : "Helena Cabral"} />
        )}
        <Field label="Telefone" value={phone} onChange={setPhone} placeholder="+244 9__ ___ ___" />
        <Field label="Palavra-passe" type="password" placeholder="••••••••" />

        <button className="mt-4 w-full rounded-2xl bg-foreground py-4 text-sm font-semibold text-background transition active:scale-[0.99]">
          {mode === "login" ? "Entrar como " : "Criar conta como "}{tipo}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
      </div>

      <button className="w-full rounded-2xl border border-border bg-card py-3.5 text-sm font-medium">
        Continuar com Google
      </button>

      <button
        type="button"
        onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
        className="mt-auto pt-8 text-center text-sm text-muted-foreground"
      >
        {mode === "login" ? (
          <>Sem conta? <span className="font-semibold text-foreground">Cadastrar</span></>
        ) : (
          <>Já tem conta? <span className="font-semibold text-foreground">Entrar</span></>
        )}
      </button>
    </main>
  );
}

function Field({
  label, type = "text", placeholder, value, onChange,
}: { label: string; type?: string; placeholder?: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <label className="block rounded-2xl bg-secondary px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="mt-1 w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}
