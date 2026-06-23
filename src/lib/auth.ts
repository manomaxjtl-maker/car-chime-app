export type UserType = "passageiro" | "motorista";

export type SessionUser = {
  name: string;
  phone: string;
  tipo_usuario: UserType;
};

const KEY = "ryde.user";

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setUser(u: SessionUser) {
  window.localStorage.setItem(KEY, JSON.stringify(u));
}

export function clearUser() {
  window.localStorage.removeItem(KEY);
}

export function homeFor(type: UserType): "/passageiro/home" | "/motorista/dashboard" {
  return type === "motorista" ? "/motorista/dashboard" : "/passageiro/home";
}
