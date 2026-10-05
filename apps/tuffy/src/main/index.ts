import { Menu, app, ipcMain, session, systemPreferences, type IpcMainEvent } from 'electron';
import { IPC, SIMULATABLE, type MicStats, type Simulatable, type Snapshot, type SttEvent } from '../shared/ipc';
import { LIMITS, isEngine, sanitizeMemory, sanitizeSignal, type Signal } from '../shared/state';
import { Brain } from './brain/brain';
import { freeDecider, freeVoice, typesafeDecider } from './brain/decide/deciders';
import { FREE_ROUTER, FreeRouter } from './brain/decide/freeRouter';
import { DesktopSensors } from './sensors/desktop';
import { SPEECH, isSpeechClip, judgeTranscript, resolveClip } from './sensors/speech';
import { Whisper, resolveWhisper } from './sensors/whisper';
import { typesafeKey } from './secrets';
import { ConsoleWindow, DeviceWindow, isAppUrl } from './windows';

/** 무료 추론형 모델은 reasoning 토큰 때문에 느리다 */
const CORTEX_TIMEOUT_MS = 30_000;
/** OpenRouter 무료 등급은 하루 무료 요청 수가 제한된다. proxy의 내부 재시도 몫을 남겨 둔다 */
const DEFAULT_DAILY_BUDGET = 40;
/** jev 하루 비용 상한(USD). 메시지당 약 $0.0005(평가 + 표현·대답 고르기, 대답 181개)라 약 95개 */
const DEFAULT_JEV_DAILY_USD = 0.05;
const JEV_TIMEOUT_MS = 20_000;
/**
 * 판단 JSON을 안정적으로 내는 무료 모델을 먼저 쓰고(2026-10-05 실측 8초·finish=stop), 실패하면 쉬게 한 뒤
 * 무료 라우터로 넘어간다. 전체 무료 목록 관리는 proxy(fallback-models.json, 주간 점검) 몫이다.
 * MAIN_VITE_FREE_MODELS로 덮어쓴다
 */
const DEFAULT_FREE_MODELS = ['nvidia/nemotron-3-super-120b-a12b:free', FREE_ROUTER];

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  void app.whenReady().then(bootstrap);
}

/**
 * 판단 엔진 연결. 고르는 건 콘솔에서 한다.
 * - 무료 LLM(판단·대사): openrouter-proxy 경유, MAIN_VITE_CORTEX_URL이 있을 때
 * - jev(판단): TypeSafe 직접 호출, 콘솔에서 키를 등록했을 때 (console.typesafe.ai 크레딧)
 */
function connectEngines(brain: Brain): void {
  const url = import.meta.env.MAIN_VITE_CORTEX_URL;
  let router: FreeRouter | null = null;
  if (url) {
    const models = import.meta.env.MAIN_VITE_FREE_MODELS?.split(',').map((m) => m.trim()).filter(Boolean) ?? DEFAULT_FREE_MODELS;
    router = new FreeRouter({ url, models, timeoutMs: CORTEX_TIMEOUT_MS }, brain.budget);
    if (router.rejected.length) brain.note(`:free가 아닌 모델은 쓰지 않음 · ${router.rejected.join(', ')}`);
  }
  brain.setEngines({
    free: router && freeDecider(router),
    voice: router && freeVoice(router),
    jev: typesafeDecider(() => typesafeKey.get(), JEV_TIMEOUT_MS),
    jevKey: () => typesafeKey.source(),
  });
}

/** 환경 변수 숫자. 없거나 음수면 기본값 */
const envNumber = (raw: string | undefined, fallback: number) => {
  const n = Number(raw);
  return raw !== undefined && raw !== '' && Number.isFinite(n) && n >= 0 ? n : fallback;
};

const SIMULATED: Record<Simulatable, Signal> = {
  'name-call': { kind: 'name-call' },
  hum: { kind: 'hum', hz: 220 },
  loud: { kind: 'loud' },
  return: { kind: 'return', awaySec: 42 * 60 },
  'clock-late': { kind: 'clock', hour: 3 },
  idle: { kind: 'idle' },
  'app-dev': { kind: 'app', app: 'Code' },
};

