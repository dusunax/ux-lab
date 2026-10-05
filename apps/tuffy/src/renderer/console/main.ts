import '@fontsource/silkscreen/400.css';
import '@fontsource/nanum-gothic-coding/400.css';
import '@fontsource/nanum-gothic-coding/700.css';
import './console.css';
import { SIMULATABLE, type MicStats, type Simulatable, type SttEvent } from '../../shared/ipc';
import { MIC_DBFS } from '../../shared/state';
import { LOG_TAGS, isEngine, type BodyState, type CortexOutput, type Emotion, type LogLine, type LogTag, type Usage } from '../../shared/state';

const BARS_MAX = 4;

const LOG_MAX = 140;
const STT_MAX = 5;
/** 미터 눈금 범위 (dBFS) */
const DB_FLOOR = -80;
const MIC_STALE_MS = 1500;
const TYPE_MS_PER_CHAR = 18;
const COLORS: Record<Emotion, string> = {
  calm: '#6fe7ff', curious: '#ffc857', amaze: '#ff6fb5', worried: '#ff8a5b', sleepy: '#8c9bff', focus: '#7cffb2',
};

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const logBox = $('#log');
/** 맨 위(최신)를 보고 있을 때만 새 줄로 따라간다. 아래 기록을 읽는 중이면 화면을 움직이지 않는다 */
const FOLLOW_PX = 40;
const followLatest = () => { if (logBox.scrollTop < FOLLOW_PX) logBox.scrollTop = 0; };

/** 로그 필터: 끈 태그 + 검색어. 보는 사람 편의 설정이라 localStorage에만 둔다 */
const FILTER_KEY = 'tuffy.logFilter';
const filter = { off: new Set<LogTag>(), q: '' };

function loadFilter() {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTER_KEY) ?? 'null') as { off?: unknown; q?: unknown } | null;
    if (Array.isArray(saved?.off)) saved.off.forEach((t) => (LOG_TAGS as readonly unknown[]).includes(t) && filter.off.add(t as LogTag));
    if (typeof saved?.q === 'string') filter.q = saved.q;
  } catch {
    // 저장된 필터가 없거나 읽을 수 없으면 전체 보기
  }
}

function saveFilter() {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify({ off: [...filter.off], q: filter.q }));
  } catch {
    // 저장 실패 시 이번 창에서만 유지
  }
}

const matches = (row: HTMLElement) => {
  if (filter.off.has(row.dataset.tag as LogTag)) return false;
  const q = filter.q.trim().toLowerCase();
  return !q || (row.dataset.text ?? '').toLowerCase().includes(q);
};

function updateCount() {
  const rows = [...logBox.children] as HTMLElement[];
  const shown = rows.filter((r) => !r.hidden).length;
  const filtered = filter.off.size > 0 || filter.q.trim() !== '';
  $('#logCount').textContent = filtered ? `${shown} / ${rows.length}줄` : `${rows.length}줄`;
}

function applyFilter() {
  for (const row of logBox.children as HTMLCollectionOf<HTMLElement>) row.hidden = !matches(row);
  document.querySelectorAll<HTMLButtonElement>('.tag-chip').forEach((b) =>
    b.setAttribute('aria-pressed', String(!filter.off.has(b.dataset.tag as LogTag))));
  updateCount();
  saveFilter();
}

function initFilter() {
  loadFilter();
  const box = $('#logTags');
  for (const tag of LOG_TAGS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `tag-chip t-${tag.toLowerCase()}`;
    chip.dataset.tag = tag;
    chip.textContent = tag;
    chip.title = `${tag} 보이기/숨기기 (Alt+클릭: 이것만 보기)`;
    chip.addEventListener('click', (e) => {
      if (e.altKey) {
        // 이 태그만 보기
        LOG_TAGS.forEach((t) => (t === tag ? filter.off.delete(t) : filter.off.add(t)));
      } else if (filter.off.has(tag)) filter.off.delete(tag);
      else filter.off.add(tag);
      applyFilter();
    });
    box.appendChild(chip);
  }
  const search = $<HTMLInputElement>('#logSearch');
  search.value = filter.q;
  search.addEventListener('input', () => {
    filter.q = search.value;
    applyFilter();
  });
  $('#logReset').addEventListener('click', () => {
    filter.off.clear();
    filter.q = '';
    search.value = '';
    applyFilter();
  });
  applyFilter();
}

