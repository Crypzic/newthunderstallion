"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { coinHref } from "@/components/links";
import { Empty, Modal, Spinner, StatusBadge, TokenAvatar } from "@/components/primitives";
import { useTierLabel } from "@/components/tier-copy";
import { chainShort } from "@/lib/config";
import { dateTime, money, shortAddr, timeLeft } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { getStore, isRunning, useAuth, type AdminUser, type Listing, type Order, type OrderAction, type Settings } from "@/lib/store";
import type { Tier } from "@/lib/tiers";

type Tab = "overview" | "listings" | "orders" | "pricing" | "users";
type Data = { listings: Listing[]; orders: Order[]; tiers: Tier[]; settings: Settings; users: AdminUser[] };

export default function AdminPage() {
  const { t } = useI18n();
  const { session, ready } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const s = getStore();
    try {
      const [listings, orders, tiers, settings, users] = await Promise.all([s.admin.listings(), s.admin.orders(), s.getTiers(), s.getSettings(), s.admin.users()]);
      setData({ listings, orders, tiers, settings, users });
      setErr("");
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin data load
    if (session?.isAdmin) void load();
  }, [session?.isAdmin, load]);

  if (!ready) return <Spinner />;
  if (!session?.isAdmin) {
    return (
      <div className="container-x flex justify-center pt-16">
        <div className="card max-w-md p-8 text-center">
          <p className="text-sm text-muted">{t.admin.noAccess}</p>
          {!session && <Link href="/login?next=/admin" className="btn-primary mt-5">{t.nav.login}</Link>}
        </div>
      </div>
    );
  }

  const tabs: [Tab, string, number?][] = [
    ["overview", t.admin.overview],
    ["listings", t.admin.listings, data?.listings.filter((l) => l.status === "pending").length],
    ["orders", t.admin.orders, data?.orders.filter((o) => o.status === "awaiting_payment").length],
    ["pricing", t.admin.pricing],
    ["users", t.admin.users],
  ];

  return (
    <div className="container-x pt-8">
      <h1 className="h-display text-3xl">{t.admin.title}</h1>
      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([id, label, badge]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === id ? "border-volt text-volt" : "border-transparent text-muted hover:text-text"}`}>
            {label}{badge ? <span className="pill bg-volt text-volt-ink">{badge}</span> : null}
          </button>
        ))}
      </div>
      {err && <p className="mt-4 text-sm text-down">{err}</p>}
      {!data ? <Spinner /> : (
        <div className="mt-6">
          {tab === "overview" && <Overview data={data} reload={load} goto={setTab} />}
          {tab === "listings" && <Listings rows={data.listings} reload={load} />}
          {tab === "orders" && <Orders rows={data.orders} reload={load} />}
          {tab === "pricing" && <Pricing tiers={data.tiers} settings={data.settings} reload={load} />}
          {tab === "users" && <Users rows={data.users} me={session.userId} reload={load} />}
        </div>
      )}
    </div>
  );
}

function Overview({ data, reload, goto }: { data: Data; reload: () => Promise<void>; goto: (t: Tab) => void }) {
  const { t } = useI18n();
  const revenue = data.orders.filter((o) => o.status === "active" || o.status === "expired").reduce((n, o) => n + o.amountUsd, 0);
  const awaiting = data.orders.filter((o) => o.status === "awaiting_payment");
  const running = data.orders.filter((o) => isRunning(o));
  const pending = data.listings.filter((l) => l.status === "pending");
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([[t.admin.revenue, money(revenue), "text-up", "orders"], [t.admin.awaiting, awaiting.length, "text-volt", "orders"], [t.admin.activeBoosts, running.length, "text-storm-2", "orders"], [t.admin.pendingListings, pending.length, "text-volt", "listings"]] as const).map(([k, v, c, to]) => (
          <button key={k} className="card p-4 text-left hover:border-line-2" onClick={() => goto(to)}>
            <p className="text-xs text-muted">{k}</p>
            <p className={`h-display num mt-1 text-3xl ${c}`}>{v}</p>
          </button>
        ))}
      </div>
      <h2 className="h-display mt-8 text-lg">{t.admin.awaiting}</h2>
      <div className="mt-3"><Orders rows={awaiting} reload={reload} compact /></div>
      <h2 className="h-display mt-8 text-lg">{t.admin.pendingListings}</h2>
      <div className="mt-3"><Listings rows={pending} reload={reload} compact /></div>
    </>
  );
}

function Filter<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string, number][] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {options.map(([v, label, n]) => (
        <button key={v} className={`chip ${value === v ? "chip-on" : ""}`} onClick={() => onChange(v)}>{label} <span className="num opacity-70">{n}</span></button>
      ))}
    </div>
  );
}

function Listings({ rows, reload, compact }: { rows: Listing[]; reload: () => Promise<void>; compact?: boolean }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<"all" | Listing["status"]>("pending");
  const [editing, setEditing] = useState<Listing | null>(null);
  const shown = compact || filter === "all" ? rows : rows.filter((l) => l.status === filter);
  const act = async (id: string, patch: Parameters<ReturnType<typeof getStore>["admin"]["updateListing"]>[1]) => {
    try { await getStore().admin.updateListing(id, patch); await reload(); } catch (e) { alert((e as Error).message); }
  };
  return (
    <>
      {!compact && (
        <Filter value={filter} onChange={setFilter} options={[
          ["pending", t.status.pending, rows.filter((l) => l.status === "pending").length],
          ["approved", t.status.approved, rows.filter((l) => l.status === "approved").length],
          ["rejected", t.status.rejected, rows.filter((l) => l.status === "rejected").length],
          ["all", t.admin.filterAll, rows.length],
        ]} />
      )}
      {shown.length === 0 ? <Empty>{t.common.noResults}</Empty> : (
        <div className="card divide-y divide-line/60">
          {shown.map((l) => (
            <div key={l.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <TokenAvatar src={l.logoUrl} symbol={l.symbol} chain={l.chain} size={36} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={coinHref(l.chain, l.contract)} className="font-semibold hover:text-volt">{l.projectName}</Link>
                    <span className="text-xs text-muted">{l.symbol} · {chainShort(l.chain)}</span>
                    <StatusBadge status={l.status} label={t.status[l.status]} />
                    {l.featured && <span className="pill-volt">★</span>}
                  </p>
                  <p className="num truncate text-xs text-faint">{l.id} · {shortAddr(l.contract)} · @{l.username || "—"} · {dateTime(l.submittedAt)} · {l.adminVotes} admin {t.common.votes}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {l.status !== "approved" && <button className="btn-primary btn-sm" onClick={() => act(l.id, { status: "approved", rejectedReason: "" })}>{t.admin.approve}</button>}
                {l.status !== "rejected" && (
                  <button className="btn-ghost btn-sm" onClick={() => { const r = prompt(t.admin.rejectReason); if (r !== null) void act(l.id, { status: "rejected", rejectedReason: r }); }}>{t.admin.reject}</button>
                )}
                <button className="btn-ghost btn-sm" onClick={() => act(l.id, { featured: !l.featured })}>{l.featured ? t.admin.unfeature : t.admin.feature}</button>
                <button className="btn-ghost btn-sm" onClick={() => {
                  const n = Math.floor(Number(prompt(t.admin.addVotes, "10")));
                  if (n > 0) void act(l.id, { adminVotes: l.adminVotes + n });
                }}>+ {t.common.votes}</button>
                <button className="btn-quiet btn-sm" onClick={() => setEditing(l)}>{t.common.edit}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <EditListing listing={editing} onClose={() => setEditing(null)} onSave={async (patch) => { await act(editing.id, patch); setEditing(null); }} />}
    </>
  );
}

function EditListing({ listing, onClose, onSave }: { listing: Listing; onClose: () => void; onSave: (p: Partial<Listing>) => Promise<void> }) {
  const { t } = useI18n();
  const [f, setF] = useState({ projectName: listing.projectName, symbol: listing.symbol, logoUrl: listing.logoUrl, bannerUrl: listing.bannerUrl, description: listing.description });
  const field = (k: keyof typeof f, label: string, area = false) => (
    <label className="block">
      <span className="label">{label}</span>
      {area ? <textarea className="input min-h-24" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        : <input className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}
    </label>
  );
  return (
    <Modal open onClose={onClose} title={`${t.common.edit} · ${listing.id}`}>
      <div className="flex flex-col gap-3">
        {field("projectName", t.submit.name)}{field("symbol", t.submit.symbol)}{field("logoUrl", t.submit.logo)}{field("bannerUrl", t.submit.banner)}{field("description", t.submit.description, true)}
        <button className="btn-primary mt-2" onClick={() => onSave(f)}>{t.common.save}</button>
      </div>
    </Modal>
  );
}

function Orders({ rows, reload, compact }: { rows: Order[]; reload: () => Promise<void>; compact?: boolean }) {
  const { t } = useI18n();
  const label = useTierLabel();
  const [filter, setFilter] = useState<"all" | Order["status"]>("awaiting_payment");
  const shown = compact || filter === "all" ? rows : rows.filter((o) => o.status === filter);
  const act = async (id: string, a: OrderAction) => {
    try { await getStore().admin.orderAction(id, a); await reload(); } catch (e) { alert((e as Error).message); }
  };
  const statuses: Order["status"][] = ["awaiting_payment", "active", "expired", "cancelled"];
  return (
    <>
      {!compact && <Filter value={filter} onChange={setFilter} options={[...statuses.map((s): [Order["status"], string, number] => [s, t.status[s], rows.filter((o) => o.status === s).length]), ["all", t.admin.filterAll, rows.length]]} />}
      {shown.length === 0 ? <Empty>{t.common.noResults}</Empty> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-faint">
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="py-2.5 font-medium">{t.admin.product}</th>
                <th className="py-2.5 font-medium">{t.checkout.token}</th>
                <th className="py-2.5 font-medium">{t.admin.customer}</th>
                <th className="py-2.5 text-right font-medium">{t.admin.pay}</th>
                <th className="py-2.5 pl-4 font-medium">{t.dash.status}</th>
                <th className="py-2.5 pr-4 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id} className="border-b border-line/60 last:border-0">
                  <td className="num px-4 py-3 text-xs text-muted">{o.id}<br /><span className="text-faint">{dateTime(o.createdAt)}</span></td>
                  <td className="py-3 font-semibold">{label({ code: o.tierCode, product: o.product })}</td>
                  <td className="py-3">
                    <Link href={coinHref(o.chain, o.address)} className="hover:text-volt">{o.tokenSymbol || shortAddr(o.address)}</Link>
                    <span className="block text-xs text-faint">{chainShort(o.chain)}{o.bannerUrl && <> · <a href={o.bannerUrl} target="_blank" rel="noopener noreferrer" className="underline">banner</a></>}</span>
                  </td>
                  <td className="py-3">@{o.username}</td>
                  <td className="num py-3 text-right">{money(o.amountUsd)}<span className="block text-xs text-faint">{o.payToken} · {o.payNetwork}</span></td>
                  <td className="py-3 pl-4">
                    <StatusBadge status={o.status} label={t.status[o.status]} />
                    {o.status === "active" && <span className="num block text-xs text-faint">{t.admin.ends}: {timeLeft(o.endsAt)}</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-1.5">
                      {o.status === "awaiting_payment" && <>
                        <button className="btn-primary btn-sm" onClick={() => act(o.id, "activate")}>{t.admin.activate}</button>
                        <button className="btn-ghost btn-sm" onClick={() => confirm(`${t.admin.cancelOrder} ${o.id}?`) && act(o.id, "cancel")}>{t.admin.cancelOrder}</button>
                      </>}
                      {o.status === "active" && <>
                        {o.endsAt && <button className="btn-ghost btn-sm" onClick={() => act(o.id, "extend")}>{t.admin.extend}</button>}
                        <button className="btn-ghost btn-sm" onClick={() => confirm(`${t.admin.endNow} ${o.id}?`) && act(o.id, "end")}>{t.admin.endNow}</button>
                      </>}
                      {o.status === "expired" && o.endsAt && <button className="btn-ghost btn-sm" onClick={() => act(o.id, "extend")}>{t.admin.extend}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Pricing({ tiers, settings, reload }: { tiers: Tier[]; settings: Settings; reload: () => Promise<void> }) {
  const { t } = useI18n();
  const label = useTierLabel();
  const [saved, setSaved] = useState("");
  const sorted = useMemo(() => [...tiers].sort((a, b) => a.product.localeCompare(b.product) || a.sort - b.sort), [tiers]);
  return (
    <>
      <label className="card mb-4 flex cursor-pointer items-center gap-3 p-4">
        <input type="checkbox" className="h-4 w-4 accent-[#ffd23f]" checked={settings.saleActive}
          onChange={async (e) => { await getStore().admin.setSettings({ saleActive: e.target.checked }); await reload(); }} />
        <span className="text-sm font-semibold">{t.admin.saleToggle}</span>
      </label>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-faint">
              <th className="px-4 py-2.5 font-medium">{t.admin.product}</th>
              <th className="py-2.5 font-medium">{t.admin.price}</th>
              <th className="py-2.5 font-medium">{t.admin.compareAt}</th>
              <th className="py-2.5 font-medium">{t.admin.points}</th>
              <th className="py-2.5 font-medium">{t.admin.duration}</th>
              <th className="py-2.5 font-medium">{t.admin.active}</th>
              <th className="py-2.5 pr-4" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((tier) => <TierRow key={tier.code} tier={tier} name={label(tier)} onSaved={async () => { setSaved(tier.code); await reload(); setTimeout(() => setSaved(""), 1500); }} saved={saved === tier.code} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TierRow({ tier, name, onSaved, saved }: { tier: Tier; name: string; onSaved: () => Promise<void>; saved: boolean }) {
  const { t } = useI18n();
  const [f, setF] = useState({
    priceUsd: String(tier.priceUsd), compareAtUsd: tier.compareAtUsd == null ? "" : String(tier.compareAtUsd),
    points: String(tier.points), durationHours: tier.durationHours == null ? "" : String(tier.durationHours), active: tier.active,
  });
  const num = (k: "priceUsd" | "compareAtUsd" | "points" | "durationHours") => (
    <input className="input num w-24 py-1.5" inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
  );
  const save = async () => {
    const n = (v: string) => (v.trim() === "" ? null : Number(v));
    await getStore().admin.updateTier(tier.code, {
      priceUsd: Number(f.priceUsd) || 0, compareAtUsd: n(f.compareAtUsd), points: Math.floor(Number(f.points) || 0), durationHours: n(f.durationHours), active: f.active,
    });
    await onSaved();
  };
  return (
    <tr className="border-b border-line/60 last:border-0">
      <td className="px-4 py-2.5 font-semibold">{name}<span className="num block text-xs text-faint">{tier.code}</span></td>
      <td className="py-2.5">{num("priceUsd")}</td>
      <td className="py-2.5">{num("compareAtUsd")}</td>
      <td className="py-2.5">{num("points")}</td>
      <td className="py-2.5">{num("durationHours")}</td>
      <td className="py-2.5"><input type="checkbox" className="h-4 w-4 accent-[#ffd23f]" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /></td>
      <td className="py-2.5 pr-4 text-right"><button className="btn-ghost btn-sm" onClick={save}>{saved ? t.admin.saved : t.common.save}</button></td>
    </tr>
  );
}

function Users({ rows, me, reload }: { rows: AdminUser[]; me: string; reload: () => Promise<void> }) {
  const { t } = useI18n();
  if (!rows.length) return <Empty>{t.common.noResults}</Empty>;
  return (
    <div className="card divide-y divide-line/60">
      {rows.map((u) => (
        <div key={u.userId} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">@{u.username} {u.isAdmin && <span className="pill-volt ml-1">admin</span>}</p>
            <p className="text-xs text-faint">{u.telegram || "—"} · {t.admin.joined} {dateTime(u.createdAt)} · {u.listings} {t.dash.listings.toLowerCase()} · {u.orders} {t.dash.orders.toLowerCase()}</p>
          </div>
          {u.userId !== me && (
            <button className="btn-ghost btn-sm" onClick={async () => { await getStore().admin.setAdmin(u.userId, !u.isAdmin); await reload(); }}>
              {u.isAdmin ? t.admin.removeAdmin : t.admin.makeAdmin}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
