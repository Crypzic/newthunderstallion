import "server-only";
import { cacheLife } from "next/cache";
import type { Coin, Stablecoin } from "./types";
import { tokenKey } from "./types";
import { fixtureCoins, fixtureStables } from "./fixtures";

// All upstream market calls happen here, on the server, behind `use cache`.
// Every visitor shares one cached response per endpoint instead of each
// browser hitting DexScreener itself — the main speed fix over the old site.

const DEX = "https://api.dexscreener.com";
const GECKO = "https://api.coingecko.com/api/v3";
const USE_FIXTURES = process.env.MARKET_FIXTURES === "1";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json() as Promise<T>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalize(p: any): Coin | null {
  if (!p?.baseToken?.address) return null;
  const info = p.info || {};
  const n = (o: any, k: string) => (o && o[k] != null ? Number(o[k]) || 0 : 0);
  return {
    chainId: p.chainId,
    address: p.baseToken.address,
    pairAddress: p.pairAddress,
    dexId: p.dexId || "",
    url: p.url || "",
    name: p.baseToken.name || p.baseToken.symbol || "Unknown",
    symbol: p.baseToken.symbol || "—",
    quoteSymbol: p.quoteToken?.symbol || "",
    image: info.imageUrl || null,
    header: info.header || null,
    priceUsd: parseFloat(p.priceUsd) || 0,
    change: { m5: n(p.priceChange, "m5"), h1: n(p.priceChange, "h1"), h6: n(p.priceChange, "h6"), h24: n(p.priceChange, "h24") },
    volume: { m5: n(p.volume, "m5"), h1: n(p.volume, "h1"), h6: n(p.volume, "h6"), h24: n(p.volume, "h24") },
    txns24: { buys: p.txns?.h24?.buys || 0, sells: p.txns?.h24?.sells || 0 },
    liquidity: p.liquidity?.usd || 0,
    marketCap: p.marketCap || p.fdv || 0,
    fdv: p.fdv || 0,
    createdAt: p.pairCreatedAt || 0,
    websites: (info.websites || []).map((w: any) => (typeof w === "string" ? w : w.url)).filter(Boolean),
    socials: (info.socials || []).map((s: any) => ({ type: String(s.type || s.platform || ""), url: String(s.url || "") })).filter((s: any) => s.url),
    description: info.description || "",
  };
}

/** Keep the most liquid pair per base token. */
function bestPairs(pairs: any[]): Coin[] {
  const best = new Map<string, any>();
  for (const p of pairs || []) {
    if (!p?.baseToken?.address) continue;
    const k = tokenKey(p.chainId, p.baseToken.address);
    const cur = best.get(k);
    if (!cur || (p.liquidity?.usd || 0) > (cur.liquidity?.usd || 0)) best.set(k, p);
  }
  return [...best.values()].map(normalize).filter(Boolean) as Coin[];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Batch lookup: one request per chain per 30 addresses. */
async function enrich(refs: { chainId: string; address: string }[]): Promise<Coin[]> {
  const byChain = new Map<string, string[]>();
  for (const r of refs) {
    if (!r.chainId || !r.address) continue;
    const list = byChain.get(r.chainId) || [];
    if (!list.includes(r.address)) list.push(r.address);
    byChain.set(r.chainId, list);
  }
  const calls: Promise<Coin[]>[] = [];
  for (const [chain, addrs] of byChain) {
    for (let i = 0; i < addrs.length; i += 30) {
      const chunk = addrs.slice(i, i + 30);
      calls.push(getJson<unknown[]>(`${DEX}/tokens/v1/${chain}/${chunk.join(",")}`).then(bestPairs).catch(() => []));
    }
  }
  const coins = (await Promise.all(calls)).flat();
  const order = new Map(refs.map((r, i) => [tokenKey(r.chainId, r.address), i]));
  return coins.sort((a, b) => (order.get(tokenKey(a.chainId, a.address)) ?? 1e9) - (order.get(tokenKey(b.chainId, b.address)) ?? 1e9));
}

type Ref = { chainId: string; tokenAddress: string };
const toRefs = (rows: Ref[]) => rows.map((r) => ({ chainId: r.chainId, address: r.tokenAddress }));

export async function getTrending(): Promise<Coin[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  if (USE_FIXTURES) return fixtureCoins().slice(0, 40);
  const [top, latest] = await Promise.all([
    getJson<Ref[]>(`${DEX}/token-boosts/top/v1`).catch(() => [] as Ref[]),
    getJson<Ref[]>(`${DEX}/token-boosts/latest/v1`).catch(() => [] as Ref[]),
  ]);
  return enrich(toRefs([...top, ...latest]).slice(0, 90));
}

/** "Trenches": freshly launched tokens with a profile, newest first. */
export async function getTrenches(): Promise<Coin[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  if (USE_FIXTURES) return fixtureCoins().sort((a, b) => b.createdAt - a.createdAt).slice(0, 40);
  const latest = await getJson<Ref[]>(`${DEX}/token-profiles/latest/v1`).catch(() => [] as Ref[]);
  const coins = await enrich(toRefs(latest).slice(0, 90));
  return coins.sort((a, b) => b.createdAt - a.createdAt);
}

/** Market data for an explicit set of tokens (boosted rows, listings). */
export async function getTokens(keys: string[]): Promise<Coin[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  const refs = keys.map((k) => {
    const i = k.indexOf(":");
    return { chainId: k.slice(0, i), address: k.slice(i + 1) };
  });
  if (USE_FIXTURES) {
    const all = fixtureCoins();
    return refs.map((r) => all.find((c) => tokenKey(c.chainId, c.address) === tokenKey(r.chainId, r.address))).filter(Boolean) as Coin[];
  }
  return enrich(refs);
}

export async function getCoin(chainId: string, address: string): Promise<Coin | null> {
  "use cache";
  cacheLife({ stale: 20, revalidate: 20, expire: 300 });
  if (USE_FIXTURES) return fixtureCoins().find((c) => c.chainId === chainId && c.address.toLowerCase() === address.toLowerCase()) || null;
  const pairs = await getJson<unknown[]>(`${DEX}/tokens/v1/${chainId}/${address}`).catch(() => []);
  return bestPairs(pairs as never[])[0] || null;
}

export async function searchTokens(q: string): Promise<Coin[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  const query = q.trim().toLowerCase();
  if (!query) return [];
  if (USE_FIXTURES) {
    return fixtureCoins().filter((c) => [c.name, c.symbol, c.address].some((v) => v.toLowerCase().includes(query))).slice(0, 12);
  }
  const data = await getJson<{ pairs?: unknown[] }>(`${DEX}/latest/dex/search?q=${encodeURIComponent(query)}`).catch(() => ({ pairs: [] }));
  return bestPairs((data.pairs || []) as never[]).sort((a, b) => b.liquidity - a.liquidity).slice(0, 12);
}

/** "Hottest": the biggest stablecoins ranked by 24h volume. */
export async function getHottest(): Promise<Stablecoin[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  if (USE_FIXTURES) return fixtureStables();
  type Row = { id: string; symbol: string; name: string; image: string; current_price: number; total_volume: number; market_cap: number; price_change_percentage_24h: number };
  const rows = await getJson<Row[]>(`${GECKO}/coins/markets?vs_currency=usd&category=stablecoins&order=volume_desc&per_page=25&page=1`);
  return rows.map((r) => ({
    id: r.id, symbol: (r.symbol || "").toUpperCase(), name: r.name, image: r.image,
    price: r.current_price || 0, volume24: r.total_volume || 0, marketCap: r.market_cap || 0, change24: r.price_change_percentage_24h || 0,
  }));
}
