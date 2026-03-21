import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "var(--bg-0)",
          1: "var(--bg-1)",
          2: "var(--bg-2)",
          3: "var(--bg-3)",
          4: "var(--bg-4)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          placeholder: "var(--text-placeholder)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          muted: "var(--accent-muted)",
        },
        semantic: {
          red: "var(--color-red)",
          orange: "var(--color-orange)",
          yellow: "var(--color-yellow)",
          green: "var(--color-green)",
          teal: "var(--color-teal)",
          blue: "var(--color-blue)",
          purple: "var(--color-purple)",
          pink: "var(--color-pink)",
          gray: "var(--color-gray)",
        },
        "semantic-muted": {
          red: "var(--color-red-muted)",
          orange: "var(--color-orange-muted)",
          yellow: "var(--color-yellow-muted)",
          green: "var(--color-green-muted)",
          teal: "var(--color-teal-muted)",
          blue: "var(--color-blue-muted)",
          purple: "var(--color-purple-muted)",
          pink: "var(--color-pink-muted)",
          gray: "var(--color-gray-muted)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionDuration: {
        fast: "80ms",
        default: "150ms",
      },
      fontFamily: {
        sans: [
          "var(--font-dm-sans)",
          "DM Sans",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "JUST Sans",
          "var(--font-dm-sans)",
          "DM Sans",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      fontSize: {
        "editor-body": ["15px", { lineHeight: "1.7" }],
      },
      maxWidth: {
        editor: "720px",
      },
    },
  },
  plugins: [animate],
};

export default config;
