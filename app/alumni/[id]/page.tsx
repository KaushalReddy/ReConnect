"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AlumniProfileView from "@/components/profile/AlumniProfileView";
import RequestMentorshipPanel from "@/components/mentorship/RequestMentorshipPanel";
import { useAuth } from "@/lib/auth-context";
import { getAlumniProfile } from "@/lib/firestore/alumniProfiles";
import type { AlumniProfile } from "@/types";

function AlumniDetailContent() {
  const { userDoc } = useAuth();
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<AlumniProfile | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getAlumniProfile(params.id)
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setProfile(null));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (!userDoc) return null;

  return (
    <DashboardShell role={userDoc.role}>
      <div className="max-w-2xl">
        <Link href="/alumni" className="font-body text-sm text-ink-400 hover:text-ink">
          ← Back to directory
        </Link>

        <div className="card mt-4 p-8">
          {profile === undefined && (
            <p className="font-body text-sm text-ink-400">Loading profile…</p>
          )}

          {profile === null && (
            <p className="font-body text-sm text-ink-400">
              This alumni profile doesn&apos;t exist or hasn&apos;t been published yet.
            </p>
          )}

          {profile && (
            <>
              <AlumniProfileView profile={profile} />

              {profile.availableForMentorship && (
                <RequestMentorshipPanel
                  alumniId={profile.userId}
                  alumniFirstName={profile.fullName.split(" ")[0]}
                />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

export default function AlumniDetailPage() {
  return (
    <ProtectedRoute>
      <AlumniDetailContent />
    </ProtectedRoute>
  );
}
