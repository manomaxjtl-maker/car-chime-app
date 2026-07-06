import { useEffect, useState } from "react";

export type PaymentMethod = {
  id: string;
  label: string;
  hint: string;
  icon: "card" | "cash" | "paypay";
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "mcx",    label: "Multicaixa Express", hint: "•••• 8821",             icon: "card" },
  { id: "cash",   label: "Dinheiro em mão",    hint: "Pagar no destino",      icon: "cash" },
  { id: "paypay", label: "Pay Pay",            hint: "Carteira digital",      icon: "paypay" },
];

const KEY = "ryde.payment";
const listeners = new Set<(id: string) => void>();

function read(): string {
  if (typeof window === "undefined") return PAYMENT_METHODS[0].id;
  return window.localStorage.getItem(KEY) ?? PAYMENT_METHODS[0].id;
}

export function setPaymentMethod(id: string) {
  window.localStorage.setItem(KEY, id);
  listeners.forEach((l) => l(id));
}

export function usePaymentMethod() {
  const [id, setId] = useState<string>(() => read());
  useEffect(() => {
    setId(read());
    const l = (v: string) => setId(v);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  const method = PAYMENT_METHODS.find((m) => m.id === id) ?? PAYMENT_METHODS[0];
  return {
    method,
    setMethod: setPaymentMethod,
    cycle: () => {
      const idx = PAYMENT_METHODS.findIndex((m) => m.id === method.id);
      const next = PAYMENT_METHODS[(idx + 1) % PAYMENT_METHODS.length];
      setPaymentMethod(next.id);
    },
  };
}
