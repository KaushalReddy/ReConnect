"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AlumniProfileForm from "@/components/profile/AlumniProfileForm";
import AlumniProfileView from "@/components/profile/AlumniProfileView";
import { useAuth } from "@/lib/auth-context";
import { getAlumniProfile } from "@/lib/firestore/alumniProfiles";
import { roleLabel, initials } from "@/lib/utils";
import type { AlumniProfile } from "@/types";
import OtpModal from "@/components/auth/OtpModal";

function AlumniProfileSection({ uid, name }: { uid: string; name: string }) {
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAlumniProfile(uid)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setEditing(!p); // no profile yet -> open straight into the form
      })
      .catch(() => !cancelled && setError("Couldn't load your profile right now."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (loading) {
    return (
      <div className="card p-8">
        <p className="font-body text-sm text-ink-400">Loading your profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8">
        <p className="font-body text-sm text-rust">{error}</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="card p-8">
        <h2 className="mb-6 font-display text-xl text-ink">
          {profile ? "Edit your profile" : "Create your alumni profile"}
        </h2>
        <AlumniProfileForm
          uid={uid}
          defaultName={name}
          existing={profile}
          onSaved={(saved) => {
            setProfile(saved);
            setEditing(false);
          }}
          onCancel={profile ? () => setEditing(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl text-ink">Your profile</h2>
        <button onClick={() => setEditing(true)} className="btn-secondary !px-4 !py-2 text-xs">
          Edit profile
        </button>
      </div>
      {profile && <AlumniProfileView profile={profile} />}
    </div>
  );
}

function SimpleProfileCard({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  return (
    <div className="card flex items-center gap-4 p-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-display text-lg text-paper">
        {initials(name)}
      </span>
      <div>
        <p className="font-body text-sm font-medium text-ink">{email}</p>
        <p className="font-body text-sm text-ink-400">{role}</p>
      </div>
    </div>
  );
}

function VerificationStatusCard({
  email,
  phoneNumber,
  isEmailVerified,
  isPhoneVerified,
  onOpenVerifyModal,
}: {
  email: string;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  onOpenVerifyModal: (type: "EMAIL" | "PHONE") => void;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between pb-3 border-b border-ink/10">
        <div>
          <h3 className="font-display text-base font-medium text-ink">
            Identity &amp; Security Verification
          </h3>
          <p className="font-body text-xs text-ink-400">
            Keep your account trusted with verified contact channels.
          </p>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wide text-brass-dark font-medium">
          OTP Security
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {/* Email verification row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-ink/5 bg-ink/[0.02] p-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-body text-sm font-medium text-ink">
                Email Address
              </span>
              {isEmailVerified ? (
                <span className="rounded-full bg-verdant/15 px-2 py-0.5 font-mono text-[10px] text-verdant-dark font-medium">
                  ✓ Verified
                </span>
              ) : (
                <span className="rounded-full bg-rust/15 px-2 py-0.5 font-mono text-[10px] text-rust font-medium">
                  Unverified
                </span>
              )}
            </div>
            <p className="font-body text-xs text-ink-500 mt-0.5">{email}</p>
          </div>

          {!isEmailVerified && (
            <button
              onClick={() => onOpenVerifyModal("EMAIL")}
              className="btn-secondary !px-3 !py-1.5 text-xs shrink-0"
            >
              Verify via Email OTP
            </button>
          )}
        </div>

        {/* Phone verification row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-ink/5 bg-ink/[0.02] p-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-body text-sm font-medium text-ink">
                Phone Number
              </span>
              {isPhoneVerified ? (
                <span className="rounded-full bg-verdant/15 px-2 py-0.5 font-mono text-[10px] text-verdant-dark font-medium">
                  ✓ Verified
                </span>
              ) : (
                <span className="rounded-full bg-ink/10 px-2 py-0.5 font-mono text-[10px] text-ink-500 font-medium">
                  Not Verified
                </span>
              )}
            </div>
            <p className="font-body text-xs text-ink-500 mt-0.5">
              {phoneNumber || "No phone number added"}
            </p>
          </div>

          <button
            onClick={() => onOpenVerifyModal("PHONE")}
            className="btn-secondary !px-3 !py-1.5 text-xs shrink-0"
          >
            {isPhoneVerified ? "Update Phone via SMS" : "Verify Phone via SMS"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileContent() {
  const { userDoc } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"EMAIL" | "PHONE">("EMAIL");

  if (!userDoc) return null;

  function handleOpenModal(type: "EMAIL" | "PHONE") {
    setModalType(type);
    setModalOpen(true);
  }

  return (
    <DashboardShell role={userDoc.role}>
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
          Your profile
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-ink">{userDoc.name}</h1>

        <div className="mt-6 space-y-4">
          <VerificationStatusCard
            email={userDoc.email}
            phoneNumber={userDoc.phoneNumber}
            isEmailVerified={userDoc.isEmailVerified}
            isPhoneVerified={userDoc.isPhoneVerified}
            onOpenVerifyModal={handleOpenModal}
          />

          {userDoc.role === "ALUMNI" ? (
            <AlumniProfileSection uid={userDoc.uid} name={userDoc.name} />
          ) : (
            <>
              <SimpleProfileCard
                name={userDoc.name}
                email={userDoc.email}
                role={roleLabel(userDoc.role)}
              />
              <div className="card p-6">
                <p className="font-body text-sm leading-relaxed text-ink-500">
                  Editable profile fields for {roleLabel(userDoc.role).toLowerCase()}{" "}
                  accounts are built out in a later phase. For now, your name, email,
                  and role are managed here.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <OtpModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
        initialEmail={userDoc.email}
        initialPhone={userDoc.phoneNumber || ""}
      />
    </DashboardShell>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
