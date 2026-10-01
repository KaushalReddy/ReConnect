import type { OpportunityDoc } from "@/types";

interface Props {
  opportunity: OpportunityDoc;
  onEdit?: (opp: OpportunityDoc) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

const TYPE_STYLES = {
  JOB: "bg-verdant/15 text-verdant-dark",
  INTERNSHIP: "bg-brass/15 text-brass-dark",
};

export default function OpportunityCard({
  opportunity: opp,
  onEdit,
  onDelete,
  isAdmin,
}: Props) {
  return (
    <div className="card p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${TYPE_STYLES[opp.type]}`}
          >
            {opp.type === "JOB" ? "Full-time" : "Internship"}
          </span>
          <h3 className="mt-2 font-display text-base font-medium text-ink leading-snug">
            {opp.title}
          </h3>
          <p className="mt-0.5 font-body text-sm font-semibold text-ink-500">
            {opp.company}
          </p>
          {opp.location && (
            <p className="mt-0.5 font-mono text-xs text-ink-400">
              📍 {opp.location}
            </p>
          )}
          {opp.description && (
            <p className="mt-2 font-body text-sm text-ink-500 line-clamp-3">
              {opp.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {opp.applyUrl && (
          <a
            href={opp.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !px-4 !py-2 text-xs"
          >
            Apply now ↗
          </a>
        )}
        {isAdmin && (
          <>
            <button
              onClick={() => onEdit?.(opp)}
              className="font-mono text-[11px] uppercase tracking-wide text-brass-dark hover:underline"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(opp.opportunityId)}
              className="font-mono text-[11px] uppercase tracking-wide text-rust hover:underline"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
