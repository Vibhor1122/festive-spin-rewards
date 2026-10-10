import { describe, it, expect } from "vitest";
import { rotationForPrize, segmentAtPointer, WHEEL_SEGMENTS, normalizeIndianPhone } from "./wheel";

describe("wheel landing", () => {
  it("lands on every backend-chosen prize", () => {
    for (const s of WHEEL_SEGMENTS) {
      expect(segmentAtPointer(rotationForPrize(s.id, 1234))).toBe(s.id);
    }
  });
  it("always spins forward at least 6 full turns", () => {
    expect(rotationForPrize("p20", 500)).toBeGreaterThan(500 + 5 * 360);
  });
});

describe("indian phone", () => {
  it("accepts 10-digit and +91 numbers", () => {
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianPhone("9876543210")).toBe("9876543210");
  });
  it("rejects invalid numbers", () => {
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("1234567890")).toBeNull();
  });
});
