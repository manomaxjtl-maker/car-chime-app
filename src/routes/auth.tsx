import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
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
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-6 pt-10 pb-8">
      <Link to="/" className="self-start text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        ← Voltar
      </Link>

      <div className="mt-10">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">Ryde</div>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">
          {mode === "login" ? "Bem-vindo de volta." : "Crie a sua conta."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login" ? "Entre para pedir a sua próxima viagem." : "Em segundos. Comece a viajar pela Luanda."}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/" });
        }}
        className="mt-8 space-y-3"
      >
        {mode === "signup" && (
          <Field label="Nome completo" placeholder="João Silva" />
        )}
        <Field label="Telefone" placeholder="+244 9__ ___ ___" />
        <Field label="Palavra-passe" type="password" placeholder="••••••••" />

        <button className="mt-4 w-full rounded-2xl bg-accent py-4 text-sm font-semibold text-accent-foreground transition active:scale-[0.99]">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
      </div>

      <button className="w-full rounded-2xl border border-border bg-card py-3.5 text-sm font-medium">
        Continuar com Google
      </button>

      <button
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

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <label className="block rounded-2xl bg-secondary px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}
