import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
}

const BASE_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Directory", href: "/alumni" },
  { label: "Events", href: "/events" },
  { label: "Opportunities", href: "/opportunities" },
];

const ROLE_ITEMS: Record<UserRole, NavItem[]> = {
  ALUMNI: [
    { label: "Mentorship requests", href: "/mentorship" },
    { label: "Messages", href: "/messages" },
    { label: "Meetings", href: "/meetings" },
  ],
  STUDENT: [
    { label: "My mentorship requests", href: "/mentorship" },
    { label: "Messages", href: "/messages" },
    { label: "Meetings", href: "/meetings" },
  ],
  FACULTY: [
    { label: "My mentorship requests", href: "/mentorship" },
    { label: "Messages", href: "/messages" },
    { label: "Meetings", href: "/meetings" },
  ],
  ADMIN: [
    { label: "Manage users", href: "/admin/users" },
    { label: "Analytics", href: "/admin/analytics" },
  ],
};

export function navItemsForRole(role: UserRole): NavItem[] {
  const [overview, ...rest] = BASE_ITEMS;
  // Overview first, then the role's own items, then the shared items —
  // so each dashboard leads with what's most relevant to that role.
  return [overview, ...ROLE_ITEMS[role], ...rest];
}
