"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import { getUserRoleCounts, getRecentUsers, type UserRoleCounts } from "@/lib/firestore/users";
import { getMentorshipStats, type MentorshipStats } from "@/lib/firestore/mentorshipRequests";
import { roleLabel } from "@/lib/utils";
import type { UserDoc } from "@/types";

export default function AdminDashboard({ userDoc }: { userDoc: UserDoc }) {
  const [counts, setCounts] = useState<UserRoleCounts | null>(null);
  const [recent, setRecent] = useState<UserDoc[] | null>(null);
  const [mentorship, setMentorship] = useState<MentorshipStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [c, r, m] = await Promise.all([
          getUserRoleCounts(),
          getRecentUsers(5),
          getMentorshipStats(),
        ]);
        if (!cancelled) {
          setCounts(c);
          setRecent(r);
          setMentorship(m);
        }
      } catch {
        if (!cancelled) setError("Couldn't load live dashboard data right now.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
            Administrator dashboard
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">
            Welcome back, {userDoc.name.split(" ")[0]}.
          </h1>
        </div>
        <Link href="/admin/analytics" className="btn-secondary">
          Full analytics
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-rust/10 px-4 py-3 font-body text-sm text-rust">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl text-ink">Users</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Total users" value={counts ? counts.total : "…"} />
          <StatCard label="Alumni" value={counts ? counts.alumni : "…"} />
          <StatCard label="Students" value={counts ? counts.student : "…"} />
          <StatCard label="Faculty" value={counts ? counts.faculty : "…"} />
          <StatCard label="Admins" value={counts ? counts.admin : "…"} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl text-ink">Mentorship requests</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total requests" value={mentorship ? mentorship.total : "…"} />
          <StatCard label="Pending" value={mentorship ? mentorship.pending : "…"} />
          <StatCard label="Accepted" value={mentorship ? mentorship.accepted : "…"} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Recent registrations</h2>
          <Link href="/admin/users" className="font-body text-sm text-brass-dark hover:underline">
            View all users
          </Link>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {!recent && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center font-body text-sm text-ink-400">
                    Loading recent registrations…
                  </td>
                </tr>
              )}
              {recent && recent.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center font-body text-sm text-ink-400">
                    No users registered yet.
                  </td>
                </tr>
              )}
              {recent?.map((u) => (
                <tr key={u.uid} className="border-b border-ink/5 last:border-b-0">
                  <td className="px-5 py-3 font-body text-sm text-ink">{u.name}</td>
                  <td className="px-5 py-3 font-body text-sm text-ink-500">{u.email}</td>
                  <td className="px-5 py-3 font-body text-sm text-ink-500">{roleLabel(u.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
