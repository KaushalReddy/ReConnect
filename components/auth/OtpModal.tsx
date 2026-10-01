"use client";

import { useState } from "react";
import EmailOtpVerification from "./EmailOtpVerification";
import PhoneOtpVerification from "./PhoneOtpVerification";
import { updateUserVerification } from "@/lib/firestore/users";
import { useAuth } from "@/lib/auth-context";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "EMAIL" | "PHONE";
  initialEmail?: string;
  initialPhone?: string;
}

export default function OtpModal({
  isOpen,
  onClose,
  defaultType = "EMAIL",
  initialEmail = "",
  initialPhone = "",
}: Props) {
  const { userDoc, refreshUserDoc } = useAuth();
  const [activeType, setActiveType] = useState<"EMAIL" | "PHONE">(defaultType);
  const [phone, setPhone] = useState(initialPhone || userDoc?.phoneNumber || "");
  const [email, setEmail] = useState(initialEmail || userDoc?.email || "");
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleEmailVerified(verifiedEmail: string) {
    if (!userDoc) return;
    setUpdating(true);
    try {
      await updateUserVerification(userDoc.uid, {
        isEmailVerified: true,
        verificationMethod: userDoc.isPhoneVerified ? "BOTH" : "EMAIL",
      });
      await refreshUserDoc();
      setStatusMsg("Email verified successfully!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to update email verification status:", err);
    } finally {
      setUpdating(false);
    }
  }

  async function handlePhoneVerified(verifiedPhone: string) {
    if (!userDoc) return;
    setUpdating(true);
    try {
      await updateUserVerification(userDoc.uid, {
        phoneNumber: verifiedPhone,
        isPhoneVerified: true,
        verificationMethod: userDoc.isEmailVerified ? "BOTH" : "PHONE",
      });
      await refreshUserDoc();
      setStatusMsg("Phone number verified successfully!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to update phone verification status:", err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-ink/10">
          <h2 className="font-display text-lg font-medium text-ink">
            Identity Verification
          </h2>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink transition-colors p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab switch between Email and Phone */}
        <div className="mt-4 flex rounded-lg bg-ink/5 p-1">
          <button
            type="button"
            onClick={() => setActiveType("EMAIL")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              activeType === "EMAIL"
                ? "bg-paper text-ink shadow-sm"
                : "text-ink-400 hover:text-ink"
            }`}
          >
            Email OTP
          </button>
          <button
            type="button"
            onClick={() => setActiveType("PHONE")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              activeType === "PHONE"
                ? "bg-paper text-ink shadow-sm"
                : "text-ink-400 hover:text-ink"
            }`}
          >
            Phone SMS OTP
          </button>
        </div>

        <div className="mt-5">
          {activeType === "EMAIL" ? (
            <EmailOtpVerification
              email={email}
              isEmailEditable={!userDoc?.email}
              onEmailChange={setEmail}
              onVerified={handleEmailVerified}
            />
          ) : (
            <PhoneOtpVerification
              initialPhoneNumber={phone}
              onPhoneChange={setPhone}
              onVerified={handlePhoneVerified}
              containerIdSuffix="modal"
            />
          )}
        </div>

        {statusMsg && (
          <p className="mt-4 rounded-lg bg-verdant/15 p-2.5 text-center font-body text-xs font-medium text-verdant-dark">
            ✓ {statusMsg}
          </p>
        )}

        {updating && (
          <p className="mt-3 text-center font-body text-xs text-ink-400">
            Updating your profile…
          </p>
        )}
      </div>
    </div>
  );
}
