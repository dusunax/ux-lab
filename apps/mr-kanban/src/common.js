// 제공자(GitLab·GitHub) 공통 로직: URL 검증, 토큰 칸 구분, 컬럼 판정.

const GITHUB_API = 'https://api.github.com';

function normalizeBase(url) {
  const u = new URL(url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('http(s) URL만 허용');
  return u.origin + u.pathname.replace(/\/+$/, '');
}

// 토큰은 GitLab · github.com · GitHub Enterprise 별로 따로 저장한다
function tokenKind(cfg) {
  if (cfg.provider !== 'github') return 'gitlab';
  return cfg.baseUrl === GITHUB_API ? 'github' : 'ghe';
}

// 지금 설정에 쓸 토큰 칸. 토큰을 저장했던 주소와 지금 주소가 다르면 쓰지 않는다 (다른 호스트로 토큰이 나가지 않게)
function tokenSlot(cfg) {
  const slot = (cfg.tokens || {})[tokenKind(cfg)];
  return slot && slot.enc && slot.base === cfg.baseUrl ? slot : null;
}

// 칸별로 토큰을 저장한 호스트 (렌더러 안내용, 토큰 자체는 담지 않는다)
function tokenHosts(cfg) {
  const out = {};
  for (const [kind, slot] of Object.entries(cfg.tokens || {})) {
    if (!slot || !slot.enc) continue;
    try { out[kind] = slot.base ? new URL(kind === 'github' ? 'https://github.com' : slot.base).host : ''; } catch { out[kind] = ''; }
  }
  return out;
}

// 저장 전에 확인할 필수 항목: 주소, 지금 칸에 쓸 수 있는 토큰, 담당자 ID
function missingRequired(cfg) {
  const out = [];
  if (!cfg.baseUrl) out.push('URL');
  if (!tokenSlot(cfg)) out.push('토큰');
  if (!(cfg.users || []).length) out.push('담당자 ID');
  return out;
}

// 예전 단일 토큰(tokenEnc)을 그때 설정의 칸으로 옮긴다
function migrateTokens(cfg) {
  if (!cfg.tokenEnc) return cfg;
  const { tokenEnc, ...rest } = cfg;
  const tokens = { ...(rest.tokens || {}) };
  const kind = tokenKind(rest);
  if (!tokens[kind]) tokens[kind] = { enc: tokenEnc, base: rest.baseUrl };
  return { ...rest, tokens };
}

// 위에서부터 첫 번째로 맞는 규칙 적용 (Merged → Approved → Reviewing → Draft)
// Approved: 승인 수가 필요 승인 수(최소 1)를 채운 경우. 파이프라인·충돌 여부는 카드의 표시 점으로만 보여준다.
// Reviewing: 작성자 본인이 아닌 사람이 단 댓글이 있는 경우 (reviewed)
function classify(mr, { approvedCount, pipeline, needed, reviewed }) {
  if (mr.state === 'merged') return 'merged';
  if (approvedCount >= Math.max(1, needed)) return 'ready';
  if (reviewed) return 'review';
  return 'draft';
}

module.exports = { GITHUB_API, normalizeBase, tokenKind, tokenSlot, tokenHosts, missingRequired, migrateTokens, classify };
