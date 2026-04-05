import type { CommunityBadge } from "@/types/community";

interface BadgeChipProps {
  badge: CommunityBadge;
}

/**
 * Badge chip for profiles and posts.
 * Future: verified_purchaser - styled differently, tied to Shopify.
 */
export function BadgeChip({ badge }: BadgeChipProps) {
  const variantStyles: Record<string, string> = {
    verified_purchaser: "bg-teal/15 text-teal",
    swatcher: "bg-magenta/15 text-magenta",
    moderator: "bg-plum/15 text-plum",
    brand: "bg-cyan/15 text-teal",
    custom: "bg-ink/10 text-ink/80",
  };
  const style = variantStyles[badge.type] ?? variantStyles.custom;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}
      title={badge.type}
    >
      {badge.label}
    </span>
  );
}
