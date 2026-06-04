import { useCallback, useState } from 'react'
import type { DemoType } from '../types'
import type { ProjectionTransform } from '../components/KeystoneOverlay'

export interface Preset {
  demo: DemoType
  transform: ProjectionTransform
  showFps?: boolean
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

  const save = useCallback((demo: DemoType, transform: ProjectionTransform, showFps: boolean) => {
    const p: Preset = { demo, transform, showFps }
    localStorage.setItem(PRESET_KEY, JSON.stringify(p))
    setPreset(p)
  }, [])

  const restore = useCallback((): Preset | null => loadPreset(), [])

  const clear = useCallback(() => {
    localStorage.removeItem(PRESET_KEY)
    setPreset(null)
  }, [])

  return { preset, save, restore, clear }
}
