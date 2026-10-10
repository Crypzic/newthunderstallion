"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { market, useAsync } from "@/lib/market/client";
import { tokenKey, type Coin } from "@/lib/market/types";
import { getStore } from "@/lib/store";
import { useBoosts } from "./boosts";
import { ArrowRight, Bolt, Flame, Search } from "./icons";
import { coinHref } from "./links";
import { ChainBadge, Empty, Pct, Spinner, TokenAvatar } from "./primitives";
import { useUi } from "./ui-state";

export function HomeHero() {
  const { t } = useI18n();
  const { open } = useUi();
  return (
    <section className="container-x pb-8 pt-10 sm:pt-16">
      <div className="min-w-0 max-w-3xl">
        <span className="enter eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 px-3 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" /> {t.home.kicker}
        </span>
        <h1 className="enter h-display mt-5 text-[clamp(34px,6.4vw,76px)] leading-[1.02]" style={{ "--d": "80ms" } as React.CSSProperties}>
          {t.home.h1a}<br /><span className="ticker-gold">{t.home.h1b}</span>
        </h1>
        <p className="enter mt-5 max-w-xl text-base text-muted sm:text-lg" style={{ "--d": "160ms" } as React.CSSProperties}>{t.home.lead}</p>
        <div className="enter mt-7 flex flex-wrap gap-3" style={{ "--d": "240ms" } as React.CSSProperties}>
          <button onClick={() => open("search")} className="btn-ghost w-full justify-start text-muted sm:w-96">
            <Search size={16} /> <span className="truncate text-sm font-medium">{t.nav.search}</span>
          </button>
          <Link href="/advertising" className="btn-primary"><Bolt filled size={16} /> {t.board.boostCta}</Link>
        </div>
        <ul className="enter mt-7 flex flex-wrap gap-2 text-xs text-muted" style={{ "--d": "320ms" } as React.CSSProperties}>
          {[t.home.chipChains, t.home.chipLive, t.home.chipVotes].map((c) => (
            <li key={c} className="flex items-center gap-1.5 rounded-lg border border-line bg-panel/70 px-3 py-1.5"><Bolt filled size={11} className="text-volt" /> {c}</li>
          ))}
        </ul>
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
    <section className="reveal container-x mb-6">
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

type Slide = {
  key: string;
  chain: string;
  address: string;
  kind: "promoted" | "boosted" | "dex";
  coin: Coin | null;
  symbol: string;
  name: string;
  banner: string | null;
  points: number;
  href: string;
  external: boolean;
};

/**
 * Live banner rotation, rebuilt every 30s:
 *   1. paid banner ads (and Tier 4/5 banners)
 *   2. every running boost — paid or added by the admin — highest points first
 *   3. whatever is trending on DexScreener right now
 */
export function BannerCarousel() {
  const { t } = useI18n();
  const boosts = useBoosts();
  const dex = useAsync(() => market.trending(), [], 30_000);
  const boostRefs = useMemo(() => (boosts.data || []).filter((b) => b.product !== "profile").map((b) => `${b.chain}:${b.address}`).sort(), [boosts.data]);
  const boostCoins = useAsync(() => market.tokens(boostRefs), [boostRefs.join(",")], 30_000);

  const slides = useMemo(() => {
    const out: Slide[] = [];
    const seen = new Set<string>();
    const coinFor = new Map([...(boostCoins.data || []), ...(dex.data || [])].map((c) => [tokenKey(c.chainId, c.address), c]));
    const push = (s: Omit<Slide, "key" | "coin">) => {
      const key = tokenKey(s.chain, s.address);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ ...s, key, coin: coinFor.get(key) || null });
    };
    for (const b of boosts.banners) {
      push({ chain: b.chain, address: b.address, kind: "promoted", symbol: b.tokenSymbol, name: b.tokenName, banner: b.bannerUrl,
        points: boosts.trend.get(tokenKey(b.chain, b.address))?.points || 0, href: b.linkUrl || coinHref(b.chain, b.address), external: !!b.linkUrl });
    }
    const running = (boosts.data || []).filter((b) => b.product === "trend").sort((a, b) => b.points - a.points);
    for (const b of running) {
      const c = coinFor.get(tokenKey(b.chain, b.address));
      push({ chain: b.chain, address: b.address, kind: "boosted", symbol: b.tokenSymbol || c?.symbol || "", name: b.tokenName || c?.name || "",
        banner: b.bannerUrl || c?.header || null, points: boosts.trend.get(tokenKey(b.chain, b.address))?.points || b.points,
        href: coinHref(b.chain, b.address), external: false });
    }
    for (const c of (dex.data || []).slice(0, 12)) {
      push({ chain: c.chainId, address: c.address, kind: "dex", symbol: c.symbol, name: c.name, banner: c.header, points: 0,
        href: coinHref(c.chainId, c.address), external: false });
    }
    return out.slice(0, 16);
  }, [boosts.banners, boosts.data, boosts.trend, boostCoins.data, dex.data]);

  const [i, setI] = useState(0);
  const n = slides.length;
  useEffect(() => {
    if (n < 2) return;
    const h = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(h);
  }, [n]);

  if (!n) {
    if (dex.loading || boosts.loading) return <div className="container-x mb-6"><div className="aspect-[3/1] w-full animate-pulse rounded-2xl bg-panel sm:aspect-[5/1]" /></div>;
    return null;
  }
  const cur = i % n;
  return (
    <section className="reveal container-x mb-6" aria-roledescription="carousel" aria-label={t.home.dexTrending}>
      <div className="relative overflow-hidden rounded-2xl border border-line shadow-[0_30px_80px_-50px_rgb(255_210_63/0.5)]">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${cur * 100}%)` }}>
          {slides.map((s, idx) => <BannerSlide key={s.key} s={s} eager={idx === 0} />)}
        </div>
        {n > 1 && (
          <div className="absolute bottom-3 right-3 flex max-w-[60%] flex-wrap justify-end gap-1.5">
            {slides.map((s, idx) => (
              <button key={s.key} onClick={() => setI(idx)} aria-label={s.symbol}
                className={`h-1.5 rounded-full transition-all ${idx === cur ? "w-6 bg-volt" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BannerSlide({ s, eager }: { s: Slide; eager: boolean }) {
  const { t } = useI18n();
  const tag =
    s.kind === "dex" ? <span className="pill bg-black/60 text-storm-2">{t.home.dexTrending}</span>
    : s.kind === "promoted" ? <span className="pill on-dark bg-black/60 text-volt">{t.home.promoted}</span>
    : <span className="pill-volt on-dark bg-black/60"><Bolt filled size={11} /> {t.home.boostedTag} · {s.points.toLocaleString()}</span>;
  const info = (
    <span className="flex items-center gap-3">
      <TokenAvatar src={s.coin?.image} symbol={s.symbol} chain={s.chain} size={40} />
      <span className="min-w-0">
        <span className="h-display block truncate text-lg leading-tight sm:text-2xl">{s.symbol}</span>
        <span className="block truncate text-xs text-muted sm:text-sm">{s.name}</span>
      </span>
      {s.coin && (
        <span className="ml-2 text-right">
          <span className="num block text-sm font-semibold">{usd(s.coin.marketCap)}</span>
          <Pct v={s.coin.change.h24} className="text-xs" />
        </span>
      )}
    </span>
  );
  return (
    <a href={s.href} {...(s.external ? { target: "_blank", rel: "noopener noreferrer sponsored" } : {})}
      className="relative block aspect-[3/1] w-full shrink-0 overflow-hidden bg-panel sm:aspect-[5/1]">
      {s.banner ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.banner} alt={s.name} className="h-full w-full object-cover" loading={eager ? "eager" : "lazy"} />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-3 pt-10">{info}</span>
        </>
      ) : (
        <span className="flex h-full w-full items-center bg-[radial-gradient(600px_200px_at_85%_50%,rgb(91_140_255/0.18),transparent),linear-gradient(120deg,rgb(255_210_63/0.08),transparent_60%)] px-5 sm:px-8">
          {info}
        </span>
      )}
      <span className="absolute left-3 top-3">{tag}</span>
    </a>
  );
}

export function HotSpot() {
  const { t } = useI18n();
  const data = useAsync(() => getStore().hotSpot(10), [], 60_000);
  const keys = useMemo(() => (data.data?.rows || []).map((r) => `${r.chain}:${r.address}`).sort(), [data.data]);
  const coins = useAsync(() => market.tokens(keys), [keys.join(",")]);
  const byKey = new Map((coins.data || []).map((c) => [tokenKey(c.chainId, c.address), c]));
  return (
    <section className="reveal card p-4 sm:p-5">
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
    <section className="reveal card p-4 sm:p-5">
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
            <Link key={l.id} href={coinHref(l.chain, l.contract)} className="lift flex min-w-0 items-center gap-3 rounded-xl border border-line bg-panel-2/50 p-3">
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
