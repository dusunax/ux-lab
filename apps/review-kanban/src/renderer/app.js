// 렌더러: 토큰은 보지 못하고, 정제된 카드 데이터만 받는다. 외부 문자열은 textContent로만 넣는다.
const COLUMNS = [
  ['draft', 'Created'],
  ['review', 'Reviewing'],
  ['ready', 'Approved'],
  ['merged', 'Merged'],
];
const WARN_HOURS = 24; // 리뷰 대기 경고 기준 (기본 1일)
const MERGED_VISIBLE = 4; // Merged는 최신 4개만, 나머지는 아코디언

const $ = (id) => document.getElementById(id);
let mergedOpen = false;
let capH = 0; // 손잡이로 고정한 창 높이 (0이면 내용에 맞춘 자동 높이)
let prev = new Map(); // 카드 키 → updatedAt (변경 강조용)
let board = { lanes: [] };
let collapsed = false; // 축소 상태 (툴바만 표시)

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function icon(paths) {
  const s = document.createElementNS(SVG_NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('class', 'ic');
  for (const d of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    s.append(p);
  }
  return s;
}
// Lucide 아이콘 경로 (24x24, stroke) — 외부 의존성 없이 코드에 포함
const ICON_COMMENT = ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'];
const ICON_CHECK = ['M20 6 9 17l-5-5'];
const ICON_CLOCK = ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'M12 6v6l4 2'];
const ICON_REFRESH = ['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5'];
const ICON_SETTINGS = ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'];
const ICON_X = ['M18 6 6 18', 'm6 6 12 12'];
const ICON_DOWN = ['m6 9 6 6 6-6'];
const ICON_UP = ['m18 15-6-6-6 6'];
const ICON_COLLAPSE = ['m17 11-5-5-5 5', 'm17 18-5-5-5 5'];
const ICON_EXPAND = ['m7 6 5 5 5-5', 'm7 13 5 5 5-5'];

// 툴바 버튼: 문자 기호 대신 아이콘
$('btn-refresh').replaceChildren(icon(ICON_REFRESH));
$('btn-quit').replaceChildren(icon(ICON_X));

function age(iso) {
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  return { hours: h, label: h < 1 ? `${Math.max(1, Math.round(h * 60))}분` : h < 48 ? `${Math.round(h)}시간` : `${Math.round(h / 24)}일` };
}

function avatarEl(a) {
  if (a.avatar) {
    const img = el('img', 'avatar');
    img.src = a.avatar;
    img.alt = '';
    return img;
  }
  const name = a.name || a.username;
  const ini = el('span', 'avatar initial', name.slice(0, 1).toUpperCase());
  let h = 0;
  for (const ch of a.username) h = (h * 31 + ch.charCodeAt(0)) % 360;
  ini.style.background = `hsl(${h} 45% 52%)`; // 담당자별 고정 색
  return ini;
}

function cardEl(c) {
  const key = c.url;
  const warn = c.column === 'review' && c.waitSince && age(c.waitSince).hours >= WARN_HOURS;
  const changed = prev.size > 0 && prev.get(key) !== c.updatedAt;
  const d = el('div', `card${warn ? ' warn' : ''}${changed ? ' changed' : ''}`);
  d.title = c.title;
  const t = el('div', 't');
  t.append(el('span', 'iid', `!${c.iid}`), ` ${c.title}`); // 번호는 굵게, 제목은 텍스트 노드로 (외부 문자열)
  d.append(t);
  const m = el('div', 'm');
  if (c.pipeline) m.append(el('span', `dot ${c.pipeline}`));
  const cm = el('span', null, String(c.notes));
  cm.prepend(icon(ICON_COMMENT));
  m.append(cm);
  if (c.column !== 'merged' && c.needed > 0) { // 필요 승인 수가 0이면 승인 표시를 생략한다
    const ap = el('span', null, `${c.approvedCount}/${c.needed}`);
    ap.prepend(icon(ICON_CHECK));
    m.append(ap);
  }
  if (c.column === 'review' && c.waitSince) {
    const w = el('span', null, age(c.waitSince).label);
    w.prepend(icon(ICON_CLOCK));
    m.append(w);
  }
  const who = el('span', 'who');
  who.title = c.author.username;
  who.append(avatarEl(c.author), el('span', null, c.author.name || c.author.username));
  m.append(who);
  d.append(m);
  d.onclick = () => window.api.openUrl(c.url);
  return d;
}

