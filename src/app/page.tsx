"use client";
import { MarketBoard } from "@/components/board";
import { BannerCarousel, EliteSpotlight, HomeHero, HotSpot, LatestListings } from "@/components/home";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();
  return (
    <>
      <HomeHero />
      <EliteSpotlight />
      <BannerCarousel />
      <div className="container-x">
        <MarketBoard source="trending" title={t.board.title} subtitle={t.board.subtitle} />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr] [&>*]:min-w-0">
          <HotSpot />
          <LatestListings />
        </div>
      </div>
    </>
  );
}
