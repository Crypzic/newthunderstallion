"use client";
import Link from "next/link";
import { useState } from "react";
import { useBoosts } from "@/components/boosts";
import { CheckoutModal } from "@/components/checkout";
import { ArrowLeft, Bolt, Copy, Discord, External, Flame, Globe, Star, Telegram, XLogo } from "@/components/icons";
import { ChainBadge, Empty, Pct, Spinner, TokenAvatar } from "@/components/primitives";
import { age, price, shortAddr, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { market, useAsync } from "@/lib/market/client";
import { tokenKey } from "@/lib/market/types";
import { getStore, type Listing } from "@/lib/store";
import { hasTicker, type Tier } from "@/lib/tiers";

type LinkItem = { label: string; href: string; icon?: React.ReactNode };

export function CoinView({ chain, address }: { chain: string; address: string }) {
  const { t, fmt } = useI18n();
  const coin = useAsync(() => market.coin(chain, address), [chain, address], 30_000);
  const listing = useAsync(() => getStore().listingForToken(chain, address), [chain, address]);
  const tiers = useAsync(() => getStore().getTiers(), []);
  const boosts = useBoosts();
  const [votes, setVotes] = useState<{ votes: number; voted: boolean } | null>(null);
  const voteState = useAsync(() => getStore().voteStatus(chain, address), [chain, address]);
  const [checkout, setCheckout] = useState<Tier | null>(null);
  const [copied, setCopied] = useState(false);

  const key = tokenKey(chain, address);
  const boost = boosts.trend.get(key);
  const elite = boosts.eliteProfiles.has(key);
  const c = coin.data;
  const l = listing.data;
  const v = votes || voteState.data;

  if (coin.loading && !c && listing.loading) return <Spinner />;
  if (!c && !l && !coin.loading && !listing.loading) {
    return <div className="container-x pt-10"><Empty>{t.coin.notFound}</Empty></div>;
  }

  const name = l?.projectName || c?.name || "";
  const symbol = l?.symbol || c?.symbol || "";
  const logo = l?.logoUrl || c?.image;
  const banner = elite ? l?.bannerUrl || c?.header || boosts.banners.find((b) => tokenKey(b.chain, b.address) === key)?.bannerUrl : null;
  const description = l?.description || c?.description || "";
  const links = collectLinks(l, c?.websites || [], c?.socials || [], elite);

  const doVote = async () => {
    const res = await getStore().vote(chain, address, { name, symbol });
    setVotes(res);
  };
  const pick = (code: string) => setCheckout(tiers.data?.find((x) => x.code === code) || null);

  return (
    <div className="container-x pt-6">
      <Link href="/" className="btn-quiet -ml-3 mb-3"><ArrowLeft size={16} /> {t.coin.backToBoard}</Link>

      <section className={`card overflow-hidden ${elite ? "border-volt/50 shadow-[0_0_40px_rgb(255_210_63/0.10)]" : ""}`}>
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="" className="aspect-[3/1] max-h-[300px] w-full object-cover" />
        )}
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <TokenAvatar src={logo} symbol={symbol} chain={chain} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`h-display truncate text-2xl sm:text-3xl ${hasTicker(boost?.level || 0) ? "ticker-gold" : ""}`}>{symbol}</h1>
              <ChainBadge chain={chain} />
              {elite && <span className="pill bg-volt text-volt-ink"><Star size={11} /> {t.coin.elite}</span>}
              {boost && <span className="pill-volt"><Bolt filled size={11} /> {boost.points.toLocaleString()} {t.common.pts}</span>}
            </div>
            <p className="mt-1 truncate text-muted">{name}</p>
            <button
              className="num mt-2 inline-flex items-center gap-1.5 text-xs text-faint hover:text-text"
              onClick={() => { navigator.clipboard?.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            >
              {shortAddr(address)} <Copy size={12} /> {copied && <span className="text-up">{t.common.copied}</span>}
            </button>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <p className="h-display num text-2xl">{c ? price(c.priceUsd) : "—"}</p>
            {c && <Pct v={c.change.h24} className="text-sm" />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line p-4">
          <button className={v?.voted ? "btn-ghost text-up" : "btn-ghost"} onClick={doVote} disabled={v?.voted}>
            <Flame size={16} /> {v?.voted ? t.coin.voted : t.coin.vote} · <span className="num">{(v?.votes || 0).toLocaleString()}</span>
          </button>
          <button className="btn-primary" onClick={() => pick("t3")}><Bolt filled size={16} /> {t.coin.boost}</button>
          {!elite && <button className="btn-ghost" onClick={() => pick("elite")}><Star size={16} /> {t.coin.upgrade}</button>}
          {c?.url && <a className="btn-quiet" href={c.url} target="_blank" rel="noopener noreferrer">{t.coin.trade} <External size={14} /></a>}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card overflow-hidden">
          <p className="eyebrow border-b border-line px-5 py-3">{t.coin.chart}</p>
          {c?.pairAddress ? (
            <iframe
              title={`${symbol} chart`}
              src={`https://dexscreener.com/${chain}/${c.pairAddress}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=15`}
              className="h-[460px] w-full border-0 sm:h-[560px]"
              loading="lazy"
            />
          ) : (
            <div className="p-5"><Empty>{t.coin.noChart}</Empty></div>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          {c && (
            <section className="card p-5">
              <p className="eyebrow mb-3">{t.coin.stats}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  [t.board.mcap, usd(c.marketCap)], [t.board.liquidity, usd(c.liquidity)],
                  [`${t.board.volume} 24h`, usd(c.volume.h24)], [t.board.age, age(c.createdAt)],
                  [`${t.board.txns} 24h`, (c.txns24.buys + c.txns24.sells).toLocaleString()], ["FDV", usd(c.fdv)],
                ].map(([k, val]) => (
                  <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="num font-semibold">{val}</dd></div>
                ))}
              </dl>
              <div className="mt-4 grid grid-cols-4 gap-1 border-t border-line pt-4 text-center">
                {([["m5", "5m"], ["h1", "1h"], ["h6", "6h"], ["h24", "24h"]] as const).map(([w, label]) => (
                  <div key={w}><p className="num text-[11px] text-faint">{label}</p><Pct v={c.change[w]} className="text-sm" /></div>
                ))}
              </div>
            </section>
          )}
          {(description || links.length > 0) && (
            <section className={`card p-5 ${elite ? "border-volt/30" : ""}`}>
              {description && (<><p className="eyebrow mb-2">{t.coin.about}</p><p className="whitespace-pre-line text-sm text-muted">{description}</p></>)}
              {links.length > 0 && (
                <>
                  <p className="eyebrow mb-2 mt-5">{t.coin.links}</p>
                  <div className="flex flex-wrap gap-2">
                    {links.map((x) => (
                      <a key={x.href} href={x.href} target="_blank" rel="noopener noreferrer" className="chip">{x.icon} {x.label}</a>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
          <p className="text-center text-xs text-faint">{fmt(t.coin.votes, { n: (v?.votes || 0).toLocaleString() })}</p>
        </aside>
      </div>

      <CheckoutModal tier={checkout} onClose={() => setCheckout(null)} preset={{ chain, address }} />
    </div>
  );
}

function collectLinks(l: Listing | null, websites: string[], socials: { type: string; url: string }[], elite: boolean): LinkItem[] {
  const out: LinkItem[] = [];
  const add = (label: string, href?: string, icon?: React.ReactNode) => {
    if (href && /^https?:\/\//.test(href) && !out.some((o) => o.href === href)) out.push({ label, href, icon });
  };
  const lk = l?.links || {};
  add("Website", lk.website || websites[0], <Globe size={12} />);
  add("X", lk.twitter || socials.find((s) => s.type === "twitter")?.url, <XLogo size={12} />);
  add("Telegram", lk.telegram || socials.find((s) => s.type === "telegram")?.url, <Telegram size={12} />);
  add("Discord", lk.discord || socials.find((s) => s.type === "discord")?.url, <Discord size={12} />);
  // Free profiles show what's on-chain; listed and Elite profiles show every link the team provided.
  if (l || elite) {
    for (const [k, label] of [["reddit", "Reddit"], ["tiktok", "TikTok"], ["youtube", "YouTube"], ["github", "GitHub"], ["medium", "Medium"], ["linktree", "Linktree"], ["audit", "Audit"], ["other", "Link"]] as const) {
      add(label, lk[k]);
    }
  }
  return out;
}
