/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#e5e7eb",
        signal: "#fb7185",
        slateblue: "#2b5a8a"
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
