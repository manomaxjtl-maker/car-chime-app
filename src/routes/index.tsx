import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUser, homeFor } from "@/lib/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    const u = getUser();
    if (!u) throw redirect({ to: "/auth" });
    throw redirect({ to: homeFor(u.tipo_usuario) });
  },
  component: () => null,
});