/** 타자 효과는 순서대로 하나씩. 다음 줄이 앞줄을 앞지르지 않게 체인으로 잇는다 */
let typing = Promise.resolve();

function appendLog(line: LogLine) {
  const row = document.createElement('div');
  row.className = `ln${line.dim ? ' dim' : ''}`;
  const time = document.createElement('time');
  time.textContent = new Date(line.at).toTimeString().slice(0, 8);
  const tag = document.createElement('b');
  tag.className = `tag t-${line.tag.toLowerCase()}`;
  tag.textContent = line.tag;
  const text = document.createElement('span');
  row.append(time, tag, text);
  // 검색은 타자 효과가 끝나기 전에도 전체 문장으로 한다
  row.dataset.tag = line.tag;
  row.dataset.text = `${line.tag} ${line.text}`;
  row.hidden = !matches(row);
  // 최신 줄이 맨 위 (desc)
  logBox.prepend(row);
  while (logBox.children.length > LOG_MAX) logBox.lastChild?.remove();
  updateCount();

  if (!line.typing) {
    text.textContent = line.text;
    followLatest();
    return;
  }
  typing = typing.then(async () => {
    text.classList.add('cursor');
    for (let i = 1; i <= line.text.length; i++) {
      text.textContent = line.text.slice(0, i);
      followLatest();
      await new Promise((r) => setTimeout(r, TYPE_MS_PER_CHAR));
    }
    text.classList.remove('cursor');
  });
}

function renderBody(b: BodyState) {
  document.documentElement.style.setProperty('--emo', COLORS[b.emotion]);
  $('#mEmo').textContent = b.emotion.toUpperCase();
  $('#mMotion').textContent = b.thinking ? 'THINK…' : b.motion.toUpperCase();
  $('#bEnergy').style.width = `${Math.round(b.energy * 100)}%`;
  $('#mTurns').textContent = String(b.turns);
}

/** 확률 막대 목록. picked는 실제로 고른 항목 */
function bars(box: HTMLElement, probs: Record<string, number>, picked?: string) {
  const rows = Object.entries(probs).sort((a, b) => b[1] - a[1]).slice(0, BARS_MAX).map(([k, p]) => {
    const row = document.createElement('div');
    row.className = `pbar${k === picked ? ' on' : ''}`;
    const name = document.createElement('span');
    name.textContent = k;
    const track = document.createElement('i');
    const fill = document.createElement('b');
    fill.style.width = `${Math.round(p * 100)}%`;
    track.appendChild(fill);
    const pct = document.createElement('span');
    pct.textContent = p.toFixed(2);
    row.append(name, track, pct);
    return row;
  });
  box.replaceChildren(...rows);
}

function renderCortex(o: CortexOutput) {
  $('#json').textContent = JSON.stringify(o, null, 2);
  const d = o.decision;
  const panel = $('#decision');
  // 본능 판단(LLM 안 씀)이면 마지막 LLM 판단을 흐리게 남겨 둔다
  if (!d) {
    if (!panel.hidden) {
      panel.dataset.stale = 'true';
      $('#decEngine').textContent = `이번엔 본능 판단 (${o.source}) · 아래는 마지막 LLM 판단`;
    }
    return;
  }
  panel.hidden = false;
  panel.dataset.stale = 'false';
  $('#decEngine').textContent = `${d.engine} · 말할까 ${d.speak.toFixed(2)}`;
  const { concern, joy, curiosity } = d.appraisal;
  bars($('#decAppraisal'), { 걱정: concern, 기쁨: joy, 궁금: curiosity });
  bars($('#decEmotion'), d.emotion, o.emotion);
  bars($('#decMotion'), d.motion, o.motion);
}

const dbPct = (db: number) => `${Math.min(100, Math.max(0, ((db - DB_FLOOR) / -DB_FLOOR) * 100))}%`;
const VAD_LABEL: Record<MicStats['vad'], string> = { quiet: '조용', voice: '말소리', hum: '허밍', recording: '녹음 중' };

