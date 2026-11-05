const { app, BrowserWindow, ipcMain, shell, safeStorage, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const { normalizeBase, tokenKind, tokenSlot, tokenHosts, missingRequired, parseApprovals, migrateTokens } = require('./common');
const providers = { gitlab: require('./gitlab'), github: require('./github') };

const DEFAULTS = { provider: 'gitlab', baseUrl: '', users: [], intervalSec: 60, approvalsNeeded: 1, tokens: {}, bounds: null, maxHeight: 0, uiSize: 'm', collapsed: false };
const UI_PREFS = { uiSize: ['s', 'm', 'l'], collapsed: [true, false] };
// UI 크기: 글자뿐 아니라 여백·높이·아이콘까지 페이지 배율로 함께 조정한다
const ZOOM = { s: 0.85, m: 1, l: 1.2 };
const zoomOf = (cfg) => ZOOM[cfg.uiSize] || 1;
// 보드 4칸(110px씩)·간격·여백이 들어가는 최소 너비 (CSS px). 창 최소 너비는 여기에 배율을 곱한다
const MIN_CSS_W = 500;
function applyZoom(z) {
  win.webContents.setZoomFactor(z);
  const minW = Math.round(MIN_CSS_W * z);
  win.setMinimumSize(minW, 40);
  const [w, h] = win.getContentSize();
  if (w < minW) win.setContentSize(minW, h); // 배율이 커져 내용이 잘리지 않게 넓힌다
}
let win;
let timer = null;
let failures = 0;
let lastBoard = null;

const cfgPath = () => path.join(app.getPath('userData'), 'config.json');

// 예전 이름(mr-kanban)으로 저장한 설정을 한 번만 옮긴다. 토큰은 키체인 항목이 앱 이름을 따르므로
// 새 이름으로는 풀 수 없어 옮기지 않는다 (처음 한 번 다시 입력)
function migrateLegacyConfig() {
  const legacy = path.join(app.getPath('appData'), 'mr-kanban', 'config.json');
  if (fs.existsSync(cfgPath()) || !fs.existsSync(legacy)) return;
  try {
    const { tokens, tokenEnc, ...rest } = JSON.parse(fs.readFileSync(legacy, 'utf8'));
    fs.mkdirSync(path.dirname(cfgPath()), { recursive: true });
    saveCfg(rest);
  } catch { /* 옮기지 못하면 새 설정으로 시작 */ }
}
function loadCfg() {
  try {
    const { fontSize, ...saved } = JSON.parse(fs.readFileSync(cfgPath(), 'utf8'));
    if (fontSize && !saved.uiSize) saved.uiSize = fontSize; // 예전 '글자 크기' 설정을 UI 크기로 옮긴다
    return migrateTokens({ ...DEFAULTS, ...saved });
  } catch { return { ...DEFAULTS }; }
}
function saveCfg(cfg) { fs.writeFileSync(cfgPath(), JSON.stringify(cfg, null, 2), { mode: 0o600 }); }

// 토큰은 safeStorage(OS 키체인)로만 암호화 저장. 렌더러에는 절대 넘기지 않는다.
// GitLab · github.com · Enterprise 칸이 따로 있고, 지금 설정에 맞는 칸만 쓴다.
function readToken(cfg) {
  const slot = tokenSlot(cfg);
  if (!slot || !safeStorage.isEncryptionAvailable()) return '';
  try { return safeStorage.decryptString(Buffer.from(slot.enc, 'base64')); } catch { return ''; }
}
function publicCfg(cfg) {
  const { tokens, bounds, ...rest } = cfg;
  return { ...rest, hasToken: !!tokenSlot(cfg), tokenHosts: tokenHosts(cfg) };
}

const client = (cfg) => providers[cfg.provider] || providers.gitlab;
// PR·MR 링크를 열어도 되는 웹 주소 (GitHub는 API 주소와 웹 주소가 다르다)
const webBase = (cfg) => (cfg.provider === 'github' ? providers.github.webBase(cfg.baseUrl) : cfg.baseUrl);

function send(ch, payload) { if (win && !win.isDestroyed()) win.webContents.send(ch, payload); }

async function poll() {
  clearTimeout(timer);
  const cfg = loadCfg();
  const token = readToken(cfg);
  let delay = Math.max(30, Math.min(300, cfg.intervalSec)) * 1000;
  if (!cfg.baseUrl || !token || cfg.users.length === 0) {
    send('board:update', { error: '설정에서 URL·토큰·담당자를 입력하세요.', lanes: [] });
  } else {
    try {
      lastBoard = await client(cfg).fetchBoard(cfg, token);
      failures = 0;
      send('board:update', lastBoard);
    } catch (e) {
      failures += 1;
      delay = Math.min(300000, delay * 2 ** failures); // 429/5xx 포함 지수 백오프
      send('board:update', { ...(lastBoard || { lanes: [] }), error: e.message });
    }
  }
  timer = setTimeout(poll, delay);
}

function createWindow() {
  const cfg = loadCfg();
  win = new BrowserWindow({
    width: cfg.bounds?.width || 560,
    height: cfg.bounds?.height || 340,
    x: cfg.bounds?.x,
    y: cfg.bounds?.y,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setAlwaysOnTop(true, 'floating');
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.on('did-finish-load', () => applyZoom(zoomOf(loadCfg())));
  const saveBounds = () => { const c = loadCfg(); c.bounds = win.getBounds(); saveCfg(c); };
  win.on('moved', saveBounds);
  win.on('resized', saveBounds);
  // 외부 이동 차단: 링크는 항상 기본 브라우저로
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

ipcMain.handle('config:get', () => publicCfg(loadCfg()));
// 폼 입력(토큰 제외)을 설정에 반영한다. 저장과 연결 테스트가 같은 규칙으로 해석하도록 한곳에 둔다
function applyInput(cfg, input) {
  if (input.provider in providers) cfg.provider = input.provider;
  if (typeof input.baseUrl === 'string') {
    const url = input.baseUrl.trim();
    if (cfg.provider === 'github') cfg.baseUrl = providers.github.apiBase(url);
    else cfg.baseUrl = url ? normalizeBase(url) : '';
  }
  if (Array.isArray(input.users)) cfg.users = [...new Set(input.users.map((u) => String(u).trim()).filter(Boolean))];
  cfg.intervalSec = Math.max(30, Math.min(300, Number(input.intervalSec) || 60));
  cfg.approvalsNeeded = parseApprovals(input.approvalsNeeded);
  return cfg;
}

ipcMain.handle('config:save', (_e, input) => {
  const cfg = loadCfg();
  const before = `${cfg.provider}|${cfg.baseUrl}`;
  applyInput(cfg, input);
  if (input.token) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('OS 키체인을 사용할 수 없어 토큰을 저장하지 않습니다.');
    cfg.tokens = { ...cfg.tokens, [tokenKind(cfg)]: { enc: safeStorage.encryptString(input.token).toString('base64'), base: cfg.baseUrl } };
  }
  // 필수 항목이 빠진 설정은 파일에 쓰지 않는다 (기존 설정 유지)
  const missing = missingRequired(cfg);
  if (missing.length) return { error: `필수 항목이 비어 있어 저장하지 않았습니다: ${missing.join(', ')}` };
  if (`${cfg.provider}|${cfg.baseUrl}` !== before) lastBoard = null; // 다른 저장소의 카드가 남지 않게
  saveCfg(cfg);
  poll();
  return publicCfg(cfg);
});
// 연결 테스트: 지금 폼 값으로 연결만 확인하고 저장하지 않는다.
// 토큰을 새로 입력하지 않았으면 그 칸(같은 주소)에 저장된 토큰을 쓴다.
ipcMain.handle('config:test', async (_e, input) => {
  try {
    const cfg = applyInput(loadCfg(), input || {});
    const token = (input && input.token) || readToken(cfg);
    if (!cfg.baseUrl || !token) return { ok: false, error: `필수 항목: ${[!cfg.baseUrl && 'URL', !token && '토큰'].filter(Boolean).join(', ')}` };
    return { ok: true, ...(await client(cfg).testConnection(cfg, token)) };
  } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('board:refresh', () => poll());
ipcMain.handle('open:url', (_e, url) => {
  const cfg = loadCfg();
  // 설정한 저장소 호스트의 MR·PR만 연다
  if (cfg.baseUrl && typeof url === 'string' && url.startsWith(webBase(cfg) + '/')) return shell.openExternal(url);
});
// 렌더러가 보내는 크기는 CSS px이라 UI 배율을 곱해 창 크기(DIP)로 바꾼다
const zoom = () => win.webContents.getZoomFactor();
// 창 높이를 내용에 맞춘다 (한도는 렌더러가 정하고, 여기서는 작업 영역 높이까지만 허용)
ipcMain.handle('win:fit', (_e, h) => {
  if (!win || win.isDestroyed()) return;
  const wa = screen.getDisplayMatching(win.getBounds()).workArea;
  // 배율을 곱한 값을 반올림하면 내용보다 1px 작아져 스크롤바가 생길 수 있어 올림한다. 축소하면 툴바 높이까지 줄어든다
  const H = Math.ceil(Math.max(40, Math.min((Number(h) || 0) * zoom(), wa.height)));
  const [w, cur] = win.getContentSize();
  if (Math.abs(cur - H) > 1) win.setContentSize(w, H);
});
// 크기 조절 손잡이: 너비·높이를 그대로 반영하고, 놓은 높이는 고정 높이로 저장한다
let saveTimer = null;
ipcMain.handle('win:resize', (_e, w, h, final) => {
  if (!win || win.isDestroyed()) return;
  const wa = screen.getDisplayMatching(win.getBounds()).workArea;
  const z = zoom();
  const W = Math.round(Math.max(MIN_CSS_W * z, Math.min((Number(w) || 0) * z, wa.width)));
  const H = Math.round(Math.max(200, Math.min((Number(h) || 0) * z, wa.height)));
  win.setContentSize(W, H);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const c = loadCfg();
    c.bounds = win.getBounds();
    if (final) c.maxHeight = Math.round(H / z); // 고정 높이는 CSS px로 저장 (배율이 바뀌어도 같은 내용 높이)
    saveCfg(c);
  }, 300);
});
// 화면 설정(UI 크기·축소)은 연결 설정과 별개로 바로 저장한다 (정해진 키·값만 허용)
ipcMain.handle('ui:pref', (_e, key, value) => {
  if (!(key in UI_PREFS) || !UI_PREFS[key].includes(value)) return;
  const c = loadCfg();
  const before = zoomOf(c);
  c[key] = value;
  if (key === 'uiSize' && win && !win.isDestroyed()) {
    // 배율을 바꾸고 창 너비도 같은 비율로 맞춘다 (높이는 렌더러가 내용에 맞춰 다시 정한다)
    const after = zoomOf(c);
    const [w, h] = win.getContentSize();
    win.setContentSize(Math.round(w * after / before), h);
    applyZoom(after);
    c.bounds = win.getBounds();
  }
  saveCfg(c);
});
ipcMain.handle('win:autoheight', () => { const c = loadCfg(); c.maxHeight = 0; saveCfg(c); });
ipcMain.handle('win:close', () => app.quit());

// 렌더러가 로드되기 전에 보낸 결과는 사라지므로, 로드가 끝날 때마다(처음 실행·새로고침) 바로 한 번 받아온다
app.whenReady().then(() => { migrateLegacyConfig(); createWindow(); win.webContents.on('did-finish-load', poll); });
app.on('window-all-closed', () => app.quit());
