"use client";
import { useState } from "react";
import { CheckoutModal } from "@/components/checkout";
import { ArrowRight, Bolt, Check, Close, Megaphone, Star, User } from "@/components/icons";
import { Spinner } from "@/components/primitives";
import { BANNER_SPEC } from "@/lib/config";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/market/client";
import { getStore } from "@/lib/store";
import { hasEliteFrame, hasTicker, trendLevel, type Tier } from "@/lib/tiers";

const SAMPLE = { symbol: "BOLTKAT", initials: "BK" };

export default function AdvertisingPage() {
  const { t } = useI18n();
  const data = useAsync(() => Promise.all([getStore().getTiers(), getStore().getSettings()]), []);
  const [picked, setPicked] = useState<Tier | null>(null);
  const tiers = (data.data?.[0] || []).filter((x) => x.active);
  const sale = data.data?.[1].saleActive ?? false;
  const by = (p: Tier["product"]) => tiers.filter((x) => x.product === p).sort((a, b) => a.sort - b.sort);

  return (
    <div className="pb-6">
      <section className="container-x pt-10 text-center sm:pt-14">
        <p className="eyebrow text-storm-2">• {t.ads.kicker}</p>
        <h1 className="h-display mx-auto mt-4 max-w-3xl text-[clamp(30px,5.5vw,58px)] leading-[1.05]">
          {t.ads.title.split(" ").slice(0, -1).join(" ")} <span className="text-volt">{t.ads.title.split(" ").slice(-1)}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted sm:text-lg">{t.ads.lead}</p>
        {sale && (
          <p className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-up/30 bg-up/10 px-4 py-2 text-sm font-semibold text-up">
            <span className="h-2 w-2 rounded-full bg-up" /> {t.ads.sale}
          </p>
        )}
        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-2 text-sm">
          {[t.ads.chipLive, t.ads.chipTg, t.ads.chipChains, t.ads.chipInstant].map((c) => (
            <span key={c} className="rounded-full border border-line bg-panel px-4 py-2.5 font-semibold text-muted">{c}</span>
          ))}
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            { id: "profile", n: "01", name: t.ads.profileName, tag: t.ads.profileTag, icon: User },
            { id: "trend", n: "02", name: t.ads.trendName, tag: t.ads.trendTag, icon: Bolt },
            { id: "banner", n: "03", name: t.ads.bannerName, tag: t.ads.bannerTag, icon: Megaphone },
          ].map((a) => (
            <a key={a.id} href={`#${a.id}`} className="card lift group p-5">
              <p className="eyebrow">{t.ads.type} {a.n}</p>
              <p className="h-display mt-3 flex items-center justify-center gap-2 text-lg"><a.icon size={18} className="text-volt" /> {a.name}</p>
              <p className="mt-1 text-sm text-muted">{a.tag}</p>
            </a>
          ))}
        </div>
      </section>

      {data.loading ? <Spinner /> : (
        <>
          <ProfileSection tiers={by("profile")} onPick={setPicked} />
          <TrendSection tiers={by("trend")} sale={sale} onPick={setPicked} />
          <BannerSection tiers={by("banner")} onPick={setPicked} />
        </>
      )}

      <section className="container-x mt-20">
        <h2 className="h-display text-center text-2xl">{t.ads.howItWorks}</h2>
        <ol className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-3">
          {[t.ads.step1, t.ads.step2, t.ads.step3].map((s, i) => (
            <li key={s} className="reveal card p-5">
              <span className="num text-sm font-bold text-volt">0{i + 1}</span>
              <p className="mt-2 text-sm">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <CheckoutModal tier={picked} onClose={() => setPicked(null)} />
    </div>
  );
}

function SectionHead({ id, n, name, lead }: { id: string; n: string; name: string; lead: string }) {
  const { t } = useI18n();
  return (
    <div id={id} className="mx-auto max-w-2xl scroll-mt-24 text-center">
      <p className="eyebrow inline-block rounded-full border border-storm/30 bg-storm/10 px-4 py-1.5 text-storm-2">{t.ads.type} {n} · {name}</p>
      <h2 className="h-display mt-4 text-3xl">{name}</h2>
      <p className="mt-3 text-muted">{lead}</p>
    </div>
  );
}

function Perk({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-3 text-sm ${on ? "" : "text-faint"}`}>
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${on ? "bg-storm/25 text-storm-2" : "bg-panel-3 text-faint"}`}>
        {on ? <Check size={12} /> : <Close size={11} />}
      </span>
      {children}
    </li>
  );
}

