'use strict';

/* ── HTML Escape ───────────────────────────────── */
/* Morgan + Chase: single-pass, String() cast, single-quote included */
var HTML_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(c) { return HTML_ESCAPE[c]; });
}

/* ── JSON helpers (Sage) ────────────────────────── */
function extractJson(raw) {
  var trimmed = String(raw).trim();
  try { return JSON.parse(trimmed); } catch (e) { /* continue */ }
  var stripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try { return JSON.parse(stripped); } catch (e) { /* continue */ }
  // Use [^{}]* to match only the first complete flat JSON object,
  // preventing greedy match from spanning multiple objects in the response.
  var match = stripped.match(/\{[^{}]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch (e) { /* continue */ } }
  throw new Error('JSON 파싱 실패');
}

/* ── Emotion Normalizer ─────────────────────────── */
/* Depends on EMOTION_CONFIG from config.js — must load config.js first */
if (typeof EMOTION_CONFIG === 'undefined') throw new Error('utils.js: config.js must be loaded first');
function normalizeEmotion(emotion) {
  if (EMOTION_CONFIG[emotion]) return emotion;
  var keys = Object.keys(EMOTION_CONFIG);
  var found = keys.find(function(k) { return emotion.includes(k) || k.includes(emotion); });
  return found !== undefined ? found : '평온';
}

/* ── Error Reason Classifier ───────────────────── */
function errorReason(err) {
  var m = (err && err.message) ? err.message : '';
  if (m.includes('서버에 연결할 수 없어요')) return 'network';
  if (m.includes('잠시 쉬고 있어요')) return 'upstream_exhausted';
  if (m.includes('너무 많아요')) return 'rate_limit';
  if (m.includes('AI 서버에 일시적인')) return 'upstream_5xx';
  if (m.includes('응답 오류가 발생했어요')) return 'http_error';
  if (m.includes('너무 길어요')) return 'input_too_long';
  if (m.includes('형식이 예상과 달라요')) return 'format_mismatch';
  if (m.includes('응답 형식이 올바르지')) return 'parse_error';
  if (m.includes('분석 결과') || m.includes('내용을 찾을 수')) return 'parse_error';
  return 'unknown';
}

/* ── Date ──────────────────────────────────────── */
function todayStr() {
  var d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/* ── ID Generator ──────────────────────────────── */
/* Morgan: prefer crypto.randomUUID when available */
function generateId() {
  return (crypto.randomUUID && crypto.randomUUID()) ||
    (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
}