/** 판단 기준선: 미터 위 세로선 + 아래 라벨 */
function drawMicMarks() {
  const marks: { db: number; label: string; color: string; side: string; id?: string }[] = [
    // 음정·말소리 기준선은 3dB 차이라 라벨을 선의 왼쪽/오른쪽으로 갈라 붙인다
    { db: MIC_DBFS.pitch, label: '음정', color: 'var(--violet)', side: 'left' },
    { db: MIC_DBFS.speech, label: '말소리', color: 'var(--cyan)', side: 'right', id: 'speech' },
    { db: MIC_DBFS.loud, label: '큰 소리', color: '#ff5b5b', side: 'center' },
  ];
  for (const m of marks) {
    const line = document.createElement('i');
    line.className = 'mark';
    line.style.left = dbPct(m.db);
    line.style.color = m.color;
    if (m.id) line.id = `mark-${m.id}`;
    $('#micTrack').appendChild(line);
    const tag = document.createElement('span');
    tag.style.left = dbPct(m.db);
    tag.dataset.side = m.side;
    tag.style.color = m.color;
    tag.textContent = m.side === 'left' ? `${m.label} ${m.db} ` : ` ${m.label} ${m.db}`;
    if (m.id) tag.id = `tag-${m.id}`;
    $('#micRuler').appendChild(tag);
  }
}

let micSeenAt = 0;
function renderMic(s: MicStats) {
  micSeenAt = Date.now();
  $('#mic').dataset.on = 'true';
  $('#micDevice').textContent = `${s.device} · ${s.rate / 1000}kHz`;
  const vad = $('#micVad');
  vad.dataset.vad = s.vad;
  vad.textContent = VAD_LABEL[s.vad];
  $('#micFill').style.width = dbPct(s.rmsDb);
  $('#micPeak').style.left = dbPct(s.peakDb);
  $('#micRead').textContent = `레벨 ${s.rmsDb}dB · 피크 ${s.peakDb}dB · 음높이 ${s.hz ? `${s.hz}Hz` : '—'} · 소음 ${s.floorDb}dB → 말소리 기준 ${s.thresholdDb}dB`;
  // 말소리 기준선은 주변 소음에 따라 움직인다
  $('#mark-speech').style.left = dbPct(s.thresholdDb);
  $('#tag-speech').style.left = dbPct(s.thresholdDb);
  $('#tag-speech').textContent = ` 말소리 ${s.thresholdDb}`;
}

function renderMicOff() {
  $('#mic').dataset.on = 'false';
  $('#micDevice').textContent = '마이크 꺼짐';
  $('#micVad').dataset.vad = 'off';
  $('#micVad').textContent = 'OFF';
  $('#micFill').style.width = '0';
  $('#micRead').textContent = '—';
}

function renderStt(e: SttEvent) {
  const list = $('#stt');
  let row = list.querySelector<HTMLLIElement>(`[data-id="${e.id}"]`);
  if (!row) {
    row = document.createElement('li');
    row.dataset.id = String(e.id);
    list.prepend(row);
    while (list.children.length > STT_MAX) list.lastElementChild?.remove();
  }
  row.dataset.phase = e.phase;
  const when = document.createElement('b');
  when.textContent = new Date(e.at).toTimeString().slice(0, 8);
  const body = document.createElement('span');
  const text = document.createElement('span');
  text.className = 'text';
  text.textContent = e.text ? `"${e.text}"` : `${e.sec}s 음성`;
  const verdict = document.createElement('span');
  verdict.className = 'verdict';
  verdict.textContent = [e.verdict, e.ms ? `${e.sec}s 음성 · ${e.ms}ms` : ''].filter(Boolean).join(' · ');
  body.append(text, verdict);
  row.replaceChildren(when, body);
}

function bindToggle(btn: HTMLButtonElement, label: string, initial: boolean, send: (on: boolean) => unknown) {
  const paint = (on: boolean) => {
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = `${label} ${on ? '켜짐' : '꺼짐'}`;
  };
  paint(initial);
  btn.addEventListener('click', async () => {
    const want = btn.getAttribute('aria-pressed') !== 'true';
    const result = await send(want);
    paint(typeof result === 'boolean' ? result : want);
  });
}

