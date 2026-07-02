import { useEffect } from "react";
import { motion } from "framer-motion";

export function DriverArrivedNotice({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    // Vibrate
    try { navigator.vibrate?.([200, 100, 200]); } catch { /* noop */ }

    // Short beep via Web Audio API
    try {
      const AudioCtx =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.24);
        setTimeout(() => ctx.close().catch(() => {}), 400);
      }
    } catch { /* noop */ }

    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1],
        opacity: { duration: 0.3 },
      }}
      onClick={onClose}
      className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black px-6 text-center text-white"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14l-1.5-6a2 2 0 0 0-2-1.5h-7a2 2 0 0 0-2 1.5L5 17Z" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      </div>
      <div className="mt-5 text-[20px] font-bold">O seu motorista chegou</div>
      <div className="mt-2 text-[14px] text-white/60">Dirija-se ao local de embarque</div>
    </motion.div>
  );
}
