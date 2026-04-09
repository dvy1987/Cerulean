import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
      },
      colors: {
        cerulean: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b9dfff",
          300: "#7cc4ff",
          400: "#36a9ff",
          500: "#0090f0",
          600: "#0070cc",
          700: "#0058a6",
          800: "#004a89",
          900: "#003d71",
          950: "#00274a",
        },
        warm: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        border: "var(--border-color)",
        muted: "var(--muted)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        medium: "var(--shadow-medium)",
        lifted: "var(--shadow-lifted)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { maxHeight: "0", opacity: "0" },
          "100%": { maxHeight: "24rem", opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translate(-50%, 8px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        slideUp: "slideUp 0.25s ease-out",
        slideDown: "slideDown 0.3s ease-out",
        scaleIn: "scaleIn 0.15s ease-out",
        toastIn: "toastIn 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
