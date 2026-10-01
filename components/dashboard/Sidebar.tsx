"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types";
import { navItemsForRole } from "@/lib/navigation";
import { roleLabel } from "@/lib/utils";

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <aside className="hidden w-56 shrink-0 border-r border-ink/10 py-8 pr-6 md:block">
      <p className="mb-4 px-3 font-mono text-[11px] uppercase tracking-wide text-ink-400">
        {roleLabel(role)} menu
      </p>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 font-body text-sm transition-colors ${
                active
                  ? "bg-ink text-paper"
                  : "text-ink-500 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
