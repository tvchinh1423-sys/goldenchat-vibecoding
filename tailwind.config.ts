import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--border))",
        ring: "hsl(var(--primary))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "#fff",
          hover: "#2563eb",
          light: "#eff6ff",
        },
        muted: { DEFAULT: "#f4f5fa", foreground: "#777c99" },
      },
      fontFamily: { sans: ["Arial", "Helvetica", "sans-serif"] },
      boxShadow: { panel: "0 2px 14px -8px rgb(30 41 59 / 12%)" },
    },
  },
  plugins: [],
} satisfies Config;
