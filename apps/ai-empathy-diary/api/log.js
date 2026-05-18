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
]);

const ALLOWED_PARAM_KEYS = new Set([
  'text_length', 'emotion', 'reason', 'code', 'is_new_user',
]);
const MAX_VAL_LEN = 256;

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

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
