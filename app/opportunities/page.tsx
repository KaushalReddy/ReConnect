"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import OpportunityCard from "@/components/opportunities/OpportunityCard";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/auth-context";
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  type OpportunityInput,
} from "@/lib/firestore/opportunities";
import type { OpportunityDoc, OpportunityType } from "@/types";

// ── Admin form ─────────────────────────────────────────────────────────────────
interface OppFormData {
  type: OpportunityType;
  title: string;
  company: string;
  description: string;
  location: string;
  applyUrl: string;
}

const EMPTY_FORM: OppFormData = {
  type: "JOB",
  title: "",
  company: "",
  description: "",
  location: "",
  applyUrl: "",
};

interface OppFormProps {
  initial?: OppFormData;
  onSave: (data: OppFormData) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
}

function OppForm({ initial = EMPTY_FORM, onSave, onCancel, busy }: OppFormProps) {
  const [form, setForm] = useState<OppFormData>(initial);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) return;
    await onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <h3 className="font-display text-lg text-ink">
        {initial === EMPTY_FORM ? "Post opportunity" : "Edit opportunity"}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="opp-type">
            Type *
          </label>
          <select
            id="opp-type"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="input-field"
          >
            <option value="JOB">Full-time job</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="opp-company">
            Company *
          </label>
          <input
            id="opp-company"
            name="company"
            value={form.company}
            onChange={handleChange}
            className="input-field"
            placeholder="Acme Corp"
            required
          />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="opp-title">
          Role / Title *
        </label>
        <input
          id="opp-title"
          name="title"
          value={form.title}
          onChange={handleChange}
          className="input-field"
          placeholder="Software Engineer"
          required
        />
      </div>
      <div>
        <label className="field-label" htmlFor="opp-location">
          Location
        </label>
        <input
          id="opp-location"
          name="location"
          value={form.location}
          onChange={handleChange}
          className="input-field"
          placeholder="Remote · Bangalore"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="opp-description">
          Description
        </label>
        <textarea
          id="opp-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="input-field resize-none"
          placeholder="Role summary, requirements, perks…"
        />
      </div>
      <div>
        <label className="field-label" htmlFor="opp-apply-url">
          Apply URL
        </label>
        <input
          id="opp-apply-url"
          name="applyUrl"
          type="url"
          value={form.applyUrl}
          onChange={handleChange}
          className="input-field"
          placeholder="https://careers.example.com/apply"
        />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save opportunity"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function OpportunitiesContent() {
  const { userDoc } = useAuth();
  const isAdmin = userDoc?.role === "ADMIN";

  const [opportunities, setOpportunities] = useState<OpportunityDoc[] | null>(null);
  const [typeFilter, setTypeFilter] = useState<OpportunityType | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<OpportunityDoc | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getOpportunities()
      .then(setOpportunities)
      .catch(() => setError("Couldn't load opportunities right now."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(data: OppFormData) {
    if (!userDoc) return;
    setBusy(true);
    try {
      const input: OpportunityInput = {
        type: data.type,
        title: data.title.trim(),
        company: data.company.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        applyUrl: data.applyUrl.trim(),
      };
      const created = await createOpportunity(userDoc.uid, input);
      setOpportunities((prev) => (prev ? [created, ...prev] : [created]));
      setShowCreate(false);
    } catch {
      setError("Failed to post opportunity. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(data: OppFormData) {
    if (!editing) return;
    setBusy(true);
    try {
      const patch: Partial<OpportunityInput> = {
        type: data.type,
        title: data.title.trim(),
        company: data.company.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        applyUrl: data.applyUrl.trim(),
      };
      await updateOpportunity(editing.opportunityId, patch);
      setOpportunities((prev) =>
        prev
          ? prev.map((o) =>
              o.opportunityId === editing.opportunityId ? { ...o, ...patch } : o
            )
          : prev
      );
      setEditing(null);
    } catch {
      setError("Failed to update opportunity. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this opportunity? This cannot be undone.")) return;
    try {
      await deleteOpportunity(id);
      setOpportunities((prev) =>
        prev ? prev.filter((o) => o.opportunityId !== id) : prev
      );
    } catch {
      setError("Failed to delete opportunity. Please try again.");
    }
  }

  if (!userDoc) return null;

  const filtered = (opportunities ?? []).filter(
    (o) => typeFilter === "ALL" || o.type === typeFilter
  );

  return (
    <DashboardShell role={userDoc.role}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
              Opportunities
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium text-ink">
              {isAdmin ? "Manage opportunities" : "Jobs & internships"}
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
              + Post opportunity
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
          <OppForm
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
            busy={busy}
          />
        )}

        {/* Edit form */}
        {editing && !showCreate && (
          <OppForm
            initial={{
              type: editing.type,
              title: editing.title,
              company: editing.company,
              description: editing.description,
              location: editing.location,
              applyUrl: editing.applyUrl,
            }}
            onSave={handleUpdate}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        )}

        {/* Type filter */}
        {!showCreate && !editing && (
          <div className="flex gap-2">
            {(["ALL", "JOB", "INTERNSHIP"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
                  typeFilter === t
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/15 text-ink-500 hover:border-ink/40"
                }`}
              >
                {t === "ALL" ? "All" : t === "JOB" ? "Jobs" : "Internships"}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {opportunities === null && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-36 animate-pulse bg-ink/5" />
            ))}
          </div>
        )}

        {opportunities !== null && filtered.length === 0 && (
          <EmptyState
            title={
              typeFilter !== "ALL"
                ? `No ${typeFilter === "JOB" ? "jobs" : "internships"} posted yet`
                : "No opportunities posted yet"
            }
            description={
              isAdmin
                ? "Post the first opportunity using the button above."
                : "Check back soon — opportunities will appear here when posted by your institution."
            }
          />
        )}

        <div className="space-y-3">
          {filtered.map((opp) => (
            <OpportunityCard
              key={opp.opportunityId}
              opportunity={opp}
              isAdmin={isAdmin}
              onEdit={(o) => {
                setShowCreate(false);
                setEditing(o);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

export default function OpportunitiesPage() {
  return (
    <ProtectedRoute>
      <OpportunitiesContent />
    </ProtectedRoute>
  );
}
