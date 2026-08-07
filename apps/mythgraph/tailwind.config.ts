import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MythGraph Design System
        myth: {
          // Backgrounds - Abyss to Slate
          abyss: '#0A0D11',
          night: '#12161D',
          slate: '#1B212A',

          // Point Colors
          bronze: '#A67C52',
          gold: '#D7B26D',
          amber: '#D39A39',

          // Text
          primary: '#F6F1E7',
          secondary: '#B5B8BE',
          muted: '#6D727A',

          // Entity Types
          deity: '#D7B26D',      // Gold
          human: '#9BA1A8',      // Stone Gray
          monster: '#8B3A3A',    // Dark Crimson
          place: '#5B8DBE',      // Blue Gray
        },
      },
    },
  },
  plugins: [],
};

export default config;
