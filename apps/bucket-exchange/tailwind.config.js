/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        'primary-dark': '#3730A3',
        paper: '#F8F5EF',
        'paper-dark': '#EDE9E0',
        ink: '#2F2F2F',
        stamp: '#D64545',
        'stamp-dark': '#B03030',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
