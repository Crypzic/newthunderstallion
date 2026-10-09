"use client";
import { useEffect, useState } from "react";
import { chainShort, NETWORKS } from "@/lib/config";
import { Close } from "./icons";

/** Token logo with a lettered fallback when the image is missing or broken. */
export function TokenAvatar({ src, symbol, size = 32, chain }: { src?: string | null; symbol: string; size?: number; chain?: string }) {
  const [broken, setBroken] = useState(false);
  const letters = (symbol || "?").replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
  const color = NETWORKS.find((n) => n.chainIds.includes(chain || ""))?.color;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote token logos from many hosts
        <img src={src} alt="" width={size} height={size} loading="lazy" onError={() => setBroken(true)} className="h-full w-full rounded-full bg-panel-3 object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-panel-3 font-mono font-bold text-muted" style={{ fontSize: size * 0.34 }}>
          {letters}
        </span>
      )}
      {chain && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel" style={{ background: color || "#5b6377" }} title={chainShort(chain)} />
      )}
    </span>
  );
}

export function ChainBadge({ chain }: { chain: string }) {
  const color = NETWORKS.find((n) => n.chainIds.includes(chain))?.color || "#8d95a8";
  return (
    <span className="pill border border-line" style={{ color }}>
      {chainShort(chain)}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose} role="dialog" aria-modal aria-label={title}>
      <div
        className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-2xl sm:p-6 ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="h-display text-lg">{title}</h2>
          <button className="btn-quiet -mr-2 p-2" onClick={onClose} aria-label="Close"><Close /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-volt/30 border-t-volt" />
      {label}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line-2 px-4 py-10 text-center text-sm text-muted">{children}</div>;
}

export function Pct({ v, className = "" }: { v: number; className?: string }) {
  return <span className={`num ${v > 0 ? "up" : v < 0 ? "down" : "text-muted"} ${className}`}>{`${v > 0 ? "+" : ""}${(Math.round(v * 10) / 10).toFixed(1)}%`}</span>;
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone: Record<string, string> = {
    approved: "bg-up/12 text-up", active: "bg-up/12 text-up",
    pending: "bg-volt/12 text-volt", awaiting_payment: "bg-volt/12 text-volt",
    rejected: "bg-down/12 text-down", cancelled: "bg-down/12 text-down",
    expired: "bg-panel-3 text-muted",
  };
  return <span className={`pill ${tone[status] || "bg-panel-3 text-muted"}`}>{label}</span>;
}
