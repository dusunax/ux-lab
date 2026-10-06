import type { Emotion, Motion, Signal } from '../../shared/state';

/** salience가 이 값 이상이면 cortex(LLM)까지 올려 숙고한다 */
export const ESCALATE_AT = 0.5;

export interface Reflex {
  salience: number;
  motion: Motion;
  emotion?: Emotion;
  note: string;
  energy?: number;
}

const DEV_APPS = /^(Code|Cursor|Xcode|Terminal|iTerm2|Warp|Ghostty|WebStorm|IntelliJ IDEA|Claude|Zed)$/i;
const isLateHour = (h: number) => h >= 0 && h < 5;

/** 몸의 즉각 반응. 말하지 않고 motion/emotion만 바꾼다 */
export function reflex(sig: Signal): Reflex {
  switch (sig.kind) {
    case 'text':
      return { salience: 0.8, motion: 'perk', note: '글자 감지 → 다리 쫙 (perk)' };
    case 'speech':
      return sig.addressed
        ? { salience: 0.8, motion: 'perk', note: '나한테 한 말 → 다리 쫙 (perk)' }
        : { salience: 0.35, motion: 'idle', emotion: 'curious', note: '말소리 들림 → 귀만 기울임 (대화 상대 아님)' };
    case 'name-call':
      return { salience: 0.9, motion: 'perk', emotion: 'curious', note: '이름 불림 → 벌떡' };
    case 'hum':
      return { salience: 0.55, motion: 'perk', note: '음정 있는 소리 → 귀 기울임' };
    case 'loud':
      return { salience: 0.3, motion: 'shiver', emotion: 'worried', note: '큰 소리 → 움찔 떨림' };
    case 'app':
      return DEV_APPS.test(sig.app ?? '')
        ? { salience: 0.35, motion: 'think', emotion: 'focus', note: `개발 앱(${sig.app}) → 집중 자세` }
        : { salience: 0.2, motion: 'idle', note: `앱 전환(${sig.app}) → 힐끗` };
    case 'clock':
      return isLateHour(sig.hour ?? 12)
        ? { salience: 0.7, motion: 'perk', emotion: 'worried', note: `시계 ${pad(sig.hour)}시 → 경계` }
        : { salience: 0.25, motion: 'idle', note: `정각 ${pad(sig.hour)}시 → 기지개` };
    case 'idle':
      return { salience: 0.4, motion: 'idle', emotion: 'calm', note: '유휴 10분 → 조용히 대기', energy: -0.1 };
    case 'return':
      return (sig.awaySec ?? 0) >= 600
        ? { salience: 0.6, motion: 'perk', note: '자리 복귀 → 고개 듦' }
        : { salience: 0.3, motion: 'perk', note: '잠깐 자리 비움 복귀 → 힐끗' };
    case 'self':
      return { salience: 0.55, motion: 'idle', note: '자기 점검 틱' };
  }
}

const pad = (h?: number) => String(h ?? 0).padStart(2, '0');

/** SENSE 로그 한 줄 */
export function describe(sig: Signal): string {
  switch (sig.kind) {
    case 'text': return `text "${sig.text}"`;
    // 대화 상대가 아닌 말은 내용을 로그에도 남기지 않는다
    case 'speech': return sig.addressed ? `mic.speech "${sig.text}"` : `mic.speech (${sig.text?.length ?? 0}자, 내용 비공개)`;
    case 'name-call': return 'mic.wake "터피"';
    case 'hum': return `mic.pitch ${sig.hz ?? '?'}Hz`;
    case 'loud': return 'mic.peak > -10dBFS';
    case 'app': return `desktop.focus "${sig.app}"`;
    case 'clock': return `desktop.clock ${pad(sig.hour)}:00`;
    case 'idle': return 'desktop.idle 600s';
    case 'return': return `desktop.idle_end (${Math.round((sig.awaySec ?? 0) / 60)}분 부재)`;
    case 'self': return 'self.tick';
  }
}
