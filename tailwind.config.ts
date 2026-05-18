import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "monospace"],
      },
      colors: {
        ink: "#1C3144",
        paper: "#FBFAF6",
        sand: "#E9E5DC",
        amber: "#B87830",
        "amber-dark": "#8E5A1F",
        profit: "#2D9C6B",
        loss: "#B85042",
        bonds: "#8A7A3C",
        equity: "#34699A",
        "sys-blue": "#0A84FF",
      },
      boxShadow: {
        panel: "0 18px 50px rgba(28,49,68,0.08)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 0 rgba(28,49,68,0.04), 0 14px 36px rgba(28,49,68,0.08)",
        "glass-strong": "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(28,49,68,0.06), 0 20px 48px rgba(28,49,68,0.10)",
        card: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 0 rgba(28,49,68,0.04), 0 4px 16px rgba(28,49,68,0.05)",
      },
      borderRadius: {
        glass: "14px",
        card: "16px",
      },
    },
  },
  daisyui: {
    themes: [
      {
        investor: {
          primary: "#0A84FF",
          "primary-content": "#ffffff",
          secondary: "#B87830",
          accent: "#B87830",
          neutral: "#1C3144",
          "base-100": "#E9E5DC",
          "base-200": "#E0DBD1",
          "base-300": "#D3CEC4",
          "base-content": "#1C3144",
          info: "#0A84FF",
          success: "#2D9C6B",
          warning: "#B87830",
          error: "#B85042",
        },
      },
    ],
  },
  plugins: [daisyui],
};

export default config;
