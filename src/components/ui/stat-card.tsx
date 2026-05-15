import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "warning";
};

const toneClassName = {
  neutral: "bg-secondary/10 text-secondary",
  positive: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: StatCardProps) {
  return (
    <article className="rounded-lg border border-base-300 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-neutral/55">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <span
          className={clsx(
            "grid size-10 shrink-0 place-items-center rounded-md",
            toneClassName[tone],
          )}
        >
          <Icon size={19} aria-hidden />
        </span>
      </div>
      <p className="mt-4 text-sm text-neutral/60">{detail}</p>
    </article>
  );
}
