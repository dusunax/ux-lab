/**
 * 알림음. 파일 없이 Web Audio로 교회 종처럼 배음을 겹친 소리를 세 번 친다.
 */

/** 종의 배음 비율과 상대 음량 (hum, prime, tierce, quint, nominal) */
const PARTIALS: ReadonlyArray<readonly [ratio: number, gain: number]> = [
  [0.5, 0.35],
  [1, 0.5],
  [1.2, 0.22],
  [1.5, 0.16],
  [2, 0.12],
  [2.76, 0.06],
];
/** E5 → B4 → E5 */
const STRIKES: ReadonlyArray<readonly [delaySec: number, hz: number]> = [
  [0, 659.25],
  [0.42, 493.88],
  [0.84, 659.25],
];
const DECAY_SEC = 2.6;
const MASTER_GAIN = 0.32;

let ctx: AudioContext | null = null;

function strike(audio: AudioContext, out: AudioNode, at: number, hz: number): void {
  for (const [ratio, level] of PARTIALS) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz * ratio;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.006);
    // 높은 배음일수록 빨리 사라진다
    gain.gain.exponentialRampToValueAtTime(0.0001, at + DECAY_SEC / Math.sqrt(ratio));
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + DECAY_SEC + 0.1);
  }
}

export function chime(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);
    const now = ctx.currentTime + 0.02;
    for (const [delay, hz] of STRIKES) strike(ctx, master, now + delay, hz);
  } catch (error) {
    console.error('chime:', error);
  }
}
