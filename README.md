# ReConnect — Alumni Management & Engagement Platform

Phase 1: project scaffold, Tailwind CSS, Firebase configuration, and authentication.
Phase 2: role-based dashboards.
Phase 3: alumni profiles and the searchable alumni directory.
Phase 4: mentorship requests and engagement logging.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Firebase Authentication · Cloud Firestore · Recharts (added in Phase 5)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Firebase project values
npm run dev
```

Open http://localhost:3000.

## Required environment variables

Create a Firebase project at https://console.firebase.google.com, enable
**Authentication → Sign-in method → Email/Password**, and create a
**Cloud Firestore** database. Then, from Project Settings → General → Your
apps, register a Web app and copy its config into `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

These are all `NEXT_PUBLIC_*` because the Firebase **client** SDK is
designed to run in the browser — access is enforced separately by
`firestore.rules`, not by hiding these values.

Deploy the security rules with the Firebase CLI once you have a project:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # point it at firestore.rules and firestore.indexes.json in this repo
firebase deploy --only firestore:rules,firestore:indexes
```

## What Phase 1 built

**Config & tooling**
- `package.json`, `tsconfig.json`, `next.config.mjs` — project + TypeScript setup
- `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css` — design tokens (colors, fonts) and reusable utility classes (`.btn-primary`, `.input-field`, `.card`, …)

**Firebase**
- `firebase/config.ts` — initializes the Firebase app, exports `auth` and `db`
- `firestore.rules` — locks every collection down by default; only `users` is opened up so far, to the owner for writes and any signed-in user for reads

**Types**
- `types/index.ts` — the single source of truth for every Firestore document shape used across all six collections (`users`, `alumniProfiles`, `mentorshipRequests`, `engagementLogs`, `events`, `opportunities`), so later phases don't redefine them

**Auth**
- `lib/auth-context.tsx` — a React context (`AuthProvider` / `useAuth`) wrapping Firebase Auth: `register(name, email, password, role)`, `login(email, password)`, `logout()`, plus live `firebaseUser` / `userDoc` / `loading` state
- `lib/firestore/users.ts` — `createUserDoc`, `getUserDoc`, `markProfileCompleted`
- `hooks/useAuth.ts` — re-exports the hook so it's discoverable under `hooks/`
- `components/ProtectedRoute.tsx` — redirects signed-out visitors to `/login`, and (via an optional `allowedRoles` prop) redirects users without the right role back to `/dashboard`

**Pages**
- `/` — public landing page
- `/register` — email/password sign-up with role selection (Student, Alumni, Faculty, Admin); on success, creates the Firestore `users/{uid}` doc and redirects to `/dashboard`
- `/login` — email/password sign-in with role-based redirection to `/dashboard`
- `/dashboard` — protected placeholder; reads the signed-in user's role and greets them. Full role-specific panels (mentorship inbox, analytics, directory shortcuts) are built in Phase 2.

**Components**
- `components/Navbar.tsx` — adapts between signed-out (Log in / Join) and signed-in (avatar, role, Log out) states
- `components/NetworkSeal.tsx` — the landing page's signature graphic: a medallion built from the app's actual four roles and their real relationships (mentorship, advising, verification, oversight)

## What Phase 2 built

**Live Firestore queries**
- `lib/firestore/users.ts` gained `getUserRoleCounts()` (server-side count aggregation, one query per role — no documents downloaded) and `getRecentUsers(count)`, both used by the admin dashboard's live user stats.

**Dashboard shell**
- `lib/navigation.ts` — role → sidebar nav items (`ALUMNI`, `STUDENT`, `FACULTY`, `ADMIN` each get a different menu)
- `components/dashboard/Sidebar.tsx` — renders that menu, highlights the active route
- `components/dashboard/DashboardShell.tsx` — the layout every authenticated page now uses: `Navbar` + `Sidebar` + content

**Reusable UI**
- `components/StatCard.tsx`, `components/EmptyState.tsx` — used across every dashboard
- `components/dashboard/MentorshipRequestRow.tsx` — a single mentorship request, with status pill

**Role-specific dashboard panels** (`components/dashboard/*Dashboard.tsx`)
- **Student** — requests sent, upcoming events, open opportunities
- **Faculty** — outreach to alumni on students' behalf, upcoming events
- **Alumni** — incoming mentorship requests, a "complete your profile" prompt when `profileCompleted` is `false`
- **Admin** — *live* user counts by role and a *live* recent-registrations table, both from Firestore

**Pages**
- `app/dashboard/page.tsx` — now reads the signed-in user's role and renders the matching dashboard panel inside `DashboardShell`
- `app/profile/page.tsx` — minimal protected placeholder (name, email, role) so the navbar avatar link works; the full editable profile form is built in Phase 3

**Sample data**
- `lib/sampleData.ts` — mentorship requests, events, and opportunities are realistic sample data, clearly labeled, because those collections (`mentorshipRequests`, `events`, `opportunities`) aren't built until Phases 4 and 6. Everything backed by a collection that already exists (`users`) uses a real Firestore query instead.

## What Phase 3 built

**Firestore**
- `lib/firestore/alumniProfiles.ts` — `getAlumniProfile(uid)`, `saveAlumniProfile(uid, input)` (create-or-update, also flips `users/{uid}.profileCompleted`), `getAllAlumniProfiles()` for the directory
- `firestore.rules` gained an `alumniProfiles/{userId}` block: any signed-in user can read (needed for the directory), but only the profile's owner can write to it, and only if their `users/{uid}` doc says `role == "ALUMNI"` — this is what stops students or faculty from creating/editing an alumni profile

**Profile page (`/profile`)**
- For **Alumni**: a full create → view → edit flow. First visit with no profile opens straight into the form; saving switches to a read-only view with an "Edit profile" button.
- For **Student / Faculty / Admin**: unchanged simple info card (name, email, role) — editable profile fields for those roles aren't part of this spec.
- New components: `components/profile/AlumniProfileForm.tsx` (all fields from the spec: name, photo URL, department, graduation year, degree, company, job title, location, skills, LinkedIn, bio, mentorship availability) and `components/profile/AlumniProfileView.tsx` (read-only rendering, reused on the directory detail page)

**Alumni directory (`/alumni`)**
- `components/directory/DirectoryFilters.tsx` — search by name, plus filters for department, graduation year, company, skill, and location (all client-side over the fetched profile set, so no composite Firestore indexes are needed for arbitrary filter combinations)
- `components/directory/AlumniCard.tsx` — card layout showing name, photo/initials, graduation year, company, job title, up to 3 skills, and a mentorship-availability badge
- Loading skeletons, an empty state when no alumni have completed profiles yet, and a separate empty state for "no results match your filters"

**Alumni detail page (`/alumni/[id]`)**
- Renders the same `AlumniProfileView` used on `/profile`, fetched by uid from the route param
- Deliberately never displays email — `AlumniProfile` doesn't store it, so there's no sensitive contact info to leak through the directory
- Shows a disabled "Request mentorship" button when the alumni is open to mentorship, since the mentorship system itself is built in Phase 4

## What Phase 4 built

**Live Firestore queries**
- `lib/firestore/mentorshipRequests.ts` — `sendMentorshipRequest`, `getSentRequests`, `getIncomingRequests`, `getExistingRequest` (prevents duplicate requests and drives the right call-to-action state), `respondToRequest` (alumni-only accept/reject), `getMentorshipStats` (server-side count aggregation for the admin dashboard)
- `lib/firestore/engagementLogs.ts` — `logEngagement` and `getRecentEngagementLogs`. Every write path that should log an event calls this itself (profile save in `alumniProfiles.ts`, request sent/accepted/rejected in `mentorshipRequests.ts`) rather than the UI calling it separately, so a log can never be missed or double-written by a retry.

**Security rules**
- `firestore.rules` gained `mentorshipRequests` (only the two participants or an admin can read a request; only the requester can create one, and only as `pending` about themselves; only the alumnus can update it, and only to flip `pending` → `accepted`/`rejected` — nothing else about the request is mutable) and `engagementLogs` (write-once, always about the signed-in user, readable by its subject or an admin)
- `firestore.indexes.json` — the composite indexes `mentorshipRequests` needs for `getSentRequests`/`getIncomingRequests` (an equality filter combined with `orderBy` on a different field requires one in Firestore). Deploy alongside the rules; see setup instructions above.

**UI**
- `/alumni/[id]` — alumni with `availableForMentorship` now show `components/mentorship/RequestMentorshipPanel.tsx`: a message box for students/faculty, or a status line if a request already exists between the two of you
- `/mentorship` — role-aware: students/faculty see requests they've sent (`components/mentorship/MentorshipRequestCard.tsx`); alumni see incoming requests with Accept/Decline actions
- **Alumni, Student, and Faculty dashboards** now show *live* mentorship data instead of Phase 2's sample data — including inline Accept/Decline on the alumni dashboard
- **Admin dashboard** now shows *live* mentorship totals (total/pending/accepted) via `getMentorshipStats()`, replacing the Phase 2 sample numbers

**What's still sample data:** only `events` and `opportunities` (Phase 6) — everything else in the app is now backed by real Firestore reads and writes.

## What Phase 5 built

**Admin analytics (`/admin/analytics`)**
- `getUserRoleCounts()` + `getMentorshipStats()` + `getRecentEngagementLogs()` — all called in parallel for a single-pass load
- **PieChart** — user distribution by role (Alumni / Student / Faculty / Admin) using Recharts + custom colour tokens from the design system
- **BarChart** — mentorship request status (Pending / Accepted / Rejected) with per-bar fill colours
- **LineChart** — platform engagement events logged per day over the last 7 days, built from the `engagementLogs` collection server-side
- Stat row: total users + per-role breakdown; total/pending/accepted/rejected request counts
- Recent engagement log table — last 15 events, with human-readable action labels and truncated user IDs

**Admin user directory (`/admin/users`)**
- `getAllUsers()` — new Firestore query that fetches every user doc, ordered by registration date
- `components/admin/UserTable.tsx` — client-side search (name/email), role filter dropdown, and asc/desc sort toggle; result count displayed
- Profile-completion indicator per row

**Supporting components**
- `components/admin/ChartCard.tsx` — title card wrapper for Recharts charts with a height-matched loading skeleton
- `/admin` root page redirects to `/admin/analytics` so the URL is never blank

## What Phase 6 built

**Firestore services**
- `lib/firestore/events.ts` — `createEvent`, `updateEvent`, `deleteEvent`, `getUpcomingEvents` (date ≥ now, ascending), `getAllEvents` (admin, all dates)
- `lib/firestore/opportunities.ts` — `createOpportunity`, `updateOpportunity`, `deleteOpportunity`, `getOpportunities` (with optional type filter)

**Security rules** (`firestore.rules`)
- `events/{eventId}` — any signed-in user can read; only admins can create / update / delete
- `opportunities/{opportunityId}` — same pattern

**Indexes** (`firestore.indexes.json`)
- `events` composite index (`date ASC`) for the upcoming-events query
- `opportunities` composite index (`type ASC, createdAt DESC`) for the type-filtered query

**Pages**
- `/events` — role-aware: **Admins** see the "+ New event" button, an inline create form, an inline edit form, and both upcoming + past event sections with Edit/Delete actions. **All other roles** see only upcoming events in a read-only card view. Loading skeleton + empty state included.
- `/opportunities` — same pattern: **Admins** get "+ Post opportunity" with create/edit/delete. **All other roles** see a type-filter toggle (All / Jobs / Internships) and card view with Apply link.

**Components**
- `components/events/EventCard.tsx` — calendar-style date badge, title, time, location, description, optional admin actions, past-event dimming
- `components/opportunities/OpportunityCard.tsx` — type badge (Full-time / Internship), company, location, description, Apply link, optional admin actions

**Dashboards updated**
- `StudentDashboard` — replaces sample events + opportunities with live `getUpcomingEvents()` / `getOpportunities()` calls; shows loading skeleton and "View all" links
- `FacultyDashboard` — replaces sample events with live `getUpcomingEvents()`


## Firestore schema so far

```
users/{uid}
  uid: string
  name: string
  email: string
  role: "ALUMNI" | "STUDENT" | "FACULTY" | "ADMIN"
  createdAt: number
  profileCompleted: boolean
```

```
alumniProfiles/{uid}   (document id matches the owning user's uid)
  userId: string
  fullName: string
  photoUrl: string
  department: string
  graduationYear: number
  degree: string
  currentCompany: string
  jobTitle: string
  location: string
  skills: string[]
  linkedinUrl: string
  bio: string
  availableForMentorship: boolean
  createdAt: number
  updatedAt: number
```

```
mentorshipRequests/{requestId}
  requestId: string
  studentId: string   // the student or faculty member who sent the request
  alumniId: string
  message: string
  status: "pending" | "accepted" | "rejected"
  createdAt: number
  updatedAt: number
```

```
engagementLogs/{logId}
  logId: string
  userId: string
  action: "PROFILE_CREATED" | "PROFILE_UPDATED" | "MENTORSHIP_REQUEST_SENT"
        | "MENTORSHIP_REQUEST_ACCEPTED" | "MENTORSHIP_REQUEST_REJECTED"
  timestamp: number
  relatedUserId?: string
```

The remaining two collections (`events`, `opportunities`) are fully typed
already in `types/index.ts` and will be built out starting Phase 6.

## Known checks before Phase 5

- `npm run build` should succeed once `.env.local` is populated with a real Firebase project (the Firebase SDK initializes lazily, so `npm run dev` also works without env vars, but auth calls will fail until they're set).
- Registering a user requires **Email/Password** to be enabled in Firebase Authentication, or you'll see `auth/operation-not-allowed`.
- If Firestore is still in "Not created" state, `getUserDoc`/`createUserDoc` calls will throw — create the database first (start in test mode is fine locally; `firestore.rules` above should be deployed before going further).
- The admin dashboard's live stats need at least one registered user of each role to look meaningful — register a few test accounts across roles to see it populated.
- `getUserRoleCounts()` uses `getCountFromServer`, which requires no additional Firestore index, but does require the security rules above (or equivalent) to permit `read` on `users` for signed-in users — already the case with `firestore.rules` as provided.
- To see the directory populated, log in as an Alumni account and save a profile at `/profile` — the directory and detail page both read live from `alumniProfiles`, so there's no sample data to fall back on there.
- If saving an alumni profile throws a permissions error, double-check the deployed `firestore.rules` match the version in this repo — the create rule specifically checks `users/{uid}.role == "ALUMNI"`, so a user registered before their role was set correctly will be rejected.
- **Deploy `firestore.indexes.json`** before testing mentorship requests in a real project. Without it, `getSentRequests`/`getIncomingRequests` will throw a `FirebaseError: The query requires an index` — the error includes a direct link to create it, or you can `firebase deploy --only firestore:indexes` ahead of time using the file in this repo.
- To try the full mentorship flow: complete an alumni profile with "Available for mentorship" checked, then request mentorship from that profile while signed in as a Student or Faculty account, then accept/decline from the Alumni account's `/mentorship` page or dashboard.
