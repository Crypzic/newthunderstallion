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
import { age, price, usd } from "@/lib/format";
import { coinHref } from "./links";
import { Bolt, Close, Coins, Crosshair, Megaphone, Menu, Plus, Search, Shield, Telegram, User, Wallet, Sun, Moon } from "./icons";
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
    <Link href="/" className="flex shrink-0 items-center gap-2.5 whitespace-nowrap" aria-label={SITE.name}>
      <Image src="/brand/logo-128.png" alt="" width={48} height={48} className="rounded-lg ring-1 ring-volt/40 shadow-[0_0_18px_rgb(255_210_63/0.35)]" priority />
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

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the theme the head script applied
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("ts-theme", next); } catch {}
  };
  return (
    <button className="btn-ghost p-2.5" onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Light mode" : "Dark mode"}>
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
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
    <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-md">
      <span className="nav-glow" aria-hidden />
      <div className="container-x flex h-16 items-center gap-3">
        <Logo />
        <nav className="ml-2 hidden items-center gap-0.5 xl:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${isActive(n.href) ? "bg-panel-2 text-volt" : "text-muted hover:text-text"}`}
            >
              <n.icon size={16} className="hidden 2xl:block" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <button
            className="hidden h-10 min-w-[130px] max-w-[300px] flex-1 items-center gap-2 rounded-xl border border-line-2 bg-bg-2 px-3 text-left text-muted transition-colors hover:border-volt/50 lg:flex"
            onClick={() => open("search")}
          >
            <Search size={16} className="shrink-0" />
            <span className="truncate text-xs font-medium">{t.nav.search}</span>
            <kbd className="num ml-auto hidden rounded border border-line-2 px-1.5 text-[10px] text-faint xl:inline">/</kbd>
          </button>
          <button className="btn-ghost p-2.5 lg:hidden" onClick={() => open("search")} aria-label={t.nav.search}><Search size={16} /></button>
          <div className="hidden sm:block"><LangToggle /></div>
          <div className="hidden sm:block"><ThemeToggle /></div>
          <button className="btn-ghost hidden whitespace-nowrap sm:flex" onClick={() => open("wallet")} aria-label={t.nav.connect}>
            <Wallet size={16} /> <span className="sm:inline lg:hidden 2xl:inline">{t.nav.connect}</span>
          </button>
          <div className="hidden sm:block"><AccountButton /></div>
          <button className="btn-ghost p-2.5 xl:hidden" onClick={() => setDrawer(true)} aria-label={t.nav.menu}><Menu size={18} /></button>
        </div>
      </div>

      {drawer && createPortal(
        <div className="fixed inset-0 z-50 bg-black/70 xl:hidden" onClick={() => setDrawer(false)}>
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
              <div className="flex items-center gap-2"><LangToggle /><ThemeToggle /></div>
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
  const [trending, setTrending] = useState<Coin[]>([]);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const isOpen = dialog === "search";

  // ⌘K / Ctrl+K or "/" opens search from anywhere (except while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName || "");
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("ts:open-search"));
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Before anything is typed, suggest what's trending right now.
  useEffect(() => {
    if (!isOpen || trending.length) return;
    market.trending().then((r) => setTrending(r.slice(0, 8))).catch(() => {});
  }, [isOpen, trending.length]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    let alive = true;
    const h = setTimeout(() => {
      setBusy(true);
      market.search(q).then((r) => alive && setRows(r)).catch(() => alive && setRows([])).finally(() => alive && setBusy(false));
    }, 250);
    return () => { alive = false; clearTimeout(h); };
  }, [q]);

  const searching = q.trim().length >= 2;
  const shown = searching ? rows : trending;
  const go = (c: Coin) => { close(); setQ(""); router.push(coinHref(c.chainId, c.address)); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && shown[sel]) { e.preventDefault(); go(shown[sel]); }
  };

  return (
    <Modal open={isOpen} onClose={close} title={t.nav.search.replace("…", "")} wide>
      <div className="relative mb-2">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input autoFocus className="input py-3 pl-9 text-base" placeholder={t.nav.search} value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} spellCheck={false} autoComplete="off" />
      </div>
      <p className="eyebrow mb-1 mt-3 flex items-center gap-2">
        {searching ? (busy ? t.common.loading : `${rows.length} ${t.nav.searchResults}`) : <><Bolt size={12} className="text-volt" /> {t.nav.searchTrending}</>}
      </p>
      <ul className="flex flex-col">
        {shown.map((c, i) => (
          <li key={`${c.chainId}:${c.address}`}>
            <button
              className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left ${i === sel ? "bg-panel-2" : "hover:bg-panel-2"}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => go(c)}
            >
              <TokenAvatar src={c.image} symbol={c.symbol} chain={c.chainId} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.symbol} <span className="font-normal text-faint">/{c.quoteSymbol}</span> <span className="font-normal text-muted">{c.name}</span></span>
                <span className="num mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                  <ChainBadge chain={c.chainId} />
                  <span>{t.board.liquidity} {usd(c.liquidity)}</span>
                  <span className="hidden sm:inline">{t.board.volume} {usd(c.volume.h24)}</span>
                  <span className="hidden sm:inline">{t.board.mcap} {usd(c.marketCap)}</span>
                  <span>{age(c.createdAt)}</span>
                </span>
              </span>
              <span className="text-right">
                <span className="num block text-sm">{price(c.priceUsd)}</span>
                <Pct v={c.change.h24} className="text-xs" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {searching && !busy && rows.length === 0 && <p className="py-4 text-center text-sm text-muted">{t.common.noResults}</p>}
      <p className="mt-3 text-center text-[11px] text-faint">{t.nav.searchHint}</p>
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
