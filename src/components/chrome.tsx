"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEMO_MODE, NETWORKS, SITE, type NetworkId } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { market } from "@/lib/market/client";
import type { Coin } from "@/lib/market/types";
import { getStore, useAuth } from "@/lib/store";
import { price } from "@/lib/format";
import { coinHref } from "./links";
import { Bolt, Close, Coins, Crosshair, Megaphone, Menu, Plus, Search, Shield, Telegram, User, Wallet } from "./icons";
import { ChainBadge, Modal, Pct, TokenAvatar } from "./primitives";
import { useUi } from "./ui-state";

function useNav() {
  const { t } = useI18n();
  return [
    { href: "/", label: t.nav.trending, icon: Bolt },
    { href: "/trenches", label: t.nav.trenches, icon: Crosshair },
    { href: "/hottest", label: t.nav.hottest, icon: Coins },
    { href: "/advertising", label: t.nav.advertising, icon: Megaphone },
    { href: "/submit", label: t.nav.submit, icon: Plus },
  ];
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={SITE.name}>
      <Image src="/brand/logo-64.png" alt="" width={32} height={32} className="rounded-lg" priority />
      <span className="h-display text-[15px] leading-none">
        THUNDER<span className="text-volt">STALLION</span>
      </span>
    </Link>
  );
}

