"use client";

import Link from "next/link";
import { initials } from "@/lib/utils";
import type { MentorshipMeeting, MeetingStatus, UserDoc } from "@/types";

interface MeetingCardProps {
  meeting: MentorshipMeeting;
  counterpart: UserDoc | null;
  currentUserId: string;
  onScheduleClick: (meeting: MentorshipMeeting) => void;
  onStatusChange?: (meetingId: string, status: MeetingStatus) => Promise<void>;
}

const STATUS_BADGES: Record<MeetingStatus, { label: string; className: string }> = {
  pending: {
    label: "To be scheduled",
    className: "bg-brass/15 text-brass-dark",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-verdant/15 text-verdant-dark",
  },
  completed: {
    label: "Completed",
    className: "bg-ink/10 text-ink-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rust/10 text-rust",
  },
};

export default function MeetingCard({
  meeting,
  counterpart,
  currentUserId,
  onScheduleClick,
  onStatusChange,
}: MeetingCardProps) {
  const counterpartName = counterpart?.name || "Mentorship Partner";
  const badge = STATUS_BADGES[meeting.status];

  function formatDateTime(ms: number) {
    const d = new Date(ms);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const isScheduled = meeting.status === "scheduled" && meeting.scheduledAt;
  const isPast = meeting.scheduledAt ? meeting.scheduledAt < Date.now() : false;

  return (
    <div className="card p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-body text-xs font-semibold text-paper">
            {initials(counterpartName)}
          </div>
          <div>
            <h3 className="font-display text-base font-medium text-ink">
              {counterpartName}
            </h3>
            <p className="font-mono text-xs text-brass-dark">
              {counterpart?.role ? counterpart.role : "Mentorship"}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wide font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Meeting Details */}
      <div className="rounded-xl bg-ink/[0.02] border border-ink/5 p-4 space-y-2 text-sm font-body">
        <div className="flex items-center gap-2 text-ink">
          <span className="font-mono text-xs text-ink-400 uppercase w-24">
            Date & Time:
          </span>
          <span className="font-medium">
            {isScheduled ? formatDateTime(meeting.scheduledAt!) : "Not scheduled yet"}
          </span>
        </div>

        {meeting.topic && (
          <div className="flex items-center gap-2 text-ink">
            <span className="font-mono text-xs text-ink-400 uppercase w-24">
              Topic:
            </span>
            <span>{meeting.topic}</span>
          </div>
        )}

        {meeting.location && (
          <div className="flex items-center gap-2 text-ink">
            <span className="font-mono text-xs text-ink-400 uppercase w-24">
              Location:
            </span>
            <span>{meeting.location}</span>
          </div>
        )}

        {meeting.notes && (
          <div className="flex items-start gap-2 text-ink-500 pt-1">
            <span className="font-mono text-xs text-ink-400 uppercase w-24 shrink-0">
              Notes:
            </span>
            <span className="text-xs leading-relaxed">{meeting.notes}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {meeting.status === "pending" && (
            <button
              onClick={() => onScheduleClick(meeting)}
              className="btn-primary !px-4 !py-2 text-xs"
            >
              📅 Propose Date & Time
            </button>
          )}

          {meeting.status === "scheduled" && (
            <>
              <button
                onClick={() => onScheduleClick(meeting)}
                className="btn-secondary !px-3 !py-1.5 text-xs"
              >
                ✏️ Reschedule
              </button>

              {meeting.meetingUrl && (
                <a
                  href={
                    meeting.meetingUrl.startsWith("http")
                      ? meeting.meetingUrl
                      : `https://${meeting.meetingUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary !px-4 !py-1.5 text-xs"
                >
                  🎥 Join Call
                </a>
              )}

              {onStatusChange && (
                <button
                  onClick={() => onStatusChange(meeting.meetingId, "completed")}
                  className="btn-secondary !px-3 !py-1.5 text-xs text-verdant-dark hover:border-verdant"
                >
                  ✓ Mark Completed
                </button>
              )}
            </>
          )}

          {meeting.status === "completed" && onStatusChange && (
            <span className="font-mono text-xs text-verdant-dark">
              ✓ Meeting finished
            </span>
          )}
        </div>

        {/* Link to chat with this participant */}
        <Link
          href={`/messages?conversationId=conv_${[meeting.studentId, meeting.alumniId].sort().join("_")}`}
          className="font-mono text-xs text-brass-dark hover:underline flex items-center gap-1"
        >
          💬 Open Chat &rarr;
        </Link>
      </div>
    </div>
  );
}
