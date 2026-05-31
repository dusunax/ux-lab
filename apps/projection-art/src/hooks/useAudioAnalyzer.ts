import { useState, useRef, useCallback, useEffect } from 'react'
import type { AudioAnalyzerState } from '../types'

const FFT_SIZE = 2048
const BASS_END = 10
const MID_END = 100
// 노이즈 게이트: RMS가 이 값 아래이면 "침묵"으로 판정
const NOISE_GATE_THRESHOLD = 0.015

function computeBandAmplitude(data: Uint8Array, start: number, end: number): number {
  if (data.length === 0 || start >= end) return 0
  const slice = data.slice(start, Math.min(end, data.length))
  const sum = slice.reduce((acc, v) => acc + v, 0)
  return sum / slice.length / 255
}

function computeRMS(timeDomain: Uint8Array): number {
  let sumSq = 0
  for (let i = 0; i < timeDomain.length; i++) {
    const centered = (timeDomain[i] - 128) / 128
    sumSq += centered * centered
  }
  return Math.sqrt(sumSq / timeDomain.length)
}

export type AudioSource = 'file' | 'microphone' | 'tab'

interface UseAudioAnalyzerOptions {
  audioElement?: HTMLAudioElement | null
}

export function useAudioAnalyzer(options: UseAudioAnalyzerOptions = {}) {
  const { audioElement } = options

  const [state, setState] = useState<AudioAnalyzerState>({
    isActive: false,
    frequencyData: new Uint8Array(FFT_SIZE / 2),
    timeDomainData: new Uint8Array(FFT_SIZE),
    averageAmplitude: 0,
    bassAmplitude: 0,
    midAmplitude: 0,
    trebleAmplitude: 0,
    isVoiceActive: false,
  })

  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(FFT_SIZE / 2))
  const timeDataRef = useRef<Uint8Array>(new Uint8Array(FFT_SIZE))

  const tick = useCallback(() => {
    if (!analyserRef.current) return

    analyserRef.current.getByteFrequencyData(freqDataRef.current)
    analyserRef.current.getByteTimeDomainData(timeDataRef.current)

    const rms = computeRMS(timeDataRef.current)
    const avg = computeBandAmplitude(freqDataRef.current, 0, freqDataRef.current.length)
    const bass = computeBandAmplitude(freqDataRef.current, 0, BASS_END)
    const mid = computeBandAmplitude(freqDataRef.current, BASS_END, MID_END)
    const treble = computeBandAmplitude(freqDataRef.current, MID_END, freqDataRef.current.length)

    setState(prev => ({
      ...prev,
      frequencyData: new Uint8Array(freqDataRef.current),
      timeDomainData: new Uint8Array(timeDataRef.current),
      averageAmplitude: avg,
      bassAmplitude: bass,
      midAmplitude: mid,
      trebleAmplitude: treble,
      isVoiceActive: rms > NOISE_GATE_THRESHOLD,
    }))

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const activate = useCallback(async (source: AudioSource = 'microphone') => {
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
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount)
      timeDataRef.current = new Uint8Array(analyser.fftSize)

      if (source === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const micSource = ctx.createMediaStreamSource(stream)

        // 노이즈 감소 필터 체인: mic → highpass(80Hz) → lowpass(8kHz) → analyser
        const highPass = ctx.createBiquadFilter()
        highPass.type = 'highpass'
        highPass.frequency.value = 80

        const lowPass = ctx.createBiquadFilter()
        lowPass.type = 'lowpass'
        lowPass.frequency.value = 8000

        micSource.connect(highPass)
        highPass.connect(lowPass)
        lowPass.connect(analyser)
        sourceRef.current = micSource
      } else if (source === 'tab') {
        // 탭/시스템 오디오 캡처 — Chrome: 화면 공유 팝업에서 "탭 오디오 포함" 체크
        let stream: MediaStream
        try {
          // audio-only 우선 시도 (Chrome 74+)
          stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false })
        } catch {
          // 일부 브라우저는 video 없이 거부 — 최소 video로 재시도
          stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: { width: 1, height: 1, frameRate: 1 },
          })
          stream.getVideoTracks().forEach(t => t.stop())
        }
        streamRef.current = stream
        const tabSource = ctx.createMediaStreamSource(stream)
        tabSource.connect(analyser)
        sourceRef.current = tabSource
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
    setState(prev => ({ ...prev, isActive: false, isVoiceActive: false }))
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
