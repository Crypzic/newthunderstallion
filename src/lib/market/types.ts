export type Window = "m5" | "h1" | "h6" | "h24";

export type Coin = {
  chainId: string;
  address: string;
  pairAddress: string;
  dexId: string;
  url: string;
  name: string;
  symbol: string;
  quoteSymbol: string;
  image: string | null;
  header: string | null;
  priceUsd: number;
  change: Record<Window, number>;
  volume: Record<Window, number>;
  txns24: { buys: number; sells: number };
  liquidity: number;
  marketCap: number;
  fdv: number;
  createdAt: number;
  websites: string[];
  socials: { type: string; url: string }[];
  description: string;
};

export type Stablecoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  volume24: number;
  marketCap: number;
  change24: number;
};

export const tokenKey = (chainId: string, address: string) => `${chainId}:${address.toLowerCase()}`;