function ProfileSection({ tiers, onPick }: { tiers: Tier[]; onPick: (t: Tier) => void }) {
  const { t } = useI18n();
  const elite = tiers.find((x) => x.code === "elite");
  const p = t.ads.perks;
  return (
    <section className="container-x mt-20">
      <SectionHead id="profile" n="01" name={t.ads.profileName} lead={t.ads.profileLead} />
      <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
        <div className="reveal card lift flex flex-col p-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow rounded-full bg-panel-3 px-3 py-1">{t.ads.freeProfile}</span>
            <span className="h-display text-3xl text-faint">$0</span>
          </div>
          <ul className="mt-6 flex flex-col gap-3">
            <Perk on>{p.basicInfo}</Perk><Perk on>{p.chart}</Perk><Perk on>{p.socialsOnchain}</Perk>
            <Perk on={false}>{p.noBanner}</Perk><Perk on={false}>{p.noSection}</Perk><Perk on={false}>{p.noAnnouncement}</Perk>
          </ul>
          <p className="eyebrow mt-6 border-t border-line pt-5">{t.ads.preview}</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <div className="m-3 flex h-16 items-center justify-center rounded-lg border border-dashed border-line-2 text-xs text-faint">{t.ads.noBanner}</div>
            <div className="flex items-center gap-3 border-t border-line p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-3 font-mono text-xs font-bold text-muted">{SAMPLE.initials}</span>
              <span className="text-sm font-semibold">{SAMPLE.symbol} <span className="font-normal text-faint">/ SOL</span></span>
            </div>
          </div>
        </div>
        {elite && (
          <div className="reveal card lift flex flex-col border-storm/40 bg-[linear-gradient(160deg,rgb(91_140_255/0.12),transparent_60%)] p-6">
            <div className="flex items-center justify-between">
              <span className="eyebrow rounded-full bg-storm/20 px-3 py-1 text-storm-2">{t.ads.eliteProfile}</span>
              <span className="text-right"><span className="h-display text-3xl">{money(elite.priceUsd)}</span><span className="block text-xs text-muted">{t.common.perUpdate}</span></span>
            </div>
            <ul className="mt-6 flex flex-col gap-3">
              <Perk on>{p.enhancedInfo}</Perk><Perk on>{p.chart}</Perk><Perk on>{p.socialsFull}</Perk>
              <Perk on>{p.profileBanner}</Perk><Perk on>{p.premiumDesign}</Perk><Perk on>{p.tgListing}</Perk>
            </ul>
            <p className="eyebrow mt-6 border-t border-line pt-5">{t.ads.preview}</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-storm/30">
              <div className="h-16 bg-[linear-gradient(120deg,#1b2a55,#3b2a6e_55%,#ffd23f_140%)]" />
              <div className="flex items-center gap-3 p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-volt font-mono text-xs font-bold text-volt-ink">{SAMPLE.initials}</span>
                <span className="text-sm font-semibold">{SAMPLE.symbol} <span className="font-normal text-faint">/ SOL</span></span>
                <span className="num ml-auto text-sm text-up">+24.3%</span>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
                {["Website", "X", "Telegram", "Discord"].map((l) => <span key={l} className="rounded-md border border-line px-2 py-1 text-xs text-muted">{l}</span>)}
              </div>
            </div>
            <button className="btn-primary mt-6 w-full" onClick={() => onPick(elite)}>{t.ads.getStarted} <ArrowRight size={16} /></button>
          </div>
        )}
      </div>
    </section>
  );
}

