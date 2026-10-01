import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12141C",
          50: "#F4F4F6",
          100: "#E3E4E9",
          200: "#C3C5D1",
          300: "#9A9DB0",
          400: "#6C6F87",
          500: "#4A4D63",
          600: "#33354A",
          700: "#22233333",
          800: "#1A1B27",
          900: "#12141C",
        },
        paper: {
          DEFAULT: "#F7F4EC",
          dim: "#EFEAE0",
        },
        brass: {
          DEFAULT: "#B08D4F",
          light: "#D3B172",
          dark: "#8A6B37",
        },
        verdant: {
          DEFAULT: "#2F6F62",
          light: "#4C8F80",
          dark: "#1F4E44",
        },
        rust: {
          DEFAULT: "#B4552F",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(18,20,28,0.06) 1px, transparent 0)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,20,28,0.06), 0 8px 24px -12px rgba(18,20,28,0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
