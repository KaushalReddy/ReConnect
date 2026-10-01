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
  const { login, loginWithPhoneUser } = useAuth();
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

          {/* Toggle between Email/Password and Phone SMS OTP */}
          <div className="mt-6 mb-6 flex rounded-lg bg-ink/5 p-1">
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
