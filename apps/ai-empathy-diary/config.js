'use strict';

/* ── App Constants ─────────────────────────────── */
var PROXY_ENDPOINT = '/api/chat';
var MODEL = 'auto';
var TOAST_DURATION_MS = 4000;
var MAX_INPUT_LENGTH = 500;
var VIRTUAL_THRESHOLD = 200;
var VIRTUAL_ROW_EST = 52; /* estimated px per row (accounts for wrapped empathy text) */
var COLUMN_LETTERS = ['A', 'B', 'C', 'D', 'E'];

/* ── System Prompt ─────────────────────────────── */
/* Sage: Korean system prompt, 13 emotions, stricter rules */
var SYSTEM_PROMPT = '당신은 따뜻하고 공감 능력이 뛰어난 감정 동반자입니다. 사용자가 오늘 있었던 일을 공유하면:\n\n1. 다음 감정 목록에서 주된 감정 하나를 파악하세요: 기쁨, 설렘, 뿌듯함, 슬픔, 외로움, 스트레스, 분노, 억울함, 불안, 혼란, 피로, 무기력함, 평온\n2. 상대방의 감정을 인정하고 공감하는 2~3문장의 한국어 응답을 작성하세요. 절대 조언하거나 해결책을 제시하지 마세요. 그냥 함께 있어 주세요.\n\n규칙:\n- JSON 객체만 응답하세요. 마크다운, 설명, 감싸는 텍스트 없이.\n- JSON은 정확히 두 개의 키를 가져야 합니다: "emotion" (string)과 "empathy" (string).\n- "empathy" 값은 한국어로, 따뜻하고 대화체여야 합니다. 딱딱하거나 임상적이지 않게.\n- 입력이 모호하거나 감정적으로 중립적이면 기본 감정을 "평온"으로 설정하세요.\n- empathy는 150자 이내로 작성하세요.\n\n응답 형식 (엄격히):\n{"emotion": "스트레스", "empathy": "오늘 정말 많이 지치셨겠어요. 그 무게를 혼자 감당해왔다는 게 느껴져서 마음이 쓰여요. 수고 많으셨어요."}';

/* ── Model Stats Config ─────────────────────────── */
/* 모델 익명화: api/chat.js 서버가 MDL-xxxx 형태로 반환. 클라이언트는 저장만 함. */
/* 피드백 최소 의미 샘플 기준 */
var FEEDBACK_MIN_SAMPLE = 5;

/* ── Emotion Config ─────────────────────────────── */
/* Morgan: merge EMOTION_TINT + EMOTION_BADGE → EMOTION_CONFIG */
var EMOTION_CONFIG = {
  '기쁨':     { tint: 'tint-joy',     badge: 'emo-joy'     },
  '설렘':     { tint: 'tint-joy',     badge: 'emo-joy'     },
  '뿌듯함':   { tint: 'tint-joy',     badge: 'emo-joy'     },
  '슬픔':     { tint: 'tint-sad',     badge: 'emo-sad'     },
  '외로움':   { tint: 'tint-sad',     badge: 'emo-sad'     },
  '스트레스': { tint: 'tint-stress',  badge: 'emo-stress'  },
  '분노':     { tint: 'tint-stress',  badge: 'emo-stress'  },
  '억울함':   { tint: 'tint-stress',  badge: 'emo-stress'  },
  '불안':     { tint: 'tint-anxiety', badge: 'emo-anxiety' },
  '혼란':     { tint: 'tint-anxiety', badge: 'emo-anxiety' },
  '피로':     { tint: 'tint-tired',   badge: 'emo-tired'   },
  '무기력함': { tint: 'tint-tired',   badge: 'emo-tired'   },
  '평온':     { tint: 'tint-calm',    badge: 'emo-calm'    },
};
