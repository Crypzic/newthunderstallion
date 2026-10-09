"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { matchesNetwork } from "@/lib/config";
import { age, price, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { market, useAsync } from "@/lib/market/client";
import { tokenKey, type Coin, type Window } from "@/lib/market/types";
import { hasEliteFrame, hasTicker } from "@/lib/tiers";
import { useBoosts, type BoostInfo } from "./boosts";
import { NetworkChips } from "./chrome";
import { Bolt } from "./icons";
import { coinHref } from "./links";
import { Empty, Pct, Spinner, TokenAvatar } from "./primitives";
import { useUi } from "./ui-state";

type Sort = "trending" | "volume" | "gainers" | "newest";
const WINDOWS: { id: Window; label: string }[] = [
  { id: "m5", label: "5m" }, { id: "h1", label: "1h" }, { id: "h6", label: "6h" }, { id: "h24", label: "24h" },
];

type Row = { coin: Coin; boost: BoostInfo | null };

export function MarketBoard({ source, title, subtitle, limit = 60 }: { source: "trending" | "trenches"; title: string; subtitle: string; limit?: number }) {
  const { t } = useI18n();
  const { network } = useUi();
  const [win, setWin] = useState<Window>("h1");
  const [sort, setSort] = useState<Sort>(source === "trenches" ? "newest" : "trending");

  const feed = useAsync(() => (source === "trending" ? market.trending() : market.trenches()), [source], 30_000);
  const boosts = useBoosts();

  // Boosted tokens are always on the board, even when they've dropped out of the live feed.
  const boostedKeys = useMemo(() => [...boosts.trend.values()].map((b) => b.ref).sort(), [boosts.trend]);
  const extra = useAsync(() => market.tokens(boostedKeys), [boostedKeys.join(",")], 30_000);

  const rows: Row[] = useMemo(() => {
    const seen = new Set<string>();
    const all: Row[] = [];
    for (const coin of [...(extra.data || []), ...(feed.data || [])]) {
      const key = tokenKey(coin.chainId, coin.address);
      if (seen.has(key)) continue;
      seen.add(key);
      all.push({ coin, boost: boosts.trend.get(key) || null });
    }
    const feedOrder = new Map((feed.data || []).map((c, i) => [tokenKey(c.chainId, c.address), i]));
    const filtered = all.filter((r) => matchesNetwork(r.coin.chainId, network));
    const by: Record<Sort, (a: Row, b: Row) => number> = {
      trending: (a, b) =>
        (b.boost?.points || 0) - (a.boost?.points || 0) ||
        (feedOrder.get(tokenKey(a.coin.chainId, a.coin.address)) ?? 1e6) - (feedOrder.get(tokenKey(b.coin.chainId, b.coin.address)) ?? 1e6),
      volume: (a, b) => b.coin.volume[win] - a.coin.volume[win],
      gainers: (a, b) => b.coin.change[win] - a.coin.change[win],
      newest: (a, b) => b.coin.createdAt - a.coin.createdAt,
    };
    return filtered.sort(by[sort]).slice(0, limit);
  }, [feed.data, extra.data, boosts.trend, network, sort, win, limit]);

  const sorts: { id: Sort; label: string }[] = [
    { id: "trending", label: t.board.sortTrending },
    { id: "volume", label: t.board.sortVolume },
    { id: "gainers", label: t.board.sortGainers },
    { id: "newest", label: t.board.sortNewest },
  ];

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="h-display flex items-center gap-2 text-xl"><Bolt filled size={20} className="text-volt" /> {title}</h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          <Link href="/advertising#trend" className="btn-primary btn-sm"><Bolt filled size={14} /> {t.board.boostCta}</Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-line bg-bg-2 p-0.5" role="group" aria-label="Time window">
            {WINDOWS.map((w) => (
              <button key={w.id} onClick={() => setWin(w.id)} aria-pressed={win === w.id}
                className={`num rounded-md px-2.5 py-1 text-xs font-semibold ${win === w.id ? "bg-storm/20 text-storm-2" : "text-muted hover:text-text"}`}>
                {w.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-line bg-bg-2 p-0.5" role="group" aria-label="Sort">
            {sorts.map((s) => (
              <button key={s.id} onClick={() => setSort(s.id)} aria-pressed={sort === s.id}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${sort === s.id ? "bg-panel-3 text-text" : "text-muted hover:text-text"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <NetworkChips className="hidden lg:flex lg:ml-auto" />
        </div>
      </div>

      {feed.loading && !feed.data ? (
        <Spinner label={t.common.loading} />
      ) : feed.error && !feed.data ? (
        <div className="p-5"><Empty>{t.common.unavailable}</Empty></div>
      ) : rows.length === 0 ? (
        <div className="p-5"><Empty>{t.board.empty}</Empty></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-faint">
                <th className="w-10 py-2.5 pl-4 font-medium">#</th>
                <th className="py-2.5 font-medium">{t.board.pair}</th>
                <th className="hidden py-2.5 text-right font-medium md:table-cell">{t.board.price}</th>
                <th className="hidden py-2.5 text-right font-medium lg:table-cell">{t.board.age}</th>
                <th className="hidden py-2.5 text-right font-medium xl:table-cell">{t.board.txns}</th>
                <th className="hidden py-2.5 text-right font-medium sm:table-cell">{t.board.volume}</th>
                {WINDOWS.map((w) => (
                  <th key={w.id} className={`num py-2.5 text-right font-medium ${w.id === win ? "text-storm-2" : "hidden lg:table-cell"}`}>{w.label}</th>
                ))}
                <th className="hidden py-2.5 text-right font-medium md:table-cell">{t.board.liquidity}</th>
                <th className="py-2.5 pr-4 text-right font-medium">{t.board.mcap}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => <BoardRow key={tokenKey(r.coin.chainId, r.coin.address)} row={r} rank={i + 1} win={win} />)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function BoardRow({ row, rank, win }: { row: Row; rank: number; win: Window }) {
  const { coin: c, boost } = row;
  const lvl = boost?.level || 0;
  const href = coinHref(c.chainId, c.address);
  return (
    <tr className={`group relative border-b border-line/60 transition-colors last:border-0 hover:bg-panel-2/70 ${hasEliteFrame(lvl) ? "elite-frame" : ""}`}>
      <td className="num py-3 pl-4 text-xs text-faint">{rank}</td>
      <td className="py-3 pr-3">
        <Link href={href} className="flex min-w-0 items-center gap-3 after:absolute after:inset-0">
          <TokenAvatar src={c.image} symbol={c.symbol} chain={c.chainId} size={30} />
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className={`max-w-[120px] truncate font-bold sm:max-w-[180px] ${hasTicker(lvl) ? "ticker-gold" : ""}`}>{c.symbol}</span>
              <span className="hidden text-xs text-faint sm:inline">/{c.quoteSymbol}</span>
              {boost && (
                <span className="pill-volt" title="Thunder Points">
                  <Bolt filled size={11} /> {boost.points.toLocaleString()}
                </span>
              )}
            </span>
            <span className="block max-w-[140px] truncate text-xs text-muted sm:max-w-[220px]">{c.name}</span>
          </span>
        </Link>
      </td>
      <td className="num hidden py-3 text-right md:table-cell">{price(c.priceUsd)}</td>
      <td className="num hidden py-3 text-right text-muted lg:table-cell">{age(c.createdAt)}</td>
      <td className="num hidden py-3 text-right text-muted xl:table-cell">{(c.txns24.buys + c.txns24.sells).toLocaleString()}</td>
      <td className="num hidden py-3 text-right sm:table-cell">{usd(c.volume[win])}</td>
      {WINDOWS.map((w) => (
        <td key={w.id} className={`py-3 text-right ${w.id === win ? "" : "hidden lg:table-cell"}`}><Pct v={c.change[w.id]} /></td>
      ))}
      <td className="num hidden py-3 text-right text-muted md:table-cell">{usd(c.liquidity)}</td>
      <td className="num py-3 pr-4 text-right font-semibold">{usd(c.marketCap)}</td>
    </tr>
  );
}
