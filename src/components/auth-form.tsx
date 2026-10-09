"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_MODE } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { getStore, StoreError } from "@/lib/store";
import { Wallet } from "./icons";
import { useUi } from "./ui-state";

const USERNAME = /^[A-Za-z0-9_]{3,20}$/;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const { open } = useUi();
  const router = useRouter();
  const [f, setF] = useState({ username: "", password: "", confirm: "", telegram: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const username = f.username.trim();
    if (!USERNAME.test(username)) return setErr(t.auth.errUsername);
    if (f.password.length < 6) return setErr(t.auth.errPassword);
    if (mode === "signup" && f.password !== f.confirm) return setErr(t.auth.errMatch);
    setBusy(true);
    try {
      const store = getStore();
      if (mode === "signup") await store.signUp(username, f.password, f.telegram.trim());
      else await store.signIn(username, f.password);
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
    } catch (ex) {
      const code = ex instanceof StoreError ? ex.code : "";
      setErr(code === "USERNAME_TAKEN" ? t.auth.errTaken : code === "INVALID_LOGIN" ? t.auth.errInvalid : (ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const signup = mode === "signup";
  return (
    <div className="container-x flex justify-center pt-10 sm:pt-16">
      <form onSubmit={submit} className="card w-full max-w-md p-6 sm:p-8" noValidate>
        <h1 className="h-display text-2xl">{signup ? t.auth.signupTitle : t.auth.loginTitle}</h1>
        <p className="mt-1 text-sm text-muted">{signup ? t.auth.signupSub : t.auth.loginSub}</p>

        <div className="mt-6 flex flex-col gap-4">
          <label><span className="label">{t.auth.username}</span><input className="input" autoComplete="username" value={f.username} onChange={set("username")} autoFocus /></label>
          <label><span className="label">{t.auth.password}</span><input className="input" type="password" autoComplete={signup ? "new-password" : "current-password"} value={f.password} onChange={set("password")} /></label>
          {signup && (
            <>
              <label><span className="label">{t.auth.confirm}</span><input className="input" type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} /></label>
              <label><span className="label">{t.auth.telegram}</span><input className="input" placeholder="@handle" value={f.telegram} onChange={set("telegram")} /></label>
            </>
          )}
        </div>

        {err && <p className="mt-4 text-sm text-down" role="alert">{err}</p>}
        <button className="btn-primary mt-6 w-full" disabled={busy}>{busy ? t.common.loading : signup ? t.auth.signupBtn : t.auth.loginBtn}</button>
        <button type="button" className="btn-ghost mt-2 w-full" onClick={() => open("wallet")}><Wallet size={16} /> {t.nav.connect}</button>

        <p className="mt-6 text-center text-sm text-muted">
          {signup ? t.auth.haveAccount : t.auth.noAccount}{" "}
          <Link className="font-semibold text-volt hover:underline" href={signup ? "/login" : "/signup"}>{signup ? t.nav.login : t.nav.signup}</Link>
        </p>
        {signup && <p className="mt-4 rounded-xl bg-bg-2 p-3 text-xs text-muted">{t.auth.migrated}</p>}
        {DEMO_MODE && <p className="mt-3 rounded-xl border border-volt/20 bg-volt/8 p-3 text-xs text-volt-2">{t.auth.demoAdmin}</p>}
      </form>
    </div>
  );
}
