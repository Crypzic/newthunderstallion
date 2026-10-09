"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { DEMO_MODE } from "../config";
import { createDemoStore } from "./demo";
import { createSupabaseStore } from "./supabase";
import type { Session, Store } from "./types";

export * from "./types";

let instance: Store | null = null;
/** The single data store for the browser: Supabase when configured, demo otherwise. */
export function getStore(): Store {
  if (!instance) instance = DEMO_MODE ? createDemoStore() : createSupabaseStore();
  return instance;
}

type AuthState = { session: Session | null; ready: boolean };
const AuthContext = createContext<AuthState>({ session: null, ready: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, ready: false });
  useEffect(() => {
    const store = getStore();
    let alive = true;
    store.getSession().then((session) => alive && setState({ session, ready: true }), () => alive && setState({ session: null, ready: true }));
    const off = store.onAuthChange((session) => alive && setState({ session, ready: true }));
    return () => { alive = false; off(); };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
