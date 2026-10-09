"use client";
import { DEFAULT_TIERS, type Tier } from "../tiers";
import { tokenKey } from "../market/types";
import {
  isRunning, StoreError,
  type ActiveBoost, type AdminUser, type HotSpotRow, type Listing, type ListingInput, type Order, type OrderInput, type Session, type Settings, type Store,
} from "./types";

// Browser-only store used until Supabase keys are configured. Everything is
// kept in localStorage so each screen (including admin) can be tried end to
// end. It is NOT secure and never shared between visitors.

type User = { userId: string; username: string; telegram: string; isAdmin: boolean; passHash: string; createdAt: string };
type Vote = { key: string; chain: string; address: string; name: string; symbol: string; voter: string };
type DB = { v: 2; users: User[]; listings: Listing[]; orders: Order[]; votes: Vote[]; tiers: Tier[]; settings: Settings; seq: { listing: number; order: number } };

const KEY = "ts-demo-db";
const SESSION_KEY = "ts-demo-session";
const CLIENT_KEY = "ts-client-id";

const iso = (ms = Date.now()) => new Date(ms).toISOString();
const HOUR = 3600_000;

function seed(): DB {
  const now = Date.now();
  const listing = (n: number, projectName: string, symbol: string, chain: string, contract: string, extra: Partial<Listing> = {}): Listing => ({
    id: `TS-2026-${String(n).padStart(6, "0")}`, userId: null, username: "stallion", projectName, symbol, chain, contract, pairAddress: "",
    logoUrl: "", bannerUrl: "", description: `${projectName} — community project listed on Thunder Stallion.`, category: "Meme",
    links: { website: "https://example.com", twitter: "https://x.com", telegram: "https://t.me" },
    status: "approved", rejectedReason: "", featured: false, adminVotes: 0, submittedAt: iso(now - n * 9 * HOUR), approvedAt: iso(now - n * 8 * HOUR), ...extra,
  });
  const order = (n: number, tierCode: string, product: Order["product"], chain: string, address: string, tokenName: string, tokenSymbol: string, hoursAgo: number, bannerUrl = ""): Order => {
    const t = DEFAULT_TIERS.find((x) => x.code === tierCode)!;
    const start = now - hoursAgo * HOUR;
    return {
      id: `ORD-${String(n).padStart(6, "0")}`, userId: "seed", username: "stallion", product, tierCode, chain, address, tokenName, tokenSymbol,
      bannerUrl, linkUrl: "", payToken: "USDC", payNetwork: "solana", amountUsd: t.priceUsd, points: t.points, durationHours: t.durationHours,
      status: "active", txHash: "", createdAt: iso(start), startsAt: iso(start), endsAt: t.durationHours ? iso(start + t.durationHours * HOUR) : null,
    };
  };
  return {
    v: 2,
    users: [],
    listings: [
      listing(1, "Ansem", "ANSEM", "solana", "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump", { featured: true, adminVotes: 120 }),
      listing(2, "Ark", "ARK", "bsc", "0xCae117ca6Bc8A341D2E7207F30E180f0e5618B9D", { adminVotes: 64 }),
      listing(3, "Cate", "CATE", "solana", "Ai66LHZG9MCzg1WKdawwqduVAXpNDUuV8M3uyq5ppump", { adminVotes: 41 }),
      listing(4, "Jimothy", "JIMOTHY", "solana", "Ge87EtsjwRQbHaqQmKRno69RFTwh9bfSsm99XNxTpump", { adminVotes: 18 }),
      listing(5, "Pipe Dog", "PIPEDOG", "bsc", "0x5Cb6F181081301b44905F3ae15419112ecaBd8A6", { adminVotes: 9 }),
    ],
    orders: [
      order(1, "t5", "trend", "solana", "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump", "Ansem", "ANSEM", 3),
      order(2, "t3", "trend", "bsc", "0xCae117ca6Bc8A341D2E7207F30E180f0e5618B9D", "Ark", "ARK", 2),
      order(3, "t1", "trend", "solana", "Ai66LHZG9MCzg1WKdawwqduVAXpNDUuV8M3uyq5ppump", "Cate", "CATE", 1),
      order(4, "elite", "profile", "solana", "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump", "Ansem", "ANSEM", 30),
    ],
    votes: [],
    tiers: DEFAULT_TIERS.map((t) => ({ ...t })),
    settings: { saleActive: true },
    seq: { listing: 5, order: 4 },
  };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db.v === 2) return db;
    }
  } catch {}
  const db = seed();
  save(db);
  return db;
}
function save(db: DB) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {}
}

