"use client";
import { tokenKey } from "@/lib/market/types";
import { useMemo } from "react";
import { useAsync } from "@/lib/market/client";
import { getStore, type ActiveBoost } from "@/lib/store";
import { BONUS_BANNER_HOURS_T4, hasBonusBanner, trendLevel } from "@/lib/tiers";

export type BoostInfo = { points: number; level: number; ref: string }; // ref = chain:address with original casing

/** Running boosts indexed by token, plus the banner slots they unlock. */
export function useBoosts() {
  const state = useAsync(() => getStore().activeBoosts(), [], 60_000);
  const index = useMemo(() => indexBoosts(state.data || []), [state.data]);
  return { ...state, ...index };
}

export function indexBoosts(list: ActiveBoost[], now?: number) {
  const trend = new Map<string, BoostInfo>();
  const eliteProfiles = new Set<string>();
  for (const b of list) {
    const key = tokenKey(b.chain, b.address);
    if (b.product === "trend") {
      const cur = trend.get(key) || { points: 0, level: 0, ref: `${b.chain}:${b.address}` };
      cur.points += b.points;
      cur.level = Math.max(cur.level, trendLevel(b.tierCode));
      trend.set(key, cur);
    } else if (b.product === "profile") {
      eliteProfiles.add(key);
    }
  }
  // Banner rotation: paid banner ads, Tier 5 for its whole run, Tier 4 for its first 24h.
  const banners = list.filter((b) => {
    if (!b.bannerUrl) return false;
    if (b.product === "banner") return true;
    const lvl = trendLevel(b.tierCode);
    if (lvl >= 5) return true;
    return hasBonusBanner(lvl) && (now ?? Date.now()) - Date.parse(b.startsAt) < BONUS_BANNER_HOURS_T4 * 3600_000;
  });
  const frontPage = list.filter((b) => b.product === "trend" && trendLevel(b.tierCode) >= 5);
  return { trend, eliteProfiles, banners, frontPage };
}
