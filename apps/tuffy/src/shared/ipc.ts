import type { ActEvent, BodyState, CortexOutput, EngineId, LogLine, Memory, Signal, Usage } from './state';

export const IPC = {
  // device → main
  deviceReady: 'device:ready',
  micSignal: 'device:mic-signal',
  speechClip: 'device:speech-clip',
  speechStart: 'device:speech-start',
  micStats: 'device:mic-stats',
  // console → main
  getSnapshot: 'console:get-snapshot',
  sendText: 'console:send-text',
  simulate: 'console:simulate',
  setMic: 'console:set-mic',
  setSound: 'console:set-sound',
  setEngine: 'console:set-engine',
  setTypesafeKey: 'console:set-typesafe-key',
  clearTypesafeKey: 'console:clear-typesafe-key',
  // any window → main
  openConsole: 'app:open-console',
  // main → windows
  body: 'brain:body',
  act: 'brain:act',
  log: 'brain:log',
  cortex: 'brain:cortex',
  memory: 'brain:memory',
  usage: 'brain:usage',
  deviceCmd: 'brain:device-cmd',
  micDiag: 'brain:mic-diag',
  stt: 'brain:stt',
} as const;

export interface DeviceCmd {
  mic?: boolean;
  /** whisper가 준비돼 음성 구간을 보내도 되는지 */
  speech?: boolean;
  sound?: boolean;
}

/** 마이크 진단 (콘솔에만, 저장하지 않음) */
export interface MicStats {
  rmsDb: number;
  peakDb: number;
  hz: number | null;
  vad: 'quiet' | 'voice' | 'hum' | 'recording';
  /** 지금 말소리 기준 (소음 바닥 + 12dB, 최소 -42) */
  thresholdDb: number;
  floorDb: number;
  device: string;
  rate: number;
}

export interface SttEvent {
  id: number;
  at: number;
  sec: number;
  phase: 'pending' | 'done' | 'dropped';
  ms?: number;
  /** whisper 원문. 진단 화면에만 잠깐 보이고 로그·기억·LLM으로 가지 않는다 */
  text?: string;
  verdict: string;
}

export interface Snapshot {
  body: BodyState;
  logs: LogLine[];
  lastCortex: CortexOutput | null;
  mic: boolean;
  sound: boolean;
  usage: Usage;
}

/** 콘솔에서 눌러 볼 수 있는 신호 (마이크·데스크탑 신호를 실제로 기다리지 않고 확인용) */
export const SIMULATABLE = ['name-call', 'hum', 'loud', 'return', 'clock-late', 'idle', 'app-dev'] as const;
export type Simulatable = (typeof SIMULATABLE)[number];

/** preload가 window.api로 노출하는 API */
export interface Api {
  // device
  deviceReady: (memory: unknown) => void;
  sendMicSignal: (signal: Pick<Signal, 'kind' | 'hz'>) => void;
  /** 16kHz mono 음성 구간 (0.4~10초). humHz: 구간 안에서 허밍처럼 음정이 이어졌을 때의 음높이 */
  sendSpeechClip: (clip: Float32Array, humHz?: number) => void;
  /** 말소리 구간이 시작됨 (생각 중이면 멈추고 듣게 한다) */
  sendSpeechStart: () => void;
  sendMicStats: (s: MicStats) => void;
  onAct: (cb: (e: ActEvent) => void) => () => void;
  onMemory: (cb: (m: Memory) => void) => () => void;
  onDeviceCmd: (cb: (c: DeviceCmd) => void) => () => void;
  // console
  getSnapshot: () => Promise<Snapshot>;
  sendText: (text: string) => void;
  simulate: (kind: Simulatable) => void;
  /** 실제로 켜졌는지 돌려준다 (권한 거부 시 false) */
  setMic: (on: boolean) => Promise<boolean>;
  setSound: (on: boolean) => void;
  setEngine: (engine: EngineId) => void;
  /** 키를 main에 넘겨 암호화 저장. 형식이 틀리거나 저장할 수 없으면 false */
  setTypesafeKey: (key: string) => Promise<boolean>;
  clearTypesafeKey: () => void;
  onUsage: (cb: (u: Usage) => void) => () => void;
  onLog: (cb: (l: LogLine) => void) => () => void;
  onCortex: (cb: (o: CortexOutput) => void) => () => void;
  onMicDiag: (cb: (s: MicStats) => void) => () => void;
  onStt: (cb: (e: SttEvent) => void) => () => void;
  // both
  onBody: (cb: (b: BodyState) => void) => () => void;
  openConsole: () => void;
}
