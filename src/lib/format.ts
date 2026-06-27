/** Shared formatting helpers. */

export const usd = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits });

/** Compact dollars, e.g. $612k, $1.2M. */
export const usdShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return usd(n);
};

export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;

export const num = (n: number) => n.toLocaleString("en-US");

export const minutes = (n: number) => `${n} min`;
