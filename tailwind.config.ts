import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ──────────────────────────────────────────────────────────
        crimson: "#D4004E",
        "crimson-soft": "#FF1A6A",
        "blue-accent": "#0090D9",
        "green-accent": "#6AA613",
        "amber-brand": "#C97A1A",

        // ── Dark backgrounds ───────────────────────────────────────────────
        "bg-base": "#0E0E0F",
        "bg-surface": "#161618",
        "bg-elevated": "#1E1E21",
        "bg-hover": "#252528",

        // ── Light backgrounds ──────────────────────────────────────────────
        "bg-base-light": "#F9F8F5",
        "bg-surface-light": "#FFFFFF",
        "bg-elevated-light": "#F2F1EE",

        // ── shadcn/ui semantic tokens ──────────────────────────────────────
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "7px",
        lg: "10px",
        xl: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
