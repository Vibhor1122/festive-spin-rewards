export const WHEEL_SEGMENTS = [
  { id: "p10", label: "10% OFF" },
  { id: "p20", label: "20% OFF" },
  { id: "p30", label: "30% OFF" },
  { id: "p50", label: "50% OFF" },
  { id: "p80", label: "80% OFF" },
  { id: "p100", label: "100% OFF" },
  { id: "none", label: "Better Luck Next Time" },
] as const;

export const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;

/** Rotation (deg, clockwise) that puts the given prize's segment centre under the top pointer. */
export function rotationForPrize(prizeId: string, currentRotation = 0, fullTurns = 6): number {
  const index = WHEEL_SEGMENTS.findIndex((s) => s.id === prizeId);
  if (index < 0) throw new Error(`Unknown prize ${prizeId}`);
  const centre = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const target = (360 - centre) % 360;
  const base = currentRotation - (currentRotation % 360);
  return base + fullTurns * 360 + target;
}

/** Which segment sits under the top pointer for a given rotation. */
export function segmentAtPointer(rotation: number): string {
  const a = ((360 - (rotation % 360)) % 360 + 360) % 360;
  return WHEEL_SEGMENTS[Math.floor(a / SEGMENT_ANGLE)].id;
}

export function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
