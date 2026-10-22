/**
 * Electron에서는 preload가 넣어 준 window.api를 쓴다.
 * 브라우저 미리보기(디자인 확인용)에서는 같은 규칙을 localStorage로 흉내 내는 대체 구현을 쓴다.
 */
import { applyCommand, parseCommand } from '../../shared/commands';
import type { Api } from '../../shared/ipc';
import { sanitizeLayers, tick, type Layer } from '../../shared/layers';

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
  let layers = tick(sanitizeLayers(read(), Date.now(), makeId), Date.now()).layers;
  const changeSubs = new Set<(l: Layer[]) => void>();
  const finishSubs = new Set<(l: Layer[]) => void>();
  const emit = () => changeSubs.forEach((cb) => cb(layers));
  const set = (next: Layer[]) => {
    layers = next;
    localStorage.setItem(PREVIEW_KEY, JSON.stringify(layers));
    emit();
  };
  // 다른 탭(시계 ↔ 설정)에서 바꾼 값을 따라간다
  window.addEventListener('storage', (e) => {
    if (e.key !== PREVIEW_KEY) return;
    layers = sanitizeLayers(read(), Date.now(), makeId);
    emit();
  });
  setInterval(() => {
    const result = tick(layers, Date.now());
    if (!result.finished.length) return;
    set(result.layers);
    finishSubs.forEach((cb) => cb(result.finished));
  }, TICK_MS);

  const subscribe = (subs: Set<(l: Layer[]) => void>) => (cb: (l: Layer[]) => void) => {
    subs.add(cb);
    return () => void subs.delete(cb);
  };
  return {
    getLayers: async () => layers,
    onLayers: subscribe(changeSubs),
    onFinished: subscribe(finishSubs),
    command: (raw) => {
      const cmd = parseCommand(raw);
      if (cmd) set(applyCommand(layers, cmd, Date.now(), makeId));
    },
    openSettings: () => void window.open('../settings/index.html', 'settings', 'width=500,height=660'),
  };
}

export const api: Api = window.api ?? previewApi();
