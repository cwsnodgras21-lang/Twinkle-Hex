import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}

/**
 * Dashboard metric card. Future: Link to detail view, sparkline.
 */
export function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-white border border-ink/10 rounded-lg p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink/70">{title}</p>
          <p className="text-2xl font-bold text-ink mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-ink/60 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 text-teal/70">{icon}</div>
        )}
      </div>
      {trend && (
        <div className="mt-2 text-xs">
          {trend === "up" && <span className="text-teal">↑</span>}
          {trend === "down" && <span className="text-magenta">↓</span>}
        </div>
      )}
    </div>
  );
}
