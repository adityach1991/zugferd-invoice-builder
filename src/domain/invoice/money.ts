/**
 * Money is represented as integer minor units (e.g. cents for EUR).
 * JavaScript floats are never used for monetary arithmetic (AGENTS.md 2.3).
 */

export type MinorUnits = number; // integer, e.g. 85000 = 850.00 EUR

/** Parse a decimal string like "850.00" or "1011,50" into minor units. */
export function toMinorUnits(decimal: string): MinorUnits {
  const normalized = decimal.trim().replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`Invalid decimal amount: ${decimal}`);
  }
  const negative = normalized.startsWith("-");
  const [intPart, fracPart = ""] = normalized.replace("-", "").split(".");
  const frac = (fracPart + "00").slice(0, 2);
  const minor = Number(intPart) * 100 + Number(frac);
  return negative ? -minor : minor;
}

/** Format minor units as a decimal string with two fraction digits. */
export function fromMinorUnits(minor: MinorUnits): string {
  if (!Number.isInteger(minor)) {
    throw new Error(`Minor units must be an integer, got ${minor}`);
  }
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const intPart = Math.floor(abs / 100);
  const fracPart = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${intPart}.${fracPart}`;
}

/** Round half-up to the nearest integer (used after rate/quantity math). */
export function roundHalfUp(value: number): number {
  return value < 0 ? -roundHalfUp(-value) : Math.floor(value + 0.5);
}

/**
 * Multiply minor units by a decimal quantity (e.g. 10 hours x 85.00 EUR).
 * Result is rounded half-up to whole minor units.
 */
export function multiplyMinor(minor: MinorUnits, quantity: number): MinorUnits {
  return roundHalfUp(minor * quantity);
}

/** Apply a percentage rate (e.g. 19 for 19% VAT), rounded half-up. */
export function applyRatePercent(minor: MinorUnits, ratePercent: number): MinorUnits {
  return roundHalfUp((minor * ratePercent) / 100);
}
