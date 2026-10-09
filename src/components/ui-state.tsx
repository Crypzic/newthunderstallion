"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { NetworkId } from "@/lib/config";

// Small app-wide UI state: the selected network filter (shared by the board,
// trenches and the mobile drawer) and which global dialog is open.

type Dialog = null | "wallet" | "search";
type Ctx = { network: NetworkId; setNetwork: (n: NetworkId) => void; dialog: Dialog; open: (d: Dialog) => void; close: () => void };
const UiContext = createContext<Ctx | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<NetworkId>("all");
  const [dialog, setDialog] = useState<Dialog>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ts-network") as NetworkId | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved filter after hydration
      if (saved) setNetworkState(saved);
    } catch {}
  }, []);

  const setNetwork = useCallback((n: NetworkId) => {
    setNetworkState(n);
    try { localStorage.setItem("ts-network", n); } catch {}
  }, []);

  const value = useMemo(() => ({ network, setNetwork, dialog, open: setDialog, close: () => setDialog(null) }), [network, setNetwork, dialog]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}
