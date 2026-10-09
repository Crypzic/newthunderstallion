"use client";
import { useI18n } from "@/lib/i18n";
import type { Tier } from "@/lib/tiers";

/** Human name for any tier, in the current language. */
export function useTierLabel() {
  const { t } = useI18n();
  return (tier: Pick<Tier, "code" | "product">) => {
    if (tier.product === "profile") return `${t.ads.profileName} · ${t.ads.eliteProfile}`;
    if (tier.product === "banner") return `${t.ads.bannerName} · ${t.ads.bannerTiers[tier.code as "b1" | "b2" | "b3"] || tier.code}`;
    const n = tier.code.slice(1);
    return `${t.ads.trendName} · ${t.ads.tier} ${n}`;
  };
}
