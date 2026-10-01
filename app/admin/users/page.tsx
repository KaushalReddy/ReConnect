"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import UserTable from "@/components/admin/UserTable";
import { useAuth } from "@/lib/auth-context";
import { getAllUsers } from "@/lib/firestore/users";
import type { UserDoc } from "@/types";

function AdminUsersContent() {
  const { userDoc } = useAuth();
  const [users, setUsers] = useState<UserDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllUsers()
      .then((u) => !cancelled && setUsers(u))
      .catch(() => !cancelled && setError("Couldn't load users right now."));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!userDoc) return null;

  return (
    <DashboardShell role={userDoc.role}>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
            Admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">
            All users
          </h1>
        </div>

        {error && (
          <p className="rounded-lg bg-rust/10 px-4 py-3 font-body text-sm text-rust">
            {error}
          </p>
        )}

        {!users && !error && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-ink/5" />
            ))}
          </div>
        )}

        {users && <UserTable users={users} />}
      </div>
    </DashboardShell>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}
