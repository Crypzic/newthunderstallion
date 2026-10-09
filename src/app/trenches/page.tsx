"use client";
import { MarketBoard } from "@/components/board";
import { BannerCarousel } from "@/components/home";
import { useI18n } from "@/lib/i18n";

export default function TrenchesPage() {
  const { t } = useI18n();
  return (
    <div className="pt-8">
      <BannerCarousel />
      <div className="container-x">
        <MarketBoard source="trenches" title={t.trenches.title} subtitle={t.trenches.subtitle} />
      </div>
    </div>
  );
}
