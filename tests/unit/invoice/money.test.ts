import { describe, expect, it } from "vitest";
import {
  applyRatePercent,
  fromMinorUnits,
  multiplyMinor,
  roundHalfUp,
  toMinorUnits,
} from "@/src/domain/invoice";

describe("toMinorUnits", () => {
  it("parses decimal strings into integer minor units", () => {
    expect(toMinorUnits("850.00")).toBe(85000);
    expect(toMinorUnits("0.19")).toBe(19);
    expect(toMinorUnits("1011.50")).toBe(101150);
    expect(toMinorUnits("1234")).toBe(123400);
  });

  it("accepts comma decimal separators", () => {
    expect(toMinorUnits("1011,50")).toBe(101150);
  });

  it("handles negatives", () => {
    expect(toMinorUnits("-10.25")).toBe(-1025);
  });

  it("rejects invalid input", () => {
    expect(() => toMinorUnits("abc")).toThrow();
    expect(() => toMinorUnits("1.234")).toThrow();
    expect(() => toMinorUnits("")).toThrow();
  });
});

describe("fromMinorUnits", () => {
  it("formats minor units as a decimal string", () => {
    expect(fromMinorUnits(85000)).toBe("850.00");
    expect(fromMinorUnits(19)).toBe("0.19");
    expect(fromMinorUnits(-1025)).toBe("-10.25");
    expect(fromMinorUnits(0)).toBe("0.00");
  });

  it("rejects non-integers", () => {
    expect(() => fromMinorUnits(1.5)).toThrow();
  });
});

describe("roundHalfUp", () => {
  it("rounds halves away from zero", () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(-0.5)).toBe(-1);
    expect(roundHalfUp(2.49)).toBe(2);
    expect(roundHalfUp(2.5)).toBe(3);
  });
});

describe("multiplyMinor", () => {
  it("multiplies minor units by a decimal quantity", () => {
    expect(multiplyMinor(8500, 10)).toBe(85000);
    expect(multiplyMinor(3333, 3)).toBe(9999);
  });
});

describe("applyRatePercent", () => {
  it("applies a percentage rate with half-up rounding", () => {
    expect(applyRatePercent(85000, 19)).toBe(16150);
    expect(applyRatePercent(85000, 7)).toBe(5950);
    expect(applyRatePercent(85000, 0)).toBe(0);
    expect(applyRatePercent(101, 19)).toBe(19); // 19.19 -> 19
  });
});
