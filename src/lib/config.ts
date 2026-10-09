// Site-wide settings. Values that differ per deployment come from env vars
// (see .env.example); everything else lives here.

export const SITE = {
  name: "Thunder Stallion",
  tagline: "Discover. Track. Ride.",
  adminTelegram: process.env.NEXT_PUBLIC_ADMIN_TELEGRAM || "@Stallion_CEO",
  adminTelegramUrl: process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_URL || "https://t.me/Stallion_CEO",
  reviewTime: "48h",
  community: [
    { label: "Stallion X Listing", href: "https://x.com/stallion_ceo", kind: "x" },
    { label: "Stallion X Official", href: "https://x.com/stallion_cn", kind: "x" },
    { label: "Telegram KOLs", href: "https://t.me/STALLION_KOLS", kind: "tg" },
    { label: "Stallion Trend Bot", href: "https://t.me/StallionTrendBot", kind: "tg" },
    { label: "Linktree", href: "https://linktr.ee/Stallion_CE", kind: "link" },
  ],
} as const;

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
/** Without Supabase keys the site runs in demo mode: accounts, listings and
 *  orders live in this browser's localStorage so every screen can be tried. */
export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;

/** Supabase Auth needs an email, but accounts here are username-only.
 *  Each username maps to a private, never-emailed address on this domain. */
export const AUTH_EMAIL_DOMAIN = "users.thunderstallion.app";

export type NetworkId = "all" | "robinhood" | "bsc" | "ethereum" | "solana" | "others";

export const NETWORKS: { id: Exclude<NetworkId, "all">; label: string; chainIds: string[]; color: string }[] = [
  // DexScreener's chain id for Robinhood Chain; adjust here if it differs.
  { id: "robinhood", label: "Robinhood", chainIds: ["robinhood"], color: "#c3f53c" },
  { id: "bsc", label: "BSC", chainIds: ["bsc"], color: "#f3ba2f" },
  { id: "ethereum", label: "Ethereum", chainIds: ["ethereum"], color: "#8c9eff" },
  { id: "solana", label: "Solana", chainIds: ["solana"], color: "#14f195" },
];

const KNOWN = new Set(NETWORKS.flatMap((n) => n.chainIds));

export function matchesNetwork(chainId: string, net: NetworkId) {
  if (net === "all") return true;
  if (net === "others") return !KNOWN.has(chainId);
  return NETWORKS.find((n) => n.id === net)?.chainIds.includes(chainId) ?? false;
}

const CHAIN_LABELS: Record<string, string> = {
  solana: "SOL", bsc: "BSC", ethereum: "ETH", base: "BASE", robinhood: "RH",
  arbitrum: "ARB", polygon: "POL", avalanche: "AVAX", sui: "SUI", ton: "TON",
  tron: "TRX", hyperevm: "HYPE", abstract: "ABS",
};
export const chainShort = (c: string) => CHAIN_LABELS[c] || (c ? c.slice(0, 4).toUpperCase() : "—");

/** Tokens people will be able to pay with once wallet payments go live. */
export const PAY_TOKENS = [
  { id: "USDC", networks: ["solana", "ethereum", "bsc"] },
  { id: "USDT", networks: ["ethereum", "bsc", "solana"] },
  { id: "SOL", networks: ["solana"] },
  { id: "BNB", networks: ["bsc"] },
  { id: "ETH", networks: ["ethereum"] },
] as const;
export type PayToken = (typeof PAY_TOKENS)[number]["id"];

/** Banner creative spec — DexScreener-style 3:1 header. */
export const BANNER_SPEC = { width: 1500, height: 500, maxMb: 2, formats: "JPG, PNG, GIF, WEBP" };