/** 엔진 선택 버튼과 오늘 사용량 (무료 호출 수, jev 비용) */
function renderUsage(u: Usage) {
  document.querySelectorAll<HTMLButtonElement>('.seg').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.engine === u.engine));
    if (b.dataset.engine === 'jev') {
      b.disabled = !u.jevAvailable;
      b.title = u.jevAvailable ? `TypeSafe jev · 메시지당 약 $0.0005 · 하루 $${u.paidCapUsd} 상한` : '아래 TypeSafe 키를 먼저 등록하세요';
    }
  });
  $('#keyStatus').textContent = u.jevKey === 'env' ? '환경 변수 TYPESAFE_API_KEY 사용 중' : u.jevKey === 'stored' ? '등록됨' : '등록 안 됨';
  showKeyMask(!!u.jevKey);
  $<HTMLButtonElement>('#keyClear').disabled = u.jevKey !== 'stored';
  const capped = u.engine === 'jev' && u.paidUsd >= u.paidCapUsd;
  const pill = $('#usagePill');
  pill.classList.toggle('warn', capped);
  pill.textContent = `무료 ${u.freeCalls}/${u.freeBudget} · jev $${u.paidUsd.toFixed(4)}/$${u.paidCapUsd}${capped ? ' · 상한 도달, 무료로 판단 중' : ''}`;
}

/**
 * 키가 저장돼 있으면 입력창에 점을 채워 보여 준다. 실제 키는 main 밖으로 나오지 않으므로
 * 값과 무관한 고정 길이 자리표시이고, 이걸 그대로 저장하지는 않는다.
 */
const KEY_MASK = '•'.repeat(24);

function showKeyMask(stored: boolean) {
  const input = $<HTMLInputElement>('#keyInput');
  // 새 키를 붙여 넣는 중이면 건드리지 않는다
  if (input.dataset.masked !== 'true' && input.value) return;
  input.value = stored ? KEY_MASK : '';
  input.dataset.masked = String(stored);
}

function initKeyForm() {
  const input = $<HTMLInputElement>('#keyInput');
  // 점을 누르면 통째로 선택해서 붙여 넣으면 바로 바뀌게
  input.addEventListener('focus', () => { if (input.dataset.masked === 'true') input.select(); });
  input.addEventListener('input', () => { input.dataset.masked = 'false'; });
  const msg = $('#keyMsg');
  const say = (text: string, bad = false) => {
    msg.textContent = text;
    msg.classList.toggle('bad', bad);
  };
  $('#keyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (input.dataset.masked === 'true') {
      say('이미 저장된 키가 있어요. 바꾸려면 새 키를 붙여 넣으세요.');
      return;
    }
    const key = input.value;
    // 붙여 넣은 값은 저장 요청 직후 입력창에서 지운다
    input.value = '';
    if (!key.trim()) return;
    const ok = await window.api.setTypesafeKey(key);
    say(ok ? '저장했어요. 위에서 jev를 고를 수 있어요.' : '저장하지 못했어요. 키 형식을 확인해 주세요.', !ok);
  });
  $('#keyClear').addEventListener('click', () => {
    window.api.clearTypesafeKey();
    say('키를 삭제했어요. jev를 쓰던 중이면 무료 LLM으로 바꿨어요.');
  });
}

function initEngine() {
  document.querySelectorAll<HTMLButtonElement>('.seg').forEach((b) => b.addEventListener('click', () => {
    if (isEngine(b.dataset.engine)) window.api.setEngine(b.dataset.engine);
  }));
}

async function init() {
  initFilter();
  const snap = await window.api.getSnapshot();
  snap.logs.forEach((l) => appendLog({ ...l, typing: false }));
  renderBody(snap.body);
  if (snap.lastCortex) renderCortex(snap.lastCortex);
  initEngine();
  initKeyForm();
  renderUsage(snap.usage);
  window.api.onUsage(renderUsage);

  window.api.onLog(appendLog);
  window.api.onBody(renderBody);
  window.api.onCortex(renderCortex);
  drawMicMarks();
  window.api.onMicDiag(renderMic);
  window.api.onStt(renderStt);
  // 신호가 끊기면(마이크 끔·권한 없음) 미터를 끈 상태로 되돌린다
  setInterval(() => { if (Date.now() - micSeenAt > MIC_STALE_MS) renderMicOff(); }, MIC_STALE_MS);

  $('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $<HTMLInputElement>('#chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    window.api.sendText(text);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-sim]').forEach((b) => {
    const kind = b.dataset.sim as Simulatable;
    if (SIMULATABLE.includes(kind)) b.addEventListener('click', () => window.api.simulate(kind));
  });
  bindToggle($('#micBtn'), '마이크', snap.mic, window.api.setMic);
  bindToggle($('#soundBtn'), '화음 소리', snap.sound, window.api.setSound);
}

void init();
