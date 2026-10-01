"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import AlumniDashboard from "@/components/dashboard/AlumniDashboard";
import FacultyDashboard from "@/components/dashboard/FacultyDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

function DashboardContent() {
  const { userDoc } = useAuth();
  if (!userDoc) return null;

  return (
    <DashboardShell role={userDoc.role}>
      {userDoc.role === "STUDENT" && <StudentDashboard userDoc={userDoc} />}
      {userDoc.role === "ALUMNI" && <AlumniDashboard userDoc={userDoc} />}
      {userDoc.role === "FACULTY" && <FacultyDashboard userDoc={userDoc} />}
      {userDoc.role === "ADMIN" && <AdminDashboard userDoc={userDoc} />}
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
