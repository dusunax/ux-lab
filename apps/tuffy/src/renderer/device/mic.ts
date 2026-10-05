import type { MicStats } from '../../shared/ipc';
import { MIC_DBFS, SPEECH, type Signal } from '../../shared/state';

/**
 * 마이크 감각. 이 창 안에서 16kHz로 듣고 세 가지를 만든다.
 * - 큰 소리: peak > -10dBFS
 * - 허밍: 음정이 1.2초 이어짐 (음높이 Hz만 내보냄)
 * - 음성 구간: 말소리 시작~0.7초 침묵까지 잘라 main의 whisper로 보냄 (speech가 켜졌을 때만)
 *
 * 진짜 목소리만 보내기 위해 (실측: 타자 소리가 구간으로 잘려 whisper가 "시청해주셔서 감사합니다"를 지어냄)
 * - 말소리 기준은 소음 바닥 + 12dB로 따라 올라간다 (최소 -42dB)
 * - 구간은 음정(모음)이 잡힌 조각으로만 시작하고, 음정 조각이 30% 이상·0.3초 이상이어야 보낸다
 */

const RATE = SPEECH.sampleRate;
/** 16kHz에서 128ms. 80Hz 주기가 10번 들어간다 */
const CHUNK = 2048;
const CHUNK_MS = (CHUNK / RATE) * 1000;
const { loud: LOUD_DBFS, pitch: VOICE_DBFS, speech: SPEECH_DBFS } = MIC_DBFS;
const CLARITY_MIN = 0.9;
const MIN_HZ = 80;
const MAX_HZ = 1000;
const HUM_SUSTAIN_MS = 1200;
const HUM_GAP_MS = 300;
const VAD_END_SILENCE_MS = 700;
const PREROLL_CHUNKS = 2;
/** 소음 바닥보다 이만큼 커야 말소리로 본다 */
const NOISE_MARGIN_DB = 12;
const NOISE_FLOOR_INIT = -60;
const NOISE_FLOOR_MIN = -75;
/** 조용한 조각마다 소음 바닥이 이 비율만큼 따라간다 (약 2~3초에 적응) */
const NOISE_ADAPT = 0.05;
/** 목소리 판정용 음정 선명도 (허밍 판정 0.9보다 느슨하게 — 말소리 모음은 허밍보다 덜 고르다) */
const VOICING_CLARITY = 0.75;
const MIN_VOICED_RATIO = 0.3;
const MIN_PITCHED_MS = 300;
/** 음정 조각이 이만큼 연달아 나와야 구간을 시작한다 (실측: 타자 소리 한 조각이 음정으로 잡혀 구간이 열리고 생각을 끊음) */
const START_STREAK = 2;
const COOLDOWN = { loud: 5000, hum: 8000 } as const;

type MicSignal = Pick<Signal, 'kind' | 'hz'>;

const dbfs = (x: number) => 20 * Math.log10(Math.max(x, 1e-8));

/**
 * 정규화 자기상관(겹치는 구간 에너지로 나눔)으로 기본 주파수를 찾는다.
 * 주기의 배수에서도 상관이 높으므로, 임계값을 넘는 첫 봉우리를 택해 옥타브 오류를 피한다.
 */
export function detectPitch(buf: Float32Array, sampleRate: number, clarity = CLARITY_MIN): number | null {
  const minLag = Math.floor(sampleRate / MAX_HZ);
  const maxLag = Math.min(buf.length >> 1, Math.floor(sampleRate / MIN_HZ));
  const corr = (lag: number) => {
    let sum = 0, e1 = 0, e2 = 0;
    for (let i = 0; i + lag < buf.length; i++) {
      sum += buf[i] * buf[i + lag];
      e1 += buf[i] * buf[i];
      e2 += buf[i + lag] * buf[i + lag];
    }
    return e1 && e2 ? sum / Math.sqrt(e1 * e2) : 0;
  };
  for (let lag = minLag; lag <= maxLag; lag++) {
    let r = corr(lag);
    if (r < clarity) continue;
    for (let next = corr(lag + 1); next > r && lag < maxLag; next = corr(lag + 1)) {
      lag++;
      r = next;
    }
    return sampleRate / lag;
  }
  return null;
}

const concat = (parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
};

type ClipSink = (clip: Float32Array, humHz?: number) => void;

/** 조용한 조각으로 소음 바닥을 따라가며 말소리 기준을 정한다 */
export function createNoiseGate() {
  let floor = NOISE_FLOOR_INIT;
  const threshold = () => Math.max(SPEECH_DBFS, floor + NOISE_MARGIN_DB);
  return {
    get floor() { return floor; },
    get threshold() { return threshold(); },
    /** 말하는 중이 아니고 기준보다 작은 조각만 소음으로 본다 (타자 같은 순간 소리에 바닥이 끌려 올라가지 않게) */
    observe(rmsDb: number, inSegment: boolean) {
      if (inSegment || rmsDb >= threshold()) return;
      floor = Math.max(NOISE_FLOOR_MIN, floor + (rmsDb - floor) * NOISE_ADAPT);
    },
  };
}

/**
 * 말소리 구간 자르기.
 * - 기준(threshold)보다 크고 음정이 잡힌 조각에서만 시작한다 → 타자·팬처럼 음정 없는 소리는 구간이 되지 않는다
 * - 끝날 때 음정 조각 비율·길이가 모자라면 버린다
 * 음정이 길게 이어진 구간도 버리지 않고 humHz를 붙여 보낸다. 말인지 허밍인지는 whisper 결과로 main이 정한다.
 */
