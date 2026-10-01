"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

function AdminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/analytics");
  }, [router]);
  return null;
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminRedirect />
    </ProtectedRoute>
  );
}
