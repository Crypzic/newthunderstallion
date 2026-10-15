"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AUTH_EMAIL_DOMAIN, SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";
import type { Product, Tier } from "../tiers";
import {
  StoreError,
  type ActiveBoost, type AdminUser, type Listing, type ListingInput, type Order, type Session, type Store,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const toListing = (r: Row): Listing => ({
  id: r.id, userId: r.user_id, username: r.username, projectName: r.project_name, symbol: r.symbol, chain: r.chain, contract: r.contract,
  pairAddress: r.pair_address, logoUrl: r.logo_url, bannerUrl: r.banner_url, description: r.description, category: r.category,
  links: r.links || {}, status: r.status, rejectedReason: r.rejected_reason, featured: r.featured, adminVotes: r.admin_votes,
  submittedAt: r.submitted_at, approvedAt: r.approved_at,
});
const fromListing = (l: Partial<Listing>): Row => {
  const map: Record<string, string> = {
    projectName: "project_name", symbol: "symbol", chain: "chain", contract: "contract", pairAddress: "pair_address", logoUrl: "logo_url",
    bannerUrl: "banner_url", description: "description", category: "category", links: "links", status: "status",
    rejectedReason: "rejected_reason", featured: "featured", adminVotes: "admin_votes",
  };
  const out: Row = {};
  for (const [k, v] of Object.entries(l)) if (map[k] && v !== undefined) out[map[k]] = v;
  return out;
};
const toOrder = (r: Row): Order => ({
  id: r.id, userId: r.user_id, username: r.username, product: r.product as Product, tierCode: r.tier_code, chain: r.chain, address: r.address,
  tokenName: r.token_name, tokenSymbol: r.token_symbol, bannerUrl: r.banner_url, linkUrl: r.link_url, payToken: r.pay_token as Order["payToken"],
  payNetwork: r.pay_network, amountUsd: Number(r.amount_usd), points: r.points, durationHours: r.duration_hours,
  status: r.status === "active" && r.ends_at && Date.parse(r.ends_at) <= Date.now() ? "expired" : r.status,
  txHash: r.tx_hash, createdAt: r.created_at, startsAt: r.starts_at, endsAt: r.ends_at,
});
const toTier = (r: Row): Tier => ({
  code: r.code, product: r.product, priceUsd: Number(r.price_usd), compareAtUsd: r.compare_at_usd == null ? null : Number(r.compare_at_usd),
  points: r.points, durationHours: r.duration_hours, sort: r.sort, active: r.active,
});

// Accounts sign in with a username; Supabase needs an email, so each username maps to a fixed hidden one.
// Plain usernames (letters, numbers, _) keep the original mapping so existing accounts still log in;
// anything else (spaces, Chinese, dots…) maps to a hash of the lowercased name.
async function emailFor(username: string) {
  const name = username.toLowerCase();
  if (/^[a-z0-9_]+$/.test(name)) return `${name}@${AUTH_EMAIL_DOMAIN}`;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(name));
  const hex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
  return `u-${hex.slice(0, 40)}@${AUTH_EMAIL_DOMAIN}`;
}