function render() {
  const root = $('board');
  const scroll = {};
  root.querySelectorAll('.col').forEach((c) => { scroll[c.dataset.k] = c.querySelector('.cards').scrollTop; });
  root.replaceChildren();

  // 담당자 레인 없이 컬럼별로 합치고, 카드에 담당자를 붙인다
  const all = board.lanes.flatMap((l) => l.cards.map((c) => ({ ...c, author: { username: l.username, name: l.name, avatar: l.avatar } })));
  updateMini(all);
  const next = new Map();
  all.forEach((c) => next.set(c.url, c.updatedAt));

  for (const [k, label] of COLUMNS) {
    const cards = all.filter((c) => c.column === k).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const open = k === 'merged' && mergedOpen;
    const col = el('div', `col col-${k}${open ? ' open' : ''}`);
    col.dataset.k = k;
    const head = el('div', `colhead h-${k}`, label);
    head.append(el('span', 'cnt', String(cards.length)));
    col.append(head);
    const list = el('div', 'cards');
    const shown = k === 'merged' && !open ? cards.slice(0, MERGED_VISIBLE) : cards;
    shown.forEach((c) => list.append(cardEl(c)));
    col.append(list);
    if (k === 'merged' && cards.length > MERGED_VISIBLE) {
      const t = el('button', 'more', open ? '접기' : `${cards.length - MERGED_VISIBLE}개 더보기`);
      t.prepend(icon(open ? ICON_UP : ICON_DOWN));
      t.onclick = () => { mergedOpen = !mergedOpen; render(); };
      col.append(t);
    }
    root.append(col);
  }
  await_fit();
  root.querySelectorAll('.col').forEach((c) => { c.querySelector('.cards').scrollTop = scroll[c.dataset.k] || 0; });
  prev = next;
}

// 각 컬럼의 카드 목록 높이를 '온전히 보이는 카드 개수'만큼으로 맞춘다 (카드가 중간에 잘리지 않게)
function fitLists() {
  document.querySelectorAll('#board .cards').forEach((list) => {
    list.style.flex = '';
    list.style.height = '';
    const avail = list.clientHeight;
    if (list.scrollHeight <= avail + 1) return; // 다 들어가면 그대로
    let fit = 0;
    for (const card of list.children) {
      const bottom = card.offsetTop + card.offsetHeight + 8; // 아래 그림자 여백
      if (bottom > avail) break;
      fit = bottom;
    }
    if (fit > 0) { list.style.flex = 'none'; list.style.height = `${fit}px`; }
  });
}
window.addEventListener('resize', () => { if (!capH) fitLists(); });

// 창 높이를 내용에 맞춘다. 화면 한도(80%)를 넘는 컬럼은 '온전한 카드 개수'까지만 보이게 계산해서,
// 더보기 버튼 아래에 빈 여백이 남지 않게 창 높이를 정한다.
async function await_fit() {
  if (collapsed) return fitCollapsed();
  const board = $('board');
  if (board.hidden) return;
  const cols = [...board.querySelectorAll('.col')];
  if (capH) { // 고정 높이: 목록이 남는 공간을 채우고 안에서 스크롤
    cols.forEach((col) => { const l = col.querySelector('.cards'); l.style.flex = ''; l.style.height = ''; });
    await window.api.fit(capH);
    return;
  }
  const cap = Math.floor(window.screen.availHeight * 0.8);
  cols.forEach((col) => { const l = col.querySelector('.cards'); l.style.flex = 'none'; l.style.height = 'auto'; });
  const chrome = $('app').offsetHeight - board.offsetHeight; // 툴바·여백
  let target = 0;
  for (const col of cols) {
    const list = col.querySelector('.cards');
    let total = 0;
    for (const c of col.children) total += c.offsetHeight;
    total += (col.children.length > 2 ? 4 : 0) + 18; // 헤더·버튼 마진 + 패널 패딩·테두리
    const extra = total - list.scrollHeight;     // 목록을 뺀 나머지 높이
    const avail = cap - chrome - extra;
    let h = total;
    if (list.scrollHeight > avail) {
      let fit = 0;
      for (const card of list.children) {
        const bottom = card.offsetTop + card.offsetHeight + 8; // 아래 그림자 여백
        if (bottom > avail) break;
        fit = bottom;
      }
      h = extra + (fit || avail);
    }
    target = Math.max(target, h);
  }
  await window.api.fit(chrome + target);
  requestAnimationFrame(fitLists);
}

// 맨 아래 오류 줄: 보드 탭은 폴링 오류, 설정 탭은 저장을 눌렀을 때의 검증·저장 오류만 보여준다
let boardError = '';
let formError = '';
function renderError() {
  const msg = $('settings').hidden ? boardError : formError;
  $('error').hidden = !msg;
  $('error').textContent = msg;
  fitSettings(); // 오류 줄이 생기거나 사라지면 설정 화면 높이도 다시 맞춘다
}
function setFormError(msg) { formError = msg; renderError(); }

