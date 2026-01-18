/**
 * 색상 테마 상수
 * 모든 색상은 이 파일에서 중앙 관리됩니다.
 */

export const Colors = {
  // 기본 색상
  white: '#ffffff',
  black: '#000000',
  transparent: '#00000000',

  // 배경 색상
  background: {
    light: '#ffffff',
    dark: '#1a1a1a',
  },

  // 카드 색상
  card: {
    light: '#ffffff',
    dark: '#2d2d2d',
  },

  // 텍스트 색상
  text: {
    primary: {
      light: '#1a1a1a',
      dark: '#ffffff',
    },
    secondary: '#666666',
    muted: '#888888',
    light: '#999999',
  },

  // 강조 색상
  accent: {
    red: '#e53935',
    blue: '#1976D2', // 월 헤더 색상
  },

  // 그림자 색상
  shadow: {
    color: '#000000',
    opacity: {
      light: 0.15,
      dark: 0.3,
    },
  },
};

// Android XML에서 사용할 색상 (대문자)
export const AndroidColors = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  TRANSPARENT: '#00000000',
  BACKGROUND_LIGHT: '#FFFFFF',
  BACKGROUND_DARK: '#1A1A1A',
  TEXT_PRIMARY_LIGHT: '#1A1A1A',
  TEXT_PRIMARY_DARK: '#FFFFFF',
  ACCENT_RED: '#E53935',
};
