export type TrustMedal = "Bronze" | "Prata" | "Ouro" | "Diamante";

export type TrustResult = {
  score: number;
  medal: TrustMedal;
  color: string;
  bg: string;
  ring: string;
};

export function computeTrust(input: {
  rating: number;        // 0..5
  trips: number;         // total completed trips
  joinedMonths?: number; // months on platform
  cancelRate?: number;   // 0..1 (e.g. 0.05 = 5%)
}): TrustResult {
  const joinedMonths = input.joinedMonths ?? 18;
  const cancelRate = input.cancelRate ?? 0.04;

  const ratingPts = (Math.max(0, Math.min(5, input.rating)) / 5) * 40;
  const tripsPts = Math.min(1, input.trips / 2000) * 30;
  const tenurePts = Math.min(1, joinedMonths / 24) * 20;
  const cancelPenalty = Math.min(10, cancelRate * 100);

  const raw = ratingPts + tripsPts + tenurePts - cancelPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  let medal: TrustMedal = "Bronze";
  if (score > 90) medal = "Diamante";
  else if (score > 70) medal = "Ouro";
  else if (score > 40) medal = "Prata";

  const palette: Record<TrustMedal, { color: string; bg: string; ring: string }> = {
    Bronze:   { color: "#7a4a1f", bg: "#fbeadd", ring: "#e7c6a3" },
    Prata:    { color: "#4a4a4a", bg: "#eef0f2", ring: "#cdd2d8" },
    Ouro:     { color: "#8a6a10", bg: "#fff3c8", ring: "#e7c95a" },
    Diamante: { color: "#0c5a7a", bg: "#d8f1fb", ring: "#7fc8e3" },
  };

  return { score, medal, ...palette[medal] };
}
