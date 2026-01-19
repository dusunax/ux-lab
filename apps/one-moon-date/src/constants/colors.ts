export const Colors = {
  white: '#ffffff',
  black: '#000000',
  transparent: '#00000000',

  background: {
    light: '#ffffff',
    dark: '#1a1a1a',
  },

  card: {
    light: '#ffffff',
    dark: '#2d2d2d',
  },

  text: {
    primary: {
      light: '#1a1a1a',
      dark: '#ffffff',
    },
    secondary: '#666666',
    muted: '#888888',
    light: '#999999',
  },

  accent: {
    red: '#e53935',
    blue: '#1976D2',
  },

  shadow: {
    color: '#000000',
    opacity: {
      light: 0.15,
      dark: 0.3,
    },
  },
} as const;

export const AndroidColors = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  TRANSPARENT: '#00000000',
  BACKGROUND_LIGHT: '#FFFFFF',
  BACKGROUND_DARK: '#1A1A1A',
  TEXT_PRIMARY_LIGHT: '#1A1A1A',
  TEXT_PRIMARY_DARK: '#FFFFFF',
  ACCENT_RED: '#E53935',
} as const;
