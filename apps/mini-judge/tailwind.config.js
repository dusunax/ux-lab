/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gh: {
          canvas: '#f6f8fa',
          surface: '#ffffff',
          border: '#d0d7de',
          'border-muted': '#eaeef2',
          header: '#24292f',
          'header-text': '#f0f6fc',
          'header-muted': '#8b949e',
          fg: '#1f2328',
          'fg-muted': '#656d76',
          'fg-subtle': '#9198a1',
          green: '#2da44e',
          'green-hover': '#2c974b',
          'green-subtle': '#dafbe1',
          blue: '#0969da',
          'blue-subtle': '#ddf4ff',
          red: '#cf222e',
          'red-subtle': '#ffebe9',
          yellow: '#9a6700',
          'yellow-subtle': '#fff8c5',
          purple: '#8250df',
          'purple-subtle': '#fbefff',
        },
      },
      fontFamily: {
        sans: ['"Instrument Sans"', '"Noto Sans KR"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(31,35,40,0.12)',
        input: '0 0 0 3px rgba(9,105,218,0.3)',
      },
    },
  },
  plugins: [],
}
