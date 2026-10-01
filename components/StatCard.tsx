interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="card p-5">
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      {hint && <p className="mt-1 font-body text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
