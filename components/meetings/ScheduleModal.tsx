"use client";

import { useState } from "react";
import type { MentorshipMeeting, UserDoc } from "@/types";

interface ScheduleModalProps {
  meeting: MentorshipMeeting;
  counterpart: UserDoc | null;
  currentUserId: string;
  onClose: () => void;
  onSave: (data: {
    scheduledAt: number;
    location?: string;
    meetingUrl?: string;
    topic?: string;
    notes?: string;
  }) => Promise<void>;
}

export default function ScheduleModal({
  meeting,
  counterpart,
  currentUserId,
  onClose,
  onSave,
}: ScheduleModalProps) {
  // Format existing scheduledAt or default to tomorrow at 10:00 AM
  const defaultDateStr = () => {
    const d = meeting.scheduledAt
      ? new Date(meeting.scheduledAt)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const [dateTime, setDateTime] = useState(defaultDateStr());
  const [topic, setTopic] = useState(meeting.topic || "1-on-1 Mentorship Kickoff");
  const [location, setLocation] = useState(meeting.location || "Google Meet / Video Call");
  const [meetingUrl, setMeetingUrl] = useState(meeting.meetingUrl || "");
  const [notes, setNotes] = useState(meeting.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateTime) {
      setError("Please select a valid date and time.");
      return;
    }

    const epoch = new Date(dateTime).getTime();
    if (isNaN(epoch)) {
      setError("Invalid date/time selected.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        scheduledAt: epoch,
        topic,
        location,
        meetingUrl,
        notes,
      });
      onClose();
    } catch {
      setError("Failed to save meeting schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const counterpartName = counterpart?.name || "your mentorship partner";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-lg bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div>
            <h2 className="font-display text-xl font-medium text-ink">
              Schedule Mentorship Meeting
            </h2>
            <p className="font-body text-xs text-ink-500">
              Session with {counterpartName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-rust/10 p-3 font-body text-xs text-rust">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-body text-sm">
          <div>
            <label className="field-label" htmlFor="meeting-datetime">
              Date & Time *
            </label>
            <input
              id="meeting-datetime"
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="meeting-topic">
              Session Topic
            </label>
            <input
              id="meeting-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Career advice, Portfolio review, Graduate studies"
              className="input-field"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="meeting-location">
              Platform / Location
            </label>
            <input
              id="meeting-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Google Meet, Zoom, Campus Library"
              className="input-field"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="meeting-url">
              Call Link (Optional)
            </label>
            <input
              id="meeting-url"
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/xyz-abc"
              className="input-field"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="meeting-notes">
              Notes / Agenda
            </label>
            <textarea
              id="meeting-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Topics you'd like to discuss or questions prepared in advance…"
              className="input-field resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-ink/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary !px-4 !py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !px-5 !py-2 text-xs"
            >
              {saving ? "Saving…" : "Confirm Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
