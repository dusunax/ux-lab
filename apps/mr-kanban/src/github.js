// GitHub REST 클라이언트. main 프로세스에서만 사용한다(토큰 격리).
// 카드 모양은 gitlab.js와 같아서 렌더러는 제공자를 구분하지 않는다.
const { GITHUB_API, normalizeBase, classify } = require('./common');

const AVATAR_ORIGIN = 'https://avatars.githubusercontent.com';

// 설정에 입력한 주소 → API 주소. 빈 값·github.com은 api.github.com, Enterprise 웹 주소에는 /api/v3를 붙인다
function apiBase(input) {
  if (!input) return GITHUB_API;
  const base = normalizeBase(input);
  const host = new URL(base).hostname;
  if (host === 'github.com' || host === 'api.github.com') return GITHUB_API;
  return /\/api\/v3$/.test(base) ? base : `${base}/api/v3`;
}

// API 주소 → PR 웹 주소. github.com은 api.github.com, Enterprise는 https://호스트/api/v3
function webBase(apiBase) {
  const u = new URL(normalizeBase(apiBase));
  if (u.hostname === 'api.github.com') return 'https://github.com';
  return u.origin + u.pathname.replace(/\/api\/v3$/, '').replace(/\/+$/, '');
}

async function api(cfg, token, path, params) {
  const url = new URL(`${normalizeBase(cfg.baseUrl)}${path}`);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  if (!res.ok) {
    const err = new Error(`GitHub ${res.status} ${path}`); // 토큰·헤더는 메시지에 넣지 않는다
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function testConnection(cfg, token) {
  const me = await api(cfg, token, '/user');
  return { username: me.login, name: me.name };
}

// 리뷰어별 마지막 결론(APPROVED·CHANGES_REQUESTED·DISMISSED)만 세어, 지금 승인 상태인 사람 수
function approvedCount(reviews, authorId) {
  const last = new Map();
  for (const r of reviews || []) {
    if (!r.user || r.user.id === authorId) continue;
    if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(r.state)) last.set(r.user.id, r.state);
  }
  return [...last.values()].filter((s) => s === 'APPROVED').length;
}

// 작성자 본인과 봇을 뺀 다른 사람의 댓글·리뷰를 시각순으로 (리뷰 본문 없는 승인도 리뷰 활동으로 본다)
function reviewerActivity(comments, reviews, authorId) {
  const other = (u) => u && u.id !== authorId && u.type !== 'Bot';
  return [
    ...(comments || []).filter((c) => other(c.user)).map((c) => c.created_at),
    ...(reviews || []).filter((r) => other(r.user) && r.state !== 'PENDING' && r.submitted_at).map((r) => r.submitted_at),
  ].sort();
}

// check-run 목록 → 카드 점 색 (GitLab 파이프라인 상태 이름에 맞춘다)
function checkStatus(runs) {
  if (!runs || runs.length === 0) return null;
  if (runs.some((r) => ['failure', 'cancelled', 'timed_out', 'action_required'].includes(r.conclusion))) return 'failed';
  if (runs.some((r) => r.status !== 'completed')) return 'running';
  return 'success';
}

async function buildCard(cfg, token, item) {
  const repo = item.repository_url.replace(/^.*\/repos\//, '');
  const card = {
    iid: item.number,
    title: item.title,
    url: item.html_url,
    repo,
    notes: item.comments || 0,
    updatedAt: item.updated_at,
    pipeline: null,
    approvedCount: 0,
    needed: cfg.approvalsNeeded,
    waitSince: null,
  };
  if (item.pull_request && item.pull_request.merged_at) {
    card.column = 'merged';
    return card;
  }
  const base = `/repos/${repo}`;
  const authorId = item.user && item.user.id;
  const [pr, reviews, issueComments, reviewComments] = await Promise.all([
    api(cfg, token, `${base}/pulls/${item.number}`),
    api(cfg, token, `${base}/pulls/${item.number}/reviews`, { per_page: 100 }).catch(() => []),
    item.comments > 0 ? api(cfg, token, `${base}/issues/${item.number}/comments`, { per_page: 100 }).catch(() => []) : Promise.resolve([]),
    api(cfg, token, `${base}/pulls/${item.number}/comments`, { per_page: 100 }).catch(() => []),
  ]);
  const checks = await api(cfg, token, `${base}/commits/${pr.head.sha}/check-runs`, { per_page: 100 }).catch(() => ({ check_runs: [] }));
  const activity = reviewerActivity([...issueComments, ...reviewComments], reviews, authorId);
  card.notes = (pr.comments || 0) + (pr.review_comments || 0);
  card.pipeline = checkStatus(checks.check_runs);
  card.approvedCount = approvedCount(reviews, authorId);
  card.column = classify({ state: 'opened' }, {
    approvedCount: card.approvedCount,
    pipeline: card.pipeline,
    needed: cfg.approvalsNeeded,
    reviewed: activity.length > 0,
  });
  if (card.column === 'review') card.waitSince = activity[0]; // 첫 리뷰 활동 시각
  return card;
}

// 아바타: GitHub 아바타 호스트(또는 Enterprise 자기 호스트)만 받아 data URL로 변환
const profileCache = new Map();
async function getProfile(cfg, token, username) {
  const key = `${cfg.baseUrl}|${username}`;
  if (profileCache.has(key)) return profileCache.get(key);
  const result = { avatar: null, name: null };
  try {
    const u = await api(cfg, token, `/users/${encodeURIComponent(username)}`);
    result.name = u.name || null;
    if (u.avatar_url) {
      const src = new URL(u.avatar_url);
      const own = src.origin === new URL(webBase(cfg.baseUrl)).origin;
      if (src.origin === AVATAR_ORIGIN || own) {
        src.searchParams.set('s', '48');
        // 토큰은 Enterprise 자기 호스트에만 보낸다
        const res = await fetch(src, own ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
        const type = res.headers.get('content-type') || '';
        if (res.ok && type.startsWith('image/')) {
          result.avatar = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
        }
      }
    }
  } catch { /* 아바타 실패는 무시하고 이니셜로 대체 */ }
  profileCache.set(key, result);
  return result;
}

async function fetchBoard(cfg, token) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, 'Z');
  const lanes = [];
  for (const username of cfg.users) {
    // 검색 API는 분당 30회 한도라 담당자당 2회만 쓴다
    const [opened, merged] = await Promise.all([
      api(cfg, token, '/search/issues', { q: `is:pr is:open author:${username}`, per_page: 50 }),
      api(cfg, token, '/search/issues', { q: `is:pr is:merged author:${username} merged:>=${since}`, per_page: 50 }),
    ]);
    const cards = await Promise.all([...opened.items, ...merged.items].map((item) => buildCard(cfg, token, item)));
    lanes.push({ username, cards, ...(await getProfile(cfg, token, username)) });
  }
  return { lanes, updatedAt: new Date().toISOString() };
}

module.exports = { fetchBoard, testConnection, apiBase, webBase, approvedCount, reviewerActivity, checkStatus };
