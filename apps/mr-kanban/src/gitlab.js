// GitLab REST v4 클라이언트. main 프로세스에서만 사용한다(토큰 격리).
const { normalizeBase, classify } = require('./common');

async function api(cfg, token, path, params) {
  const url = new URL(`${normalizeBase(cfg.baseUrl)}/api/v4${path}`);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'PRIVATE-TOKEN': token } });
  if (!res.ok) {
    const err = new Error(`GitLab ${res.status} ${path}`); // 토큰·헤더는 메시지에 넣지 않는다
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function testConnection(cfg, token) {
  const me = await api(cfg, token, '/user');
  return { username: me.username, name: me.name };
}

// 시스템 노트와 작성자 본인 댓글을 제외한, 다른 사람의 댓글 목록
function reviewerNotes(notes, authorId) {
  return (notes || []).filter((n) => !n.system && n.author && n.author.id !== authorId);
}

async function buildCard(cfg, token, mr) {
  const base = `/projects/${mr.project_id}/merge_requests/${mr.iid}`;
  const card = {
    iid: mr.iid,
    title: mr.title,
    url: mr.web_url,
    repo: (mr.references && mr.references.full ? mr.references.full.replace(/!\d+$/, '') : ''),
    notes: mr.user_notes_count || 0,
    updatedAt: mr.updated_at,
    pipeline: null,
    approvedCount: 0,
    needed: cfg.approvalsNeeded,
    waitSince: null,
  };
  if (mr.state === 'merged') {
    card.column = 'merged';
    return card;
  }
  const [detail, appr, notes] = await Promise.all([
    api(cfg, token, base),
    api(cfg, token, `${base}/approvals`).catch(() => ({ approved_by: [] })),
    mr.user_notes_count > 0
      ? api(cfg, token, `${base}/notes`, { sort: 'asc', order_by: 'created_at', per_page: 100 }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const others = reviewerNotes(notes, mr.author && mr.author.id);
  card.pipeline = detail.head_pipeline ? detail.head_pipeline.status : null;
  card.approvedCount = (appr.approved_by || []).length;
  card.column = classify(detail, {
    approvedCount: card.approvedCount,
    pipeline: card.pipeline,
    needed: cfg.approvalsNeeded,
    reviewed: others.length > 0,
  });
  if (card.column === 'review') card.waitSince = others[0].created_at; // 첫 리뷰 댓글 시각
  return card;
}

// 아바타: 설정한 GitLab 업로드 경로만 받아 data URL로 변환 (외부 호스트·gravatar는 건너뜀)
const profileCache = new Map();
async function getProfile(cfg, token, username) {
  const key = `${cfg.baseUrl}|${username}`;
  if (profileCache.has(key)) return profileCache.get(key);
  const result = { avatar: null, name: null };
  try {
    const [u] = await api(cfg, token, '/users', { username });
    if (u) result.name = u.name || null;
    if (u && u.avatar_url) {
      const p = new URL(u.avatar_url, normalizeBase(cfg.baseUrl));
      if (p.pathname.startsWith('/uploads/')) {
        const src = new URL(normalizeBase(cfg.baseUrl));
        src.pathname = p.pathname;
        src.searchParams.set('width', '48');
        const res = await fetch(src, { headers: { 'PRIVATE-TOKEN': token } });
        const type = res.headers.get('content-type') || '';        if (res.ok && type.startsWith('image/')) {
          result.avatar = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
        }
      }
    }
  } catch { /* 아바타 실패는 무시하고 이니셜로 대체 */ }
  profileCache.set(key, result);
  return result;
}

async function fetchBoard(cfg, token) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const lanes = [];
  for (const username of cfg.users) {
    const [opened, merged] = await Promise.all([
      api(cfg, token, '/merge_requests', { scope: 'all', state: 'opened', author_username: username, per_page: 50 }),
      api(cfg, token, '/merge_requests', { scope: 'all', state: 'merged', author_username: username, updated_after: since, per_page: 50 }),
    ]);
    const cards = await Promise.all([...opened, ...merged].map((mr) => buildCard(cfg, token, mr)));
    lanes.push({ username, cards, ...(await getProfile(cfg, token, username)) });
  }
  return { lanes, updatedAt: new Date().toISOString() };
}

module.exports = { fetchBoard, testConnection, reviewerNotes };
