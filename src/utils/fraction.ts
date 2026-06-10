/**
 * Convert a decimal number to a Unicode fraction string for display.
 * Supports common fractions used in cooking.
 */
export function decimalToFraction(value: number): string {
  const whole = Math.floor(value);
  const decimal = value - whole;

  if (decimal < 0.01) return whole > 0 ? String(whole) : "0";

  const fractions: { threshold: number; symbol: string; exact: number }[] = [
    { threshold: 0.125, symbol: "⅛", exact: 1 / 8 },
    { threshold: 0.167, symbol: "⅙", exact: 1 / 6 },
    { threshold: 0.2, symbol: "⅕", exact: 1 / 5 },
    { threshold: 0.25, symbol: "¼", exact: 1 / 4 },
    { threshold: 0.333, symbol: "⅓", exact: 1 / 3 },
    { threshold: 0.375, symbol: "⅜", exact: 3 / 8 },
    { threshold: 0.4, symbol: "⅖", exact: 2 / 5 },
    { threshold: 0.5, symbol: "½", exact: 1 / 2 },
    { threshold: 0.6, symbol: "⅗", exact: 3 / 5 },
    { threshold: 0.625, symbol: "⅝", exact: 5 / 8 },
    { threshold: 0.667, symbol: "⅔", exact: 2 / 3 },
    { threshold: 0.75, symbol: "¾", exact: 3 / 4 },
    { threshold: 0.8, symbol: "⅘", exact: 4 / 5 },
    { threshold: 0.833, symbol: "⅚", exact: 5 / 6 },
    { threshold: 0.875, symbol: "⅞", exact: 7 / 8 },
  ];

  let closest = fractions[0];
  let minDiff = Math.abs(decimal - fractions[0].exact);

  for (const f of fractions) {
    const diff = Math.abs(decimal - f.exact);
    if (diff < minDiff) {
      minDiff = diff;
      closest = f;
    }
  }

  if (whole > 0) {
    return `${whole}${closest.symbol}`;
  }
  return closest.symbol;
}

/**
 * Parse a fractional string (e.g., "1 1/2", "3/4", "2") into a decimal number.
 */
export function fractionToDecimal(input: string): number {
  const trimmed = input.trim();
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d)\/(\d)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    return whole + num / den;
  }

  const fractionMatch = trimmed.match(/^(\d)\/(\d)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    return num / den;
  }

  const decimal = parseFloat(trimmed);
  return isNaN(decimal) ? 0 : decimal;
}
