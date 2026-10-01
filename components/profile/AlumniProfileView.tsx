import type { AlumniProfile } from "@/types";
import { initials } from "@/lib/utils";

export default function AlumniProfileView({ profile }: { profile: AlumniProfile }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-5">
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoUrl}
            alt={profile.fullName}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ink font-display text-2xl text-paper">
            {initials(profile.fullName)}
          </span>
        )}
        <div>
          <h2 className="font-display text-2xl text-ink">{profile.fullName}</h2>
          <p className="font-body text-sm text-ink-500">
            {[profile.jobTitle, profile.currentCompany].filter(Boolean).join(" at ")}
          </p>
          {profile.location && (
            <p className="font-body text-sm text-ink-400">{profile.location}</p>
          )}
          {profile.availableForMentorship && (
            <span className="mt-2 inline-block rounded-full bg-verdant/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-verdant-dark">
              Open to mentorship
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-400">Department</p>
          <p className="font-body text-sm text-ink">{profile.department || "—"}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-400">Degree</p>
          <p className="font-body text-sm text-ink">{profile.degree || "—"}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
            Graduation year
          </p>
          <p className="font-body text-sm text-ink">{profile.graduationYear || "—"}</p>
        </div>
      </div>

      {profile.bio && (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-400">Biography</p>
          <p className="mt-1 font-body text-sm leading-relaxed text-ink-600">{profile.bio}</p>
        </div>
      )}

      {profile.skills.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-400">Skills</p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-ink/5 px-3 py-1 font-body text-xs text-ink-600"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.linkedinUrl && (
        <a
          href={profile.linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-brass-dark hover:underline"
        >
          View LinkedIn profile ↗
        </a>
      )}
    </div>
  );
}
