/**
 * Electron에서는 preload가 넣어 준 window.api를 쓴다.
 * 브라우저 미리보기(디자인 확인용)에서는 같은 규칙을 localStorage로 흉내 내는 대체 구현을 쓴다.
 */
import { applyCommand, parseCommand } from '../../shared/commands';
import type { Api } from '../../shared/ipc';
import type { Layer } from '../../shared/layers';
import { sanitizeState, tickState, type AppState } from '../../shared/tabs';

const PREVIEW_KEY = 'layered-pomodoro:preview';
const TICK_MS = 250;

function previewApi(): Api {
  const makeId = () => crypto.randomUUID();
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(PREVIEW_KEY) ?? 'null') as unknown;
    } catch {
      return null;
    }
  };
  let state = tickState(sanitizeState(read(), Date.now(), makeId), Date.now()).state;
  const stateSubs = new Set<(s: AppState) => void>();
  const finishSubs = new Set<(l: Layer[]) => void>();
  const emit = () => stateSubs.forEach((cb) => cb(state));
  const set = (next: AppState) => {
    state = next;
    localStorage.setItem(PREVIEW_KEY, JSON.stringify(state));
    emit();
  };
  // 다른 탭(시계 ↔ 설정)에서 바꾼 값을 따라간다
  window.addEventListener('storage', (e) => {
    if (e.key !== PREVIEW_KEY) return;
    state = sanitizeState(read(), Date.now(), makeId);
    emit();
  });
  setInterval(() => {
    const result = tickState(state, Date.now());
    if (!result.finished.length) return;
    set(result.state);
    finishSubs.forEach((cb) => cb(result.finished));
  }, TICK_MS);

  const subscribe =
    <T,>(subs: Set<(v: T) => void>) =>
    (cb: (v: T) => void) => {
      subs.add(cb);
      return () => void subs.delete(cb);
    };
  return {
    getState: async () => state,
    onState: subscribe(stateSubs),
    onFinished: subscribe(finishSubs),
    command: (raw) => {
      const cmd = parseCommand(raw);
      if (cmd) set(applyCommand(state, cmd, Date.now(), makeId));
    },
    openSettings: () => void window.open('../settings/index.html', 'settings', 'width=500,height=660'),
  };
}

export const api: Api = window.api ?? previewApi();
