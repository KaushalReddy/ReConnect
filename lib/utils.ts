import type { UserRole } from "@/types";

/**
 * Where a user should land immediately after logging in.
 * Every role currently shares the same dashboard shell, which then
 * renders role-specific panels (built out in Phase 2).
 */
export function dashboardPathForRole(_role: UserRole): string {
  return "/dashboard";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "ALUMNI":
      return "Alumni";
    case "STUDENT":
      return "Student";
    case "FACULTY":
      return "Faculty";
    case "ADMIN":
      return "Administrator";
  }
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
