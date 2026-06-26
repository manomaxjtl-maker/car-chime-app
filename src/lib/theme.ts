import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "ryde.theme";

function read(): Theme {
  if (typeof window === "undefined") return "dark";
  return (window.localStorage.getItem(KEY) as Theme) ?? "dark";
}

function apply(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", t === "light");
  root.classList.toggle("dark", t === "dark");
}

const listeners = new Set<(t: Theme) => void>();

export function setTheme(t: Theme) {
  window.localStorage.setItem(KEY, t);
  apply(t);
  listeners.forEach((l) => l(t));
}

export function useTheme() {
  const [theme, setLocal] = useState<Theme>(() => read());
  useEffect(() => {
    apply(theme);
    const l = (t: Theme) => setLocal(t);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return {
    theme,
    toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
    set: setTheme,
  };
}
