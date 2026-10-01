"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dashboardPathForRole } from "@/lib/utils";
import type { UserRole } from "@/types";
import NetworkSeal from "@/components/NetworkSeal";
import EmailOtpVerification from "@/components/auth/EmailOtpVerification";
import PhoneOtpVerification from "@/components/auth/PhoneOtpVerification";

const ROLE_OPTIONS: { value: UserRole; label: string; blurb: string }[] = [
  { value: "STUDENT", label: "Student", blurb: "Currently enrolled" },
  { value: "ALUMNI", label: "Alumni", blurb: "Graduated" },
  { value: "FACULTY", label: "Faculty", blurb: "Teaching staff" },
];

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    default:
      return "Something went wrong creating your account. Please try again.";
  }
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");

  // OTP Verification States
  const [verificationType, setVerificationType] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVerified = isEmailVerified || isPhoneVerified;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isVerified) {
      setError("Please complete OTP verification (Email or Phone SMS) before continuing.");
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, role, {
        phoneNumber: verifiedPhone || undefined,
        isEmailVerified,
        isPhoneVerified,
        verificationMethod: isEmailVerified && isPhoneVerified ? "BOTH" : isEmailVerified ? "EMAIL" : "PHONE",
      });
      router.push(dashboardPathForRole(role));
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(friendlyAuthError(code));
      setSubmitting(false);
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
          &ldquo;The directory used to live in three retired staff members&apos;
          inboxes. Now it lives in one place everyone can search.&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <h1 className="font-display text-3xl font-medium text-ink">
            Create your account
          </h1>
          <p className="mt-2 font-body text-sm text-ink-500">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-brass-dark underline underline-offset-2">
              Log in
            </Link>
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="field-label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Jordan Ellis"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailVerified(false);
                }}
                className="input-field"
                placeholder="you@university.edu"
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <span className="field-label">I am a</span>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      role === opt.value
                        ? "border-brass bg-brass/10"
                        : "border-ink/15 hover:border-ink/30"
                    }`}
                  >
                    <span className="block font-body text-sm font-medium text-ink">
                      {opt.label}
                    </span>
                    <span className="block font-body text-[11px] text-ink-400">
                      {opt.blurb}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* OTP Verification Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="field-label !mb-0">Identity Verification</span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-verdant/15 px-2.5 py-0.5 font-mono text-[10px] text-verdant-dark font-medium">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase text-rust font-medium">
                    * Verification required
                  </span>
                )}
              </div>

              {/* Selector Tabs */}
              <div className="mb-3 flex rounded-lg bg-ink/5 p-1">
                <button
                  type="button"
                  onClick={() => setVerificationType("EMAIL")}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    verificationType === "EMAIL"
                      ? "bg-paper text-ink shadow-sm"
                      : "text-ink-400 hover:text-ink"
                  }`}
                >
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationType("PHONE")}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    verificationType === "PHONE"
                      ? "bg-paper text-ink shadow-sm"
                      : "text-ink-400 hover:text-ink"
                  }`}
                >
                  Phone SMS OTP
                </button>
              </div>

              {verificationType === "EMAIL" ? (
                <EmailOtpVerification
                  email={email}
                  onVerified={() => setIsEmailVerified(true)}
                />
              ) : (
                <PhoneOtpVerification
                  initialPhoneNumber={verifiedPhone}
                  onVerified={(phone) => {
                    setIsPhoneVerified(true);
                    setVerifiedPhone(phone);
                  }}
                  containerIdSuffix="register"
                />
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-rust/10 px-3 py-2 font-body text-sm text-rust">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !isVerified}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Creating account…"
                : isVerified
                ? "Complete Registration"
                : "Verify via OTP to Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
