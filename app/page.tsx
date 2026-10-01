import Link from "next/link";
import Navbar from "@/components/Navbar";
import NetworkSeal from "@/components/NetworkSeal";

const roles = [
  {
    key: "Alumni",
    detail: "Keep your record current and open your calendar to mentees who share your path.",
  },
  {
    key: "Students",
    detail: "Search a verified directory and reach out directly for mentorship, referrals, and advice.",
  },
  {
    key: "Faculty",
    detail: "Connect coursework to career outcomes by routing students to the right graduates.",
  },
  {
    key: "Admins",
    detail: "See engagement across the whole network in one dashboard, not four spreadsheets.",
  },
];

const stats = [
  { label: "Verified alumni records", value: "One" },
  { label: "Login for every role", value: "1" },
  { label: "Spreadsheets replaced", value: "All" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:pt-24">
        <div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-brass-dark">
            Alumni Management &amp; Engagement
          </p>
          <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink md:text-6xl">
            The record your institution keeps of everyone who came through it.
          </h1>
          <p className="mt-6 max-w-md font-body text-lg leading-relaxed text-ink-500">
            ReConnect is the single place alumni, students, faculty, and
            administrators meet — for mentorship, hiring, and the kind of
            institutional memory a spreadsheet can&apos;t hold.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/register" className="btn-primary">
              Create your account
            </Link>
            <Link href="/alumni" className="btn-secondary">
              Browse the directory
            </Link>
          </div>

          <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-ink/10 pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
                  {s.label}
                </dt>
                <dd className="mt-1 font-display text-2xl text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex justify-center md:justify-end">
          <NetworkSeal className="w-full max-w-sm" />
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-ink/10 bg-paper-dim/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
            Built around four roles, one record.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r, i) => (
              <div key={r.key} className="card flex flex-col gap-4 p-6">
                <span className="font-mono text-xs text-brass-dark">
                  0{i + 1}
                </span>
                <h3 className="font-display text-xl text-ink">{r.key}</h3>
                <p className="font-body text-sm leading-relaxed text-ink-500">
                  {r.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
          Your alumni are already out there. Give them a way back in.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="btn-primary">
            Get started
          </Link>
          <Link href="/login" className="btn-secondary">
            I already have an account
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 font-body text-xs text-ink-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} ReConnect.</p>
          <p>A centralized record for institutional alumni engagement.</p>
        </div>
      </footer>
    </div>
  );
}
