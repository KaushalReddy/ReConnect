"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, only these roles may view the page. */
  allowedRoles?: UserRole[];
}

/**
 * Wrap any authenticated page in this component. It:
 *  - redirects signed-out visitors to /login
 *  - redirects signed-in users whose role isn't allowed back to /dashboard
 *  - shows a loading state while auth/session data resolves
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { firebaseUser, userDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && userDoc && !allowedRoles.includes(userDoc.role)) {
      router.replace("/dashboard");
    }
  }, [loading, firebaseUser, userDoc, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ink-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brass" />
          <p className="font-body text-sm">Verifying your session…</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return null;
  if (allowedRoles && userDoc && !allowedRoles.includes(userDoc.role)) {
    return null;
  }

  return <>{children}</>;
}