async function hash(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`ts-demo:${s}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clientId() {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(CLIENT_KEY, id); }
    return id;
  } catch { return "anon"; }
}

const toSession = (u: User): Session => ({ userId: u.userId, username: u.username, telegram: u.telegram, isAdmin: u.isAdmin });

export function createDemoStore(): Store {
  const listeners = new Set<(s: Session | null) => void>();

  const current = (): User | null => {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      return id ? load().users.find((u) => u.userId === id) || null : null;
    } catch { return null; }
  };
  const emit = () => { const u = current(); listeners.forEach((cb) => cb(u ? toSession(u) : null)); };
  const requireUser = () => { const u = current(); if (!u) throw new StoreError("AUTH_REQUIRED"); return u; };
  const requireAdmin = () => { const u = requireUser(); if (!u.isAdmin) throw new StoreError("FORBIDDEN"); return u; };
  const mutate = <T,>(fn: (db: DB) => T): T => { const db = load(); const out = fn(db); save(db); return out; };

  const voteCount = (db: DB, chain: string, address: string) => {
    const key = tokenKey(chain, address);
    const user = db.votes.filter((v) => v.key === key).length;
    const admin = db.listings.filter((l) => tokenKey(l.chain, l.contract) === key).reduce((n, l) => n + (l.adminVotes || 0), 0);
    return user + admin;
  };
  const voter = () => current()?.userId ? `user:${current()!.userId}` : `client:${clientId()}`;

  return {
    mode: "demo",

    async getSession() { const u = current(); return u ? toSession(u) : null; },
    onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async signUp(username, password, telegram) {
      const pass = await hash(password);
      const user = mutate((db) => {
        if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new StoreError("USERNAME_TAKEN");
        const u: User = { userId: crypto.randomUUID(), username, telegram, isAdmin: username.toLowerCase() === "admin", passHash: pass, createdAt: iso() };
        db.users.push(u);
        // Same behaviour as production: re-registering an old username reclaims its legacy listings.
        db.listings.forEach((l) => { if (!l.userId && l.username.toLowerCase() === username.toLowerCase()) l.userId = u.userId; });
        return u;
      });
      localStorage.setItem(SESSION_KEY, user.userId);
      emit();
      return toSession(user);
    },
    async signIn(username, password) {
      const pass = await hash(password);
      const u = load().users.find((x) => x.username.toLowerCase() === username.toLowerCase() && x.passHash === pass);
      if (!u) throw new StoreError("INVALID_LOGIN");
      localStorage.setItem(SESSION_KEY, u.userId);
      emit();
      return toSession(u);
    },
    async signOut() { localStorage.removeItem(SESSION_KEY); emit(); },

    async getTiers() { return load().tiers; },
    async getSettings() { return load().settings; },
    async approvedListings(limit = 30) {
      return load().listings.filter((l) => l.status === "approved").sort((a, b) => (b.approvedAt || "").localeCompare(a.approvedAt || "")).slice(0, limit);
    },
    async listingForToken(chain, address) {
      const key = tokenKey(chain, address);
      return load().listings.find((l) => l.status === "approved" && tokenKey(l.chain, l.contract) === key) || null;
    },
    async activeBoosts() {
      return load().orders.filter((o) => isRunning(o)).map((o): ActiveBoost => ({
        product: o.product, tierCode: o.tierCode, chain: o.chain, address: o.address, tokenName: o.tokenName, tokenSymbol: o.tokenSymbol,
        points: o.points, bannerUrl: o.bannerUrl, linkUrl: o.linkUrl, startsAt: o.startsAt!, endsAt: o.endsAt,
      }));
    },
    async hotSpot(limit = 10) {
      const db = load();
      const map = new Map<string, HotSpotRow>();
      for (const l of db.listings.filter((x) => x.status === "approved")) {
        const key = tokenKey(l.chain, l.contract);
        map.set(key, { chain: l.chain, address: l.contract, name: l.projectName, symbol: l.symbol, logoUrl: l.logoUrl, votes: 0, listingId: l.id });
      }
      for (const v of db.votes) if (!map.has(v.key)) map.set(v.key, { chain: v.chain, address: v.address, name: v.name, symbol: v.symbol, logoUrl: "", votes: 0, listingId: null });
      const rows = [...map.values()].map((r) => ({ ...r, votes: voteCount(db, r.chain, r.address) })).filter((r) => r.votes > 0);
      rows.sort((a, b) => b.votes - a.votes);
      return { rows: rows.slice(0, limit), total: rows.reduce((n, r) => n + r.votes, 0) };
    },
    async voteStatus(chain, address) {
      const db = load();
      const key = tokenKey(chain, address);
      return { votes: voteCount(db, chain, address), voted: db.votes.some((v) => v.key === key && v.voter === voter()) };
    },
    async vote(chain, address, meta) {
      return mutate((db) => {
        const key = tokenKey(chain, address);
        const who = voter();
        if (!db.votes.some((v) => v.key === key && v.voter === who)) db.votes.push({ key, chain, address, name: meta.name, symbol: meta.symbol, voter: who });
        return { votes: voteCount(db, chain, address), voted: true };
      });
    },

    async submitListing(input) {
      const u = requireUser();
      return mutate((db) => {
        const key = tokenKey(input.chain, input.contract);
        if (db.listings.some((l) => tokenKey(l.chain, l.contract) === key && l.status !== "rejected")) throw new StoreError("DUPLICATE");
        db.seq.listing += 1;
        const l: Listing = {
          ...input, id: `TS-2026-${String(db.seq.listing).padStart(6, "0")}`, userId: u.userId, username: u.username,
          status: "pending", rejectedReason: "", featured: false, adminVotes: 0, submittedAt: iso(), approvedAt: null,
        };
        db.listings.push(l);
        return l;
      });
    },
    async myListings() {
      const u = requireUser();
      return load().listings.filter((l) => l.userId === u.userId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    },
    async createOrder(input: OrderInput) {
      const u = requireUser();
      return mutate((db) => {
        const tier = db.tiers.find((t) => t.code === input.tierCode && t.product === input.product && t.active);
        if (!tier) throw new StoreError("BAD_INPUT", "Unknown package");
        db.seq.order += 1;
        const o: Order = {
          ...input, id: `ORD-${String(db.seq.order).padStart(6, "0")}`, userId: u.userId, username: u.username,
          amountUsd: tier.priceUsd, points: tier.points, durationHours: tier.durationHours,
          status: "awaiting_payment", txHash: "", createdAt: iso(), startsAt: null, endsAt: null,
        };
        db.orders.push(o);
        return o;
      });
    },
    async myOrders() {
      const u = requireUser();
      return load().orders.filter((o) => o.userId === u.userId).map(expire).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    admin: {
      async listings() { requireAdmin(); return load().listings.slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)); },
      async updateListing(id, patch) {
        requireAdmin();
        mutate((db) => {
          const l = db.listings.find((x) => x.id === id);
          if (!l) throw new StoreError("BAD_INPUT", "Listing not found");
          Object.assign(l, patch);
          if (patch.status === "approved" && !l.approvedAt) l.approvedAt = iso();
        });
      },
      async orders() { requireAdmin(); return load().orders.map(expire).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
      async orderAction(id, action) {
        requireAdmin();
        mutate((db) => {
          const o = db.orders.find((x) => x.id === id);
          if (!o) throw new StoreError("BAD_INPUT", "Order not found");
          const now = Date.now();
          if (action === "activate") {
            o.status = "active"; o.startsAt = iso(now); o.endsAt = o.durationHours ? iso(now + o.durationHours * HOUR) : null;
          } else if (action === "cancel") {
            o.status = "cancelled";
          } else if (action === "extend" && o.endsAt) {
            o.endsAt = iso(Math.max(now, Date.parse(o.endsAt)) + 24 * HOUR); o.status = "active";
          } else if (action === "end") {
            o.status = "expired"; o.endsAt = iso(now);
          }
        });
      },
      async addTrending(input) {
        const admin = requireAdmin();
        mutate((db) => {
          const tier = db.tiers.find((t) => t.code === input.tierCode && t.product === "trend");
          if (!tier) throw new StoreError("BAD_INPUT", "Unknown tier");
          const now = Date.now();
          db.seq.order += 1;
          db.orders.push({
            ...input, id: `ORD-${String(db.seq.order).padStart(6, "0")}`, userId: admin.userId, username: admin.username,
            product: "trend", linkUrl: "", payToken: "ADMIN", payNetwork: "admin", amountUsd: 0, points: tier.points,
            durationHours: tier.durationHours, status: "active", txHash: "", createdAt: iso(now), startsAt: iso(now),
            endsAt: tier.durationHours ? iso(now + tier.durationHours * HOUR) : null,
          });
        });
      },
      async updateTier(code, patch) { requireAdmin(); mutate((db) => { const t = db.tiers.find((x) => x.code === code); if (t) Object.assign(t, patch); }); },
      async setSettings(s) { requireAdmin(); mutate((db) => { db.settings = s; }); },
      async users() {
        requireAdmin();
        const db = load();
        return db.users.map((u): AdminUser => ({
          userId: u.userId, username: u.username, telegram: u.telegram, isAdmin: u.isAdmin, createdAt: u.createdAt,
          listings: db.listings.filter((l) => l.userId === u.userId).length, orders: db.orders.filter((o) => o.userId === u.userId).length,
        }));
      },
      async setAdmin(userId, isAdmin) { requireAdmin(); mutate((db) => { const u = db.users.find((x) => x.userId === userId); if (u) u.isAdmin = isAdmin; }); emit(); },
    },
  };
}

/** Report time-expired orders as expired without needing a background job. */
function expire(o: Order): Order {
  return o.status === "active" && o.endsAt && Date.parse(o.endsAt) <= Date.now() ? { ...o, status: "expired" } : o;
}

export type { ListingInput };
