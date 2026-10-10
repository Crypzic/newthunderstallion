import type { Coin, Stablecoin } from "./types";

// Offline sample data, used only when MARKET_FIXTURES=1 (local dev without
// network access, screenshots, tests). Deterministic so renders are stable.

const SEEDED: [string, string, string, string][] = [
  ["bsc", "0xCae117ca6Bc8A341D2E7207F30E180f0e5618B9D", "Ark", "ARK"],
  ["bsc", "0x5Cb6F181081301b44905F3ae15419112ecaBd8A6", "Pipe Dog", "PIPEDOG"],
  ["bsc", "0x2076CD26D8Cf26f91655d4Ada3dD2fdBFdd8e7a4", "Apes", "APES"],
  ["bsc", "0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1", "If", "IF"],
  ["solana", "6oGuFDbEeaSzTcvrmmd2MqfNYwHKXFoN7regcR22pump", "Neegy", "NEEGY"],
  ["solana", "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump", "Ansem", "ANSEM"],
  ["solana", "AYJ1tYQZZJ1gmZhURYuXLwG9bygUcgBnYPzriLpxpump", "Moon Doge Coin", "MOONDOGECOIN"],
  ["solana", "Ai66LHZG9MCzg1WKdawwqduVAXpNDUuV8M3uyq5ppump", "Cate", "CATE"],
  ["solana", "Cm6fNnMk7NfzStP9CZpsQA2v3jjzbcYGAxdJySmHpump", "Buttcoin", "BUTTCOIN"],
  ["solana", "Ge87EtsjwRQbHaqQmKRno69RFTwh9bfSsm99XNxTpump", "Jimothy", "JIMOTHY"],
];
const NAMES = ["Frock", "HeeHaw", "SpaceXS", "Chump", "Quantum", "Basecat", "Mala", "Claus", "Hoodlet", "Genie", "Volt", "Neigh", "Bolt Cat", "Storm", "Gallop", "Mane", "Stampede", "Rodeo", "Zap", "Hoof", "Thunder Pup", "Lightning Lad", "Static", "Raijin", "Spark", "Cumulus", "Nimbus", "Squall", "Gale", "Tempest"];
const CHAINS = ["solana", "bsc", "ethereum", "robinhood", "base", "solana", "bsc", "solana"];

function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

/** Coloured placeholder logo so sample tokens don't all look the same. */
function avatar(symbol: string, i: number) {
  const h = (i * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},85%,58%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360},80%,38%)"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#g)"/><text x="32" y="41" font-family="Arial,sans-serif" font-size="24" font-weight="700" text-anchor="middle" fill="#fff">${symbol.slice(0, 2)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

let cache: Coin[] | null = null;
export function fixtureCoins(): Coin[] {
  if (cache) return cache.map((c) => ({ ...c }));
  const r = rng(42);
  const now = Date.UTC(2026, 9, 9, 12);
  const rows: [string, string, string, string][] = [
    ...SEEDED,
    ...NAMES.map((n, i): [string, string, string, string] => {
      const chain = CHAINS[i % CHAINS.length];
      const hex = (i + 1).toString(16).padStart(4, "0");
      const addr = chain === "solana" ? `Fx${hex}${"A".repeat(36)}pump` : `0x${hex}${"b".repeat(36)}`;
      return [chain, addr, n, n.toUpperCase().replace(/\s+/g, "")];
    }),
  ];
  cache = rows.map(([chainId, address, name, symbol], i) => {
    const mc = Math.round(10 ** (4 + r() * 4));
    const v24 = Math.round(mc * (0.2 + r() * 2));
    const ch = () => Math.round((r() - 0.42) * 8000) / 100;
    return {
      chainId, address, name, symbol,
      pairAddress: `pair${i}`, dexId: chainId === "solana" ? "pumpswap" : "pancakeswap",
      url: "", quoteSymbol: chainId === "solana" ? "SOL" : chainId === "bsc" ? "WBNB" : "WETH",
      image: avatar(symbol, i), header: null,
      priceUsd: mc / 1e9,
      change: { m5: ch() / 10, h1: ch() / 3, h6: ch(), h24: ch() * 1.5 },
      volume: { m5: Math.round(v24 / 200), h1: Math.round(v24 / 20), h6: Math.round(v24 / 4), h24: v24 },
      txns24: { buys: Math.round(r() * 4000), sells: Math.round(r() * 3500) },
      liquidity: Math.round(mc * (0.05 + r() * 0.2)),
      marketCap: mc, fdv: mc,
      createdAt: now - Math.round(r() * 72 * 3600_000),
      websites: ["https://example.com"],
      socials: [{ type: "twitter", url: "https://x.com" }, { type: "telegram", url: "https://t.me" }],
      description: `${name} is a sample token used for offline previews.`,
    };
  });
  return cache.map((c) => ({ ...c }));
}

export function fixtureStables(): Stablecoin[] {
  return [
    ["tether", "USDT", "Tether", 98.1e9, 168.2e9],
    ["usd-coin", "USDC", "USDC", 9.4e9, 74.5e9],
    ["ethena-usde", "USDE", "Ethena USDe", 1.2e9, 12.1e9],
    ["dai", "DAI", "Dai", 0.41e9, 5.3e9],
    ["first-digital-usd", "FDUSD", "First Digital USD", 3.2e9, 1.9e9],
    ["paypal-usd", "PYUSD", "PayPal USD", 0.12e9, 2.4e9],
    ["usds", "USDS", "USDS", 0.09e9, 7.8e9],
    ["true-usd", "TUSD", "TrueUSD", 0.05e9, 0.49e9],
  ].map(([id, symbol, name, volume24, marketCap], i) => ({
    id: id as string, symbol: symbol as string, name: name as string, image: "",
    price: 1 + (i % 3 - 1) * 0.0004, volume24: volume24 as number, marketCap: marketCap as number, change24: (i % 3 - 1) * 0.02,
  }));
}
