import { useMemo } from "react";
import type { EventDoc } from "@/types";

interface Props {
  event: EventDoc;
  onEdit?: (event: EventDoc) => void;
  onDelete?: (eventId: string) => void;
  isAdmin?: boolean;
}

function formatEventDate(ms: number) {
  const d = new Date(ms);
  return {
    day: d.toLocaleDateString("en-US", { day: "2-digit" }),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export default function EventCard({ event, onEdit, onDelete, isAdmin }: Props) {
  const { day, month, time } = formatEventDate(event.date);
  const now = useMemo(() => Date.now(), []);
  const isPast = event.date < now;

  return (
    <div
      className={`card flex gap-4 p-5 transition-shadow hover:shadow-lg ${isPast ? "opacity-60" : ""}`}
    >
      {/* Date badge */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-ink px-2 py-3 text-paper">
        <span className="font-mono text-xl font-bold leading-none">{day}</span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-widest">
          {month}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-medium text-ink leading-snug">
            {event.title}
          </h3>
          {isPast && (
            <span className="shrink-0 rounded-full bg-ink/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-ink-400">
              Past
            </span>
          )}
        </div>
        <p className="mt-1 font-mono text-xs text-brass-dark">
          {time} · {event.location}
        </p>
        {event.description && (
          <p className="mt-2 font-body text-sm text-ink-500 line-clamp-2">
            {event.description}
          </p>
        )}

        {isAdmin && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onEdit?.(event)}
              className="font-mono text-[11px] uppercase tracking-wide text-brass-dark hover:underline"
            >
              Edit
            </button>
            <span className="text-ink-200">·</span>
            <button
              onClick={() => onDelete?.(event.eventId)}
              className="font-mono text-[11px] uppercase tracking-wide text-rust hover:underline"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
