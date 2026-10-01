"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { getSentRequests } from "@/lib/firestore/mentorshipRequests";
import { getUserDoc } from "@/lib/firestore/users";
import { getUpcomingEvents } from "@/lib/firestore/events";
import { getDeterministicConversationId } from "@/lib/firestore/chats";
import type { MentorshipRequest, UserDoc, EventDoc } from "@/types";

const STATUS_STYLES: Record<MentorshipRequest["status"], string> = {
  pending: "bg-brass/15 text-brass-dark",
  accepted: "bg-verdant/15 text-verdant-dark",
  rejected: "bg-rust/10 text-rust",
};

export default function FacultyDashboard({ userDoc }: { userDoc: UserDoc }) {
  const [requests, setRequests] = useState<MentorshipRequest[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<EventDoc[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSentRequests(userDoc.uid).then(async (r) => {
      if (cancelled) return;
      setRequests(r);
      const top = r.slice(0, 3);
      const docs = await Promise.all(top.map((req) => getUserDoc(req.alumniId)));
      if (cancelled) return;
      const map: Record<string, string> = {};
      docs.forEach((d, i) => {
        if (d) map[top[i].alumniId] = d.name;
      });
      setNames(map);
    });
    getUpcomingEvents()
      .then((e) => !cancelled && setEvents(e.slice(0, 4)))
      .catch(() => !cancelled && setEvents([]));
    return () => {
      cancelled = true;
    };
  }, [userDoc.uid]);

  const pending = (requests ?? []).filter((r) => r.status === "pending").length;
  const preview = (requests ?? []).slice(0, 3);

  function formatDate(ms: number) {
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
          Faculty dashboard
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-ink">
          Welcome back, {userDoc.name.split(" ")[0]}.
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Alumni contacted" value={requests ? requests.length : "…"} />
        <StatCard label="Awaiting reply" value={requests ? pending : "…"} />
        <StatCard label="Department" value="—" hint="Set this on your profile" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Your outreach to alumni</h2>
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
              title="No outreach yet"
              description="Connect students with alumni by reaching out on their behalf from the directory."
              action={
                <Link href="/alumni" className="btn-primary">
                  Browse directory
                </Link>
              }
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
                    <div className="min-w-0">
                      <p className="font-body text-sm font-medium text-ink">
                        {names[r.alumniId] ?? "…"}
                      </p>
                      <p className="mt-1 truncate font-body text-sm text-ink-500">{r.message}</p>
                      
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
                            📅 Schedule Meeting
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

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Upcoming events</h2>
          <Link href="/events" className="font-body text-sm text-brass-dark hover:underline">
            View all
          </Link>
        </div>
        <div className="card divide-y divide-ink/10">
          {events === null && (
            <div className="space-y-2 p-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-ink/5" />
              ))}
            </div>
          )}
          {events && events.length === 0 && (
            <div className="px-5 py-6 text-center font-body text-sm text-ink-400">
              No upcoming events yet.
            </div>
          )}
          {events?.map((e) => (
            <div key={e.eventId} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-body text-sm font-medium text-ink">{e.title}</p>
                <p className="font-body text-xs text-ink-400">{e.location}</p>
              </div>
              <span className="font-mono text-xs text-ink-400">{formatDate(e.date)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
