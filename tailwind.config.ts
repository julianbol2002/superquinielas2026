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
        pitch: "var(--accent, #00ff87)",
        accent: "var(--accent, #00ff87)",
        gold: "var(--gold, #f5c518)",
        surface: "var(--surface, #141414)",
        border: "var(--border, #222222)",
        hover: "var(--hover, #1a1a1a)",
        stadium: {
          dark: "var(--bg, #0a0a0a)",
          navy: "var(--surface, #141414)",
          card: "var(--surface, #141414)",
        },
      },
      borderRadius: {
        DEFAULT: "4px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
      },
      fontFamily: {
        display: ['"Bebas Neue"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
        accent: ['"Inter"', "sans-serif"],
      },
      fontSize: {
        label: ["12px", { lineHeight: "1.4" }],
        body: ["14px", { lineHeight: "1.5" }],
        emphasis: ["16px", { lineHeight: "1.4" }],
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
