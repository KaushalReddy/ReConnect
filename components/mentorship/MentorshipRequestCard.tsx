"use client";

import { useState } from "react";
import Link from "next/link";
import { getDeterministicConversationId } from "@/lib/firestore/chats";
import type { MentorshipRequest, MentorshipStatus } from "@/types";

const STATUS_STYLES: Record<MentorshipStatus, string> = {
  pending: "bg-brass/15 text-brass-dark",
  accepted: "bg-verdant/15 text-verdant-dark",
  rejected: "bg-rust/10 text-rust",
};

interface MentorshipRequestCardProps {
  request: MentorshipRequest;
  counterpartName: string;
  counterpartSubtitle?: string;
  isStudentView?: boolean;
  /** Show Accept/Reject buttons — only relevant for the alumni's incoming view. */
  showActions?: boolean;
  onRespond?: (status: "accepted" | "rejected") => Promise<void>;
}

export default function MentorshipRequestCard({
  request,
  counterpartName,
  counterpartSubtitle,
  isStudentView,
  showActions,
  onRespond,
}: MentorshipRequestCardProps) {
  const [busy, setBusy] = useState<"accepted" | "rejected" | null>(null);

  async function handle(status: "accepted" | "rejected") {
    if (!onRespond) return;
    setBusy(status);
    try {
      await onRespond(status);
    } finally {
      setBusy(null);
    }
  }

  const conversationId =
    request.conversationId ||
    getDeterministicConversationId(request.studentId, request.alumniId);

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-ink">{counterpartName}</p>
          {counterpartSubtitle && (
            <p className="font-body text-xs text-ink-400">{counterpartSubtitle}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLES[request.status]}`}
        >
          {request.status}
        </span>
      </div>

      <p className="font-body text-sm leading-relaxed text-ink-600">{request.message}</p>
      
      <p className="font-body text-xs text-ink-400">
        {new Date(request.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {/* Pending state actions for Alumni */}
      {showActions && request.status === "pending" && (
        <div className="mt-4 flex gap-3 border-t border-ink/10 pt-4">
          <button
            onClick={() => handle("accepted")}
            disabled={busy !== null}
            className="btn-primary !px-4 !py-2 text-xs"
          >
            {busy === "accepted" ? "Accepting…" : "Accept"}
          </button>
          <button
            onClick={() => handle("rejected")}
            disabled={busy !== null}
            className="btn-secondary !px-4 !py-2 text-xs"
          >
            {busy === "rejected" ? "Declining…" : "Decline"}
          </button>
        </div>
      )}

      {/* Accepted state UI for both Student and Alumni */}
      {request.status === "accepted" && (
        <div className="mt-3 border-t border-ink/10 pt-3 space-y-3">
          <div className="rounded-lg bg-verdant/10 p-3 border border-verdant/20">
            <p className="font-body text-xs text-verdant-dark font-medium">
              ✓ Connected for Mentorship
            </p>
            <p className="mt-0.5 font-body text-xs text-ink-600">
              {isStudentView
                ? "Your mentorship request was accepted. Schedule your first meeting."
                : "You have accepted this mentorship connection. Coordinate sessions with your mentee."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/messages?conversationId=${conversationId}`}
              className="btn-primary !px-4 !py-2 text-xs flex items-center gap-1.5"
            >
              💬 Open Chat
            </Link>

            <Link
              href={`/meetings?requestId=${request.requestId}`}
              className="btn-secondary !px-4 !py-2 text-xs flex items-center gap-1.5"
            >
              📅 {isStudentView ? "Schedule / View Meeting" : "View / Propose Meeting"}
            </Link>

            {isStudentView && request.alumniId && (
              <Link
                href={`/alumni/${request.alumniId}`}
                className="font-mono text-xs text-brass-dark hover:underline ml-2"
              >
                View Profile &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
