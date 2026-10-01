"use client";

import { useState, useEffect } from "react";

interface Props {
  email: string;
  onVerified: (email: string) => void;
  onEmailChange?: (newEmail: string) => void;
  isEmailEditable?: boolean;
  className?: string;
}

export default function EmailOtpVerification({
  email,
  onVerified,
  onEmailChange,
  isEmailEditable = false,
  className = "",
}: Props) {
  const [currentEmail, setCurrentEmail] = useState(email);
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (email !== currentEmail) {
      setCurrentEmail(email);
      setToken(null);
      setDevCode(null);
      setOtp("");
      setError(null);
      setSuccessMsg(null);
      setIsVerified(false);
    }
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSendOtp() {
    const targetEmail = currentEmail.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsSending(true);

    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setToken(data.token);
      setDevCode(data.devCode || null);
      setSuccessMsg(`Verification code sent to ${targetEmail}. Please check your inbox.`);
      setCooldown(60);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send OTP.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (!token) {
      setError("Please request a verification code first.");
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentEmail.trim(),
          otp: otp.trim(),
          token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid verification code.");
      }

      setIsVerified(true);
      setSuccessMsg("Email successfully verified!");
      onVerified(currentEmail.trim());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed.";
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  }

  if (isVerified) {
    return (
      <div className={`rounded-xl border border-verdant/30 bg-verdant/10 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-verdant text-paper">
            ✓
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-verdant-dark">
              Email Verified
            </p>
            <p className="font-body text-xs text-ink-500">{currentEmail}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-ink/10 bg-paper p-4 text-left ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-body text-sm font-medium text-ink">Email Verification</span>
          <p className="font-body text-xs text-ink-400">
            A 6-digit security code will be sent to your email.
          </p>
        </div>
        <span className="rounded-full bg-ink/10 px-2 py-0.5 font-mono text-[10px] text-ink-500 uppercase">
          Required
        </span>
      </div>

      {isEmailEditable ? (
        <div className="mt-3">
          <input
            type="email"
            placeholder="you@university.edu"
            value={currentEmail}
            onChange={(e) => {
              setCurrentEmail(e.target.value);
              onEmailChange?.(e.target.value);
            }}
            className="input-field text-sm"
          />
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-ink/10 bg-ink/[0.02] px-3 py-2">
          <div className="truncate">
            <span className="block font-mono text-[10px] text-ink-400 uppercase">Send code to</span>
            <span className="font-body text-xs font-medium text-ink truncate">
              {currentEmail || "Please enter your email above"}
            </span>
          </div>
          {currentEmail && (
            <span className="shrink-0 rounded-full bg-brass/10 px-2 py-0.5 font-mono text-[10px] text-brass-dark">
              Ready
            </span>
          )}
        </div>
      )}

      {/* Trigger button or OTP entry fields */}
      {!token ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={isSending || !currentEmail || !currentEmail.includes("@")}
            className="btn-secondary w-full text-xs font-medium !py-2.5"
          >
            {isSending
              ? "Sending Verification Code…"
              : currentEmail && currentEmail.includes("@")
              ? `Send Verification Code to ${currentEmail}`
              : "Enter your email above to send code"}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="field-label text-xs">Enter 6-Digit Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="input-field font-mono text-center text-lg tracking-widest"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 6}
                className="btn-primary shrink-0 !px-5 !py-2 text-xs"
              >
                {isVerifying ? "Verifying…" : "Verify"}
              </button>
            </div>
          </div>

          {devCode && (
            <div className="flex items-center justify-between rounded-lg bg-brass/10 border border-brass/30 px-3 py-2">
              <div className="text-xs text-brass-dark font-body">
                <span className="font-medium">Dev Preview Code:</span>{" "}
                <code className="font-mono font-bold">{devCode}</code>
              </div>
              <button
                type="button"
                onClick={() => setOtp(devCode)}
                className="text-[11px] font-mono text-brass-dark underline hover:opacity-80"
              >
                Auto-fill
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="font-body text-xs text-ink-400">
              Didn&apos;t receive the email?
            </span>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={cooldown > 0 || isSending}
              className="font-body text-xs font-medium text-brass-dark hover:underline disabled:text-ink-300 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-rust/10 p-2 font-body text-xs text-rust">
          {error}
        </p>
      )}

      {successMsg && !error && (
        <p className="mt-3 rounded-lg bg-verdant/10 p-2 font-body text-xs text-verdant-dark">
          {successMsg}
        </p>
      )}
    </div>
  );
}