export function createSegmenter(emitClip: ClipSink, onStart: () => void) {
  let preroll: Float32Array[] = [];
  let parts: Float32Array[] | null = null;
  let voicedMs = 0, pitchedMs = 0, silenceMs = 0, streak = 0, humHz: number | undefined;
  const maxSamples = SPEECH.maxSec * RATE - CHUNK;

  const finish = () => {
    const enough = voicedMs >= SPEECH.minSec * 1000 && pitchedMs >= MIN_PITCHED_MS && pitchedMs / voicedMs >= MIN_VOICED_RATIO;
    if (parts && enough) emitClip(concat(parts), humHz);
    parts = null;
    preroll = [];
  };

  return {
    /** loud: 기준보다 큰 조각, pitched: 그중 음정(모음)이 잡힌 조각 */
    push(chunk: Float32Array, loud: boolean, pitched: boolean) {
      if (!parts) {
        streak = loud && pitched ? streak + 1 : 0;
        if (streak < START_STREAK) {
          preroll = [...preroll, chunk].slice(-PREROLL_CHUNKS);
          return;
        }
        // 앞의 음정 조각은 preroll에 들어 있다
        parts = [...preroll, chunk];
        voicedMs = CHUNK_MS * START_STREAK; pitchedMs = CHUNK_MS * START_STREAK; silenceMs = 0; streak = 0; humHz = undefined;
        onStart();
        return;
      }
      parts.push(chunk);
      if (loud) {
        voicedMs += CHUNK_MS;
        if (pitched) pitchedMs += CHUNK_MS;
        silenceMs = 0;
      } else silenceMs += CHUNK_MS;
      if (silenceMs >= VAD_END_SILENCE_MS || parts.length * CHUNK >= maxSamples) finish();
    },
    markHum(hz: number) { if (parts) humHz = hz; },
    get recording() { return parts !== null; },
    reset() { parts = null; preroll = []; streak = 0; },
  };
}

export function createMic(
  emit: (s: MicSignal) => void,
  emitClip: ClipSink,
  emitStats: (s: MicStats) => void,
  emitStart: () => void,
) {
  let stream: MediaStream | null = null;
  let ctx: AudioContext | null = null;
  let speech = false;
  let humMs = 0, gapMs = 0;
  let pitches: number[] = [];
  const lastAt = { loud: 0, hum: 0 };
  const segmenter = createSegmenter(emitClip, emitStart);
  const gate = createNoiseGate();

  const fire = (kind: 'loud' | 'hum', hz?: number) => {
    const now = Date.now();
    if (now - lastAt[kind] < COOLDOWN[kind]) return;
    lastAt[kind] = now;
    emit(hz ? { kind, hz } : { kind });
  };

  function onChunk(chunk: Float32Array) {
    let peak = 0, sq = 0;
    for (const x of chunk) { peak = Math.max(peak, Math.abs(x)); sq += x * x; }
    const rmsDb = dbfs(Math.sqrt(sq / chunk.length));
    if (dbfs(peak) > LOUD_DBFS) fire('loud');
    const hz = rmsDb > VOICE_DBFS ? detectPitch(chunk, RATE) : null;
    if (hz) {
      humMs += CHUNK_MS;
      gapMs = 0;
      pitches.push(hz);
    } else if ((gapMs += CHUNK_MS) > HUM_GAP_MS) {
      humMs = 0;
      pitches = [];
    }
    if (humMs >= HUM_SUSTAIN_MS) {
      const sorted = [...pitches].sort((a, b) => a - b);
      const median = Math.round(sorted[Math.floor(sorted.length / 2)]);
      // 음성 인식이 켜져 있으면 허밍 판정을 whisper 뒤로 미룬다
      if (speech && segmenter.recording) segmenter.markHum(median);
      else fire('hum', median);
      humMs = 0;
      pitches = [];
    }
    const loud = rmsDb > gate.threshold;
    const pitched = loud && (hz !== null || detectPitch(chunk, RATE, VOICING_CLARITY) !== null);
    if (speech) segmenter.push(chunk, loud, pitched);
    gate.observe(rmsDb, segmenter.recording);
    emitStats({
      rmsDb: Math.round(rmsDb), peakDb: Math.round(dbfs(peak)), hz: hz && Math.round(hz),
      vad: segmenter.recording ? 'recording' : humMs > CHUNK_MS ? 'hum' : pitched ? 'voice' : 'quiet',
      thresholdDb: Math.round(gate.threshold), floorDb: Math.round(gate.floor),
      device: stream?.getAudioTracks()[0]?.label ?? '?', rate: ctx?.sampleRate ?? RATE,
    });
  }

  return {
    async start(): Promise<boolean> {
      if (stream) return true;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      } catch {
        return false;
      }
      // 16kHz 컨텍스트: 브라우저가 마이크 입력을 whisper 규격으로 리샘플한다
      ctx = new AudioContext({ sampleRate: RATE });
      // ScriptProcessor는 deprecated지만 빌드 설정 없이 연속 샘플을 받는 가장 단순한 경로다
      const proc = ctx.createScriptProcessor(CHUNK, 1, 1);
      proc.onaudioprocess = (e) => onChunk(new Float32Array(e.inputBuffer.getChannelData(0)));
      ctx.createMediaStreamSource(stream).connect(proc);
      proc.connect(ctx.destination);
      return true;
    },
    stop(): void {
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      stream = null;
      ctx = null;
      segmenter.reset();
    },
    setSpeech(on: boolean): void {
      speech = on;
      if (!on) segmenter.reset();
    },
  };
}
