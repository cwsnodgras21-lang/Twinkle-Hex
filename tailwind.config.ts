import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Twinkle & Hex brand palette
        cyan: "#4ac3ce",
        teal: "#066782",
        ink: "#2e333f",
        plum: "#59486d",
        magenta: "#cb508f",
        // Ops dashboard design tokens (design_handoff_ops_dashboard)
        dash: {
          bg: "oklch(97% 0.01 60)",
          surface: "oklch(99% 0.005 60)",
          border: "oklch(89% 0.012 60)",
          borderLight: "oklch(92% 0.012 60)",
          text: "oklch(22% 0.015 60)",
          muted: "oklch(50% 0.012 60)",
          navy: "oklch(24% 0.06 255)",
          navyBorder: "oklch(18% 0.05 255)",
          navyText: "oklch(82% 0.02 255)",
          navyHover: "oklch(32% 0.07 255)",
          navyDot: "oklch(45% 0.02 255)",
          pink: "oklch(62% 0.19 350)",
          pinkSoft: "oklch(93% 0.05 350)",
          pinkDark: "oklch(40% 0.15 350)",
          pinkPale: "oklch(95% 0.03 345)",
          pinkNavActive: "oklch(40% 0.09 345)",
          purple: "oklch(55% 0.16 300)",
          purpleSoft: "oklch(93% 0.045 300)",
          purpleDark: "oklch(38% 0.13 300)",
          warn: "oklch(72% 0.14 55)",
          warnSoft: "oklch(94% 0.05 55)",
          warnDark: "oklch(42% 0.1 55)",
          danger: "oklch(55% 0.16 20)",
          dangerSoft: "oklch(94% 0.045 20)",
          blank: "oklch(95% 0.012 60)",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