window.api.onBoard((data) => {
  board = data;
  boardError = data.error || '';
  $('status').classList.toggle('err', !!data.error);
  $('status').title = boardError; // 축소하면 오류 줄이 숨겨지므로 상태 점에 마우스를 올려 확인한다
  renderError();
  $('updated').textContent = data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : '--';
  render();
});

// 설정 화면
const PROVIDER_TEXT = {
  gitlab: { users: '담당자 GitLab ID (쉼표 또는 줄바꿈으로 구분)', url: 'GitLab URL', urlHint: 'http://gitlab.example.local', token: '개인 토큰 (api 스코프)', tokenHint: 'glpat-...' },
  github: { users: '담당자 GitHub ID (쉼표 또는 줄바꿈으로 구분)', url: 'Enterprise 주소 (브라우저로 접속하는 주소)', urlHint: 'https://github.example.com', token: 'Fine-grained 토큰 (PR·Checks 읽기)', tokenHint: 'github_pat_...' },
};
let savedLabel = ''; // 상단 표시: '저장됨: GitHub, github.com'. 저장된 설정이 없으면 ''
let tokenHosts = {}; // 토큰이 저장된 칸(gitlab·github·ghe) → 호스트
const GITHUB_API = 'https://api.github.com';
const ghHost = () => document.querySelector('input[name="gh-host"]:checked').value;
// 토큰 칸: GitLab · github.com · Enterprise를 따로 저장한다
const tokenKind = () => ($('f-provider').value !== 'github' ? 'gitlab' : ghHost() === 'cloud' ? 'github' : 'ghe');
function hostOf(url) { try { return new URL(url).host; } catch { return ''; } }
function setGhHost(v) { document.querySelector(`input[name="gh-host"][value="${v}"]`).checked = true; }
// 저장된 주소 → 입력칸. GitHub는 github.com이면 칸을 숨기고, Enterprise는 /api/v3를 뗀 웹 주소를 보여준다
function fillUrl(c) {
  if (c.provider !== 'github') { $('f-url').value = c.baseUrl; return; }
  const cloud = !c.baseUrl || c.baseUrl === GITHUB_API;
  setGhHost(cloud ? 'cloud' : 'enterprise');
  $('f-url').value = cloud ? '' : c.baseUrl.replace(/\/api\/v3$/, '');
}
function applyProvider() {
  const p = $('f-provider').value;
  const t = PROVIDER_TEXT[p];
  $('gh-host').hidden = p !== 'github';
  $('url-field').hidden = p === 'github' && ghHost() === 'cloud';
  $('saved-provider').hidden = !savedLabel;
  $('saved-provider').textContent = savedLabel;
  fitSettings();
  $('l-url').textContent = t.url;
  $('f-url').placeholder = t.urlHint;
  $('l-token').textContent = t.token;
  $('l-users').textContent = t.users;
  // 고른 칸(GitLab·github.com·Enterprise)에 저장된 토큰이 있을 때만 안내한다
  const host = tokenHosts[tokenKind()];
  $('f-token').placeholder = host != null ? `✅ 저장된 토큰 있음${host ? ` · ${host}` : ''} (변경 시 다시 입력)` : t.tokenHint;
  $('f-token').classList.toggle('has-token', host != null);
  $('req-token').hidden = host != null; // 저장된 토큰이 있으면 필수 아님
  $('f-token').setAttribute('aria-required', String(host == null));
}
// 제공자를 바꾸면 이전 주소가 다른 호스트로 저장되지 않게 비운다 (GitHub는 비워 두면 api.github.com)
$('f-provider').onchange = () => { $('f-url').value = ''; setGhHost('cloud'); applyProvider(); };
document.querySelectorAll('input[name="gh-host"]').forEach((r) => { r.onchange = applyProvider; });
const MISSING_PREFIX = '필수 항목을 입력하세요: ';
const isConfigured = (c) => !!(c.baseUrl && c.hasToken && c.users.length);

