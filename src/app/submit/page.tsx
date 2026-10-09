"use client";
import Link from "next/link";
import { useState } from "react";
import { Check } from "@/components/icons";
import { SITE } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { market } from "@/lib/market/client";
import { getStore, StoreError, useAuth, type ListingInput, type ListingLinks } from "@/lib/store";

const CHAINS = [["solana", "Solana"], ["bsc", "BSC"], ["ethereum", "Ethereum"], ["robinhood", "Robinhood"], ["base", "Base"]] as const;
const LINK_KEYS = ["website", "twitter", "telegram", "discord", "reddit", "tiktok", "youtube", "github", "medium", "linktree", "audit", "other"] as const;

const EMPTY: ListingInput = { projectName: "", symbol: "", chain: "solana", contract: "", pairAddress: "", logoUrl: "", bannerUrl: "", description: "", category: "Meme", links: {} };

export default function SubmitPage() {
  const { t, fmt } = useI18n();
  const { session, ready } = useAuth();
  const [f, setF] = useState<ListingInput>(EMPTY);
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState("");

  const set = (k: keyof ListingInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const setLink = (k: keyof ListingLinks) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, links: { ...f.links, [k]: e.target.value } });

  const autofill = async () => {
    if (f.contract.trim().length < 26) return;
    setBusy(true);
    setMsg(null);
    try {
      const c = await market.coin(f.chain, f.contract.trim());
      if (!c) { setMsg({ kind: "err", text: t.checkout.notFound }); return; }
      const social = (type: string) => c.socials.find((s) => s.type === type)?.url || "";
      setF((cur) => ({
        ...cur,
        projectName: cur.projectName || c.name, symbol: cur.symbol || c.symbol, pairAddress: c.pairAddress,
        logoUrl: cur.logoUrl || c.image || "", bannerUrl: cur.bannerUrl || c.header || "", description: cur.description || c.description,
        links: { ...cur.links, website: cur.links.website || c.websites[0] || "", twitter: cur.links.twitter || social("twitter"), telegram: cur.links.telegram || social("telegram"), discord: cur.links.discord || social("discord") },
      }));
      setMsg({ kind: "info", text: t.submit.autofilled });
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.projectName.trim() || f.contract.trim().length < 26) { setMsg({ kind: "err", text: `${t.submit.name} / ${t.submit.contract}: ${t.common.required}` }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const links = Object.fromEntries(Object.entries(f.links).filter(([, v]) => v && v.trim()).map(([k, v]) => [k, v!.trim()]));
      const l = await getStore().submitListing({ ...f, contract: f.contract.trim(), projectName: f.projectName.trim(), symbol: f.symbol.trim().toUpperCase(), links });
      setDoneId(l.id);
    } catch (ex) {
      setMsg({ kind: "err", text: ex instanceof StoreError && ex.code === "DUPLICATE" ? t.submit.duplicate : (ex as Error).message });
    } finally {
      setBusy(false);
    }
  };

  if (ready && !session) {
    return (
      <div className="container-x flex justify-center pt-16">
        <div className="card max-w-md p-8 text-center">
          <h1 className="h-display text-2xl">{t.submit.title}</h1>
          <p className="mt-2 text-sm text-muted">{t.submit.loginFirst}</p>
          <div className="mt-6 flex gap-2">
            <Link href="/login?next=/submit" className="btn-primary flex-1">{t.nav.login}</Link>
            <Link href="/signup" className="btn-ghost flex-1">{t.nav.signup}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (doneId) {
    return (
      <div className="container-x flex justify-center pt-16">
        <div className="card max-w-md p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-up/15 text-up"><Check size={28} /></span>
          <p className="mt-4 font-semibold">{fmt(t.submit.done, { id: doneId })}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/dashboard" className="btn-primary flex-1">{t.nav.dashboard}</Link>
            <Link href="/advertising" className="btn-ghost flex-1">{t.board.boostCta}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x pt-8">
      <form onSubmit={submit} className="mx-auto max-w-3xl">
        <h1 className="h-display text-3xl">{t.submit.title}</h1>
        <p className="mt-2 text-muted">{fmt(t.submit.lead, { time: SITE.reviewTime })}</p>

        <section className="card mt-6 grid gap-4 p-5 sm:grid-cols-[140px_1fr_auto] sm:items-end">
          <label><span className="label">{t.submit.chain}</span>
            <select className="input" value={f.chain} onChange={set("chain")}>{CHAINS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          <label><span className="label">{t.submit.contract} *</span><input className="input num" value={f.contract} onChange={set("contract")} spellCheck={false} /></label>
          <button type="button" className="btn-ghost" onClick={autofill} disabled={busy || f.contract.trim().length < 26}>{t.submit.autofill}</button>
        </section>

        <section className="card mt-4 grid gap-4 p-5 sm:grid-cols-2">
          <label><span className="label">{t.submit.name} *</span><input className="input" value={f.projectName} onChange={set("projectName")} /></label>
          <label><span className="label">{t.submit.symbol}</span><input className="input" value={f.symbol} onChange={set("symbol")} /></label>
          <label><span className="label">{t.submit.logo}</span><input className="input" value={f.logoUrl} onChange={set("logoUrl")} placeholder="https://" /></label>
          <label><span className="label">{t.submit.banner}</span><input className="input" value={f.bannerUrl} onChange={set("bannerUrl")} placeholder="https://" /></label>
          <label className="sm:col-span-2"><span className="label">{t.submit.description}</span><textarea className="input min-h-28" value={f.description} onChange={set("description")} maxLength={1200} /></label>
          <label><span className="label">{t.submit.category}</span>
            <select className="input" value={f.category} onChange={set("category")}>
              {["Meme", "AI", "DeFi", "Gaming", "Infrastructure", "NFT", "RWA", "Other"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </section>

        <section className="card mt-4 p-5">
          <p className="eyebrow mb-4">{t.submit.links}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {LINK_KEYS.map((k) => (
              <label key={k}><span className="label">{t.submit[k]}</span><input className="input" value={f.links[k] || ""} onChange={setLink(k)} placeholder="https://" /></label>
            ))}
          </div>
        </section>

        {msg && <p className={`mt-4 text-sm ${msg.kind === "err" ? "text-down" : "text-up"}`} role="status">{msg.text}</p>}
        <button className="btn-primary mt-6 w-full sm:w-auto" disabled={busy}>{busy ? t.submit.sending : t.submit.send}</button>
      </form>
    </div>
  );
}