async function bootstrap(): Promise<void> {
  const device = new DeviceWindow();
  const consoleWin = new ConsoleWindow();
  const brain = new Brain({
    dailyBudget: Math.floor(envNumber(import.meta.env.MAIN_VITE_FREE_DAILY_BUDGET, DEFAULT_DAILY_BUDGET)),
    paidCapUsd: envNumber(import.meta.env.MAIN_VITE_JEV_DAILY_USD, DEFAULT_JEV_DAILY_USD),
  });
  connectEngines(brain);
  const sensors = new DesktopSensors((sig) => brain.sense(sig), (name) => (brain.activeApp = name));
  const toggles = { mic: false, sound: false, speech: false };
  const whisperPaths = resolveWhisper();
  const whisper = 'missing' in whisperPaths ? null : new Whisper(whisperPaths, (t) => brain.note(t));

  restrictPermissions(device);
  installMenu(() => consoleWin.show());

  brain.on('body', (b) => { device.send(IPC.body, b); consoleWin.send(IPC.body, b); });
  brain.on('log', (l) => consoleWin.send(IPC.log, l));
  brain.on('cortex', (o) => consoleWin.send(IPC.cortex, o));
  brain.on('act', (a) => device.send(IPC.act, a));
  brain.on('memory', (m) => device.send(IPC.memory, m));
  brain.on('usage', (u) => consoleWin.send(IPC.usage, u));

  // ─── IPC: 보낸 창을 확인하고, 값은 shared의 sanitize로 검증한다 ───
  const from = (w: DeviceWindow | ConsoleWindow) => (e: IpcMainEvent) => w.isOwner(e.sender);
  const fromDevice = from(device);
  const fromConsole = from(consoleWin);

  let booted = false;
  ipcMain.on(IPC.deviceReady, (e, raw: unknown) => {
    if (!fromDevice(e)) return;
    device.send(IPC.deviceCmd, toggles);
    if (booted) return;
    booted = true;
    brain.loadMemory(sanitizeMemory(raw));
    brain.start();
    sensors.start();
  });
  ipcMain.on(IPC.micSignal, (e, raw: unknown) => {
    if (!fromDevice(e) || !toggles.mic) return;
    const sig = sanitizeSignal(raw);
    if (sig && (sig.kind === 'hum' || sig.kind === 'loud')) brain.sense(sig);
  });
  ipcMain.handle(IPC.getSnapshot, (e): Snapshot => {
    if (!consoleWin.isOwner(e.sender)) throw new Error('forbidden sender');
    return { ...brain.snapshot, ...toggles, usage: brain.usage };
  });
  ipcMain.on(IPC.sendText, (e, raw: unknown) => {
    if (!fromConsole(e) || typeof raw !== 'string') return;
    const text = raw.trim().slice(0, LIMITS.textMax);
    if (text) brain.sense({ kind: 'text', text });
  });
  ipcMain.on(IPC.simulate, (e, kind: unknown) => {
    if (!fromConsole(e) || !SIMULATABLE.includes(kind as Simulatable)) return;
    brain.sense({ ...SIMULATED[kind as Simulatable] });
  });
  ipcMain.handle(IPC.setMic, async (e, on: unknown) => {
    if (!consoleWin.isOwner(e.sender) || typeof on !== 'boolean') return toggles.mic;
    toggles.mic = on && (await micAllowed());
    toggles.speech = false;
    device.send(IPC.deviceCmd, toggles);
    if (toggles.mic) void startSpeech();
    else whisper?.stop();
    return toggles.mic;
  });
  const startSpeech = async () => {
    if (!whisper) return brain.note(`음성 인식 꺼짐 · 없음: ${'missing' in whisperPaths ? whisperPaths.missing : ''}`);
    toggles.speech = (await whisper.start()) && toggles.mic;
    device.send(IPC.deviceCmd, toggles);
  };
  let sttId = 0;
  /**
   * whisper는 한 번에 하나만 처리한다. 처리 중에 들어온 구간은 버리지 않고 가장 최근 것 하나만 남겨 두었다가 이어서 인식한다
   * (친구가 말을 이어 가거나 정정하면 마지막 말이 중요하다).
   */
  let sttRunning = false;
  let sttWaiting: { clip: Float32Array; humHz?: number; diag: (ev: Omit<SttEvent, 'id' | 'at' | 'sec'>) => void } | null = null;
  ipcMain.on(IPC.speechClip, (e, clip: unknown, rawHum: unknown) => {
    if (!fromDevice(e) || !toggles.speech || !whisper || !isSpeechClip(clip)) return;
    const humHz = sanitizeSignal({ kind: 'hum', hz: rawHum })?.hz;
    const base = { id: ++sttId, at: Date.now(), sec: +(clip.length / SPEECH.sampleRate).toFixed(1) };
    const diag = (ev: Omit<SttEvent, keyof typeof base>) => consoleWin.send(IPC.stt, { ...base, ...ev });
    if (sttRunning) {
      sttWaiting?.diag({ phase: 'dropped', verdict: '더 최근 말이 와서 건너뜀' });
      sttWaiting = { clip, humHz, diag };
      diag({ phase: 'pending', verdict: '앞 구간 인식 뒤에 이어서' });
      return;
    }
    void recognize(clip, humHz, diag);
  });
  ipcMain.on(IPC.speechStart, (e) => {
    if (fromDevice(e) && toggles.speech) brain.interrupt('말소리 시작');
  });
  async function recognize(clip: Float32Array, humHz: number | undefined, diag: (ev: Omit<SttEvent, 'id' | 'at' | 'sec'>) => void) {
    sttRunning = true;
    try {
      await transcribeOne(clip, humHz, diag);
    } finally {
      sttRunning = false;
      const next = sttWaiting;
      sttWaiting = null;
      if (next) void recognize(next.clip, next.humHz, next.diag);
    }
  }
  async function transcribeOne(clip: Float32Array, humHz: number | undefined, diag: (ev: Omit<SttEvent, 'id' | 'at' | 'sec'>) => void) {
    if (!whisper) return;
    const sec = +(clip.length / SPEECH.sampleRate).toFixed(1);
    diag({ phase: 'pending', verdict: 'whisper 인식 중…' });
    const result = await whisper.transcribe(clip);
    if ('failed' in result) return diag({ phase: 'dropped', verdict: result.failed });
    const judged = judgeTranscript(result.text);
    const sig = resolveClip(judged.signal, humHz);
    const toLlm = sig && (sig.kind === 'name-call' || sig.addressed || (sig.kind === 'speech' && brain.inConversation));
    const verdict = !sig ? `${judged.drop ?? '의미 없음'} → 버림` : sig.kind === 'hum' ? `음정 구간 · 이름 없음 → 허밍 ${humHz}Hz` : sig.kind === 'name-call' ? '이름 부르기 → 깨어남' : toLlm ? '나한테 한 말 → LLM' : '주변 말소리 → 귀만 기울임';
    diag({ phase: sig ? 'done' : 'dropped', ms: result.ms, text: result.text.trim(), verdict });
    brain.note(`STT ${sec}s 음성 → ${result.ms}ms${sig ? '' : ' · 의미 없음(버림)'}`);
    if (sig) brain.sense(sig);
  }
  ipcMain.on(IPC.micStats, (e, raw: unknown) => {
    if (!fromDevice(e) || !toggles.mic) return;
    const s = sanitizeMicStats(raw);
    if (s) consoleWin.send(IPC.micDiag, s);
  });
  ipcMain.on(IPC.setSound, (e, on: unknown) => {
    if (!fromConsole(e) || typeof on !== 'boolean') return;
    toggles.sound = on;
    device.send(IPC.deviceCmd, toggles);
  });
  ipcMain.on(IPC.setEngine, (e, engine: unknown) => {
    if (fromConsole(e) && isEngine(engine)) brain.setEngine(engine);
  });
  ipcMain.handle(IPC.setTypesafeKey, (e, key: unknown) => {
    if (!consoleWin.isOwner(e.sender)) return false;
    const ok = typesafeKey.set(key);
    if (ok) brain.keyChanged();
    return ok;
  });
  ipcMain.on(IPC.clearTypesafeKey, (e) => {
    if (!fromConsole(e)) return;
    typesafeKey.clear();
    brain.keyChanged();
  });
  ipcMain.on(IPC.openConsole, () => consoleWin.show());

  app.on('web-contents-created', (_e, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    contents.on('will-navigate', (ev, url) => { if (!isAppUrl(url)) ev.preventDefault(); });
  });
  app.on('before-quit', () => { brain.stop(); sensors.stop(); whisper?.stop(); });
  app.on('window-all-closed', () => app.quit());
  // 터미널 종료(SIGINT/SIGTERM)도 정상 종료로 돌려 whisper-server 자식 프로세스가 남지 않게 한다
  for (const sig of ['SIGINT', 'SIGTERM'] as const) process.once(sig, () => app.quit());

  device.show();
  consoleWin.show();
}

