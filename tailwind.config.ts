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
      },
    },
  },
  plugins: [],
};

export default config;
