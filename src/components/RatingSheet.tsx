import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Driver } from "@/lib/ryde-data";

export function RatingSheet({
  driver,
  onClose,
}: {
  driver: Driver;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [closing, setClosing] = useState(false);

  function confirm() {
    setClosing(true);
    toast.success("Obrigado pela avaliação", { duration: 2000 });
    setTimeout(onClose, 300);
  }

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34, duration: 0.3 }}
            className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-8 ring-1 ring-border"
            style={{ boxShadow: "var(--shadow-sheet)" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex flex-col items-center">
              <img
                src={driver.photo}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
              />
              <div className="mt-3 text-sm font-semibold">{driver.name}</div>
              <div className="mt-1 text-[18px] font-medium">Como foi a sua corrida?</div>

              <div className="mt-5 flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = n <= rating;
                  return (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      aria-label={`${n} estrelas`}
                      className="p-1"
                    >
                      <motion.svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        animate={filled ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                        transition={{
                          duration: 0.2,
                          delay: filled ? (n - 1) * 0.05 : 0,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        fill={filled ? "#000" : "none"}
                        stroke={filled ? "#000" : "#ccc"}
                        strokeWidth={1.5}
                        strokeLinejoin="round"
                      >
                        <path d="m12 2 3 7 7 .6-5.3 4.7L18 22l-6-3.6L6 22l1.3-7.7L2 9.6 9 9z" />
                      </motion.svg>
                    </button>
                  );
                })}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Deixe um comentário"
                rows={2}
                className="mt-5 w-full resize-none rounded-2xl bg-secondary px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
              />

              <button
                onClick={confirm}
                disabled={rating === 0}
                className="mt-4 w-full rounded-2xl bg-foreground py-4 text-[15px] font-semibold text-background transition disabled:opacity-40"
              >
                Confirmar avaliação
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
