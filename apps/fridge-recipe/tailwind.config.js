/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "monospace"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#f4f1ea",
        surface: "#faf8f4",
        border: "#ddd8cc",
        text: "#1a1916",
        muted: "#6b6457",
        accent: "#243d2c",
        "accent-mid": "#3d6b4f",
        "accent-light": "#eaf1ec",
        warm: "#c8a048",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
