/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../ui/dist/**/*.{js,mjs}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