export function LangToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex rounded-lg border border-line bg-panel-2 p-0.5 text-xs font-bold" role="group" aria-label="Language">
      {(["en", "zh"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-md px-2 py-1 transition-colors ${locale === l ? "bg-storm/20 text-storm-2" : "text-muted hover:text-text"}`}
          aria-pressed={locale === l}
        >
          {l === "en" ? "EN" : "中"}
        </button>
      ))}
    </div>
  );
}

export function NetworkChips({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const { network, setNetwork } = useUi();
  const opts: { id: NetworkId; label: string; color?: string }[] = [
    { id: "all", label: t.common.all },
    ...NETWORKS.map((n) => ({ id: n.id, label: n.label, color: n.color })),
    { id: "others", label: t.common.others },
  ];
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {opts.map((o) => (
        <button key={o.id} className={`chip ${network === o.id ? "chip-on" : ""}`} onClick={() => setNetwork(o.id)} aria-pressed={network === o.id}>
          {o.color && <span className="h-2 w-2 rounded-full" style={{ background: o.color }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AccountButton({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const { session, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);
  if (!ready) return <span className="h-9 w-20" />;
  if (!session) {
    return (
      <Link href="/login" className={`${compact ? "btn-ghost btn-sm" : "btn-ghost"} whitespace-nowrap`}>
        <User size={16} /> {t.nav.login}
      </Link>
    );
  }
  return (
    <div className="relative" ref={ref}>
      <button className={compact ? "btn-ghost btn-sm" : "btn-ghost"} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <User size={16} /> <span className="max-w-[110px] truncate">{session.username}</span>
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-40 mt-2 w-48 p-1.5 shadow-2xl">
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-panel-2" onClick={() => setOpen(false)}>{t.nav.dashboard}</Link>
          {session.isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-volt hover:bg-panel-2" onClick={() => setOpen(false)}>
              <Shield size={14} /> {t.nav.admin}
            </Link>
          )}
          <button
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-panel-2 hover:text-text"
            onClick={async () => { setOpen(false); await getStore().signOut(); router.push("/"); }}
          >
            {t.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { t } = useI18n();
  const nav = useNav();
  // Only the first URL segment is needed, and it is static even on dynamic routes,
  // so the navbar can render in the prerendered shell without a Suspense boundary.
  const segment = useSelectedLayoutSegment();
  const { open } = useUi();
  const [drawer, setDrawer] = useState(false);
  const isActive = (href: string) => (href === "/" ? segment === null : segment === href.slice(1));

  // Close the drawer when the route changes (it lives outside the page tree).
  const [lastSegment, setLastSegment] = useState(segment);
  if (lastSegment !== segment) { setLastSegment(segment); setDrawer(false); }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center gap-4">
        <Logo />
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${isActive(n.href) ? "bg-panel-2 text-volt" : "text-muted hover:text-text"}`}
            >
              <n.icon size={16} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-ghost hidden w-56 justify-start text-muted 2xl:flex" onClick={() => open("search")}>
            <Search size={16} /> <span className="truncate text-xs font-medium">{t.nav.search}</span>
          </button>
          <button className="btn-ghost p-2.5 2xl:hidden" onClick={() => open("search")} aria-label={t.nav.search}><Search size={16} /></button>
          <div className="hidden sm:block"><LangToggle /></div>
          <button className="btn-ghost hidden whitespace-nowrap sm:flex" onClick={() => open("wallet")}><Wallet size={16} /> {t.nav.connect}</button>
          <div className="hidden sm:block"><AccountButton /></div>
          <button className="btn-ghost p-2.5 lg:hidden" onClick={() => setDrawer(true)} aria-label={t.nav.menu}><Menu size={18} /></button>
        </div>
      </div>

      {drawer && createPortal(
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setDrawer(false)}>
          <aside className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col gap-6 overflow-y-auto border-l border-line bg-bg-2 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <Logo />
              <button className="btn-quiet p-2" onClick={() => setDrawer(false)} aria-label="Close"><Close /></button>
            </div>
            <nav className="flex flex-col gap-2">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${isActive(n.href) ? "border-storm/40 bg-storm/12 text-storm-2" : "border-line bg-panel text-text"}`}>
                  <n.icon size={18} /> {n.label}
                </Link>
              ))}
            </nav>
            <div>
              <p className="eyebrow mb-2">{t.nav.network}</p>
              <NetworkChips />
            </div>
            <div className="flex items-center justify-between">
              <p className="eyebrow">{t.nav.language}</p>
              <LangToggle />
            </div>
            <div className="flex flex-col gap-2">
              <button className="btn-ghost w-full border-storm/40 bg-storm/10" onClick={() => { setDrawer(false); open("wallet"); }}>
                <Wallet size={16} /> {t.nav.connect}
              </button>
              <AccountButton />
            </div>
            <CommunityLinks />
          </aside>
        </div>,
        document.body,
      )}
    </header>
  );
}

function CommunityLinks() {
  const { t } = useI18n();
  return (
    <div>
      <p className="eyebrow mb-2">{t.nav.community}</p>
      <div className="flex flex-wrap gap-2">
        {SITE.community.map((c) => (
          <a key={c.href} href={c.href} target="_blank" rel="noopener noreferrer" className="chip">
            {c.kind === "tg" ? <Telegram size={12} /> : null} {c.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  const { t, fmt } = useI18n();
  const nav = useNav();
  const [year, setYear] = useState(2026);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- current year is only known on the client
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer className="mt-20 border-t border-line">
      <div className="container-x grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1.2fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted">{SITE.tagline}</p>
        </div>
        <nav className="grid grid-cols-2 gap-2 text-sm">
          {nav.map((n) => <Link key={n.href} href={n.href} className="text-muted hover:text-text">{n.label}</Link>)}
          <Link href="/about" className="text-muted hover:text-text">{t.footer.about}</Link>
        </nav>
        <CommunityLinks />
      </div>
      <div className="border-t border-line py-5">
        <p className="container-x text-xs text-faint">{fmt(t.footer.rights, { year })}</p>
      </div>
    </footer>
  );
}

export function DemoNotice() {
  const { t } = useI18n();
  if (!DEMO_MODE) return null;
  return <div className="border-b border-volt/20 bg-volt/8 px-4 py-2 text-center text-xs text-volt-2">{t.common.demoBanner}</div>;
}

export function WalletDialog() {
  const { t } = useI18n();
  const { dialog, close } = useUi();
  const wallets = [
    { name: t.wallet.phantom, chains: "Solana" },
    { name: t.wallet.metamask, chains: "Ethereum · BSC" },
    { name: t.wallet.coinbase, chains: "Ethereum · BSC · Solana" },
    { name: t.wallet.walletconnect, chains: "Multi-chain" },
  ];
  return (
    <Modal open={dialog === "wallet"} onClose={close} title={t.wallet.title}>
      <p className="mb-4 rounded-xl border border-volt/25 bg-volt/8 p-3 text-sm text-volt-2">{t.wallet.soon}</p>
      <div className="flex flex-col gap-2">
        {wallets.map((w) => (
          <button key={w.name} disabled className="flex items-center justify-between rounded-xl border border-line bg-panel-2 px-4 py-3 text-left opacity-70">
            <span className="flex items-center gap-3">
              <Wallet size={18} />
              <span>
                <span className="block text-sm font-semibold">{w.name}</span>
                <span className="block text-xs text-muted">{w.chains}</span>
              </span>
            </span>
            <span className="pill bg-panel-3 text-muted">{t.common.comingSoon}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Link href="/login" className="btn-primary flex-1" onClick={close}>{t.nav.login}</Link>
        <Link href="/signup" className="btn-ghost flex-1" onClick={close}>{t.nav.signup}</Link>
      </div>
    </Modal>
  );
}

export function SearchDialog() {
  const { t } = useI18n();
  const { dialog, close } = useUi();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Coin[]>([]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); document.dispatchEvent(new CustomEvent("ts:open-search")); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) return;
    let alive = true;
    const h = setTimeout(() => {
      setBusy(true);
      market.search(q).then((r) => alive && setRows(r)).catch(() => alive && setRows([])).finally(() => alive && setBusy(false));
    }, 250);
    return () => { alive = false; clearTimeout(h); };
  }, [q]);
  const shown = q.trim().length < 2 ? [] : rows;

  return (
    <Modal open={dialog === "search"} onClose={close} title={t.nav.search.replace("…", "")}>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input autoFocus className="input pl-9" placeholder={t.nav.search} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {busy && <p className="py-2 text-xs text-muted">{t.common.loading}</p>}
      <ul className="flex flex-col">
        {shown.map((c) => (
          <li key={`${c.chainId}:${c.address}`}>
            <button
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-panel-2"
              onClick={() => { close(); router.push(coinHref(c.chainId, c.address)); }}
            >
              <TokenAvatar src={c.image} symbol={c.symbol} chain={c.chainId} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.symbol} <span className="font-normal text-muted">{c.name}</span></span>
                <span className="mt-0.5 flex items-center gap-2"><ChainBadge chain={c.chainId} /></span>
              </span>
              <span className="text-right">
                <span className="num block text-sm">{price(c.priceUsd)}</span>
                <Pct v={c.change.h24} className="text-xs" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!busy && q.trim().length >= 2 && shown.length === 0 && <p className="py-4 text-center text-sm text-muted">{t.common.noResults}</p>}
    </Modal>
  );
}

/** Lets ⌘K open search from anywhere. */
export function SearchHotkey() {
  const { open } = useUi();
  useEffect(() => {
    const h = () => open("search");
    document.addEventListener("ts:open-search", h);
    return () => document.removeEventListener("ts:open-search", h);
  }, [open]);
  return null;
}
