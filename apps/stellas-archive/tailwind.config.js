/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stellaBg: "#0b1220",
        text: "#ecf2ff",
        muted: "#9ab0c6",
        lineWeak: "rgba(59, 199, 255, 0.3)",
        surface: "#111c30",
        panel: "#111c30",
        panelLine: "rgba(130, 206, 255, 0.28)",
        primary: "#3bc7ff",
        primaryDark: "#2a8cd0",
        accent: "#b48cff",
        accentGlow: "#d6b2ff",
        success: "#8df0a2",
        warning: "#ffd28a",
        danger: "#ff6f7e",
      },
      fontFamily: {
        body: ["Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "sans-serif"],
        display: ["Orbitron", "Space Grotesk", "sans-serif"],
        logo: ["Press Start 2P", "Orbitron", "monospace"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
