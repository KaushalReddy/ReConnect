"use client";

import { useState, useEffect, useRef } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/firebase/config";

interface Props {
  initialPhoneNumber?: string;
  onVerified: (phoneNumber: string, credential?: UserCredential) => void;
  onPhoneChange?: (phone: string) => void;
  className?: string;
  containerIdSuffix?: string;
}

export default function PhoneOtpVerification({
  initialPhoneNumber = "",
  onVerified,
  onPhoneChange,
  className = "",
  containerIdSuffix = "default",
}: Props) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const [recaptchaKey, setRecaptchaKey] = useState(0);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const activeContainerId = `recaptcha-container-${containerIdSuffix}-${recaptchaKey}`;

  useEffect(() => {
    setPhoneNumber(initialPhoneNumber);
  }, [initialPhoneNumber]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function cleanupVerifier() {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // ignore
      }
      recaptchaVerifierRef.current = null;
    }
  }

  // Cleanup verifier on unmount
  useEffect(() => {
    return () => {
      cleanupVerifier();
    };
  }, []);

  function setupRecaptchaVerifier() {
    if (typeof window === "undefined") return null;

    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    const container = document.getElementById(activeContainerId);
    if (container) {
      container.innerHTML = "";
    }

    const verifier = new RecaptchaVerifier(auth, activeContainerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved - allow signInWithPhoneNumber
      },
      "expired-callback": () => {
        setError("reCAPTCHA expired. Please try sending the SMS code again.");
      },
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  }

  function resetRecaptcha() {
    cleanupVerifier();
    setRecaptchaKey((k) => k + 1);
  }

  async function handleSendSms() {
    const raw = phoneNumber.trim();
    if (!raw || raw.length < 8) {
      setError("Please enter a valid phone number including country code (e.g., +15555555555).");
      return;
    }

    // Ensure phone number starts with '+' for E.164 standard
    const formatted = raw.startsWith("+") ? raw : `+${raw}`;

    setError(null);
    setSuccessMsg(null);
    setIsSending(true);

    try {
      const verifier = setupRecaptchaVerifier();
      if (!verifier) {
        throw new Error("Unable to initialize verification service.");
      }

      const confirmation = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirmationResult(confirmation);
      setSuccessMsg(`SMS verification code sent to ${formatted}.`);
      setCooldown(60);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const message = (err as { message?: string })?.message;

      if (code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Please include country code, e.g. +14155552671.");
      } else if (code === "auth/operation-not-allowed") {
        setError(
          "SMS is restricted for this region (+91/India). Either enable India in Firebase Console > Authentication > Settings > SMS region policy, OR add this number under 'Phone numbers for testing' to test instantly."
        );
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few moments before trying again.");
      } else if (code === "auth/quota-exceeded") {
        setError("SMS quota exceeded. If testing, please configure Firebase test phone numbers.");
      } else {
        setError(message || "Failed to send SMS code. Please verify the phone number.");
      }

      // Reset recaptcha with a fresh DOM element on error
      resetRecaptcha();
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyCode() {
    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit SMS verification code.");
      return;
    }

    if (!confirmationResult) {
      setError("Please request an SMS verification code first.");
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const formatted = phoneNumber.trim().startsWith("+")
        ? phoneNumber.trim()
        : `+${phoneNumber.trim()}`;

      const credential = await confirmationResult.confirm(otp.trim());
      setIsVerified(true);
      setSuccessMsg("Phone number successfully verified!");
      onVerified(formatted, credential);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/invalid-verification-code") {
        setError("Invalid verification code. Please check the code received via SMS.");
      } else if (code === "auth/code-expired") {
        setError("SMS code has expired. Please request a new code.");
      } else {
        setError("Failed to verify code. Please try again.");
      }
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
              Phone Verified
            </p>
            <p className="font-body text-xs text-ink-500">{phoneNumber}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-ink/10 bg-paper p-4 text-left ${className}`}>
      {/* Container for invisible reCAPTCHA with fresh DOM node on reset */}
      <div key={recaptchaKey} id={activeContainerId} />

      <div className="flex items-center justify-between">
        <div>
          <span className="font-body text-sm font-medium text-ink">Phone SMS Verification</span>
          <p className="font-body text-xs text-ink-400">
            A 6-digit code will be sent to your phone via SMS.
          </p>
        </div>
        <span className="rounded-full bg-brass/10 px-2 py-0.5 font-mono text-[10px] text-brass-dark uppercase font-medium">
          SMS OTP
        </span>
      </div>

      <div className="mt-3">
        <label className="field-label text-xs">Mobile Phone Number</label>
        <div className="relative">
          <input
            type="tel"
            placeholder="+1 555 123 4567"
            value={phoneNumber}
            disabled={confirmationResult !== null && isVerified}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              onPhoneChange?.(e.target.value);
            }}
            className="input-field text-sm"
          />
        </div>
        <p className="mt-1 font-body text-[11px] text-ink-400">
          Include country code with + (e.g. +1 for US/Canada, +91 for India, +44 for UK).
        </p>
      </div>

      {!confirmationResult ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSendSms}
            disabled={isSending || !phoneNumber}
            className="btn-secondary w-full text-xs font-medium !py-2.5"
          >
            {isSending ? "Sending SMS Code…" : "Send SMS Code"}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="field-label text-xs">Enter 6-Digit SMS Code</label>
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
                onClick={handleVerifyCode}
                disabled={isVerifying || otp.length !== 6}
                className="btn-primary shrink-0 !px-5 !py-2 text-xs"
              >
                {isVerifying ? "Verifying…" : "Verify SMS"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-body text-xs text-ink-400">
              Didn&apos;t receive SMS?
            </span>
            <button
              type="button"
              onClick={handleSendSms}
              disabled={cooldown > 0 || isSending}
              className="font-body text-xs font-medium text-brass-dark hover:underline disabled:text-ink-300 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend SMS in ${cooldown}s` : "Resend SMS"}
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

      {/* Helpful development note */}
      <div className="mt-3 rounded-lg border border-ink/5 bg-ink/[0.02] p-2.5">
        <p className="font-body text-[11px] text-ink-400 leading-normal">
          <strong className="text-ink-600 font-medium">Testing tip:</strong> In Firebase Console &gt; Authentication &gt; Sign-in method &gt; Phone, you can register test phone numbers (e.g. <code className="font-mono text-ink-600">+1 555-555-5555</code> with code <code className="font-mono text-ink-600">123456</code>) for instant verification without SMS carrier charges.
        </p>
      </div>
    </div>
  );
}
