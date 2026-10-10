"use client";
import { Coins } from "@/components/icons";
import { Empty, Pct, Spinner, TokenAvatar } from "@/components/primitives";
import { price, usd } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { market, useAsync } from "@/lib/market/client";

export default function HottestPage() {
  const { t } = useI18n();
  const data = useAsync(() => market.hottest(), [], 60_000);
  const rows = data.data || [];
  const totalVol = rows.reduce((n, r) => n + r.volume24, 0) || 1;
  return (
    <div className="container-x pt-8">
      <section className="reveal card overflow-hidden">
        <div className="border-b border-line p-4 sm:p-5">
          <h1 className="h-display flex items-center gap-2 text-xl"><Coins size={20} className="text-storm-2" /> {t.hottest.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.hottest.subtitle}</p>
        </div>
        {data.loading && !data.data ? <Spinner label={t.common.loading} /> : data.error && !data.data ? (
          <div className="p-5"><Empty>{t.common.unavailable}</Empty></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-faint">
                  <th className="w-10 py-2.5 pl-4 font-medium">{t.hottest.rank}</th>
                  <th className="py-2.5 font-medium">{t.hottest.asset}</th>
                  <th className="hidden py-2.5 text-right font-medium sm:table-cell">{t.board.price}</th>
                  <th className="py-2.5 text-right font-medium">{t.hottest.vol24}</th>
                  <th className="hidden py-2.5 pl-6 font-medium md:table-cell">{t.hottest.share}</th>
                  <th className="hidden py-2.5 text-right font-medium sm:table-cell">{t.hottest.mcap}</th>
                  <th className="py-2.5 pr-4 text-right font-medium">{t.hottest.change24}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const share = (r.volume24 / totalVol) * 100;
                  return (
                    <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-panel-2/70">
                      <td className="num py-3 pl-4 text-xs text-faint">{i + 1}</td>
                      <td className="py-3">
                        <span className="flex items-center gap-3">
                          <TokenAvatar src={r.image} symbol={r.symbol} size={30} />
                          <span><span className="block font-bold">{r.symbol}</span><span className="block text-xs text-muted">{r.name}</span></span>
                        </span>
                      </td>
                      <td className="num hidden py-3 text-right sm:table-cell">{price(r.price)}</td>
                      <td className="num py-3 text-right font-semibold">{usd(r.volume24)}</td>
                      <td className="hidden py-3 pl-6 md:table-cell">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-32 overflow-hidden rounded-full bg-panel-3"><span className="block h-full rounded-full bg-storm" style={{ width: `${Math.max(2, share)}%` }} /></span>
                          <span className="num text-xs text-muted">{share.toFixed(1)}%</span>
                        </span>
                      </td>
                      <td className="num hidden py-3 text-right text-muted sm:table-cell">{usd(r.marketCap)}</td>
                      <td className="py-3 pr-4 text-right"><Pct v={r.change24} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
