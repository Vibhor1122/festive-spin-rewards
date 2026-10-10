import { useEffect, useState } from "react";

export function Diya({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <radialGradient id="flame" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="var(--ivory)" />
          <stop offset="45%" stopColor="var(--gold-soft)" />
          <stop offset="100%" stopColor="var(--royal)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="clay" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--royal)" />
        </linearGradient>
      </defs>
      <g className="animate-flicker">
        <ellipse cx="32" cy="24" rx="9" ry="16" fill="url(#flame)" />
        <path d="M32 10 C36 18 37 24 32 30 C27 24 28 18 32 10Z" fill="var(--gold-soft)" />
      </g>
      <path d="M6 36 Q32 62 58 36 Q50 40 32 40 Q14 40 6 36Z" fill="url(#clay)" />
      <path d="M10 37 Q32 44 54 37" stroke="var(--gold-soft)" strokeWidth="1" fill="none" opacity="0.7" />
    </svg>
  );
}

export function Lantern({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div className={`animate-sway ${className}`} style={{ animationDelay: `${delay}s` }} aria-hidden>
      <div className="mx-auto h-16 w-px bg-gold/60" />
      <svg viewBox="0 0 40 70" className="w-full drop-shadow-[0_0_14px_var(--gold)]">
        <rect x="14" y="0" width="12" height="5" rx="1" fill="var(--gold)" />
        <path d="M8 6 H32 L36 18 Q38 38 32 56 H8 Q2 38 4 18Z" fill="var(--royal)" stroke="var(--gold)" strokeWidth="1.5" />
        <path d="M20 6 V56 M12 8 Q6 32 12 56 M28 8 Q34 32 28 56" stroke="var(--gold)" strokeWidth="0.8" fill="none" />
        <ellipse cx="20" cy="32" rx="8" ry="14" fill="var(--gold-soft)" opacity="0.35" />
        <rect x="14" y="56" width="12" height="4" fill="var(--gold)" />
        <path d="M17 60 L20 70 L23 60Z" fill="var(--gold)" />
      </svg>
    </div>
  );
}

export function Sparkles({ count = 18 }: { count?: number }) {
  const [dots, setDots] = useState<{ left: number; size: number; dur: number; delay: number }[]>([]);
  useEffect(() => {
    setDots(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        dur: 9 + Math.random() * 10,
        delay: -Math.random() * 15,
      })),
    );
  }, [count]);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className="animate-float-up absolute bottom-0 rounded-full bg-gold shadow-glow"
          style={{ left: `${d.left}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
        />
      ))}
    </div>
  );
}

export function Confetti() {
  const [pieces, setPieces] = useState<{ left: number; dur: number; delay: number; color: string; w: number }[]>([]);
  useEffect(() => {
    const colors = ["var(--gold)", "var(--gold-soft)", "var(--royal)", "var(--ivory)"];
    setPieces(
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        dur: 2.5 + Math.random() * 2.5,
        delay: Math.random() * 0.8,
        color: colors[i % colors.length],
        w: 6 + Math.random() * 6,
      })),
    );
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 rounded-sm"
          style={{ left: `${p.left}%`, width: p.w, height: p.w * 0.45, background: p.color, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
}
