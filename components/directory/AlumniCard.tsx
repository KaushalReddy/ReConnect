import Link from "next/link";
import type { AlumniProfile } from "@/types";
import { initials } from "@/lib/utils";

export default function AlumniCard({ profile }: { profile: AlumniProfile }) {
  return (
    <Link
      href={`/alumni/${profile.userId}`}
      className="card flex flex-col gap-4 p-5 transition-shadow hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoUrl}
            alt={profile.fullName}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink font-display text-base text-paper">
            {initials(profile.fullName)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-semibold text-ink">
            {profile.fullName}
          </p>
          <p className="truncate font-body text-xs text-ink-400">
            Class of {profile.graduationYear}
          </p>
        </div>
      </div>

      <div>
        <p className="truncate font-body text-sm text-ink-600">
          {[profile.jobTitle, profile.currentCompany].filter(Boolean).join(" at ") || "—"}
        </p>
        {profile.location && (
          <p className="truncate font-body text-xs text-ink-400">{profile.location}</p>
        )}
      </div>

      {profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full bg-ink/5 px-2.5 py-0.5 font-body text-[11px] text-ink-500"
            >
              {s}
            </span>
          ))}
          {profile.skills.length > 3 && (
            <span className="font-body text-[11px] text-ink-400">
              +{profile.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {profile.availableForMentorship && (
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-verdant/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-verdant-dark">
          Open to mentorship
        </span>
      )}
    </Link>
  );
}
