"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { market, useAsync } from "@/lib/market/client";
import { tokenKey } from "@/lib/market/types";
import { getStore, type ActiveBoost } from "@/lib/store";
import { useBoosts } from "./boosts";
import { ArrowRight, Bolt, Flame, Megaphone, Search } from "./icons";
import { coinHref } from "./links";
import { ChainBadge, Empty, Pct, Spinner, TokenAvatar } from "./primitives";
import { useUi } from "./ui-state";

export function HomeHero() {
  const { t } = useI18n();
  const { open } = useUi();
  return (
    <section className="container-x pb-6 pt-8 sm:pt-12">
      <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" /> {t.home.kicker}
      </span>
      <h1 className="h-display mt-4 text-[clamp(30px,5.4vw,60px)] leading-[1.05]">
        {t.home.h1a}<br /><span className="text-volt">{t.home.h1b}</span>
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">{t.home.lead}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => open("search")} className="btn-ghost w-full justify-start text-muted sm:w-96">
          <Search size={16} /> <span className="truncate text-sm font-medium">{t.nav.search}</span>
        </button>
        <Link href="/advertising" className="btn-primary"><Bolt filled size={16} /> {t.board.boostCta}</Link>
      </div>
    </section>
  );
}

/** Tier 5 "Front Page": the startup-page spotlight for Elite Stallions. */
export function EliteSpotlight() {
  const { t } = useI18n();
  const { frontPage } = useBoosts();
  const keys = useMemo(() => frontPage.map((b) => `${b.chain}:${b.address}`).sort(), [frontPage]);
  const coins = useAsync(() => market.tokens(keys), [keys.join(",")]);
  if (!frontPage.length) return null;
  const byKey = new Map((coins.data || []).map((c) => [tokenKey(c.chainId, c.address), c]));
  return (
    <section className="container-x mb-6">
      <div className="grid gap-3 md:grid-cols-2">
        {frontPage.slice(0, 2).map((b) => {
          const c = byKey.get(tokenKey(b.chain, b.address));
          return (
            <Link key={tokenKey(b.chain, b.address)} href={coinHref(b.chain, b.address)}
              className="elite-frame relative overflow-hidden rounded-2xl border border-volt/40 p-5">
              {b.bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.bannerUrl} alt="" className="absolute inset-y-0 right-0 h-full w-2/3 object-cover opacity-30 [mask-image:linear-gradient(90deg,transparent,black_70%)]" />
              )}
              <div className="relative flex items-center gap-4">
                <TokenAvatar src={c?.image} symbol={b.tokenSymbol} chain={b.chain} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-volt">{t.home.spotlight} · {t.home.spotlightSub}</p>
                  <p className="h-display ticker-gold mt-1 truncate text-2xl">{b.tokenSymbol || c?.symbol}</p>
                  <p className="truncate text-sm text-muted">{b.tokenName || c?.name}</p>
                </div>
                <div className="text-right">
                  <span className="pill-volt text-sm"><Bolt filled size={13} /> {b.points.toLocaleString()}</span>
                  {c && <p className="num mt-2 text-sm">{usd(c.marketCap)} <Pct v={c.change.h24} className="text-xs" /></p>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function BannerCarousel() {
  const { t } = useI18n();
  const { banners, loading } = useBoosts();
  const [i, setI] = useState(0);
  const slides: (ActiveBoost | null)[] = [...banners, null]; // last slide = "your banner here"
  const n = slides.length;
  useEffect(() => {
    if (n < 2) return;
    const h = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(h);
  }, [n]);
  if (loading && !banners.length) return <div className="container-x mb-6"><div className="aspect-[3/1] max-h-[220px] w-full animate-pulse rounded-2xl bg-panel sm:aspect-[6/1]" /></div>;
  const cur = i % n;
  return (
    <section className="container-x mb-6" aria-roledescription="carousel" aria-label={t.home.promoted}>
      <div className="relative overflow-hidden rounded-2xl border border-line">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${cur * 100}%)` }}>
          {slides.map((s, idx) =>
            s ? (
              <a key={idx} href={s.linkUrl || coinHref(s.chain, s.address)} className="relative block aspect-[3/1] w-full shrink-0 sm:aspect-[5/1]"
                {...(s.linkUrl ? { target: "_blank", rel: "noopener noreferrer sponsored" } : {})}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.bannerUrl} alt={s.tokenName} className="h-full w-full object-cover" loading={idx === 0 ? "eager" : "lazy"} />
                <span className="pill absolute left-3 top-3 bg-black/60 text-volt">{t.home.promoted} · {s.tokenSymbol}</span>
              </a>
            ) : (
              <Link key="cta" href="/advertising#banner" className="flex aspect-[3/1] w-full shrink-0 flex-col items-center justify-center gap-2 bg-[linear-gradient(120deg,rgb(255_210_63/0.10),rgb(91_140_255/0.12))] text-center sm:aspect-[5/1]">
                <Megaphone size={26} className="text-volt" />
                <span className="h-display text-lg sm:text-2xl">{t.home.adSlot}</span>
                <span className="text-sm text-muted">{t.home.adSlotSub}</span>
              </Link>
            ),
          )}
        </div>
        {n > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {slides.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${idx === cur ? "w-6 bg-volt" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HotSpot() {
  const { t } = useI18n();
  const data = useAsync(() => getStore().hotSpot(10), [], 60_000);
  const keys = useMemo(() => (data.data?.rows || []).map((r) => `${r.chain}:${r.address}`).sort(), [data.data]);
  const coins = useAsync(() => market.tokens(keys), [keys.join(",")]);
  const byKey = new Map((coins.data || []).map((c) => [tokenKey(c.chainId, c.address), c]));
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="h-display flex items-center gap-2 text-lg"><Flame size={18} className="text-down" /> {t.home.hotspot}</h2>
          <p className="mt-1 text-sm text-muted">{t.home.hotspotSub}</p>
        </div>
        {data.data && <span className="num text-sm text-muted">{data.data.total.toLocaleString()} {t.common.votes}</span>}
      </div>
      {data.loading && !data.data ? <Spinner /> : !data.data?.rows.length ? <Empty>{t.home.hotspotEmpty}</Empty> : (
        <ol className="flex flex-col gap-1">
          {data.data.rows.map((r, i) => {
            const c = byKey.get(tokenKey(r.chain, r.address));
            return (
              <li key={tokenKey(r.chain, r.address)}>
                <Link href={coinHref(r.chain, r.address)} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-panel-2">
                  <span className={`num w-6 text-center text-sm font-bold ${i < 3 ? "text-volt" : "text-faint"}`}>{i + 1}</span>
                  <TokenAvatar src={r.logoUrl || c?.image} symbol={r.symbol} chain={r.chain} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.symbol || c?.symbol}</span>
                    <span className="block truncate text-xs text-muted">{r.name || c?.name}</span>
                  </span>
                  <span className="num text-sm font-semibold">{r.votes.toLocaleString()}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function LatestListings() {
  const { t } = useI18n();
  const data = useAsync(() => getStore().approvedListings(8), []);
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="h-display text-lg">{t.home.latest}</h2>
          <p className="mt-1 text-sm text-muted">{t.home.latestSub}</p>
        </div>
        <Link href="/submit" className="btn-ghost btn-sm">{t.nav.submit} <ArrowRight size={14} /></Link>
      </div>
      {data.loading && !data.data ? <Spinner /> : !data.data?.length ? <Empty>{t.home.latestEmpty}</Empty> : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.data.map((l) => (
            <Link key={l.id} href={coinHref(l.chain, l.contract)} className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-panel-2/50 p-3 hover:border-line-2">
              <TokenAvatar src={l.logoUrl} symbol={l.symbol} chain={l.chain} size={36} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{l.projectName}</span>
                  <ChainBadge chain={l.chain} />
                </span>
                <span className="block truncate text-xs text-muted">{l.description}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