function TrendSection({ tiers, sale, onPick }: { tiers: Tier[]; sale: boolean; onPick: (t: Tier) => void }) {
  const { t, fmt } = useI18n();
  return (
    <section className="container-x mt-24">
      <SectionHead id="trend" n="02" name={t.ads.trendName} lead={t.ads.trendLead} />

      <ol className="mx-auto mt-8 flex max-w-md flex-col items-center gap-2">
        {tiers.slice(1).map((tier) => {
          const lvl = trendLevel(tier.code);
          return (
            <li key={tier.code} className="card w-full px-4 py-3 text-center">
              <p className={`text-sm font-semibold ${hasTicker(lvl) ? "text-gold" : ""}`}>{t.ads.tierNames[tier.code as keyof typeof t.ads.tierNames]}</p>
              <p className="num mt-1 text-xs text-muted">
                <span className="font-bold text-storm-2">{t.ads.tier.toUpperCase()} {lvl}</span> · {money(tier.priceUsd)}
                {sale && tier.compareAtUsd ? <s className="ml-2 text-faint">{money(tier.compareAtUsd)}</s> : null}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {tiers.map((tier) => <TrendTierCard key={tier.code} tier={tier} sale={sale} onPick={onPick} />)}
      </div>
      <p className="mt-4 text-center text-xs text-faint">{fmt(t.ads.bannerSpec, { w: BANNER_SPEC.width, h: BANNER_SPEC.height, formats: BANNER_SPEC.formats, mb: BANNER_SPEC.maxMb })} — Tier 4 & 5</p>
    </section>
  );
}

function TrendTierCard({ tier, sale, onPick }: { tier: Tier; sale: boolean; onPick: (t: Tier) => void }) {
  const { t, fmt } = useI18n();
  const lvl = trendLevel(tier.code);
  const copy = t.ads.tiers[tier.code as keyof typeof t.ads.tiers];
  const popular = lvl === 3;
  const off = sale && tier.compareAtUsd ? Math.round((1 - tier.priceUsd / tier.compareAtUsd) * 100) : 0;
  return (
    <div className={`reveal card lift relative flex flex-col p-5 ${popular ? "border-storm/60 bg-[linear-gradient(170deg,rgb(91_140_255/0.14),transparent_55%)]" : ""} ${hasEliteFrame(lvl) ? "border-volt/50" : ""}`}>
      {popular && (
        <span className="eyebrow absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-storm px-3 py-1 text-white">
          <Star size={11} /> {t.ads.mostPopular}
        </span>
      )}
      <p className="eyebrow text-storm-2">{t.ads.tier} 0{lvl}</p>
      <div className="mt-3 flex items-center gap-2">
        {off > 0 && <><s className="num text-sm text-faint">{money(tier.compareAtUsd!)}</s><span className="pill bg-up/12 text-up">-{off}%</span></>}
      </div>
      <p className="h-display mt-1 text-4xl">{money(tier.priceUsd)}</p>
      <p className={`mt-1 text-sm ${lvl >= 3 ? "text-gold" : "text-muted"}`}>
        {fmt(lvl >= 3 ? t.ads.durationExtended : t.ads.duration, { n: tier.durationHours || 0 })}
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-volt/25 bg-volt/8 px-3 py-2.5">
        <Bolt filled size={16} className="text-volt" />
        <span className="num text-lg font-bold">{tier.points.toLocaleString()}</span>
        <span className="eyebrow">{t.common.points}</span>
      </div>
      <p className="mt-4 min-h-[60px] text-sm text-muted">{copy.desc}</p>

      <p className="eyebrow mt-4">{lvl >= 3 ? `${t.ads.yourProfile} · ${lvl >= 5 ? "Thunder Elite" : "Thunder Ticker"}` : t.ads.yourRow}</p>
      <div className={`mt-2 flex items-center gap-2 rounded-xl border border-line bg-bg-2 px-3 py-2.5 ${hasEliteFrame(lvl) ? "elite-frame" : ""} ${lvl >= 3 && lvl < 5 ? "border-l-2 border-l-gold" : ""}`}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-storm/30 font-mono text-[9px] font-bold text-storm-2">{SAMPLE.initials}</span>
        <span className={`truncate text-sm font-bold ${hasTicker(lvl) ? "ticker-gold" : ""}`}>{SAMPLE.symbol}</span>
        <span className="pill-volt ml-auto"><Bolt filled size={10} /> {tier.points.toLocaleString()}</span>
      </div>

      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {copy.perks.map((perk, i) => (
          <li key={perk} className={`flex gap-2 text-sm ${i === 0 && lvl > 1 ? "text-faint" : ""}`}>
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${i === 0 && lvl > 1 ? "bg-faint" : "bg-storm-2"}`} />
            <span className={i > 0 && lvl >= 3 ? "text-gold" : ""}>{perk}</span>
          </li>
        ))}
      </ul>
      <button className={`${popular || lvl === 5 ? "btn-primary" : "btn-ghost"} mt-5 w-full`} onClick={() => onPick(tier)}>{t.ads.getStarted}</button>
    </div>
  );
}

function BannerSection({ tiers, onPick }: { tiers: Tier[]; onPick: (t: Tier) => void }) {
  const { t, fmt } = useI18n();
  return (
    <section className="container-x mt-24">
      <SectionHead id="banner" n="03" name={t.ads.bannerName} lead={t.ads.bannerLead} />
      <div className="mx-auto mt-8 max-w-4xl">
        <div className="reveal flex aspect-[3/1] items-center justify-center rounded-2xl border border-dashed border-volt/40 bg-[linear-gradient(120deg,rgb(255_210_63/0.08),rgb(91_140_255/0.10))] text-center">
          <div>
            <p className="h-display num text-2xl sm:text-4xl">{BANNER_SPEC.width} × {BANNER_SPEC.height}</p>
            <p className="mt-2 text-sm text-muted">{fmt(t.ads.bannerSpec, { w: BANNER_SPEC.width, h: BANNER_SPEC.height, formats: BANNER_SPEC.formats, mb: BANNER_SPEC.maxMb })}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_2fr]">
          <div className="card p-5">
            <p className="eyebrow">{t.ads.placements}</p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {[t.ads.placementHome, t.ads.placementTrenches, t.ads.placementCoin].map((p) => <Perk key={p} on>{p}</Perk>)}
            </ul>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {tiers.map((tier) => (
              <div key={tier.code} className="reveal card lift flex flex-col p-5">
                <p className="eyebrow">{t.ads.bannerTiers[tier.code as keyof typeof t.ads.bannerTiers]}</p>
                <p className="h-display mt-2 text-3xl">{money(tier.priceUsd)}</p>
                <button className="btn-ghost mt-auto w-full pt-2.5" style={{ marginTop: 20 }} onClick={() => onPick(tier)}>{t.ads.getStarted}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
