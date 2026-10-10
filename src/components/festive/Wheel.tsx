import { WHEEL_SEGMENTS, SEGMENT_ANGLE } from "@/lib/wheel";

const FILLS = ["var(--royal)", "var(--gold)", "var(--maroon)", "var(--ivory)"];
const TEXT = ["var(--ivory)", "var(--maroon)", "var(--gold-soft)", "var(--royal)"];

function arc(i: number) {
  const r = 100;
  const a0 = ((i * SEGMENT_ANGLE - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * SEGMENT_ANGLE - 90) * Math.PI) / 180;
  return `M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;
}

export function Wheel({ rotation, spinning }: { rotation: number; spinning: boolean }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,440px)]">
      {/* pointer */}
      <div className="absolute left-1/2 top-[-6px] z-20 -translate-x-1/2 drop-shadow-[0_0_10px_var(--gold)]">
        <svg width="40" height="52" viewBox="0 0 40 52"><path d="M20 52 L2 10 Q20 -6 38 10Z" fill="var(--gold)" stroke="var(--ivory)" strokeWidth="2" /><circle cx="20" cy="16" r="5" fill="var(--royal)" /></svg>
      </div>
      <div className="absolute inset-0 rounded-full bg-gold-gradient p-[3.5%] shadow-glow">
        <div className="relative h-full w-full rounded-full bg-maroon p-[2%]">
          {/* bulbs */}
          {Array.from({ length: 21 }).map((_, i) => {
            const a = (i / 21) * 2 * Math.PI;
            return (
              <span key={i} className="animate-flicker absolute h-[2.2%] w-[2.2%] rounded-full bg-gold-soft shadow-glow"
                style={{ left: `${50 + 49 * Math.cos(a) - 1.1}%`, top: `${50 + 49 * Math.sin(a) - 1.1}%`, animationDelay: `${(i % 3) * 0.4}s` }} />
            );
          })}
          <svg viewBox="-100 -100 200 200" className="h-full w-full"
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 6.2s cubic-bezier(0.12, 0.6, 0.08, 1)" : "none" }}>
            {WHEEL_SEGMENTS.map((s, i) => {
              const mid = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
              const words = s.id === "none" ? ["Better Luck", "Next Time"] : [s.label.split(" ")[0], "OFF"];
              return (
                <g key={s.id}>
                  <path d={arc(i)} fill={FILLS[i % 4]} stroke="var(--gold)" strokeWidth="0.8" />
                  <g transform={`rotate(${mid}) translate(0 -64)`}>
                    {words.map((w, j) => (
                      <text key={j} y={j * (s.id === "none" ? 9 : 13)} textAnchor="middle" fill={TEXT[i % 4]}
                        fontFamily="Cinzel, serif" fontWeight={700} fontSize={s.id === "none" ? 7.5 : j === 0 ? 15 : 9}>
                        {w}
                      </text>
                    ))}
                  </g>
                </g>
              );
            })}
            <circle r="16" fill="var(--maroon)" stroke="var(--gold)" strokeWidth="3" />
            <text y="4" textAnchor="middle" fill="var(--gold)" fontFamily="Cinzel, serif" fontSize="11" fontWeight={700}>A</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
