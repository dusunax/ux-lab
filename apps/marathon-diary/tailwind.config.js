/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FAF3E0',
          dark: '#F0E6CC',
        },
        bark: {
          DEFAULT: '#8B6F47',
          light: '#A0856A',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C17A',
        },
        ink: '#2C1810',
      },
      fontFamily: {
        handwriting: ['"Nanum Pen Script"', 'cursive'],
        sans: ['"Noto Sans KR"', 'sans-serif'],
      },
      boxShadow: {
        page: '4px 4px 20px rgba(44, 24, 16, 0.15)',
        'page-hover': '6px 6px 30px rgba(44, 24, 16, 0.25)',
      },
    },
  },
  plugins: [],
}
