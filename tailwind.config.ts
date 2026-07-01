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
        pitch: "var(--accent, #cc0000)",
        accent: "var(--accent, #cc0000)",
        gold: "var(--gold, #cc0000)",
        surface: "var(--surface, #ffffff)",
        "surface-alt": "var(--surface-alt, #f0f0f0)",
        border: "var(--border, #dddddd)",
        hover: "var(--hover, rgba(0,0,0,0.05))",
        espn: {
          red: "#CC0000",
          "red-dark": "#990000",
          black: "#000000",
          gray: "#666666",
        },
        correct: "#008248",
        wrong: "#CC0000",
        navy: {
          DEFAULT: "#000000",
          dark: "#0D0D0D",
        },
        paper: "#F5F5F5",
        stadium: {
          dark: "var(--bg, #0d0d0d)",
          navy: "var(--surface, #1a1a1a)",
          card: "var(--surface, #1a1a1a)",
        },
      },
      borderRadius: {
        DEFAULT: "4px",
        lg: "4px",
        xl: "4px",
        "2xl": "4px",
      },
      fontFamily: {
        sans: ["Roboto Condensed", "system-ui", "sans-serif"],
        display: ["Oswald", "Roboto Condensed", "sans-serif"],
        body: ["Roboto Condensed", "system-ui", "sans-serif"],
        accent: ["Oswald", "Roboto Condensed", "sans-serif"],
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
