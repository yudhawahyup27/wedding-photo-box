import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "var(--ivory)",
        cream: "var(--cream)",
        parchment: "var(--parchment)",
        blush: "var(--blush)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        bronze: "var(--bronze)",
        gold: "var(--gold)",
        rose: "var(--rose)",
        sage: "var(--sage)",
        charcoal: "var(--charcoal)",
        "charcoal-text": "var(--charcoal-text)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        script: ["var(--font-script)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
