const ALLOWED_EVENTS = new Set([
  'auth_signin_success',
  'auth_signin_failure',
  'auth_signout',
  'entry_submit_attempt',
  'entry_submit_success',
  'entry_submit_failure',
  'entry_load_failure', // reserved for future use
  'entry_save_failure', // reserved for future use
  'entry_delete',       // reserved for future use
  'emotion_label_recorded',
  'emotion_feedback_recorded',
]);

const ALLOWED_PARAM_KEYS = new Set([
  'text_length', 'emotion', 'reason', 'code', 'is_new_user', 'request_id', 'label', 'feedback', 'model',
]);
const MAX_VAL_LEN = 256;

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

function sanitize(params) {
  const safe = {};
  for (const [k, v] of Object.entries(params)) {
    if (!ALLOWED_PARAM_KEYS.has(k)) continue;
    if (typeof v === 'string') { safe[k] = v.slice(0, MAX_VAL_LEN); }
    else if (typeof v === 'number' || typeof v === 'boolean') { safe[k] = v; }
  }
  return safe;
}

export default function handler(req, res) {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    if (isAllowedOrigin(origin)) { res.status(204).end(); return; }
    res.status(403).end(); return;
  }
  if (req.method !== 'POST') { res.status(405).end(); return; }
  if (origin && !isAllowedOrigin(origin)) { res.status(403).end(); return; }

  const { event } = req.body || {};
  const rawParams = req.body?.params;
  const params = rawParams && typeof rawParams === 'object' && !Array.isArray(rawParams)
    ? rawParams
    : {};

  if (typeof event !== 'string' || !ALLOWED_EVENTS.has(event)) {
    res.status(400).end();
    return;
  }

  // event and ts are placed after spread so they cannot be overridden by params
  console.log(JSON.stringify({ ...sanitize(params), event, ts: Date.now() }));
  res.status(204).end();
}
