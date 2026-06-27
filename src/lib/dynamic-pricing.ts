import { useMemo } from "react";

export type PricingFactor = {
  id: "rain" | "peak" | "holiday" | "demand";
  label: string;
  description: string;
  surge: number; // 0.20 = +20%
  icon: "rain" | "clock" | "calendar" | "fire";
};

const HOLIDAYS_MMDD = new Set([
  "01-01", "02-04", "03-08", "04-04", "05-01",
  "09-17", "11-02", "11-11", "12-25",
]);

function isPeakHour(d: Date) {
  const h = d.getHours();
  return (h >= 7 && h < 9) || (h >= 17 && h < 19);
}

function isHoliday(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return HOLIDAYS_MMDD.has(`${mm}-${dd}`);
}

// Deterministic per-session simulation seeded by a key (e.g. destination).
function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export type PricingResult = {
  factors: PricingFactor[];
  multiplier: number;          // e.g. 1.30
  surgePct: number;            // e.g. 30
  basePrice: number;
  finalPrice: number;
};

export function computeDynamicPrice(basePrice: number, key = "default"): PricingResult {
  const now = new Date();
  const factors: PricingFactor[] = [];

  // Simulated environmental signals
  const rainSeed = seeded("rain:" + key);
  const demandSeed = seeded("demand:" + key);
  const simulatedDemand = Math.round(4 + demandSeed * 14); // 4..18 pedidos

  if (rainSeed > 0.55) {
    factors.push({
      id: "rain",
      label: "Chuva detectada",
      description: "Condições meteorológicas adversas",
      surge: 0.20,
      icon: "rain",
    });
  }

  if (isPeakHour(now)) {
    factors.push({
      id: "peak",
      label: "Horário de pico",
      description: "Maior procura entre 07h–09h e 17h–19h",
      surge: 0.10,
      icon: "clock",
    });
  }

  if (isHoliday(now)) {
    factors.push({
      id: "holiday",
      label: "Feriado",
      description: "Tarifa de feriado aplicada",
      surge: 0.50,
      icon: "calendar",
    });
  }

  if (simulatedDemand > 10) {
    factors.push({
      id: "demand",
      label: "Alta demanda",
      description: `${simulatedDemand} pedidos simultâneos na sua zona`,
      surge: 0.25,
      icon: "fire",
    });
  }

  const surge = factors.reduce((s, f) => s + f.surge, 0);
  const multiplier = 1 + surge;
  const finalPrice = Math.round(basePrice * multiplier);

  return {
    factors,
    multiplier,
    surgePct: Math.round(surge * 100),
    basePrice,
    finalPrice,
  };
}

export function useDynamicPrice(basePrice: number, key = "default") {
  return useMemo(() => computeDynamicPrice(basePrice, key), [basePrice, key]);
}
