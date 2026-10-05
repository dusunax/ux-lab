import { LIMITS, SPEECH, type Signal } from '../../shared/state';

export { SPEECH };

/**
 * whisper가 이름을 받아 적는 변형들. 실제 마이크에서는 "터피야"가 "터키야"로 자주 들려서,
 * 호격 조사가 붙은 "터키야/터키아"도 이름으로 본다 (나라 이름을 부를 일은 거의 없다).
 */
const NAME_RE = /(터피|터비|토피|떠피|타피|tuffy|tuffie|tuffi)(야|아|씨)?|터키(야|아)/gi;

/**
 * 무음·잡음에서 whisper가 지어내는 유튜브·방송 자막 문구 (자막 달린 영상으로 학습한 흔적).
 * 실측: "시청해주셔서 감사합니다", "다음 영상에서 만나요".
 * 영상 자막에만 나오는 말투로 좁혀 두어 "이 영상 재밌더라", "좋아요", "구독 취소해야지" 같은 일상 문장은 남긴다.
 */
const SUBTITLE_PHRASES: RegExp[] = [
  /시청(해|하여)?\s?주(셔서|신|세요)/,
  /(끝까지|오늘도|항상)\s?(시청|봐)\s?(해|주)/,
  /(다음|다른)\s?(영상|시간|편|방송|이야기|에피소드)(에서|에|으로|때)?\s?(만나|봬|뵙|찾아|또)/,
  /구독(과|이랑|하고|,)?\s?(좋아요|알림)/,
  /좋아요(와|랑|하고|,)?\s?(구독|알림)/,
  /구독\s?(부탁|해\s?주|눌러)/,
  /알림\s?설정/,
  /(한글\s?)?자막\s?(제공|by|번역|및|협찬)/i,
  /(MBC|KBS|SBS|YTN|JTBC|연합)\s?뉴스/,
  /뉴스\s?[가-힣]{2,4}(입니다|였습니다|이었습니다)$/,
  /이\s?시각\s?세계/,
  /(오늘|이번)\s?(영상|방송)은\s?(여기까지|여기서)/,
];

/** 말이 아닌 감탄·채움 소리 ("오우우우우", "음~", 단독 "감사합니다.") */
const FILLERS: RegExp[] = [
  /^(감사합니다|고맙습니다|네|아|음|어)[.!]?$/,
  /^[오우아어으음흠하~\s.,!?…]+$/,
];

export type DropReason = '너무 짧음' | '영상 자막 문구' | '감탄·채움 소리' | '같은 말 반복';

/**
 * 음정이 길게 이어진 구간(humHz)의 최종 판정.
 * whisper는 허밍에서도 그럴듯한 문장을 지어내고 신뢰도도 높게 준다(실측). 그래서
 * 이름을 부른 경우만 말로 믿고, 나머지는 허밍으로 본다 — 잘못 판정해도 허밍 반응으로 끝나는 쪽이 안전하다.
 */
export function resolveClip(heard: Signal | null, humHz?: number): Signal | null {
  if (!humHz) return heard;
  const named = heard && (heard.kind === 'name-call' || heard.addressed);
  return named ? heard : { kind: 'hum', hz: humHz };
}

/**
 * 잡음에서 whisper가 같은 말을 되풀이해 지어내는 경우 (실측: "아래의 아래의 아래의 아래의…").
 * 2~8글자 덩어리가 세 번 이상 이어지면 반복으로 본다. 이름을 부른 말은 반복이어도 살린다.
 */
const REPEATED = /(.{2,8}?)\1{2,}/;
const isRepetition = (text: string) => REPEATED.test(text.replace(/[\s,.!?~…]+/g, ''));

/** 결과 해석: 이름만 부름 → name-call, 내용 있음 → speech, 의미 없음 → null */
export function interpretTranscript(raw: string): Signal | null {
  return judgeTranscript(raw).signal;
}

/** 해석과 함께 버린 이유를 돌려준다 (MIC 진단 표시용) */
export function judgeTranscript(raw: string): { signal: Signal | null; drop?: DropReason } {
  const text = raw
    .replace(/\[[^\]]*\]|\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LIMITS.textMax);
  if (text.length < 2) return { signal: null, drop: '너무 짧음' };
  if (SUBTITLE_PHRASES.some((re) => re.test(text))) return { signal: null, drop: '영상 자막 문구' };
  if (FILLERS.some((re) => re.test(text))) return { signal: null, drop: '감탄·채움 소리' };

  const called = new RegExp(NAME_RE.source, 'i').test(text);
  if (!called && isRepetition(text)) return { signal: null, drop: '같은 말 반복' };
  const rest = text.replace(NAME_RE, '').replace(/[\s,.!?~…]+/g, ' ').trim();
  if (called && rest.length < 2) return { signal: { kind: 'name-call' } };
  return { signal: { kind: 'speech', text, addressed: called } };
}

/** 16-bit PCM mono WAV (whisper-server /inference 입력) */
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array<ArrayBuffer> {
  const out = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const ascii = (at: number, s: string) => [...s].forEach((c, i) => out.setUint8(at + i, c.charCodeAt(0)));
  ascii(0, 'RIFF');
  out.setUint32(4, 36 + samples.length * 2, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, 1, true);
  out.setUint32(24, sampleRate, true);
  out.setUint32(28, sampleRate * 2, true);
  out.setUint16(32, 2, true);
  out.setUint16(34, 16, true);
  ascii(36, 'data');
  out.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
  return new Uint8Array(out.buffer);
}

/** renderer에서 온 음성 구간 검증 */
export function isSpeechClip(v: unknown): v is Float32Array {
  if (!(v instanceof Float32Array)) return false;
  const sec = v.length / SPEECH.sampleRate;
  return sec >= SPEECH.minSec && sec <= SPEECH.maxSec;
}
