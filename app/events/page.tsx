"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EventCard from "@/components/events/EventCard";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/auth-context";
import {
  getAllEvents,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type EventInput,
} from "@/lib/firestore/events";
import type { EventDoc } from "@/types";

// ── Admin form ─────────────────────────────────────────────────────────────────
interface EventFormData {
  title: string;
  description: string;
  date: string; // datetime-local value
  location: string;
}

const EMPTY_FORM: EventFormData = {
  title: "",
  description: "",
  date: "",
  location: "",
};

interface EventFormProps {
  initial?: EventFormData;
  onSave: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
}

function EventForm({ initial = EMPTY_FORM, onSave, onCancel, busy }: EventFormProps) {
  const [form, setForm] = useState<EventFormData>(initial);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    await onSave(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card space-y-4 p-6"
    >
      <h3 className="font-display text-lg text-ink">
        {initial === EMPTY_FORM ? "Create event" : "Edit event"}
      </h3>
      <div>
        <label className="field-label" htmlFor="event-title">
          Title *
        </label>
        <input
          id="event-title"
          name="title"
          value={form.title}
          onChange={handleChange}
          className="input-field"
          placeholder="Annual Alumni Networking Night"
          required
        />
      </div>
      <div>
        <label className="field-label" htmlFor="event-date">
          Date & time *
        </label>
        <input
          id="event-date"
          name="date"
          type="datetime-local"
          value={form.date}
          onChange={handleChange}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="field-label" htmlFor="event-location">
          Location
        </label>
        <input
          id="event-location"
          name="location"
          value={form.location}
          onChange={handleChange}
          className="input-field"
          placeholder="Main Hall, Block A"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="event-description">
          Description
        </label>
        <textarea
          id="event-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="input-field resize-none"
          placeholder="A brief summary of what to expect…"
        />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save event"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function EventsContent() {
  const { userDoc } = useAuth();
  const isAdmin = userDoc?.role === "ADMIN";

  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<EventDoc | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const fetcher = isAdmin ? getAllEvents : getUpcomingEvents;
    fetcher()
      .then(setEvents)
      .catch(() => setError("Couldn't load events right now."));
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  // datetime-local needs "YYYY-MM-DDTHH:mm"
  function epochToLocal(ms: number) {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function handleCreate(data: EventFormData) {
    if (!userDoc) return;
    setBusy(true);
    try {
      const input: EventInput = {
        title: data.title.trim(),
        description: data.description.trim(),
        date: new Date(data.date).getTime(),
        location: data.location.trim(),
      };
      const created = await createEvent(userDoc.uid, input);
      setEvents((prev) =>
        prev ? [created, ...prev].sort((a, b) => a.date - b.date) : [created]
      );
      setShowCreate(false);
    } catch {
      setError("Failed to create event. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(data: EventFormData) {
    if (!editing) return;
    setBusy(true);
    try {
      const patch: Partial<EventInput> = {
        title: data.title.trim(),
        description: data.description.trim(),
        date: new Date(data.date).getTime(),
        location: data.location.trim(),
      };
      await updateEvent(editing.eventId, patch);
      setEvents((prev) =>
        prev
          ? prev
              .map((e) =>
                e.eventId === editing.eventId ? { ...e, ...patch } : e
              )
              .sort((a, b) => a.date - b.date)
          : prev
      );
      setEditing(null);
    } catch {
      setError("Failed to update event. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      await deleteEvent(eventId);
      setEvents((prev) => (prev ? prev.filter((e) => e.eventId !== eventId) : prev));
    } catch {
      setError("Failed to delete event. Please try again.");
    }
  }

  if (!userDoc) return null;

  const upcoming = (events ?? []).filter((e) => e.date >= Date.now());
  const past = (events ?? []).filter((e) => e.date < Date.now());

  return (
    <DashboardShell role={userDoc.role}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
              Events
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium text-ink">
              {isAdmin ? "Manage events" : "Upcoming events"}
            </h1>
          </div>
          {isAdmin && !showCreate && (
            <button
              onClick={() => {
                setEditing(null);
                setShowCreate(true);
              }}
              className="btn-primary"
            >
              + New event
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-rust/10 px-4 py-3 font-body text-sm text-rust">
            {error}
          </p>
        )}

        {/* Create form */}
        {showCreate && (
          <EventForm
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
            busy={busy}
          />
        )}

        {/* Edit form */}
        {editing && !showCreate && (
          <EventForm
            initial={{
              title: editing.title,
              description: editing.description,
              date: epochToLocal(editing.date),
              location: editing.location,
            }}
            onSave={handleUpdate}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        )}

        {/* Loading skeleton */}
        {events === null && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-ink/5" />
            ))}
          </div>
        )}

        {/* Upcoming events */}
        {events !== null && upcoming.length === 0 && past.length === 0 && (
          <EmptyState
            title="No events yet"
            description={
              isAdmin
                ? "Create the first event using the button above."
                : "Check back soon for upcoming events."
            }
          />
        )}

        {upcoming.length > 0 && (
          <section>
            {isAdmin && (
              <h2 className="mb-3 font-display text-xl text-ink">Upcoming</h2>
            )}
            <div className="space-y-3">
              {upcoming.map((e) => (
                <EventCard
                  key={e.eventId}
                  event={e}
                  isAdmin={isAdmin}
                  onEdit={(ev) => {
                    setShowCreate(false);
                    setEditing(ev);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past events — admin only */}
        {isAdmin && past.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-xl text-ink">Past events</h2>
            <div className="space-y-3">
              {past.map((e) => (
                <EventCard
                  key={e.eventId}
                  event={e}
                  isAdmin={isAdmin}
                  onEdit={(ev) => {
                    setShowCreate(false);
                    setEditing(ev);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}