function sanitizeMicStats(v: unknown): MicStats | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
  const rmsDb = num(o.rmsDb), peakDb = num(o.peakDb), rate = num(o.rate);
  const thresholdDb = num(o.thresholdDb), floorDb = num(o.floorDb);
  if (rmsDb === null || peakDb === null || rate === null || thresholdDb === null || floorDb === null) return null;
  const vad = ['quiet', 'voice', 'hum', 'recording'].includes(o.vad as string) ? (o.vad as MicStats['vad']) : 'quiet';
  return { rmsDb, peakDb, rate, vad, thresholdDb, floorDb, hz: num(o.hz), device: typeof o.device === 'string' ? o.device.slice(0, 80) : '?' };
}

/** 마이크는 device 창에만, 오디오 입력만 허용한다 */
function restrictPermissions(device: DeviceWindow): void {
  session.defaultSession.setPermissionRequestHandler((contents, permission, cb, details) => {
    const audioOnly = permission === 'media' && 'mediaTypes' in details && details.mediaTypes?.every((t) => t === 'audio');
    cb(!!audioOnly && device.isOwner(contents));
  });
}

async function micAllowed(): Promise<boolean> {
  if (process.platform !== 'darwin') return true;
  return systemPreferences.askForMediaAccess('microphone');
}

function installMenu(openConsole: () => void): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'editMenu' },
    {
      label: 'Tuffy',
      submenu: [{ label: '뇌 콘솔 열기', accelerator: 'CmdOrCtrl+Shift+B', click: openConsole }],
    },
  ]));
}
