/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-noto-sans-kr)",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      colors: {
        primary: {
          50: "#fef2f2", // 매우 연한 핑크
          100: "#fce7f3", // 연한 핑크
          200: "#fbcfe8", // 파스텔 핑크
          300: "#f9a8d4", // 부드러운 핑크
          400: "#f472b6", // 중간 핑크
          500: "#ec4899", // 핑크
          600: "#db2777", // 진한 핑크
          700: "#be185d", // 더 진한 핑크
        },
        soft: {
          pink: "#ffd6e8", // 파스텔 핑크
          blue: "#4a90e2", // 부드러운 블루
          teal: "#7dd3c0", // 틸/아쿠아
          mint: "#b8e6b8", // 민트 그린
        },
      },
      backgroundImage: {
        "gradient-soft":
          "linear-gradient(135deg, #ffd6e8 0%, #b8e6e6 50%, #b8e6b8 100%)",
        "gradient-warm":
          "linear-gradient(135deg, #ffeef5 0%, #e8f4f8 50%, #e8f8f0 100%)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
