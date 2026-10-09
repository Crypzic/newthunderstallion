import type { PayToken } from "../config";
import type { Product, Tier } from "../tiers";

export type Session = { userId: string; username: string; telegram: string; isAdmin: boolean };

export type ListingStatus = "pending" | "approved" | "rejected";
export type ListingLinks = Partial<Record<
  "website" | "twitter" | "telegram" | "discord" | "reddit" | "tiktok" | "youtube" | "github" | "medium" | "linktree" | "audit" | "other",
  string
>>;

export type Listing = {
  id: string; // TS-2026-000001
  userId: string | null;
  username: string;
  projectName: string;
  symbol: string;
  chain: string;
  contract: string;
  pairAddress: string;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  category: string;
  links: ListingLinks;
  status: ListingStatus;
  rejectedReason: string;
  featured: boolean;
  adminVotes: number;
  submittedAt: string;
  approvedAt: string | null;
};

export type ListingInput = Pick<Listing, "projectName" | "symbol" | "chain" | "contract" | "pairAddress" | "logoUrl" | "bannerUrl" | "description" | "category" | "links">;

export type OrderStatus = "awaiting_payment" | "active" | "expired" | "cancelled";

export type Order = {
  id: string; // ORD-000001
  userId: string;
  username: string;
  product: Product;
  tierCode: string;
  chain: string;
  address: string;
  tokenName: string;
  tokenSymbol: string;
  bannerUrl: string;
  linkUrl: string;
  payToken: PayToken | "ADMIN"; // ADMIN = added free by an admin from the panel
  payNetwork: string;
  amountUsd: number;
  points: number;
  durationHours: number | null;
  status: OrderStatus;
  txHash: string;
  createdAt: string;
  startsAt: string | null;
  endsAt: string | null;
};

export type OrderInput = Pick<Order, "product" | "tierCode" | "chain" | "address" | "tokenName" | "tokenSymbol" | "bannerUrl" | "linkUrl" | "payNetwork"> & { payToken: PayToken };

export type TrendingInput = Pick<Order, "tierCode" | "chain" | "address" | "tokenName" | "tokenSymbol" | "bannerUrl">;

/** Public, safe-to-show view of a running order. */
export type ActiveBoost = {
  product: Product;
  tierCode: string;
  chain: string;
  address: string;
  tokenName: string;
  tokenSymbol: string;
  points: number;
  bannerUrl: string;
  linkUrl: string;
  startsAt: string;
  endsAt: string | null;
};

export type HotSpotRow = { chain: string; address: string; name: string; symbol: string; logoUrl: string; votes: number; listingId: string | null };

export type Settings = { saleActive: boolean };

export type AdminUser = { userId: string; username: string; telegram: string; isAdmin: boolean; createdAt: string; listings: number; orders: number };

export type OrderAction = "activate" | "cancel" | "extend" | "end";

export interface Store {
  readonly mode: "supabase" | "demo";

  getSession(): Promise<Session | null>;
  onAuthChange(cb: (s: Session | null) => void): () => void;
  signUp(username: string, password: string, telegram: string): Promise<Session>;
  signIn(username: string, password: string): Promise<Session>;
  signOut(): Promise<void>;

  getTiers(): Promise<Tier[]>;
  getSettings(): Promise<Settings>;
  approvedListings(limit?: number): Promise<Listing[]>;
  listingForToken(chain: string, address: string): Promise<Listing | null>;
  activeBoosts(): Promise<ActiveBoost[]>;
  hotSpot(limit?: number): Promise<{ rows: HotSpotRow[]; total: number }>;
  voteStatus(chain: string, address: string): Promise<{ votes: number; voted: boolean }>;
  vote(chain: string, address: string, meta: { name: string; symbol: string }): Promise<{ votes: number; voted: boolean }>;

  submitListing(input: ListingInput): Promise<Listing>;
  myListings(): Promise<Listing[]>;
  createOrder(input: OrderInput): Promise<Order>;
  myOrders(): Promise<Order[]>;

  admin: {
    listings(): Promise<Listing[]>;
    updateListing(id: string, patch: Partial<Pick<Listing, "status" | "rejectedReason" | "featured" | "adminVotes" | keyof ListingInput>>): Promise<void>;
    orders(): Promise<Order[]>;
    orderAction(id: string, action: OrderAction): Promise<void>;
    /** Put a token on the board right away, free of charge. */
    addTrending(input: TrendingInput): Promise<void>;
    updateTier(code: string, patch: Partial<Pick<Tier, "priceUsd" | "compareAtUsd" | "points" | "durationHours" | "active">>): Promise<void>;
    setSettings(s: Settings): Promise<void>;
    users(): Promise<AdminUser[]>;
    setAdmin(userId: string, isAdmin: boolean): Promise<void>;
  };
}

export class StoreError extends Error {
  constructor(public code: "AUTH_REQUIRED" | "USERNAME_TAKEN" | "INVALID_LOGIN" | "DUPLICATE" | "FORBIDDEN" | "BAD_INPUT" | "SERVER", message?: string) {
    super(message || code);
  }
}

/** An order counts as running when active and inside its window. */
export const isRunning = (o: Pick<Order, "status" | "endsAt">, now = Date.now()) =>
  o.status === "active" && (!o.endsAt || Date.parse(o.endsAt) > now);
