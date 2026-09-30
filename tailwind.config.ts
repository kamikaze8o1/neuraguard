import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        guard: {
          bg: "#0d1210",
          surface: "#131a17",
          surface2: "#1a2320",
          border: "#26332d",
          ink: "#e9f5ee",
          muted: "#9db3a8",
          accent: "#39ff8f",
          accent2: "#1fbf6b",
        },
        probe: {
          bg: "#0b0f14",
          surface: "#121821",
          surface2: "#182130",
          border: "#28343f",
          ink: "#eef3f8",
          muted: "#93a3b3",
          accent: "#ffb020",
          accent2: "#ff7a1a",
          steel: "#5c7c99",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(57,255,143,0.25), 0 0 24px rgba(57,255,143,0.15)",
        "glow-probe": "0 0 0 1px rgba(255,176,32,0.25), 0 0 24px rgba(255,176,32,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
