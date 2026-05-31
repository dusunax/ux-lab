import { useState, useRef, useCallback, useEffect } from 'react'
import type React from 'react'

const FFT_SIZE = 2048
const BASS_END = 10
const MID_END = 100
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

export interface AudioData {
  frequencyData: Uint8Array
  timeDomainData: Uint8Array
  averageAmplitude: number
  bassAmplitude: number
  midAmplitude: number
  trebleAmplitude: number
  isVoiceActive: boolean
}

interface UseAudioAnalyzerOptions {
  audioElementRef?: React.RefObject<HTMLAudioElement> | null
}

export function useAudioAnalyzer(options: UseAudioAnalyzerOptions = {}) {
  const audioElementRef = options.audioElementRef

  const [isActive, setIsActive] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)

  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const freqDataRef = useRef<Uint8Array>(new Uint8Array(FFT_SIZE / 2))
  const timeDataRef = useRef<Uint8Array>(new Uint8Array(FFT_SIZE))
  const prevVoiceActiveRef = useRef(false)

  // 매 RAF마다 직접 업데이트 — setState 대신 ref로 R3F 리렌더 제거
  const audioDataRef = useRef<AudioData>({
    frequencyData: freqDataRef.current,
    timeDomainData: timeDataRef.current,
    averageAmplitude: 0,
    bassAmplitude: 0,
    midAmplitude: 0,
    trebleAmplitude: 0,
    isVoiceActive: false,
  })

  const tick = useCallback(() => {
    if (!analyserRef.current) return

    analyserRef.current.getByteFrequencyData(freqDataRef.current)
    analyserRef.current.getByteTimeDomainData(timeDataRef.current)

    const d = audioDataRef.current
    d.frequencyData = freqDataRef.current
    d.timeDomainData = timeDataRef.current
    d.averageAmplitude = computeBandAmplitude(freqDataRef.current, 0, freqDataRef.current.length)
    d.bassAmplitude = computeBandAmplitude(freqDataRef.current, 0, BASS_END)
    d.midAmplitude = computeBandAmplitude(freqDataRef.current, BASS_END, MID_END)
    d.trebleAmplitude = computeBandAmplitude(freqDataRef.current, MID_END, freqDataRef.current.length)
    const rms = computeRMS(timeDataRef.current)
    d.isVoiceActive = rms > NOISE_GATE_THRESHOLD

    // isVoiceActive가 변할 때만 setState (UI 표시 전용)
    if (d.isVoiceActive !== prevVoiceActiveRef.current) {
      prevVoiceActiveRef.current = d.isVoiceActive
      setIsVoiceActive(d.isVoiceActive)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const activate = useCallback(async (source: AudioSource = 'microphone') => {
    stopLoop() // 기존 루프 먼저 정리 — 중복 호출 시 고아 RAF 방지
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
          stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false })
        } catch {
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
      } else {
        const el = audioElementRef?.current
        if (!el) throw new Error('file 모드에는 audioElement가 필요합니다.')
        const elSource = ctx.createMediaElementSource(el)
        elSource.connect(analyser)
        analyser.connect(ctx.destination)
        sourceRef.current = elSource
      }

      setIsActive(true)
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      console.error('AudioAnalyzer activation error:', err)
      throw new Error('오디오 분석기를 시작할 수 없습니다.')
    }
  }, [audioElementRef, stopLoop, tick])

  const deactivate = useCallback(() => {
    stopLoop()
    sourceRef.current?.disconnect()
    sourceRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setIsActive(false)
    setIsVoiceActive(false)
    prevVoiceActiveRef.current = false
  }, [stopLoop])

  useEffect(() => {
    return () => {
      stopLoop()
      sourceRef.current?.disconnect()
      streamRef.current?.getTracks().forEach(t => t.stop())
      ctxRef.current?.close()
      ctxRef.current = null
      analyserRef.current = null
      sourceRef.current = null
    }
  }, [stopLoop])

  return { isActive, isVoiceActive, audioDataRef, activate, deactivate }
}
