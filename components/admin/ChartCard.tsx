"use client";

import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  loading?: boolean;
  children: ReactNode;
  height?: number;
}

export default function ChartCard({
  title,
  subtitle,
  loading,
  children,
  height = 280,
}: Props) {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="font-display text-lg text-ink">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 font-body text-xs text-ink-400">{subtitle}</p>
        )}
      </div>
      {loading ? (
        <div
          className="animate-pulse rounded-lg bg-ink/5"
          style={{ height }}
        />
      ) : (
        <div style={{ height }}>{children}</div>
      )}
    </div>
  );
}
