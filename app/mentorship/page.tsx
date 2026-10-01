"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EmptyState from "@/components/EmptyState";
import MentorshipRequestCard from "@/components/mentorship/MentorshipRequestCard";
import { useAuth } from "@/lib/auth-context";
import { getUserDoc } from "@/lib/firestore/users";
import {
  getIncomingRequests,
  getSentRequests,
  respondToRequest,
} from "@/lib/firestore/mentorshipRequests";
import { roleLabel } from "@/lib/utils";
import type { MentorshipRequest, UserDoc } from "@/types";

/** Resolve display names for the "other side" of each request in one batch. */
function useCounterpartNames(ids: string[]) {
  const [names, setNames] = useState<Record<string, UserDoc>>({});

  useEffect(() => {
    const missing = ids.filter((id) => !(id in names));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.map((id) => getUserDoc(id))).then((docs) => {
      if (cancelled) return;
      setNames((prev) => {
        const next = { ...prev };
        docs.forEach((d, i) => {
          if (d) next[missing[i]] = d;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return names;
}

function StudentFacultyView({ uid }: { uid: string }) {
  const [requests, setRequests] = useState<MentorshipRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const names = useCounterpartNames((requests ?? []).map((r) => r.alumniId));

  useEffect(() => {
    let cancelled = false;
    getSentRequests(uid)
      .then((r) => !cancelled && setRequests(r))
      .catch((err) => {
        console.error("getSentRequests error:", err);
        if (!cancelled) setError("Couldn't load your requests right now.");
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">Mentorship</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">
        Your mentorship requests
      </h1>

      <div className="mt-6">
        {error && (
          <p className="rounded-lg bg-rust/10 px-4 py-3 font-body text-sm text-rust">{error}</p>
        )}

        {!error && !requests && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-ink/5" />
            ))}
          </div>
        )}

        {requests && requests.length === 0 && (
          <EmptyState
            title="No requests yet"
            description="Browse the alumni directory and reach out to someone whose path you'd like to follow."
            action={
              <Link href="/alumni" className="btn-primary">
                Browse directory
              </Link>
            }
          />
        )}

        {requests && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((r) => (
              <MentorshipRequestCard
                key={r.requestId}
                request={r}
                counterpartName={names[r.alumniId]?.name ?? "Loading…"}
                counterpartSubtitle="Alumni"
                isStudentView={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlumniView({ uid }: { uid: string }) {
  const [requests, setRequests] = useState<MentorshipRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const names = useCounterpartNames((requests ?? []).map((r) => r.studentId));

  const load = useCallback(() => {
    getIncomingRequests(uid)
      .then(setRequests)
      .catch(() => setError("Couldn't load your requests right now."));
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRespond(requestId: string, status: "accepted" | "rejected") {
    await respondToRequest(requestId, status);
    setRequests((prev) =>
      prev
        ? prev.map((r) => (r.requestId === requestId ? { ...r, status } : r))
        : prev
    );
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">Mentorship</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">
        Incoming mentorship requests
      </h1>

      <div className="mt-6">
        {error && (
          <p className="rounded-lg bg-rust/10 px-4 py-3 font-body text-sm text-rust">{error}</p>
        )}

        {!error && !requests && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-ink/5" />
            ))}
          </div>
        )}

        {requests && requests.length === 0 && (
          <EmptyState
            title="No requests yet"
            description="When a student or faculty member reaches out for mentorship, it will show up here."
          />
        )}

        {requests && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((r) => (
              <MentorshipRequestCard
                key={r.requestId}
                request={r}
                counterpartName={names[r.studentId]?.name ?? "Loading…"}
                counterpartSubtitle={names[r.studentId] ? roleLabel(names[r.studentId].role) : undefined}
                showActions
                onRespond={(status) => handleRespond(r.requestId, status)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MentorshipContent() {
  const { userDoc } = useAuth();
  if (!userDoc) return null;

  return (
    <DashboardShell role={userDoc.role}>
      {userDoc.role === "ALUMNI" ? (
        <AlumniView uid={userDoc.uid} />
      ) : (
        <StudentFacultyView uid={userDoc.uid} />
      )}
    </DashboardShell>
  );
}

export default function MentorshipPage() {
  return (
    <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "ALUMNI"]}>
      <MentorshipContent />
    </ProtectedRoute>
  );
}
