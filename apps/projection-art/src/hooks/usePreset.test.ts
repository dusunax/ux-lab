import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePreset } from './usePreset'
import { DEFAULT_CORNERS } from '../components/KeystoneOverlay'

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true })

beforeEach(() => mockLocalStorage.clear())

describe('usePreset', () => {
  it('initializes with null when no preset saved', () => {
    const { result } = renderHook(() => usePreset())
    expect(result.current.preset).toBeNull()
  })

  it('saves and returns preset', () => {
    const { result } = renderHook(() => usePreset())
    act(() => { result.current.save('pose-reactive', DEFAULT_CORNERS) })
    expect(result.current.preset).toEqual({ demo: 'pose-reactive', corners: DEFAULT_CORNERS })
  })

  it('clears preset', () => {
    const { result } = renderHook(() => usePreset())
    act(() => { result.current.save('neon-tunnel', DEFAULT_CORNERS) })
    act(() => { result.current.clear() })
    expect(result.current.preset).toBeNull()
  })

  it('restore returns saved preset from localStorage', () => {
    const { result } = renderHook(() => usePreset())
    act(() => { result.current.save('hand-reactive', DEFAULT_CORNERS) })
    const p = result.current.restore()
    expect(p?.demo).toBe('hand-reactive')
  })

  it('persists to localStorage on save', () => {
    const { result } = renderHook(() => usePreset())
    act(() => { result.current.save('particle-flow', DEFAULT_CORNERS) })
    const raw = mockLocalStorage.getItem('projection-art-preset')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!).demo).toBe('particle-flow')
  })
})
