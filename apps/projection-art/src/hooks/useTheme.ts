import { useState, useCallback } from 'react'

export type ThemeId = 'pastel' | 'ocean' | 'forest'

export interface ThemePalette {
  id: ThemeId
  name: string
  primary: string
  accent: string
  bg: string
  particleColor: string
}

export const THEMES: ThemePalette[] = [
  {
    id: 'pastel',
    name: '파스텔',
    primary: '#f8a5c2',
    accent: '#a29bfe',
    bg: 'rgba(248,165,194,0.08)',
    particleColor: '#f8a5c2',
  },
  {
    id: 'ocean',
    name: '바다',
    primary: '#0097e6',
    accent: '#12CBC4',
    bg: 'rgba(0,151,230,0.08)',
    particleColor: '#00d2ff',
  },
  {
    id: 'forest',
    name: '숲',
    primary: '#6ab04c',
    accent: '#b8e994',
    bg: 'rgba(106,176,76,0.08)',
    particleColor: '#6ab04c',
  },
]

const THEME_KEY = 'projection-art-theme'
const DEFAULT_THEME_ID: ThemeId = 'ocean'

function loadThemeId(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_KEY) as ThemeId | null
    if (stored && THEMES.some(t => t.id === stored)) return stored
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_THEME_ID
}

export function useTheme() {
  const [themeId, setThemeId] = useState<ThemeId>(loadThemeId)

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[1]

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id)
    try {
      localStorage.setItem(THEME_KEY, id)
    } catch {
      // localStorage unavailable
    }
  }, [])

  return { theme, setTheme, themes: THEMES }
}
