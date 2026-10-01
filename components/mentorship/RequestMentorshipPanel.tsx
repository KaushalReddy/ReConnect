"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getExistingRequest,
  sendMentorshipRequest,
} from "@/lib/firestore/mentorshipRequests";
import type { MentorshipRequest } from "@/types";

export default function RequestMentorshipPanel({
  alumniId,
  alumniFirstName,
}: {
  alumniId: string;
  alumniFirstName: string;
}) {
  const { firebaseUser, userDoc } = useAuth();
  const [existing, setExisting] = useState<MentorshipRequest | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligible = userDoc?.role === "STUDENT" || userDoc?.role === "FACULTY";

  useEffect(() => {
    if (!firebaseUser || !eligible) return;
    let cancelled = false;
    getExistingRequest(firebaseUser.uid, alumniId)
      .then((r) => !cancelled && setExisting(r))
      .catch(() => !cancelled && setExisting(null));
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, alumniId, eligible]);

  if (!eligible || !firebaseUser) return null;

  if (existing === undefined) {
    return (
      <div className="mt-8 border-t border-ink/10 pt-6">
        <div className="h-24 animate-pulse rounded-lg bg-ink/5" />
      </div>
    );
  }

  if (existing) {
    const statusCopy: Record<string, string> = {
      pending: `Your request is waiting for ${alumniFirstName} to respond.`,
      accepted: `${alumniFirstName} accepted your request — you're connected.`,
      rejected: `${alumniFirstName} wasn't able to take this on right now.`,
    };
    return (
      <div className="mt-8 border-t border-ink/10 pt-6">
        <p className="font-body text-sm text-ink-500">{statusCopy[existing.status]}</p>
      </div>
    );
  }

  async function handleSubmit() {
    if (!firebaseUser || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await sendMentorshipRequest(firebaseUser.uid, alumniId, message);
      setExisting(created);
    } catch {
      setError("Couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 border-t border-ink/10 pt-6">
      <h3 className="font-display text-lg text-ink">Request mentorship</h3>
      <p className="mt-1 font-body text-sm text-ink-400">
        A short note on what you&apos;re hoping to learn goes a long way.
      </p>
      <textarea
        className="input-field mt-3 min-h-[90px] resize-y"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={500}
        placeholder={`Hi ${alumniFirstName}, I'd love to learn more about…`}
      />
      {error && <p className="mt-2 font-body text-sm text-rust">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting || !message.trim()}
        className="btn-primary mt-3"
      >
        {submitting ? "Sending…" : "Send request"}
      </button>
    </div>
  );
}
