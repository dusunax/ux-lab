/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#121212",
        surface: "#181818",
        elevated: "#282828",
        border: "#333333",
        text: "#ffffff",
        muted: "#a3a3a3",
        accent: "#22d3ee",
        "accent-dark": "#0891b2",
        "accent-glow": "rgba(34,211,238,0.15)",
      },
    },
  },
  plugins: [],
};