// 저장된 설정으로 폼을 채우고, 그 상태를 '변경 없음' 기준으로 삼는다
let savedForm = '';
function formState() {
  return JSON.stringify([
    $('f-provider').value,
    $('f-provider').value === 'github' ? ghHost() : '',
    $('f-url').value.trim(),
    $('f-users').value.split(/[\n,]+/).map((u) => u.trim()).filter(Boolean),
    String($('f-interval').value),
    String($('f-approvals').value),
  ]);
}
// 비어 있는 필수 항목: URL(github.com이면 없음), 토큰(그 칸에 저장된 토큰이 있으면 없음), 담당자 ID
function missingFields() {
  const out = [];
  if (!$('url-field').hidden && !$('f-url').value.trim()) out.push('URL');
  if (tokenHosts[tokenKind()] == null && !$('f-token').value) out.push('토큰');
  if (!$('f-users').value.split(/[\n,]+/).some((u) => u.trim())) out.push('담당자 ID');
  return out;
}
// 필수 항목이 채워졌고 저장할 변경(새 토큰 입력 포함)이 있을 때만 저장 버튼을 켠다
// 저장할 변경(새 토큰 입력 포함)이 있을 때만 저장 버튼을 켠다. 필수 항목 검사는 저장을 누를 때 한다
function updateDirty() {
  $('btn-save').disabled = formState() === savedForm && !$('f-token').value;
  // 검증 오류를 띄운 뒤 입력을 고치면 문구를 갱신하고, 다 채우면 지운다
  if (formError.startsWith(MISSING_PREFIX)) {
    const missing = missingFields();
    setFormError(missing.length ? MISSING_PREFIX + missing.join(', ') : '');
  }
}
function fillForm(c) {
  tokenHosts = c.tokenHosts || {};
  const gh = c.provider === 'github';
  const host = gh && c.baseUrl === GITHUB_API ? 'github.com' : hostOf(c.baseUrl);
  savedLabel = c.baseUrl ? `저장됨: ${gh ? 'GitHub' : 'GitLab'}, ${host}` : '';
  $('f-provider').value = c.provider;
  fillUrl(c);
  $('f-users').value = c.users.join('\n');
  $('f-interval').value = c.intervalSec;
  $('f-approvals').value = c.approvalsNeeded;
  $('f-token').value = '';
  applyProvider();
  savedForm = formState();
  updateDirty();
}
$('settings').addEventListener('input', updateDirty);
$('settings').addEventListener('change', updateDirty);

// 설정 화면은 잘리지 않게 창 높이를 폼 내용에 맞춘다 (화면 높이까지만)
async function fitSettings() {
  const s = $('settings');
  if (s.hidden || collapsed) return;
  const chrome = $('app').offsetHeight - s.offsetHeight; // 툴바·오류 줄·여백
  s.style.flex = 'none';
  s.style.height = 'auto';
  // 내용 높이는 소수점이 붙을 수 있어(GUI 배율·레티나) 정수로 반올림하면 1px 모자라 스크롤바가 생긴다 → 올림
  const h = Math.ceil(s.getBoundingClientRect().height);
  s.style.flex = '';
  s.style.height = '';
  await window.api.fit(chrome + h);
}

async function openSettings() {
  formError = '';
  fillForm(await window.api.getConfig());
  $('test-result').textContent = '';
}
async function showTab(name) {
  const settings = name === 'settings';
  if (settings === !$('settings').hidden) return;
  $('settings').hidden = !settings;
  $('board').hidden = settings;
  $('tab-board').classList.toggle('active', !settings);
  $('tab-settings').classList.toggle('active', settings);
  if (settings) await openSettings(); else render();
  renderError();
  requestAnimationFrame(refit); // 탭 전환 직후 높이 맞춤이 겹쳐도 한 프레임 뒤 다시 맞춘다
}
// 축소 중에 탭을 누르면 축소를 풀고 그 탭을 연다
function openTab(name) {
  if (collapsed) setCollapsed(false);
  showTab(name);
}
$('tab-board').onclick = () => openTab('board');
$('tab-settings').onclick = () => openTab('settings');
// 지금 폼 값 (저장·연결 테스트 공통)
function formInput() {
  return {
    provider: $('f-provider').value,
    baseUrl: $('f-provider').value === 'github' && ghHost() === 'cloud' ? '' : $('f-url').value, // 빈 값이면 api.github.com
    token: $('f-token').value,
    users: $('f-users').value.split(/[\n,]+/),
    intervalSec: $('f-interval').value,
    approvalsNeeded: $('f-approvals').value,
  };
}
async function saveForm() {
  const c = await window.api.saveConfig(formInput());
  if (c.error) throw new Error(c.error); // 유효하지 않으면 main이 저장하지 않고 이유만 돌려준다
  fillForm(c);
}
// 필수 항목이 비어 있으면 저장·테스트하지 않고 맨 아래 오류 줄에 알린다 (연결 테스트는 담당자 ID 불필요)
function checkRequired(forTest = false) {
  const missing = missingFields().filter((f) => !(forTest && f === '담당자 ID'));
  setFormError(missing.length ? MISSING_PREFIX + missing.join(', ') : '');
  return missing.length === 0;
}
$('btn-save').onclick = async () => {
  $('test-result').textContent = '';
  if (!checkRequired()) return;
  try {
    await saveForm();
    $('test-result').textContent = '✅ 저장됨';
  } catch (e) { setFormError(`저장 실패: ${e.message}`); }
};
$('btn-test').onclick = async () => {
  // 지금 폼 값으로 연결만 확인한다 (저장하지 않음)
  $('test-result').textContent = '';
  if (!checkRequired(true)) return;
  $('test-result').textContent = '확인 중…';
  const r = await window.api.testConnection(formInput());
  $('test-result').textContent = r.ok ? `연결 성공: ${r.username}` : `실패: ${r.error}`;
};
$('btn-refresh').onclick = () => window.api.refresh();
$('btn-quit').onclick = () => window.api.quit();
setInterval(render, 60000); // 경과 시간 갱신

