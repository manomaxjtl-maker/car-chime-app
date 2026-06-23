import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/motorista")({
  ssr: false,
  beforeLoad: () => {
    const u = getUser();
    if (!u) throw redirect({ to: "/auth" });
    if (u.tipo_usuario !== "motorista") throw redirect({ to: "/passageiro/home" });
  },
  component: () => <Outlet />,
});
