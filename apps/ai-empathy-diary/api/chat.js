import { randomUUID, createHash } from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ── Firebase Admin SDK 초기화 (1회만) ────────────────────────────────────────
// FIREBASE_SERVICE_ACCOUNT: Vercel 환경변수에 Service Account JSON 문자열로 등록
// 미등록 시 토큰 검증 불가 → 501 반환
function getAdminAuth() {
  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) return null;
    try {
      initializeApp({ credential: cert(JSON.parse(raw)) });
    } catch {
      return null;
    }
  }
  return getAuth();
}

// ── Firebase ID Token 검증 ────────────────────────────────────────────────────
// Authorization: Bearer <idToken> 헤더에서 토큰 추출 후 검증
// 반환값: { uid } | null (검증 실패)
async function verifyIdToken(req) {
  const auth = getAdminAuth();
  if (!auth) return null; // 환경변수 미설정 — 501로 처리
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

// CORS 정책: api/log.js와 동일하게 프로덕션 도메인 + localhost로 제한한다.
// [한계] CORS는 브라우저 Same-Origin 정책 강제이므로 curl/서버 직접 호출을 막지 않는다.
// [한계] origin 헤더가 없는 요청(curl, server-to-server)은 CORS 검사를 통과한다.
// 완전한 방어를 위해서는 Authorization 헤더 기반 Firebase ID Token 검증이 필요하다.
// 참조: OQ-3 결정 (2026-05-23 Sprint 7 킥오프)
const PRODUCTION_ORIGIN = 'https://ai-empathy-diary.vercel.app';
const LOCALHOST_ORIGIN_RE = /^http:\/\/localhost(:\d+)?$/;
// Vercel preview URLs: https://ai-empathy-diary-{hash}-d-x.vercel.app
const VERCEL_PREVIEW_RE = /^https:\/\/ai-empathy-diary-[a-z0-9]+-d-x\.vercel\.app$/;

const ALLOWED_ORIGINS = (() => {
  const origins = new Set([PRODUCTION_ORIGIN]);
  const custom = process.env.ALLOWED_ORIGIN;
  if (custom) origins.add(custom);
  return origins;
})();

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (LOCALHOST_ORIGIN_RE.test(origin)) return true;
  if (VERCEL_PREVIEW_RE.test(origin)) return true;
  return ALLOWED_ORIGINS.has(origin);
}

// 셀 참조 풀 — 해시로 결정론적 선택 (모델 ID가 같으면 항상 같은 이름)
const MODEL_LABEL_POOL = [
  '$A$1', '$B$2', '$C$3', '$D$4', '$E$5',
  '$F$6', '$G$7', '$H$8', '$I$9', '$J$10',
  '$A$2', '$B$1', '$C$2', '$D$3', '$E$4',
];

function generateModelLabel(modelId) {
  const hash = createHash('sha256').update(modelId).digest('hex');
  const idx = parseInt(hash.slice(0, 8), 16) % MODEL_LABEL_POOL.length;
  return MODEL_LABEL_POOL[idx];
}

const FALLBACKS = [
  'openai/gpt-oss-120b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-20b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'minimax/minimax-m2.5:free',
];

function log(event, fields) {
  console.log(JSON.stringify({ event, ts: Date.now(), ...fields }));
}

async function callOpenRouter(apiKey, body) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  return res;
}

export default async function handler(req, res) {
  // ── Firebase ID Token 검증 ─────────────────────────────────────────────────
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    // 환경변수 미설정: 개발 중 또는 설정 누락 상태 — 명시적 501 반환
    res.status(501).json({ error: 'FIREBASE_SERVICE_ACCOUNT 환경변수가 설정되지 않았습니다.' });
    return;
  }

  const decoded = await verifyIdToken(req);
  if (!decoded) {
    res.status(401).json({ error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.' });
    return;
  }

  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    if (isAllowedOrigin(origin)) { res.status(204).end(); return; }
    res.status(403).end(); return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENROUTER_KEY not configured' });
    return;
  }

  const requestId = randomUUID();
  res.setHeader('x-request-id', requestId);
  const t0 = Date.now();

  const { model, ...rest } = req.body;
  const isAuto = !model || model === 'auto';
  const candidates = isAuto ? FALLBACKS : [model, ...FALLBACKS.filter(m => m !== model)];

  log('chat_request', { request_id: requestId, model_requested: model ?? 'auto', is_auto: isAuto });

  let attempt = 0;
  for (const candidate of candidates) {
    attempt++;
    let upstream;
    try {
      upstream = await callOpenRouter(apiKey, { ...rest, model: candidate });
    } catch {
      log('chat_upstream_error', { request_id: requestId, model: candidate, status: 'network', latency_ms: Date.now() - t0 });
      res.status(502).json({ error: '업스트림 서버에 연결할 수 없어요.' });
      return;
    }

    if (upstream.status === 429 || (upstream.status >= 500 && upstream.status < 600)) {
      log('chat_fallback', { request_id: requestId, from_model: candidate, attempt, reason: String(upstream.status) });
      continue;
    }

    const data = await upstream.json();

    if (upstream.ok) {
      log('chat_success', {
        request_id: requestId,
        model_used: candidate,
        attempt_count: attempt,
        latency_ms: Date.now() - t0,
        prompt_tokens: data?.usage?.prompt_tokens,
        completion_tokens: data?.usage?.completion_tokens,
      });
    } else {
      log('chat_upstream_error', { request_id: requestId, model: candidate, status: upstream.status, latency_ms: Date.now() - t0 });
    }

    const usedModel = data.model || candidate || 'unknown';
    res.status(upstream.status).json(upstream.ok
      ? { ...data, model: usedModel, modelLabel: generateModelLabel(usedModel), request_id: requestId }
      : data);
    return;
  }

  log('chat_exhausted', { request_id: requestId, attempts: attempt });
  res.status(429).json({ error: `모든 모델(${candidates.length}개)이 rate limit에 걸렸어요.` });
}
