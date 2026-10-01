import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/dashboard/Sidebar";
import type { UserRole } from "@/types";

export default function DashboardShell({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="mx-auto flex max-w-6xl px-6">
        <Sidebar role={role} />
        <main className="min-w-0 flex-1 py-8 md:pl-8">{children}</main>
      </div>
    </div>
  );
}
