/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        panel: '#FFFFFF',
        canvas: '#F1F5F9',
        brand: '#FF8000',
        mint: '#13C690',
        cobalt: '#2563EB',
        violet: '#7C3AED',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(15, 23, 42, 0.12)',
        hairline: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
