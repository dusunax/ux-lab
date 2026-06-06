import { useCallback, useEffect, useRef, useState } from 'react'
import type { PoseLabel, VisualParams } from '../types'

const FALLBACK_PARAMS: Record<PoseLabel, VisualParams> = {
  'arms-raised': {
    primaryColor: '#ff6b6b',
    accentColor: '#ffd93d',
    particleDensity: 0.9,
    effectIntensity: 0.85,
    trailLength: 80,
  },
  'one-arm-raised': {
    primaryColor: '#ff9f43',
    accentColor: '#00d2d3',
    particleDensity: 0.65,
    effectIntensity: 0.6,
    trailLength: 55,
  },
  't-pose': {
    primaryColor: '#00d2d3',
    accentColor: '#54a0ff',
    particleDensity: 0.8,
    effectIntensity: 0.75,
    trailLength: 70,
  },
  'arms-wide': {
    primaryColor: '#5f27cd',
    accentColor: '#ff9ff3',
    particleDensity: 0.75,
    effectIntensity: 0.7,
    trailLength: 65,
  },
  standing: {
    primaryColor: '#2e86de',
    accentColor: '#00ff88',
    particleDensity: 0.4,
    effectIntensity: 0.35,
    trailLength: 30,
  },
}

export const KEYWORD_SETS: Record<string, string> = {
  ocean:   '바다, 파도, 해양생물, 깊은 물속, 파란 빛',
  forest:  '숲, 나뭇잎, 이슬, 초록 빛, 자연',
  pastel:  '꽃밭, 봄바람, 달빛, 부드러운 색깔',
  default: '동화, 빛, 색깔, 움직임',
}

interface AiVisualParamsOptions {
  debounceMs?: number
  apiEndpoint?: string
  themeKeywords?: string
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpParams(from: VisualParams, to: VisualParams, t: number): VisualParams {
  return {
    primaryColor: t > 0.5 ? to.primaryColor : from.primaryColor,
    accentColor: t > 0.5 ? to.accentColor : from.accentColor,
    particleDensity: lerp(from.particleDensity, to.particleDensity, t),
    effectIntensity: lerp(from.effectIntensity, to.effectIntensity, t),
    trailLength: Math.round(lerp(from.trailLength, to.trailLength, t)),
  }
}

async function fetchAiParams(
  poseLabel: PoseLabel,
  energy: number,
  endpoint: string,
  themeKeywords?: string
): Promise<VisualParams> {
  const keywords = themeKeywords ?? KEYWORD_SETS.default
  const prompt = `You are a visual art parameter generator for a children's storybook illustration.
Theme keywords: "${keywords}"
Given pose: "${poseLabel}", motion energy: ${energy.toFixed(2)} (0=still, 1=high)
Respond with ONLY a JSON object (no explanation):
{"primaryColor":"#hex","accentColor":"#hex","particleDensity":0-1,"effectIntensity":0-1,"trailLength":10-100}`

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 80,
    }),
  })
  if (!resp.ok) throw new Error(`AI endpoint ${resp.status}`)
  const data = await resp.json()
  const text: string = data?.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  const parsed = JSON.parse(match[0]) as Partial<VisualParams>
  return {
    primaryColor: parsed.primaryColor ?? FALLBACK_PARAMS[poseLabel].primaryColor,
    accentColor: parsed.accentColor ?? FALLBACK_PARAMS[poseLabel].accentColor,
    particleDensity: Math.max(0, Math.min(1, parsed.particleDensity ?? FALLBACK_PARAMS[poseLabel].particleDensity)),
    effectIntensity: Math.max(0, Math.min(1, parsed.effectIntensity ?? FALLBACK_PARAMS[poseLabel].effectIntensity)),
    trailLength: Math.max(10, Math.min(100, parsed.trailLength ?? FALLBACK_PARAMS[poseLabel].trailLength)),
  }
}

export function useAiVisualParams(
  poseLabel: PoseLabel,
  energy: number,
  options?: AiVisualParamsOptions
) {
  const debounceMs = options?.debounceMs ?? 1200
  const themeKeywords = options?.themeKeywords
  const apiEndpoint = options?.apiEndpoint ?? (
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string> }).env?.VITE_AI_ENDPOINT ?? 'http://localhost:3001/chat'
      : 'http://localhost:3001/chat'
  )

  const [params, setParams] = useState<VisualParams>(FALLBACK_PARAMS[poseLabel])
  const [isLoading, setIsLoading] = useState(false)
  const prevLabelRef = useRef<PoseLabel>(poseLabel)
  const targetRef = useRef<VisualParams>(FALLBACK_PARAMS[poseLabel])
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lerpFrameRef = useRef<number>(0)
  const fromRef = useRef<VisualParams>(FALLBACK_PARAMS[poseLabel])

  const triggerFetch = useCallback(
    (label: PoseLabel, e: number) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        setIsLoading(true)
        fetchAiParams(label, e, apiEndpoint, themeKeywords)
          .then(result => {
            targetRef.current = result
            fromRef.current = params
            let progress = 0
            cancelAnimationFrame(lerpFrameRef.current)
            const animate = () => {
              progress = Math.min(1, progress + 0.04)
              setParams(lerpParams(fromRef.current, targetRef.current, progress))
              if (progress < 1) lerpFrameRef.current = requestAnimationFrame(animate)
            }
            lerpFrameRef.current = requestAnimationFrame(animate)
          })
          .catch(() => {
            targetRef.current = FALLBACK_PARAMS[label]
          })
          .finally(() => setIsLoading(false))
      }, debounceMs)
    },
    [apiEndpoint, debounceMs, params]
  )

  useEffect(() => {
    if (poseLabel !== prevLabelRef.current) {
      prevLabelRef.current = poseLabel
      triggerFetch(poseLabel, energy)
    }
  }, [poseLabel, energy, triggerFetch])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      cancelAnimationFrame(lerpFrameRef.current)
    }
  }, [])

  return { params, isLoading }
}
