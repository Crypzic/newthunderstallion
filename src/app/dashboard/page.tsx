"use client";
import Link from "next/link";
import { coinHref } from "@/components/links";
import { Empty, Spinner, StatusBadge, TokenAvatar } from "@/components/primitives";
import { useTierLabel } from "@/components/tier-copy";
import { dateTime, money, timeLeft } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/market/client";
import { getStore, useAuth } from "@/lib/store";

export default function DashboardPage() {
  const { t, fmt } = useI18n();
  const { session, ready } = useAuth();
  const label = useTierLabel();
  const data = useAsync(
    () => (session ? Promise.all([getStore().myListings(), getStore().myOrders()]) : Promise.resolve(null)),
    [session?.userId],
  );

  if (!ready) return <Spinner />;
  if (!session) {
    return (
      <div className="container-x flex justify-center pt-16">
        <Link href="/login?next=/dashboard" className="btn-primary">{t.nav.login}</Link>
      </div>
    );
  }
  const [listings, orders] = data.data || [[], []];
  const count = (s: string) => listings.filter((l) => l.status === s).length;

  return (
    <div className="container-x pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t.dash.title}</p>
          <h1 className="h-display mt-1 text-3xl">{fmt(t.dash.hello, { name: session.username })}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/submit" className="btn-ghost">{t.nav.submit}</Link>
          <Link href="/advertising" className="btn-primary">{t.board.boostCta}</Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[[t.dash.pending, count("pending"), "text-volt"], [t.dash.approved, count("approved"), "text-up"], [t.dash.rejected, count("rejected"), "text-down"], [t.dash.total, listings.length, ""]].map(([k, v, c]) => (
          <div key={k as string} className="card p-4">
            <p className="text-xs text-muted">{k}</p>
            <p className={`h-display num mt-1 text-3xl ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      {data.loading && !data.data ? <Spinner /> : (
        <>
          <section className="card mt-6 overflow-hidden">
            <h2 className="h-display border-b border-line px-5 py-4 text-lg">{t.dash.listings}</h2>
            {listings.length === 0 ? <div className="p-5"><Empty>{t.dash.noListings}</Empty></div> : (
              <ul>
                {listings.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-3 border-b border-line/60 px-5 py-3 last:border-0">
                    <TokenAvatar src={l.logoUrl} symbol={l.symbol} chain={l.chain} />
                    <div className="min-w-0 flex-1">
                      <Link href={coinHref(l.chain, l.contract)} className="font-semibold hover:text-volt">{l.projectName}</Link>
                      <p className="num text-xs text-faint">{l.id} · {dateTime(l.submittedAt)}</p>
                      {l.status === "rejected" && l.rejectedReason && <p className="text-xs text-down">{t.dash.reason}: {l.rejectedReason}</p>}
                    </div>
                    <StatusBadge status={l.status} label={t.status[l.status]} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="orders" className="card mt-6 scroll-mt-24 overflow-hidden">
            <h2 className="h-display border-b border-line px-5 py-4 text-lg">{t.dash.orders}</h2>
            {orders.length === 0 ? <div className="p-5"><Empty>{t.dash.noOrders}</Empty></div> : (
              <ul>
                {orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 border-b border-line/60 px-5 py-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{label({ code: o.tierCode, product: o.product })}</p>
                      <p className="num text-xs text-faint">{o.id} · {o.tokenSymbol || o.address.slice(0, 10)} · {money(o.amountUsd)} {o.payToken}</p>
                    </div>
                    {o.status === "active" && <span className="num text-xs text-muted">{t.admin.ends}: {timeLeft(o.endsAt)}</span>}
                    <StatusBadge status={o.status} label={t.status[o.status]} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
