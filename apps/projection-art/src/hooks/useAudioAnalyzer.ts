import { useState, useRef, useCallback, useEffect } from 'react'
import type { AudioAnalyzerState } from '../types'

const FFT_SIZE = 2048
const BASS_END = 10     // bins ~0–200 Hz
const MID_END = 100     // bins ~200–2000 Hz

function computeBandAmplitude(data: Uint8Array, start: number, end: number): number {
  if (data.length === 0 || start >= end) return 0
  const slice = data.slice(start, Math.min(end, data.length))
  const sum = slice.reduce((acc, v) => acc + v, 0)
  return sum / slice.length / 255
}

export type AudioSource = 'file' | 'microphone'

interface UseAudioAnalyzerOptions {
  audioElement?: HTMLAudioElement | null
}

export function useAudioAnalyzer(options: UseAudioAnalyzerOptions = {}) {
  const { audioElement } = options

  const [state, setState] = useState<AudioAnalyzerState>({
    isActive: false,
    frequencyData: new Uint8Array(FFT_SIZE / 2),
    averageAmplitude: 0,
    bassAmplitude: 0,
    midAmplitude: 0,
    trebleAmplitude: 0,
  })

  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const dataRef = useRef<Uint8Array>(new Uint8Array(FFT_SIZE / 2))

  const tick = useCallback(() => {
    if (!analyserRef.current) return
    analyserRef.current.getByteFrequencyData(dataRef.current)
    const data = dataRef.current
    const avg = computeBandAmplitude(data, 0, data.length)
    const bass = computeBandAmplitude(data, 0, BASS_END)
    const mid = computeBandAmplitude(data, BASS_END, MID_END)
    const treble = computeBandAmplitude(data, MID_END, data.length)
    setState(prev => ({
      ...prev,
      frequencyData: new Uint8Array(data),
      averageAmplitude: avg,
      bassAmplitude: bass,
      midAmplitude: mid,
      trebleAmplitude: treble,
    }))
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const activate = useCallback(async (source: AudioSource = 'file') => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext()
      }
      const ctx = ctxRef.current
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const analyser = ctx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.frequencyBinCount)

      if (source === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const micSource = ctx.createMediaStreamSource(stream)
        micSource.connect(analyser)
        sourceRef.current = micSource
      } else if (audioElement) {
        const elSource = ctx.createMediaElementSource(audioElement)
        elSource.connect(analyser)
        analyser.connect(ctx.destination)
        sourceRef.current = elSource
      }

      setState(prev => ({ ...prev, isActive: true }))
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      console.error('AudioAnalyzer activation error:', err)
      throw new Error('오디오 분석기를 시작할 수 없습니다.')
    }
  }, [audioElement, tick])

  const deactivate = useCallback(() => {
    stopLoop()
    sourceRef.current?.disconnect()
    sourceRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setState(prev => ({ ...prev, isActive: false }))
  }, [stopLoop])

  useEffect(() => {
    return () => {
      stopLoop()
      sourceRef.current?.disconnect()
      streamRef.current?.getTracks().forEach(t => t.stop())
      ctxRef.current?.close()
    }
  }, [stopLoop])

  return { state, activate, deactivate }
}
