type StatusVariant = "success" | "warning" | "error" | "neutral" | "info";

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-teal/15 text-teal",
  warning: "bg-magenta/15 text-magenta",
  error: "bg-red-100 text-red-700",
  neutral: "bg-ink/10 text-ink/80",
  info: "bg-cyan/15 text-teal",
};

/**
 * Status badge for orders, batches, releases, etc.
 */
export function StatusBadge({ label, variant = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}