function clientId() {
  try {
    let id = localStorage.getItem("ts-client-id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("ts-client-id", id); }
    return id;
  } catch { return "anon"; }
}

function check<T>(res: { data: T; error: any }): NonNullable<T> {
  if (res.error) {
    if (res.error.code === "23505") throw new StoreError("DUPLICATE", res.error.message);
    throw new StoreError("SERVER", res.error.message);
  }
  return (res.data ?? []) as NonNullable<T>;
}

export function createSupabaseStore(): Store {
  const sb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

  const sessionFor = async (userId: string | undefined): Promise<Session | null> => {
    if (!userId) return null;
    const { data } = await sb.from("profiles").select("id, username, telegram, is_admin").eq("id", userId).maybeSingle();
    return data ? { userId: data.id, username: data.username, telegram: data.telegram, isAdmin: data.is_admin } : null;
  };
  const uid = async () => {
    const { data } = await sb.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new StoreError("AUTH_REQUIRED");
    return id;
  };

  return {
    mode: "supabase",

    async getSession() {
      const { data } = await sb.auth.getSession();
      return sessionFor(data.session?.user.id);
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, s) => { void sessionFor(s?.user.id).then(cb); });
      return () => data.subscription.unsubscribe();
    },
    async signUp(username, password, telegram) {
      const { data: free } = await sb.rpc("username_available", { p_username: username });
      if (free === false) throw new StoreError("USERNAME_TAKEN");
      const { data, error } = await sb.auth.signUp({ email: await emailFor(username), password, options: { data: { username, telegram } } });
      if (error) {
        if (/registered|exists/i.test(error.message)) throw new StoreError("USERNAME_TAKEN");
        if (/password/i.test(error.message)) throw new StoreError("WEAK_PASSWORD", error.message);
        throw new StoreError("SERVER", error.message);
      }
      if (!data.session) throw new StoreError("SERVER", "Turn off “Confirm email” in Supabase → Authentication → Providers → Email.");
      return (await sessionFor(data.user?.id))!;
    },
    async signIn(username, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email: await emailFor(username), password });
      if (error || !data.user) throw new StoreError("INVALID_LOGIN");
      return (await sessionFor(data.user.id))!;
    },
    async signOut() { await sb.auth.signOut(); },

    async getTiers() { return check(await sb.from("tiers").select("*").order("sort")).map(toTier); },
    async getSettings() {
      const rows = check(await sb.from("settings").select("key, value"));
      return { saleActive: rows.find((r: Row) => r.key === "sale_active")?.value !== false };
    },
    async approvedListings(limit = 30) {
      return check(await sb.from("listings").select("*").eq("status", "approved").order("approved_at", { ascending: false }).limit(limit)).map(toListing);
    },
    async listingForToken(chain, address) {
      const { data } = await sb.from("listings").select("*").eq("status", "approved").eq("chain", chain).ilike("contract", address).maybeSingle();
      return data ? toListing(data) : null;
    },
    async activeBoosts() {
      return check(await sb.from("active_boosts").select("*")).map((r: Row): ActiveBoost => ({
        product: r.product, tierCode: r.tier_code, chain: r.chain, address: r.address, tokenName: r.token_name, tokenSymbol: r.token_symbol,
        points: r.points, bannerUrl: r.banner_url, linkUrl: r.link_url, startsAt: r.starts_at, endsAt: r.ends_at,
      }));
    },
    async hotSpot(limit = 10) {
      const rows = check(await sb.rpc("hot_spot", { p_limit: limit })) as Row[];
      return {
        rows: rows.map((r) => ({ chain: r.chain, address: r.address, name: r.name, symbol: r.symbol, logoUrl: r.logo_url, votes: r.votes, listingId: r.listing_id })),
        total: rows[0]?.total || 0,
      };
    },
    async voteStatus(chain, address) {
      const rows = check(await sb.rpc("vote_status", { p_chain: chain, p_address: address, p_client: clientId() })) as Row[];
      return { votes: rows[0]?.votes || 0, voted: !!rows[0]?.voted };
    },
    async vote(chain, address, meta) {
      const rows = check(await sb.rpc("cast_vote", { p_chain: chain, p_address: address, p_name: meta.name, p_symbol: meta.symbol, p_client: clientId() })) as Row[];
      return { votes: rows[0]?.votes || 0, voted: true };
    },

    async submitListing(input: ListingInput) {
      await uid();
      return toListing(check(await sb.from("listings").insert(fromListing(input)).select("*").single()));
    },
    async myListings() {
      const id = await uid();
      return check(await sb.from("listings").select("*").eq("user_id", id).order("submitted_at", { ascending: false })).map(toListing);
    },
    async createOrder(input) {
      await uid();
      const row = {
        product: input.product, tier_code: input.tierCode, chain: input.chain, address: input.address, token_name: input.tokenName,
        token_symbol: input.tokenSymbol, banner_url: input.bannerUrl, link_url: input.linkUrl, pay_token: input.payToken, pay_network: input.payNetwork,
      };
      return toOrder(check(await sb.from("orders").insert(row).select("*").single()));
    },
    async myOrders() {
      const id = await uid();
      return check(await sb.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false })).map(toOrder);
    },

    admin: {
      async listings() { return check(await sb.from("listings").select("*").order("submitted_at", { ascending: false }).limit(1000)).map(toListing); },
      async updateListing(id, patch) { check(await sb.from("listings").update(fromListing(patch)).eq("id", id)); },
      async orders() { return check(await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(1000)).map(toOrder); },
      async orderAction(id, action) { check(await sb.rpc("admin_order_action", { order_id: id, action })); },
      async addTrending(input) {
        check(await sb.rpc("admin_add_trending", {
          p_chain: input.chain, p_address: input.address, p_tier: input.tierCode,
          p_name: input.tokenName, p_symbol: input.tokenSymbol, p_banner: input.bannerUrl,
        }));
      },
      async updateTier(code, patch) {
        const row: Row = {};
        if (patch.priceUsd !== undefined) row.price_usd = patch.priceUsd;
        if (patch.compareAtUsd !== undefined) row.compare_at_usd = patch.compareAtUsd;
        if (patch.points !== undefined) row.points = patch.points;
        if (patch.durationHours !== undefined) row.duration_hours = patch.durationHours;
        if (patch.active !== undefined) row.active = patch.active;
        check(await sb.from("tiers").update(row).eq("code", code));
      },
      async setSettings(s) { check(await sb.from("settings").upsert({ key: "sale_active", value: s.saleActive })); },
      async users() {
        return (check(await sb.rpc("admin_users")) as Row[]).map((r): AdminUser => ({
          userId: r.user_id, username: r.username, telegram: r.telegram, isAdmin: r.is_admin, createdAt: r.created_at, listings: r.listings, orders: r.orders,
        }));
      },
      async setAdmin(userId, isAdmin) { check(await sb.from("profiles").update({ is_admin: isAdmin }).eq("id", userId)); },
    },
  };
}
