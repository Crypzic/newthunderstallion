export function abbr(n: number, digits = 2): string {
  if (!isFinite(n) || n === 0) return "0";
  const a = Math.abs(n);
  const units: [number, string][] = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [v, s] of units) if (a >= v) return `${(n / v).toFixed(digits).replace(/\.?0+$/, "")}${s}`;
  return n.toFixed(a < 10 ? 2 : 0);
}

export const usd = (n: number) => `$${abbr(n)}`;

/** Prices from $40,000 down to $0.0000000123, DexScreener-style compact format. */
export function price(n: number): string {
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(n >= 100 ? 2 : 4).replace(/\.?0+$/, "")}`;
  const zeros = Math.floor(-Math.log10(n));
  // $0.0000072 → $0.0₅72 (subscript = number of zeros after the decimal point)
  if (zeros >= 4) return `$0.0${String(zeros).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[+d])}${Math.round(n * 10 ** (zeros + 4)).toString().slice(0, 4)}`;
  return `$${n.toPrecision(4)}`;
}

export const pct = (n: number) => `${n > 0 ? "+" : ""}${(Math.round(n * 10) / 10).toFixed(1)}%`;

export function age(ms: number, now = Date.now()): string {
  if (!ms) return "—";
  const s = Math.max(0, (now - ms) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d`;
  if (s < 86400 * 365) return `${Math.round(s / 86400 / 30)}mo`;
  return `${Math.round(s / 86400 / 365)}y`;
}

export function timeLeft(endIso: string | null, now = Date.now()): string {
  if (!endIso) return "∞";
  const s = Math.max(0, (Date.parse(endIso) - now) / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
}

export const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const shortAddr = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

export const dateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
