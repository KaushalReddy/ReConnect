"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { getIncomingRequests, respondToRequest } from "@/lib/firestore/mentorshipRequests";
import { getUserDoc } from "@/lib/firestore/users";
import { getDeterministicConversationId } from "@/lib/firestore/chats";
import type { MentorshipRequest, UserDoc } from "@/types";

const STATUS_STYLES: Record<MentorshipRequest["status"], string> = {
  pending: "bg-brass/15 text-brass-dark",
  accepted: "bg-verdant/15 text-verdant-dark",
  rejected: "bg-rust/10 text-rust",
};

export default function AlumniDashboard({ userDoc }: { userDoc: UserDoc }) {
  const [requests, setRequests] = useState<MentorshipRequest[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getIncomingRequests(userDoc.uid).then(async (r) => {
      if (cancelled) return;
      setRequests(r);
      const top = r.slice(0, 3);
      const docs = await Promise.all(top.map((req) => getUserDoc(req.studentId)));
      if (cancelled) return;
      const map: Record<string, string> = {};
      docs.forEach((d, i) => {
        if (d) map[top[i].studentId] = d.name;
      });
      setNames(map);
    });
    return () => {
      cancelled = true;
    };
  }, [userDoc.uid]);

  async function handleRespond(requestId: string, status: "accepted" | "rejected") {
    setBusyId(requestId);
    try {
      const res = await respondToRequest(requestId, status);
      setRequests((prev) =>
        prev
          ? prev.map((r) =>
              r.requestId === requestId
                ? {
                    ...r,
                    status,
                    conversationId: res.conversationId || r.conversationId,
                    meetingId: res.meetingId || r.meetingId,
                  }
                : r
            )
          : prev
      );
    } finally {
      setBusyId(null);
    }
  }

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const accepted = (requests ?? []).filter((r) => r.status === "accepted");
  const preview = (requests ?? []).slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
            Alumni dashboard
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">
            Welcome back, {userDoc.name.split(" ")[0]}.
          </h1>
        </div>
        {!userDoc.profileCompleted && (
          <Link href="/profile" className="btn-primary">
            Complete your profile
          </Link>
        )}
      </div>

      {!userDoc.profileCompleted && (
        <div className="card border-brass/40 bg-brass/5 p-5">
          <p className="font-body text-sm text-ink">
            Your profile isn&apos;t complete yet, so you won&apos;t appear in the
            alumni directory. It only takes a couple of minutes.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Incoming requests" value={requests ? requests.length : "…"} />
        <StatCard label="Awaiting your reply" value={requests ? pending.length : "…"} />
        <StatCard label="Mentees connected" value={requests ? accepted.length : "…"} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Incoming mentorship requests</h2>
          <Link href="/mentorship" className="font-body text-sm text-brass-dark hover:underline">
            View all
          </Link>
        </div>
        <div className="card p-2">
          {requests === null && (
            <div className="space-y-2 p-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-ink/5" />
              ))}
            </div>
          )}

          {requests && requests.length === 0 && (
            <EmptyState
              title="No requests yet"
              description="When a student or faculty member reaches out for mentorship, it will show up here."
            />
          )}

          {preview.length > 0 && (
            <div className="px-4">
              {preview.map((r) => {
                const convId =
                  r.conversationId ||
                  getDeterministicConversationId(r.studentId, r.alumniId);

                return (
                  <div
                    key={r.requestId}
                    className="flex items-start justify-between gap-4 border-b border-ink/10 py-4 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-medium text-ink">
                        {names[r.studentId] ?? "…"}
                      </p>
                      <p className="mt-1 truncate font-body text-sm text-ink-500">{r.message}</p>
                      
                      {r.status === "pending" && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleRespond(r.requestId, "accepted")}
                            disabled={busyId === r.requestId}
                            className="btn-primary !px-3 !py-1.5 text-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(r.requestId, "rejected")}
                            disabled={busyId === r.requestId}
                            className="btn-secondary !px-3 !py-1.5 text-xs"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {r.status === "accepted" && (
                        <div className="mt-2 flex gap-3">
                          <Link
                            href={`/messages?conversationId=${convId}`}
                            className="btn-primary !px-3 !py-1 text-xs"
                          >
                            💬 Chat
                          </Link>
                          <Link
                            href={`/meetings?requestId=${r.requestId}`}
                            className="btn-secondary !px-3 !py-1 text-xs"
                          >
                            📅 Meeting
                          </Link>
                        </div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
