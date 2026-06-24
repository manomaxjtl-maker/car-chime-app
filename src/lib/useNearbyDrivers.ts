import { useEffect, useState } from "react";
import type { VehicleType } from "@/lib/ryde-data";

export type NearbyDriver = {
  id: string;
  name: string;
  initials: string;
  type: VehicleType;
  rating: number;
  online: boolean;
  /** percentage position on map canvas (0-100) */
  x: number;
  y: number;
  etaMin: number;
  distanceKm: number;
};

const SEED: NearbyDriver[] = [
  { id: "n1", name: "Marco A.",   initials: "MA", type: "car",  rating: 4.93, online: true,  x: 32, y: 55, etaMin: 3, distanceKm: 0.8 },
  { id: "n2", name: "Aida P.",    initials: "AP", type: "car",  rating: 4.88, online: true,  x: 64, y: 42, etaMin: 5, distanceKm: 1.4 },
  { id: "n3", name: "João M.",    initials: "JM", type: "car",  rating: 4.81, online: false, x: 28, y: 70, etaMin: 8, distanceKm: 2.6 },
  { id: "n4", name: "Diego S.",   initials: "DS", type: "moto", rating: 4.97, online: true,  x: 52, y: 60, etaMin: 2, distanceKm: 0.5 },
  { id: "n5", name: "Helena C.",  initials: "HC", type: "moto", rating: 4.90, online: true,  x: 70, y: 30, etaMin: 4, distanceKm: 1.1 },
  { id: "n6", name: "Paulo M.",   initials: "PM", type: "moto", rating: 4.72, online: false, x: 40, y: 35, etaMin: 6, distanceKm: 2.0 },
  { id: "n7", name: "Beatriz N.", initials: "BN", type: "car",  rating: 5.00, online: true,  x: 58, y: 72, etaMin: 6, distanceKm: 1.8 },
];

function jitter(v: number, amount: number, min: number, max: number) {
  const next = v + (Math.random() - 0.5) * amount;
  return Math.max(min, Math.min(max, next));
}

/** Simulates real-time GPS pings + online/offline toggles for nearby drivers. */
export function useNearbyDrivers(intervalMs = 2000) {
  const [drivers, setDrivers] = useState<NearbyDriver[]>(SEED);

  useEffect(() => {
    const id = setInterval(() => {
      setDrivers((prev) =>
        prev.map((d) => {
          const flip = Math.random() < 0.06; // small chance of toggling status
          const online = flip ? !d.online : d.online;
          if (!online) return { ...d, online };
          const x = jitter(d.x, 4, 8, 92);
          const y = jitter(d.y, 4, 12, 88);
          const distanceKm = Math.max(0.3, +(d.distanceKm + (Math.random() - 0.5) * 0.4).toFixed(1));
          const etaMin = Math.max(1, Math.round(distanceKm * 2.5));
          return { ...d, online, x, y, distanceKm, etaMin };
        }),
      );
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return drivers;
}
