import { randomUUID } from 'crypto';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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

    res.status(upstream.status).json(upstream.ok ? { ...data, request_id: requestId } : data);
    return;
  }

  log('chat_exhausted', { request_id: requestId, attempts: attempt });
  res.status(429).json({ error: `모든 모델(${candidates.length}개)이 rate limit에 걸렸어요.` });
}
