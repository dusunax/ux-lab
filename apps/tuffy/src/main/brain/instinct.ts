import { CHORDS, EMOTION_KO, type CortexOutput, type Emotion, type Motion } from '../../shared/state';
import type { MindContext } from './mind';

/**
 * 로컬 본능. LLM을 부르지 않는 신호(혼자 생각·데스크탑·허밍)와, 무료 모델이 실패하거나
 * 하루 예산을 다 썼을 때 쓴다. 정규식·규칙이라 '생각'은 얕지만 몸이 멈추지 않게 한다.
 */

interface TextRule { re: RegExp; emotion: Emotion; motion: Motion; tone: string; score: number; say: string }

const TEXT_RULES: TextRule[] = [
  { re: /잘\s?자|졸려|자야|굿밤|good ?night/i, emotion: 'sleepy', motion: 'curl', tone: '휴식', score: 0.5,
    say: '자. 나 지켜봐. 안전해.' },
  { re: /힘들|피곤|짜증|우울|슬퍼|버그|에러|망했|안\s?돼|sad|tired/i, emotion: 'worried', motion: 'shiver', tone: '부정', score: 0.22,
    say: '너 힘들어, 질문? 나 여기. 같이 고쳐.' },
  { re: /고마|좋아|최고|사랑|귀여|잘했|성공|thanks|love/i, emotion: 'amaze', motion: 'bounce', tone: '긍정', score: 0.91,
    say: '기뻐 기뻐 기뻐! 너 좋은 친구.' },
  { re: /안녕|하이|반가|hello|\bhi\b|헬로/i, emotion: 'calm', motion: 'wave', tone: '인사', score: 0.7,
    say: '친구 왔다. 손 흔들어. 좋아.' },
  { re: /코드|과학|실험|계산|빌드|배포|커밋|리뷰/i, emotion: 'focus', motion: 'think', tone: '작업', score: 0.6,
    say: '일 한다. 나 계산 도와, 질문?' },
  { re: /\?|뭐|왜|어떻게|언제|누구/i, emotion: 'curious', motion: 'scuttle', tone: '질문', score: 0.6,
    say: '좋은 질문. 과학으로 알아내자.' },
];

const FALLBACK: TextRule = { re: /$^/, emotion: 'curious', motion: 'think', tone: '모름', score: 0.5, say: '이해 못 함. 다시 말해, 질문?' };

type Body = Omit<CortexOutput, 'source' | 'decision'>;

function thinkText(text: string, turns: number): Body {
  const rule = TEXT_RULES.find((r) => r.re.test(text)) ?? FALLBACK;
  const short = text.length > 16 ? `${text.slice(0, 15)}…` : text;
  return {
    thought: [
      `입력 해석: "${short}" (${text.length}자)`,
      `어조 추정: ${rule.tone} ${rule.score.toFixed(2)}`,
      `기억 조회: 오늘 대화 ${turns + 1}번째`,
      `결론: ${EMOTION_KO[rule.emotion]} → ${rule.motion}, 화음 ${CHORDS[rule.emotion].name}`,
    ],
    emotion: rule.emotion, motion: rule.motion, intensity: rule.score, say: rule.say,
  };
}

const pick = <T>(list: T[], rng: () => number) => list[Math.floor(rng() * list.length)];

export function instinctThink(ctx: MindContext, rng: () => number = Math.random): CortexOutput {
  const { signal, memory, body } = ctx;
  const source = signal.kind;
  // 정각 신호는 신호에 담긴 시각을 쓴다 (판단 시점의 현재 시각이 아니라)
  const clockHour = signal.kind === 'clock' ? signal.hour : undefined;
  const hh = String(clockHour ?? ctx.now.getHours()).padStart(2, '0');
  const mm = clockHour === undefined ? String(ctx.now.getMinutes()).padStart(2, '0') : '00';
  const bodyOut: Body = (() => {
    switch (signal.kind) {
      case 'text':
      case 'speech':
        return thinkText(signal.text ?? '', memory.turns);
      case 'name-call':
        return { emotion: 'amaze', motion: 'wave', intensity: 0.8, say: '불렀어! 나 여기, 질문?',
          thought: ['호출어 "터피" 일치', '친구가 나를 찾음', '결론: 신남 → 손 흔듦'] };
      case 'return':
        return { emotion: 'amaze', motion: 'bounce', intensity: 0.85, say: '돌아왔다! 좋아 좋아 좋아!',
          thought: [`부재 ${Math.round((signal.awaySec ?? 0) / 60)}분`, '친구 복귀 = 좋은 일', '결론: 신남 → bounce'] };
      case 'clock':
        return { emotion: 'worried', motion: 'scuttle', intensity: 0.6, say: `${hh}시. 인간 자야 해, 질문?`,
          thought: [`시스템 시계 ${hh}:${mm}`, '인간 수면 주기 위반 감지', '결론: 걱정 → 서성임(scuttle)'] };
      case 'hum':
        return { emotion: 'amaze', motion: 'bounce', intensity: 0.75, say: '너 노래해! 나랑 같은 말, 질문?',
          thought: [`피치 ${signal.hz ?? '?'}Hz, 화음 패턴 유사`, '리시언 언어와 닮음!', '결론: 신남 → 화음으로 대답'] };
      default:
        return pick([
          { emotion: 'curious', motion: 'scuttle', intensity: 0.35, say: '혼자 실험. 과학 과학.',
            thought: ['주변 조용함', '친구 바쁨으로 추정', '결론: 혼자 실험하며 돌아다님'] },
          { emotion: 'calm', motion: 'wave', intensity: 0.3, say: '나 여기 있어, 질문?',
            thought: [`에너지 ${Math.round(body.energy * 100)}%`, '존재 알림 필요도 낮음', '결론: 작게 손 흔듦'] },
          { emotion: 'amaze', motion: 'bounce', intensity: 0.4, say: '친구 생각. 좋아.',
            thought: [`오늘 대화 ${memory.turns}회 회상`, '기억 평균 감정: 긍정', '결론: 혼자 신남'] },
        ] satisfies Body[], rng);
    }
  })();
  return { source, ...bodyOut };
}
