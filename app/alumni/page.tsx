"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AlumniCard from "@/components/directory/AlumniCard";
import DirectoryFilters, {
  EMPTY_FILTERS,
  type DirectoryFilterState,
} from "@/components/directory/DirectoryFilters";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { getAllAlumniProfiles } from "@/lib/firestore/alumniProfiles";
import type { AlumniProfile } from "@/types";

function DirectoryContent() {
  const { userDoc } = useAuth();
  const [profiles, setProfiles] = useState<AlumniProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DirectoryFilterState>(EMPTY_FILTERS);

  useEffect(() => {
    let cancelled = false;
    getAllAlumniProfiles()
      .then((p) => !cancelled && setProfiles(p))
      .catch(() => !cancelled && setError("Couldn't load the directory right now."));
    return () => {
      cancelled = true;
    };
  }, []);
  const departments = useMemo(() => {
    const set = new Set((profiles ?? []).map((p) => p.department).filter(Boolean));
    return Array.from(set).sort();
  }, [profiles]);

  const graduationYears = useMemo(() => {
    const set = new Set((profiles ?? []).map((p) => p.graduationYear).filter(Boolean));
    return Array.from(set).sort((a, b) => b - a);
  }, [profiles]);

  const filtered = useMemo(() => {
    if (!profiles) return [];
    const search = filters.search.trim().toLowerCase();
    const company = filters.company.trim().toLowerCase();
    const skill = filters.skill.trim().toLowerCase();
    const location = filters.location.trim().toLowerCase();

    return profiles.filter((p) => {
      if (search && !p.fullName.toLowerCase().includes(search)) return false;
      if (filters.department && p.department !== filters.department) return false;
      if (
        filters.graduationYear &&
        p.graduationYear.toString() !== filters.graduationYear
      )
        return false;
      if (company && !p.currentCompany.toLowerCase().includes(company)) return false;
      if (skill && !p.skills.some((s) => s.toLowerCase().includes(skill))) return false;
      if (location && !p.location.toLowerCase().includes(location)) return false;
      return true;
    });
  }, [profiles, filters]);

  if (!userDoc) return null;

  return (
    <DashboardShell role={userDoc.role}>
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
          Alumni directory
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-ink">
          Find someone who&apos;s been where you&apos;re headed.
        </h1>

        <div className="mt-6">
          <DirectoryFilters
            filters={filters}
            onChange={setFilters}
            departments={departments}
            graduationYears={graduationYears}
          />
        </div>

        <div className="mt-6">
          {error && (
            <p className="rounded-lg bg-rust/10 px-4 py-3 font-body text-sm text-rust">
              {error}
            </p>
          )}

          {!error && !profiles && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card h-44 animate-pulse bg-ink/5" />
              ))}
            </div>
          )}

          {profiles && profiles.length === 0 && (
            <EmptyState
              title="No alumni profiles yet"
              description="Once alumni complete their profiles, they'll appear here for students and faculty to discover."
            />
          )}

          {profiles && profiles.length > 0 && filtered.length === 0 && (
            <EmptyState
              title="No matches"
              description="Try clearing a filter or searching a different name."
            />
          )}

          {filtered.length > 0 && (
            <>
              <p className="mb-3 font-body text-xs text-ink-400">
                {filtered.length} alumni
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <AlumniCard key={p.userId} profile={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

export default function AlumniDirectoryPage() {
  return (
    <ProtectedRoute>
      <DirectoryContent />
    </ProtectedRoute>
  );
}
