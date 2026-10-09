"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BANNER_SPEC, NETWORKS, PAY_TOKENS, SITE, type PayToken } from "@/lib/config";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { market } from "@/lib/market/client";
import { getStore, useAuth, type Order } from "@/lib/store";
import type { Tier } from "@/lib/tiers";
import { Check, Telegram, Wallet } from "./icons";
import { Modal } from "./primitives";
import { useTierLabel } from "./tier-copy";

const TOKEN_CHAINS = [...NETWORKS.map((n) => ({ id: n.chainIds[0], label: n.label })), { id: "base", label: "Base" }];

export function CheckoutModal({ tier, onClose, preset }: { tier: Tier | null; onClose: () => void; preset?: { chain: string; address: string } }) {
  const { t, fmt } = useI18n();
  const { session } = useAuth();
  const label = useTierLabel();
  const [chain, setChain] = useState(preset?.chain || "solana");
  const [address, setAddress] = useState(preset?.address || "");
  const [token, setToken] = useState<{ name: string; symbol: string } | null>(null);
  const [lookup, setLookup] = useState<"idle" | "busy" | "found" | "missing">("idle");
  const [bannerUrl, setBannerUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [payToken, setPayToken] = useState<PayToken>("USDC");
  const [payNetwork, setPayNetwork] = useState("solana");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Order | null>(null);

  const needsBanner = tier?.product === "banner" || (tier?.product === "trend" && Number(tier.code[1]) >= 4);
  const networks = PAY_TOKENS.find((p) => p.id === payToken)!.networks;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep the network valid for the chosen pay token
    if (!(networks as readonly string[]).includes(payNetwork)) setPayNetwork(networks[0]);
  }, [networks, payNetwork]);

  useEffect(() => {
    const a = address.trim();
    if (a.length < 26) return;
    let alive = true;
    const h = setTimeout(() => {
      setLookup("busy");
      market.coin(chain, a).then((c) => {
        if (!alive) return;
        if (c) { setToken({ name: c.name, symbol: c.symbol }); setLookup("found"); } else { setToken(null); setLookup("missing"); }
      }).catch(() => alive && setLookup("missing"));
    }, 400);
    return () => { alive = false; clearTimeout(h); };
  }, [chain, address]);

  if (!tier) return null;
  const close = () => { setDone(null); setErr(""); onClose(); };

  const submit = async () => {
    setErr("");
    if (address.trim().length < 26) return setErr(t.checkout.address);
    if (needsBanner && tier.product === "banner" && !/^https?:\/\//.test(bannerUrl.trim())) return setErr(fmt(t.checkout.bannerUrl, { w: BANNER_SPEC.width, h: BANNER_SPEC.height }));
    setBusy(true);
    try {
      const order = await getStore().createOrder({
        product: tier.product, tierCode: tier.code, chain, address: address.trim(),
        tokenName: token?.name || "", tokenSymbol: token?.symbol || "",
        bannerUrl: bannerUrl.trim(), linkUrl: linkUrl.trim(), payToken, payNetwork,
      });
      setDone(order);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={close} title={done ? t.checkout.successTitle : t.checkout.title}>
      {done ? (
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-up/15 text-up"><Check size={28} /></span>
          <p className="text-sm text-muted">{fmt(t.checkout.successBody, { id: done.id, admin: SITE.adminTelegram })}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href={SITE.adminTelegramUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1"><Telegram size={16} /> {t.checkout.dmAdmin}</a>
            <Link href="/dashboard#orders" className="btn-ghost flex-1" onClick={close}>{t.checkout.viewOrders}</Link>
          </div>
        </div>
      ) : !session ? (
        <div className="space-y-4">
          <Summary tier={tier} name={label(tier)} />
          <Link href="/login" className="btn-primary w-full" onClick={close}>{t.checkout.loginFirst}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          <Summary tier={tier} name={label(tier)} />
          <div>
            <span className="label">{t.checkout.chain}</span>
            <div className="flex flex-wrap gap-1.5">
              {TOKEN_CHAINS.map((c) => (
                <button key={c.id} className={`chip ${chain === c.id ? "chip-on" : ""}`} onClick={() => setChain(c.id)}>{c.label}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="label">{t.checkout.address}</span>
            <input className="input num" value={address} onChange={(e) => { setAddress(e.target.value); setLookup("idle"); }} placeholder="0x… / So1…" spellCheck={false} />
            <span className={`mt-1.5 block text-xs ${lookup === "found" ? "text-up" : "text-muted"}`}>
              {lookup === "busy" ? t.common.loading : lookup === "found" && token ? fmt(t.checkout.found, token) : lookup === "missing" ? t.checkout.notFound : t.checkout.addressHint}
            </span>
          </label>
          {needsBanner && (
            <>
              <label className="block">
                <span className="label">{fmt(t.checkout.bannerUrl, { w: BANNER_SPEC.width, h: BANNER_SPEC.height })}</span>
                <input className="input" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://…/banner.png" />
              </label>
              <label className="block">
                <span className="label">{t.checkout.bannerLink}</span>
                <input className="input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" />
              </label>
            </>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="label">{t.checkout.payWith}</span>
              <div className="flex flex-wrap gap-1.5">
                {PAY_TOKENS.map((p) => (
                  <button key={p.id} className={`chip num ${payToken === p.id ? "chip-on" : ""}`} onClick={() => setPayToken(p.id)}>{p.id}</button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">{t.checkout.payNetwork}</span>
              <div className="flex flex-wrap gap-1.5">
                {networks.map((n) => (
                  <button key={n} className={`chip ${payNetwork === n ? "chip-on" : ""}`} onClick={() => setPayNetwork(n)}>
                    {NETWORKS.find((x) => x.chainIds.includes(n))?.label || n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button disabled className="btn-ghost w-full"><Wallet size={16} /> {t.checkout.connectWallet} · {t.common.comingSoon}</button>
          <p className="rounded-xl border border-line bg-bg-2 p-3 text-xs text-muted">{t.checkout.walletSoon}</p>
          {err && <p className="text-sm text-down">{err}</p>}
          <button className="btn-primary w-full" onClick={submit} disabled={busy}>{busy ? t.common.loading : `${t.checkout.submit} · ${money(tier.priceUsd)}`}</button>
        </div>
      )}
    </Modal>
  );
}

function Summary({ tier, name }: { tier: Tier; name: string }) {
  const { t, fmt } = useI18n();
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-bg-2 p-3">
      <div>
        <p className="eyebrow">{t.checkout.product}</p>
        <p className="mt-1 font-semibold">{name}</p>
        <p className="text-xs text-muted">{tier.durationHours ? fmt(t.common.hours, { n: tier.durationHours }) : t.common.permanent}</p>
      </div>
      <div className="text-right">
        <p className="eyebrow">{t.checkout.total}</p>
        <p className="h-display mt-1 text-xl">{money(tier.priceUsd)}</p>
      </div>
    </div>
  );
}
