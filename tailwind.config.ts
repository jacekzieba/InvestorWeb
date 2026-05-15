import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import daisyui from "daisyui";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#17201c",
        paper: "#f6f7f4",
        positive: "#176b4d",
        warning: "#a35d00",
      },
      boxShadow: {
        panel: "0 18px 50px rgb(23 32 28 / 0.08)",
      },
    },
  },
  daisyui: {
    themes: [
      {
        investor: {
          primary: "#176b4d",
          "primary-content": "#ffffff",
          secondary: "#2f5f8f",
          accent: "#a35d00",
          neutral: "#17201c",
          "base-100": "#f6f7f4",
          "base-200": "#ecefe8",
          "base-300": "#d9ded3",
          "base-content": "#17201c",
          info: "#2f5f8f",
          success: "#176b4d",
          warning: "#a35d00",
          error: "#a33a3a",
        },
      },
    ],
  },
  plugins: [typography, daisyui],
};

export default config;
