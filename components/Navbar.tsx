"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { initials, roleLabel } from "@/lib/utils";

export default function Navbar() {
  const { firebaseUser, userDoc, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass/60 font-display text-sm font-semibold text-brass-dark">
            R
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            ReConnect
          </span>
        </Link>

        <nav className="hidden items-center gap-7 font-body text-sm text-ink-500 md:flex">
          <Link href="/alumni" className="transition-colors hover:text-ink">
            Directory
          </Link>
          <Link href="/events" className="transition-colors hover:text-ink">
            Events
          </Link>
          <Link
            href="/opportunities"
            className="transition-colors hover:text-ink"
          >
            Opportunities
          </Link>
          {firebaseUser && userDoc && userDoc.role !== "ADMIN" && (
            <>
              <Link href="/messages" className="transition-colors hover:text-ink">
                Messages
              </Link>
              <Link href="/meetings" className="transition-colors hover:text-ink">
                Meetings
              </Link>
            </>
          )}
        </nav>

        {firebaseUser && userDoc ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden font-body text-sm text-ink-500 transition-colors hover:text-ink sm:inline"
            >
              {roleLabel(userDoc.role)}
            </Link>
            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-body text-xs font-semibold text-paper"
              title={userDoc.name}
            >
              {initials(userDoc.name)}
            </Link>
            <button onClick={handleLogout} className="btn-secondary !px-4 !py-2 text-xs">
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="font-body text-sm text-ink-500 transition-colors hover:text-ink">
              Log in
            </Link>
            <Link href="/register" className="btn-primary !px-5 !py-2 text-xs">
              Join ReConnect
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
