"use client";

import { useState } from "react";
import { roleLabel } from "@/lib/utils";
import type { UserDoc, UserRole } from "@/types";

const ROLE_BADGE: Record<UserRole, string> = {
  ALUMNI: "bg-verdant/15 text-verdant-dark",
  STUDENT: "bg-brass/15 text-brass-dark",
  FACULTY: "bg-ink/10 text-ink-500",
  ADMIN: "bg-rust/10 text-rust",
};

interface Props {
  users: UserDoc[];
}

export default function UserTable({ users }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) =>
      sortDir === "desc" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );

  function formatDate(ms: number) {
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "ALL")}
          className="input-field w-40"
        >
          <option value="ALL">All roles</option>
          <option value="ALUMNI">Alumni</option>
          <option value="STUDENT">Student</option>
          <option value="FACULTY">Faculty</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          className="btn-secondary !px-4 !py-2 text-xs"
        >
          Date {sortDir === "desc" ? "↓ Newest" : "↑ Oldest"}
        </button>
      </div>

      <p className="font-mono text-xs text-ink-400">
        {filtered.length} of {users.length} users
      </p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink/10 font-mono text-[11px] uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Verification</th>
                <th className="px-5 py-3 font-medium">Profile</th>
                <th className="px-5 py-3 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center font-body text-sm text-ink-400"
                  >
                    No users match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr
                  key={u.uid}
                  className="border-b border-ink/5 last:border-b-0 hover:bg-ink/[0.02] transition-colors"
                >
                  <td className="px-5 py-3 font-body text-sm font-medium text-ink">
                    {u.name}
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-ink-500">
                    <div>{u.email}</div>
                    {u.phoneNumber && (
                      <div className="font-mono text-[11px] text-ink-400">{u.phoneNumber}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${ROLE_BADGE[u.role]}`}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.isEmailVerified || u.isPhoneVerified ? (
                      <div className="flex flex-col gap-1">
                        {u.isEmailVerified && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-verdant-dark">
                            <span className="h-1.5 w-1.5 rounded-full bg-verdant" /> Email OTP
                          </span>
                        )}
                        {u.isPhoneVerified && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-brass-dark">
                            <span className="h-1.5 w-1.5 rounded-full bg-brass" /> Phone SMS
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-300">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wide ${
                        u.profileCompleted
                          ? "text-verdant-dark"
                          : "text-ink-300"
                      }`}
                    >
                      {u.profileCompleted ? "✓ Complete" : "Incomplete"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-400">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
