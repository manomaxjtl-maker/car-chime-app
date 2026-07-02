import { motion } from "framer-motion";
import { fmtKz } from "@/lib/ryde-data";

type Props = {
  originalPrice: number;
  discount: number;              // 0..20
  onChange: (d: number) => void;
};

export function PriceNegotiation({ originalPrice, discount, onChange }: Props) {
  const offer = Math.round(originalPrice * (1 - discount / 100));
  const pct = Math.min(20, Math.max(0, discount));
  const trackColor =
    pct < 10 ? "#22c55e" : pct < 18 ? "#f59e0b" : "#ef4444";
  const fillPct = (pct / 20) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="mt-3 rounded-2xl bg-secondary p-4 ring-1 ring-border"
    >
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold">Negociar preço</div>
        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          máx. −20%
        </span>
      </div>

      <div className="relative mt-4 h-2 rounded-full bg-background ring-1 ring-border">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-150"
          style={{ width: `${fillPct}%`, backgroundColor: trackColor }}
        />
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow
            [&::-webkit-slider-thumb]:-mt-1.5
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:bg-foreground"
          aria-label="Desconto"
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>0%</span><span>10%</span><span>20%</span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-background px-3 py-2.5 ring-1 ring-border">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Sua oferta {pct > 0 ? `(−${pct}%)` : ""}
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            {pct > 0 && (
              <span className="text-[11px] tabular-nums text-muted-foreground line-through">
                {fmtKz(originalPrice)}
              </span>
            )}
            <span className="text-lg font-semibold tabular-nums" style={{ color: pct > 0 ? trackColor : undefined }}>
              {fmtKz(offer)}
            </span>
          </div>
        </div>
        <div className="text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {pct === 0 ? "Preço estimado" : "Aguarda motorista"}
        </div>
      </div>
    </motion.div>
  );
}
