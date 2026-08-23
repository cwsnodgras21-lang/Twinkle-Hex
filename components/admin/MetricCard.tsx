import { ReactNode } from "react";

type MetricAccent = "cyan" | "teal" | "plum" | "magenta" | "ink";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  /** Brand color accent — a soft gradient wash + colored value, not a plain gray box. */
  accent?: MetricAccent;
}

const accentStyles: Record<MetricAccent, { wash: string; value: string; ring: string }> = {
  cyan: { wash: "from-cyan/15 via-cyan/5 to-transparent", value: "text-teal", ring: "ring-cyan/20" },
  teal: { wash: "from-teal/15 via-teal/5 to-transparent", value: "text-teal", ring: "ring-teal/20" },
  plum: { wash: "from-plum/15 via-plum/5 to-transparent", value: "text-plum", ring: "ring-plum/20" },
  magenta: { wash: "from-magenta/15 via-magenta/5 to-transparent", value: "text-magenta", ring: "ring-magenta/20" },
  ink: { wash: "from-ink/10 via-ink/5 to-transparent", value: "text-ink", ring: "ring-ink/10" },
};

/**
 * Dashboard metric card with a brand-color wash so the dashboard reads as a
 * polish brand's tool, not a generic admin generator.
 */
export function MetricCard({ title, value, subtitle, icon, accent = "ink" }: MetricCardProps) {
  const styles = accentStyles[accent];
  return (
    <div
      className={`relative overflow-hidden bg-white border border-ink/10 rounded-xl p-4 md:p-5 shadow-sm ring-1 ${styles.ring} transition-shadow hover:shadow-md`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.wash}`} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink/70">{title}</p>
          <p className={`text-3xl font-bold mt-1 tabular-nums ${styles.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-ink/60 mt-1.5">{subtitle}</p>}
        </div>
        {icon && <div className="flex-shrink-0 text-2xl leading-none">{icon}</div>}
      </div>
    </div>
  );
}
