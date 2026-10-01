"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EmptyState from "@/components/EmptyState";
import MeetingCard from "@/components/meetings/MeetingCard";
import ScheduleModal from "@/components/meetings/ScheduleModal";
import { useAuth } from "@/lib/auth-context";
import { getUserDoc } from "@/lib/firestore/users";
import {
  getUserMeetings,
  scheduleMeeting,
  updateMeetingStatus,
} from "@/lib/firestore/meetings";
import type { MentorshipMeeting, MeetingStatus, UserDoc } from "@/types";

function MeetingsContent() {
  const { userDoc } = useAuth();
  const searchParams = useSearchParams();
  const targetRequestId = searchParams.get("requestId");
  const targetMeetingId = searchParams.get("meetingId");

  const [meetings, setMeetings] = useState<MentorshipMeeting[] | null>(null);
  const [counterparts, setCounterparts] = useState<Record<string, UserDoc>>({});
  const [activeModalMeeting, setActiveModalMeeting] = useState<MentorshipMeeting | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMeetings() {
    if (!userDoc) return;
    try {
      const list = await getUserMeetings(userDoc.uid);
      setMeetings(list);

      // Fetch user docs for all counterparts
      const otherIds = list.map((m) =>
        m.studentId === userDoc.uid ? m.alumniId : m.studentId
      );
      const uniqueMissing = Array.from(new Set(otherIds)).filter(
        (id) => !(id in counterparts)
      );

      if (uniqueMissing.length > 0) {
        const docs = await Promise.all(uniqueMissing.map((id) => getUserDoc(id)));
        setCounterparts((prev) => {
          const next = { ...prev };
          docs.forEach((d, i) => {
            if (d) next[uniqueMissing[i]] = d;
          });
          return next;
        });
      }

      // Check query params to auto-open modal if requested
      if (targetRequestId) {
        const match = list.find((m) => m.mentorshipRequestId === targetRequestId);
        if (match) setActiveModalMeeting(match);
      } else if (targetMeetingId) {
        const match = list.find((m) => m.meetingId === targetMeetingId);
        if (match) setActiveModalMeeting(match);
      }
    } catch {
      setError("Failed to load your mentorship meetings.");
    }
  }

  useEffect(() => {
    loadMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDoc?.uid, targetRequestId, targetMeetingId]);

  async function handleSaveSchedule(data: {
    scheduledAt: number;
    location?: string;
    meetingUrl?: string;
    topic?: string;
    notes?: string;
  }) {
    if (!activeModalMeeting || !userDoc) return;
    await scheduleMeeting(activeModalMeeting.meetingId, userDoc.uid, data);
    await loadMeetings();
  }

  async function handleStatusChange(meetingId: string, status: MeetingStatus) {
    if (!userDoc) return;
    await updateMeetingStatus(meetingId, userDoc.uid, status);
    await loadMeetings();
  }

  if (!userDoc) return null;

  const pendingMeetings = (meetings ?? []).filter((m) => m.status === "pending");
  const scheduledMeetings = (meetings ?? []).filter(
    (m) => m.status === "scheduled"
  );
  const pastMeetings = (meetings ?? []).filter(
    (m) => m.status === "completed" || m.status === "cancelled"
  );

  return (
    <DashboardShell role={userDoc.role}>
      <div className="space-y-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
            Mentorship
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">
            Mentorship Meetings
          </h1>
        </div>

        {error && (
          <p className="rounded-lg bg-rust/10 px-4 py-3 font-body text-sm text-rust">
            {error}
          </p>
        )}

        {/* Notice banner if there are pending meetings */}
        {pendingMeetings.length > 0 && (
          <div className="card border-brass/40 bg-brass/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-body text-sm font-semibold text-ink">
                  You have {pendingMeetings.length} mentorship meeting
                  {pendingMeetings.length > 1 ? "s" : ""} to schedule!
                </p>
                <p className="mt-0.5 font-body text-xs text-ink-500">
                  Your mentorship request was accepted. Schedule your first meeting to coordinate topics and goals.
                </p>
              </div>
              <button
                onClick={() => setActiveModalMeeting(pendingMeetings[0])}
                className="btn-primary !px-4 !py-2 text-xs shrink-0"
              >
                Schedule First Meeting
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {meetings === null && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-44 animate-pulse bg-ink/5" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {meetings && meetings.length === 0 && (
          <EmptyState
            title="No mentorship meetings yet"
            description="When a mentorship request is accepted, an initial meeting will automatically appear here for scheduling."
            action={
              <Link href="/mentorship" className="btn-primary">
                View Mentorship Requests
              </Link>
            }
          />
        )}

        {/* Pending / To Be Scheduled Meetings */}
        {pendingMeetings.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-xl text-ink">
              Needs Scheduling ({pendingMeetings.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {pendingMeetings.map((m) => {
                const otherId =
                  m.studentId === userDoc.uid ? m.alumniId : m.studentId;
                return (
                  <MeetingCard
                    key={m.meetingId}
                    meeting={m}
                    counterpart={counterparts[otherId] || null}
                    currentUserId={userDoc.uid}
                    onScheduleClick={(meet) => setActiveModalMeeting(meet)}
                    onStatusChange={handleStatusChange}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Upcoming Scheduled Meetings */}
        {scheduledMeetings.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-xl text-ink">
              Upcoming Scheduled Sessions ({scheduledMeetings.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {scheduledMeetings.map((m) => {
                const otherId =
                  m.studentId === userDoc.uid ? m.alumniId : m.studentId;
                return (
                  <MeetingCard
                    key={m.meetingId}
                    meeting={m}
                    counterpart={counterparts[otherId] || null}
                    currentUserId={userDoc.uid}
                    onScheduleClick={(meet) => setActiveModalMeeting(meet)}
                    onStatusChange={handleStatusChange}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Past / Completed Meetings */}
        {pastMeetings.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-ink/10">
            <h2 className="font-display text-lg text-ink-500">
              Past / Completed Sessions ({pastMeetings.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 opacity-85">
              {pastMeetings.map((m) => {
                const otherId =
                  m.studentId === userDoc.uid ? m.alumniId : m.studentId;
                return (
                  <MeetingCard
                    key={m.meetingId}
                    meeting={m}
                    counterpart={counterparts[otherId] || null}
                    currentUserId={userDoc.uid}
                    onScheduleClick={(meet) => setActiveModalMeeting(meet)}
                    onStatusChange={handleStatusChange}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Schedule Modal */}
        {activeModalMeeting && (
          <ScheduleModal
            meeting={activeModalMeeting}
            counterpart={
              counterparts[
                activeModalMeeting.studentId === userDoc.uid
                  ? activeModalMeeting.alumniId
                  : activeModalMeeting.studentId
              ] || null
            }
            currentUserId={userDoc.uid}
            onClose={() => setActiveModalMeeting(null)}
            onSave={handleSaveSchedule}
          />
        )}
      </div>
    </DashboardShell>
  );
}

export default function MeetingsPage() {
  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ALUMNI", "FACULTY", "ADMIN"]}>
      <Suspense fallback={<div className="p-8 text-center">Loading meetings…</div>}>
        <MeetingsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
