import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/passageiro")({
  ssr: false,
  beforeLoad: () => {
    const u = getUser();
    if (!u) throw redirect({ to: "/auth" });
    if (u.tipo_usuario !== "passageiro") throw redirect({ to: "/motorista/dashboard" });
  },
  component: () => <Outlet />,
});
