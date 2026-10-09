// Default product catalog. In production these rows live in the `tiers`
// table (seeded from supabase/schema.sql) so the admin can edit prices,
// points and durations without a deploy. Display copy comes from i18n,
// keyed by `code`.

export type Product = "trend" | "profile" | "banner";

export type Tier = {
  code: string;
  product: Product;
  priceUsd: number;
  compareAtUsd: number | null; // crossed-out "was" price, shown only while a sale is on
  points: number; // Thunder Points shown on the board / token profile
  durationHours: number | null; // null = permanent
  sort: number;
  active: boolean;
};

export const DEFAULT_TIERS: Tier[] = [
  { code: "t1", product: "trend", priceUsd: 50, compareAtUsd: 100, points: 100, durationHours: 12, sort: 1, active: true },
  { code: "t2", product: "trend", priceUsd: 100, compareAtUsd: 200, points: 200, durationHours: 12, sort: 2, active: true },
  { code: "t3", product: "trend", priceUsd: 300, compareAtUsd: 600, points: 1000, durationHours: 24, sort: 3, active: true },
  { code: "t4", product: "trend", priceUsd: 500, compareAtUsd: 1000, points: 2000, durationHours: 48, sort: 4, active: true },
  { code: "t5", product: "trend", priceUsd: 750, compareAtUsd: 1500, points: 10000, durationHours: 48, sort: 5, active: true },
  { code: "elite", product: "profile", priceUsd: 148, compareAtUsd: null, points: 0, durationHours: null, sort: 1, active: true },
  { code: "b1", product: "banner", priceUsd: 120, compareAtUsd: null, points: 0, durationHours: 24, sort: 1, active: true },
  { code: "b2", product: "banner", priceUsd: 300, compareAtUsd: null, points: 0, durationHours: 72, sort: 2, active: true },
  { code: "b3", product: "banner", priceUsd: 600, compareAtUsd: null, points: 0, durationHours: 168, sort: 3, active: true },
];

/** Trend tier level (1–5) from its code; 0 for non-trend products. */
export const trendLevel = (code: string) => (/^t[1-5]$/.test(code) ? Number(code[1]) : 0);

/** Perks unlocked at each trend level. */
export const hasTicker = (level: number) => level >= 3; // gold shimmering name
export const hasBonusBanner = (level: number) => level >= 4; // banner slot (24h at t4, full run at t5)
export const hasEliteFrame = (level: number) => level >= 5; // glowing frame + front page

export const BONUS_BANNER_HOURS_T4 = 24;
