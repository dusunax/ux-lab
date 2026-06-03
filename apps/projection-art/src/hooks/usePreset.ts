import { useCallback, useState } from 'react'
import type { DemoType } from '../types'
import type { Corners } from '../components/KeystoneOverlay'
import { loadCorners } from '../components/KeystoneOverlay'

export interface Preset {
  demo: DemoType
  corners: Corners
}

const PRESET_KEY = 'projection-art-preset'

function loadPreset(): Preset | null {
  try {
    const raw = localStorage.getItem(PRESET_KEY)
    return raw ? (JSON.parse(raw) as Preset) : null
  } catch {
    return null
  }
}

export function usePreset() {
  const [preset, setPreset] = useState<Preset | null>(loadPreset)

  const save = useCallback((demo: DemoType, corners: Corners) => {
    const p: Preset = { demo, corners }
    localStorage.setItem(PRESET_KEY, JSON.stringify(p))
    setPreset(p)
  }, [])

  const restore = useCallback((): Preset | null => {
    return loadPreset()
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(PRESET_KEY)
    setPreset(null)
  }, [])

  // Snapshot current state (active demo + current keystone corners)
  const saveSnapshot = useCallback((demo: DemoType) => {
    save(demo, loadCorners())
  }, [save])

  return { preset, save, saveSnapshot, restore, clear }
}
