"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import NetworkSeal from "@/components/NetworkSeal";
import PhoneOtpVerification from "@/components/auth/PhoneOtpVerification";
import type { UserCredential } from "firebase/auth";

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password combination doesn't match our records.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong signing you in. Please try again.";
  }
}

export default function LoginPage() {
  const { login, loginWithPhoneUser, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [loginMethod, setLoginMethod] = useState<"PASSWORD" | "PHONE_OTP">("PASSWORD");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(friendlyAuthError(code));
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed before completing.");
      } else if (code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked. Please enable popups for this site.");
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
      setSubmitting(false);
    }
  }

  async function handlePhoneVerified(_phone: string, credential?: UserCredential) {
    if (credential?.user) {
      setSubmitting(true);
      try {
        await loginWithPhoneUser(credential.user);
        router.push("/dashboard");
      } catch (err) {
        setError("Failed to sign in with verified phone number.");
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink px-12 py-12 md:flex">
        <Link href="/" className="font-display text-lg font-semibold text-paper">
          ReConnect
        </Link>
        <div className="flex justify-center">
          <NetworkSeal className="w-64 opacity-90 [&_text]:fill-paper [&_circle]:stroke-paper" />
        </div>
        <p className="max-w-sm font-body text-sm leading-relaxed text-ink-200">
          One login, four roles, and a directory that stays current on its own.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-medium text-ink">Welcome back</h1>
          <p className="mt-2 font-body text-sm text-ink-500">
            New here?{" "}
            <Link href="/register" className="font-medium text-brass-dark underline underline-offset-2">
              Create an account
            </Link>
          </p>

          {/* Google Sign-in Provider */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-ink/15 bg-paper px-4 py-2.5 font-body text-sm font-medium text-ink shadow-sm transition-all hover:bg-ink/[0.03] hover:border-ink/30 disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
              or continue with
            </span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          {/* Toggle between Email/Password and Phone SMS OTP */}
          <div className="mb-6 flex rounded-lg bg-ink/5 p-1">
            <button
              type="button"
              onClick={() => {
                setLoginMethod("PASSWORD");
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                loginMethod === "PASSWORD"
                  ? "bg-paper text-ink shadow-sm"
                  : "text-ink-400 hover:text-ink"
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod("PHONE_OTP");
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                loginMethod === "PHONE_OTP"
                  ? "bg-paper text-ink shadow-sm"
                  : "text-ink-400 hover:text-ink"
              }`}
            >
              Phone SMS OTP
            </button>
          </div>

          {loginMethod === "PASSWORD" ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="field-label" htmlFor="email">
                  Email or Username
                </label>
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@university.edu or admin"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-rust/10 px-3 py-2 font-body text-sm text-rust">
                  {error}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Signing in…" : "Log in"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <PhoneOtpVerification
                onVerified={handlePhoneVerified}
                containerIdSuffix="login"
                mode="login"
              />

              {submitting && (
                <p className="text-center font-body text-xs text-ink-500">
                  Signing you into your account…
                </p>
              )}

              {error && (
                <p className="rounded-lg bg-rust/10 px-3 py-2 font-body text-sm text-rust">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