// 오른쪽 아래 손잡이를 끌어 창 너비·최대 높이 조절 (화면 좌표 기준이라 창이 변해도 흔들리지 않는다)
(() => {
  const grip = $('grip');
  let start = null;
  const size = (e) => [start.w + (e.screenX - start.x), start.h + (e.screenY - start.y)];
  grip.addEventListener('pointerdown', (e) => {
    grip.setPointerCapture(e.pointerId);
    start = { x: e.screenX, y: e.screenY, w: window.innerWidth, h: window.innerHeight };
  });
  grip.addEventListener('pointermove', (e) => {
    if (start) window.api.resize(...size(e), false);
  });
  const end = (e) => {
    if (!start) return;
    const [w, h] = size(e);
    start = null;
    capH = Math.round(Math.max(200, h));
    window.api.resize(w, capH, true); // 놓은 높이로 고정하고 저장
    render();
  };
  grip.addEventListener('pointerup', end);
  grip.addEventListener('pointercancel', () => { start = null; });
  grip.addEventListener('dblclick', () => { // 더블클릭: 자동 높이로 복귀
    capH = 0;
    window.api.autoHeight();
    render();
  });
})();

// 설정이 비어 있으면 빈 보드 대신 설정 탭부터 보여준다
// 축소: 툴바만 남기고 컬럼별 개수 칩을 보여준다. 상태는 바로 저장한다
function updateMini(all) {
  $('mini').replaceChildren(...COLUMNS.map(([k, label]) => {
    const n = all.filter((c) => c.column === k).length;
    const chip = el('span', `chip c-${k}${n > 0 ? ' on' : ''}`, label);
    chip.append(el('span', 'n', String(n)));
    return chip;
  }));
}
async function fitCollapsed() {
  const cs = getComputedStyle($('app'));
  await window.api.fit($('bar').offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
}
function setCollapsed(v, save = true) {
  collapsed = v;
  $('app').classList.toggle('collapsed', v);
  $('mini').hidden = !v;
  $('btn-collapse').replaceChildren(icon(v ? ICON_EXPAND : ICON_COLLAPSE));
  $('btn-collapse').title = v ? '펼치기' : '축소';
  if (save) window.api.setPref('collapsed', v);
  if (v) fitCollapsed();
  else if (!$('settings').hidden) fitSettings();
  else render();
}
$('btn-collapse').onclick = () => setCollapsed(!collapsed);

// UI 크기: 고르면 main이 페이지 배율(여백·높이·아이콘 포함)과 창 너비를 바꾸고 저장한다 (연결 설정의 저장 버튼과 무관)
function showUiSize(size) {
  const r = document.querySelector(`input[name="ui-size"][value="${size}"]`);
  if (r) r.checked = true;
}
// 지금 화면에 맞게 창 높이를 다시 맞춘다
function refit() {
  if (collapsed) fitCollapsed();
  else if (!$('settings').hidden) fitSettings();
  else render();
}
document.querySelectorAll('input[name="ui-size"]').forEach((r) => {
  r.onchange = async () => {
    await window.api.setPref('uiSize', r.value);
    requestAnimationFrame(refit); // 배율이 반영된 뒤 높이를 다시 잰다
  };
});

window.api.getConfig().then((c) => {
  showUiSize(c.uiSize || 'm');
  setCollapsed(!!c.collapsed && isConfigured(c), false); // 설정이 비어 있으면 펼친 채로 설정 탭부터
  if (c.maxHeight) { capH = c.maxHeight; render(); }
  if (!isConfigured(c)) showTab('settings');
});
