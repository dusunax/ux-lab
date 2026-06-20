/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        judge: {
          bg: '#0c0c0e',
          surface: '#131316',
          border: '#2a2a30',
          gold: '#c8a96e',
          'gold-dim': '#8a7048',
          cream: '#f0ece2',
          muted: '#6b6578',
          success: '#4ade80',
          warn: '#fbbf24',
          error: '#f87171',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        sans: ['"Noto Sans KR"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
    },
  },
  plugins: [],
}
