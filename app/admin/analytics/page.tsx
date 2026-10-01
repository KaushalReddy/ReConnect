"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ChartCard from "@/components/admin/ChartCard";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/lib/auth-context";
import {
  getUserRoleCounts,
  type UserRoleCounts,
} from "@/lib/firestore/users";
import {
  getMentorshipStats,
  type MentorshipStats,
} from "@/lib/firestore/mentorshipRequests";
import { getRecentEngagementLogs } from "@/lib/firestore/engagementLogs";
import type { EngagementLog } from "@/types";

// ── Palette ──────────────────────────────────────────────────────────────────
const COLORS = {
  alumni: "#2F6F62",
  student: "#B08D4F",
  faculty: "#4A4D63",
  admin: "#B4552F",
  pending: "#B08D4F",
  accepted: "#2F6F62",
  rejected: "#B4552F",
  line: "#B08D4F",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildRoleData(counts: UserRoleCounts) {
  return [
    { name: "Alumni", value: counts.alumni, color: COLORS.alumni },
    { name: "Students", value: counts.student, color: COLORS.student },
    { name: "Faculty", value: counts.faculty, color: COLORS.faculty },
    { name: "Admins", value: counts.admin, color: COLORS.admin },
  ].filter((d) => d.value > 0);
}

function buildMentorshipData(stats: MentorshipStats) {
  return [
    { name: "Pending", value: stats.pending, fill: COLORS.pending },
    { name: "Accepted", value: stats.accepted, fill: COLORS.accepted },
    { name: "Rejected", value: stats.rejected, fill: COLORS.rejected },
  ];
}

/** Build a per-day engagement count for the last N days. */
function buildEngagementTimeline(logs: EngagementLog[], days = 7) {
  const now = Date.now();
  const msPerDay = 86_400_000;
  const buckets: Record<string, number> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * msPerDay);
    const key = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    buckets[key] = 0;
  }

  logs.forEach((log) => {
    const d = new Date(log.timestamp);
    const key = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (key in buckets) buckets[key]++;
  });

  return Object.entries(buckets).map(([date, events]) => ({ date, events }));
}

function actionLabel(action: EngagementLog["action"]): string {
  switch (action) {
    case "PROFILE_CREATED":
      return "Profile created";
    case "PROFILE_UPDATED":
      return "Profile updated";
    case "MENTORSHIP_REQUEST_SENT":
      return "Mentorship request sent";
    case "MENTORSHIP_REQUEST_ACCEPTED":
      return "Mentorship request accepted";
    case "MENTORSHIP_REQUEST_REJECTED":
      return "Mentorship request rejected";
    case "MENTORSHIP_MEETING_SCHEDULED":
      return "Meeting scheduled";
    case "MENTORSHIP_MEETING_CONFIRMED":
      return "Meeting confirmed";
    default:
      return "Activity logged";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
function AnalyticsContent() {
  const { userDoc } = useAuth();

  const [counts, setCounts] = useState<UserRoleCounts | null>(null);
  const [mentorship, setMentorship] = useState<MentorshipStats | null>(null);
  const [logs, setLogs] = useState<EngagementLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getUserRoleCounts(), getMentorshipStats(), getRecentEngagementLogs(50)])
      .then(([c, m, l]) => {
        if (cancelled) return;
        setCounts(c);
        setMentorship(m);
        setLogs(l);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load analytics data right now.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!userDoc) return null;

  const loading = !counts || !mentorship || !logs;
  const roleData = counts ? buildRoleData(counts) : [];
  const mentorshipData = mentorship ? buildMentorshipData(mentorship) : [];
  const timelineData = logs ? buildEngagementTimeline(logs) : [];

  return (
    <DashboardShell role={userDoc.role}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
              Admin analytics
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium text-ink">
              Platform overview
            </h1>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-rust/10 px-4 py-3 font-body text-sm text-rust">
            {error}
          </p>
        )}

        {/* ── Stat row ── */}
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
          <h2 className="mb-3 font-display text-xl text-ink">
            Mentorship requests
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total"
              value={mentorship ? mentorship.total : "…"}
            />
            <StatCard
              label="Pending"
              value={mentorship ? mentorship.pending : "…"}
            />
            <StatCard
              label="Accepted"
              value={mentorship ? mentorship.accepted : "…"}
            />
            <StatCard
              label="Rejected"
              value={mentorship ? mentorship.rejected : "…"}
            />
          </div>
        </section>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="User distribution"
            subtitle="Breakdown by role"
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(18,20,28,0.1)",
                    fontSize: "12px",
                    fontFamily: "var(--font-inter), system-ui",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: "12px",
                    fontFamily: "var(--font-inter), system-ui",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Mentorship request status"
            subtitle="Across all requests"
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mentorshipData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barSize={48}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(18,20,28,0.07)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fontFamily: "var(--font-inter), system-ui" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fontFamily: "var(--font-inter), system-ui" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(18,20,28,0.1)",
                    fontSize: "12px",
                    fontFamily: "var(--font-inter), system-ui",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {mentorshipData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Engagement timeline ── */}
        <ChartCard
          title="Engagement activity"
          subtitle="Events logged in the last 7 days"
          loading={loading}
          height={220}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(18,20,28,0.07)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fontFamily: "var(--font-inter), system-ui" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fontFamily: "var(--font-inter), system-ui" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid rgba(18,20,28,0.1)",
                  fontSize: "12px",
                  fontFamily: "var(--font-inter), system-ui",
                }}
              />
              <Line
                type="monotone"
                dataKey="events"
                stroke={COLORS.line}
                strokeWidth={2.5}
                dot={{ r: 4, fill: COLORS.line }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Recent engagement log ── */}
        <section>
          <h2 className="mb-3 font-display text-xl text-ink">
            Recent engagement activity
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">User ID</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-6 text-center font-body text-sm text-ink-400"
                    >
                      Loading…
                    </td>
                  </tr>
                )}
                {logs && logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-6 text-center font-body text-sm text-ink-400"
                    >
                      No activity logged yet.
                    </td>
                  </tr>
                )}
                {logs?.slice(0, 15).map((log) => (
                  <tr
                    key={log.logId}
                    className="border-b border-ink/5 last:border-b-0 hover:bg-ink/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3 font-body text-sm text-ink">
                      {actionLabel(log.action)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-400">
                      {log.userId.slice(0, 10)}…
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-400">
                      {new Date(log.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
