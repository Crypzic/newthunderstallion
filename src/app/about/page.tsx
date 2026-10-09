"use client";
import Link from "next/link";
import { Bolt } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

const COPY = {
  en: {
    title: "About Thunder Stallion",
    body: [
      "Thunder Stallion is a multi-chain discovery board. We track live market data from DexScreener, surface fresh launches in the Trenches, and let the community vote on the projects they believe in.",
      "Projects can list for free, or use Thunder Advertising — Thunder Trend boosts, Elite Profiles and banner ads — to get in front of more traders.",
      "Nothing on this site is financial advice. Always do your own research.",
    ],
  },
  zh: {
    title: "关于雷霆种马",
    body: [
      "雷霆种马是一个多链代币发现榜单。我们实时追踪 DexScreener 行情数据，在新币战壕展示刚上线的代币，并让社区为他们看好的项目投票。",
      "项目可以免费上架，也可以通过雷霆广告 — 雷霆趋势加速、精英主页和横幅广告 — 获得更多交易者的关注。",
      "本网站内容不构成投资建议，请务必自行研究。",
    ],
  },
};

export default function AboutPage() {
  const { locale, t } = useI18n();
  const c = COPY[locale];
  return (
    <div className="container-x max-w-3xl pt-12">
      <h1 className="h-display flex items-center gap-3 text-3xl"><Bolt filled className="text-volt" size={28} /> {c.title}</h1>
      <div className="mt-6 space-y-4 text-muted">{c.body.map((p) => <p key={p}>{p}</p>)}</div>
      <div className="mt-8 flex gap-2">
        <Link href="/" className="btn-primary">{t.nav.trending}</Link>
        <Link href="/advertising" className="btn-ghost">{t.nav.advertising}</Link>
      </div>
    </div>
  );
}
