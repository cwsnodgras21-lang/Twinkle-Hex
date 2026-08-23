const FALLBACK_GRADIENT = "linear-gradient(135deg, #4ac3ce 0%, #59486d 55%, #cb508f 100%)";

interface PolishSwatchProps {
  colorHex?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-9 h-9",
  lg: "w-16 h-16",
};

/**
 * A little bottle-cap swatch chip. Shows the polish's actual color when set;
 * otherwise a brand-gradient placeholder so unset polishes still feel on-brand.
 */
export function PolishSwatch({ colorHex, size = "md", className = "" }: PolishSwatchProps) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ring-2 ring-white shadow-[0_0_0_1px_rgba(46,51,63,0.12)] ${sizeClasses[size]} ${className}`}
      style={{ background: colorHex || FALLBACK_GRADIENT }}
      aria-hidden="true"
    />
  );
}
