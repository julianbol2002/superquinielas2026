import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: "var(--pitch, #00D084)",
        gold: "var(--gold, #FFD700)",
        stadium: {
          dark: "var(--bg-primary, #0a0e17)",
          navy: "var(--bg-navy, #111827)",
          card: "var(--bg-card, #1a2234)",
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
        accent: ['"Oswald"', "sans-serif"],
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        pulseHighlight: "pulseHighlight 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseHighlight: {
          "0%, 100%": {
            boxShadow: "0 0 0 0 color-mix(in srgb, var(--pitch) 40%, transparent)",
          },
          "50%": {
            boxShadow: "0 0 0 12px color-mix(in srgb, var(--pitch) 0%, transparent)",
          },
        },
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ".light &");
    }),
  ],
};

export default config;
