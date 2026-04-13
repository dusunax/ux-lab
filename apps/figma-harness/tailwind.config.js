/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        md: {
          primary: '#6750A4',
          onPrimary: '#FFFFFF',
          secondary: '#625B71',
          background: '#FFFFFF',
          surface: '#F6F6F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        nunito: ['var(--font-nunito-sans)', 'Nunito Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
