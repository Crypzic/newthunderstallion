"use client";
import { useEffect, useState } from "react";
import type { Coin, Stablecoin } from "./types";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Market data unavailable (${res.status})`);
  return res.json();
}

export const market = {
  trending: () => get<Coin[]>("/api/market/trending"),
  trenches: () => get<Coin[]>("/api/market/trenches"),
  hottest: () => get<Stablecoin[]>("/api/market/hottest"),
  search: (q: string) => get<Coin[]>(`/api/market/search?q=${encodeURIComponent(q)}`),
  coin: (chain: string, address: string) =>
    get<Coin | null>(`/api/market/coin?chain=${encodeURIComponent(chain)}&address=${encodeURIComponent(address)}`),
  tokens: (keys: string[]) =>
    keys.length ? get<Coin[]>(`/api/market/tokens?keys=${encodeURIComponent([...new Set(keys)].sort().join(","))}`) : Promise.resolve([]),
};

/** Minimal async-state hook with optional polling. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], pollMs = 0) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    const run = () =>
      fn().then(
        (data) => alive && setState({ data, error: null, loading: false }),
        (e) => alive && setState((s) => ({ data: s.data, error: String(e?.message || e), loading: false })),
      );
    run();
    const t = pollMs ? setInterval(run, pollMs) : undefined;
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
