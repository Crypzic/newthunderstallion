"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { DEMO_MODE } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { getStore, StoreError } from "@/lib/store";
import { Wallet } from "./icons";
import { useUi } from "./ui-state";

// Letters (any language), numbers, spaces and _ . -  — kept in step with the profiles check in supabase/schema.sql
const USERNAME = /^[\p{L}\p{N}_. -]{3,20}$/u;
const cleanName = (v: string) => v.trim().replace(/\s+/g, " ");
type Field = "username" | "password" | "confirm";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const { open } = useUi();
  const router = useRouter();
  const [f, setF] = useState({ username: "", password: "", confirm: "", telegram: "" });
  const [errs, setErrs] = useState<Partial<Record<Field, string>>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const pwId = useId();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    if (errs[k as Field]) setErrs({ ...errs, [k]: undefined }); // clear a field's error as soon as it's edited
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const username = cleanName(f.username);
    const found: Partial<Record<Field, string>> = {};
    if (!USERNAME.test(username)) found.username = t.auth.errUsername;
    if (f.password.length < 6) found.password = t.auth.errPassword;
    if (mode === "signup" && !found.password && f.password !== f.confirm) found.confirm = t.auth.errMatch;
    setErrs(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const store = getStore();
      if (mode === "signup") await store.signUp(username, f.password, f.telegram.trim());
      else await store.signIn(username, f.password);
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
    } catch (ex) {
      const code = ex instanceof StoreError ? ex.code : "";
      if (code === "USERNAME_TAKEN") setErrs({ username: t.auth.errTaken });
      else if (code === "WEAK_PASSWORD") setErrs({ password: t.auth.errWeak });
      else setErr(code === "INVALID_LOGIN" ? t.auth.errInvalid : (ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const signup = mode === "signup";
  const note = (k: Field, hint?: string) =>
    errs[k] ? <span className="mt-1.5 block text-xs text-down" role="alert">{errs[k]}</span>
      : hint ? <span className="mt-1.5 block text-xs text-faint">{hint}</span> : null;
  const bad = (k: Field) => (errs[k] ? " border-down/60" : "");

  return (
    <div className="container-x flex justify-center pt-10 sm:pt-16">
      <form onSubmit={submit} className="card w-full max-w-md p-6 sm:p-8" noValidate>
        <h1 className="h-display text-2xl">{signup ? t.auth.signupTitle : t.auth.loginTitle}</h1>
        <p className="mt-1 text-sm text-muted">{signup ? t.auth.signupSub : t.auth.loginSub}</p>

        <div className="mt-6 flex flex-col gap-4">
          <label>
            <span className="label">{t.auth.username}</span>
            <input className={"input" + bad("username")} autoComplete="username" autoCapitalize="none" spellCheck={false} value={f.username} onChange={set("username")} autoFocus aria-invalid={!!errs.username} />
            {note("username", signup ? t.auth.hintUsername : undefined)}
          </label>
          <div>
            <label className="label" htmlFor={pwId}>{t.auth.password}</label>
            <div className="relative">
              <input id={pwId} className={"input pr-16" + bad("password")} type={showPw ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} value={f.password} onChange={set("password")} aria-invalid={!!errs.password} />
              <button type="button" className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-semibold text-muted hover:text-text" onClick={() => setShowPw(!showPw)} aria-pressed={showPw}>
                {showPw ? t.auth.hide : t.auth.show}
              </button>
            </div>
            {note("password", signup ? t.auth.hintPassword : undefined)}
          </div>
          {signup && (
            <>
              <label>
                <span className="label">{t.auth.confirm}</span>
                <input className={"input" + bad("confirm")} type={showPw ? "text" : "password"} autoComplete="new-password" value={f.confirm} onChange={set("confirm")} aria-invalid={!!errs.confirm} />
                {note("confirm")}
              </label>
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
