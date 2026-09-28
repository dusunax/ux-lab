/**
 * 브라우저에서 renderer UI만 미리 보기 위한 mock (dev 전용, Electron 밖에서만 사용).
 * 예: http://localhost:5173/settings/index.html?mock=signedIn
 *     http://localhost:5173/bubble/index.html
 */
import { DEFAULT_BUBBLE_SETTINGS } from '../shared/bubble-settings';
import type { Api, BubblePayload } from '../shared/ipc';
import type { AppState, BubbleMessage } from '../shared/types';

export function installDevMock(): void {
  if (!import.meta.env.DEV || window.api) return;

  const mode = new URLSearchParams(location.search).get('mock') ?? 'signedIn';
  let state: AppState = {
    auth: mode === 'signedOut' ? { status: 'signedOut' } : { status: 'signedIn', email: 'user@example.com' },
    monitoring: 'running',
    connection: 'ok',
    settings: { pollIntervalSec: 5, ...DEFAULT_BUBBLE_SETTINGS },
    spaces: [
      { spaceId: 'spaces/AAAA1111', spaceName: 'Gen.AI Front-end 알림', enabled: true, status: 'ok' },
      { spaceId: 'spaces/BBBB2222', spaceName: 'Gen.AI 소통', enabled: true, status: 'waiting' },
      {
        spaceId: 'spaces/CCCC3333',
        spaceName: '권한 없는 Space',
        enabled: true,
        status: 'error',
        error: '이 Space에 접근할 수 없습니다.',
      },
      { spaceId: 'spaces/DDDD4444', spaceName: '꺼 둔 Space', enabled: false, status: 'idle' },
    ],
  };
  const stateSubs = new Set<(s: AppState) => void>();
  const bubbleSubs = new Set<(p: BubblePayload) => void>();
  const set = (patch: Partial<AppState>) => {
    state = { ...state, ...patch };
    stateSubs.forEach((cb) => cb(state));
  };
  const noop = async () => {};

  const api: Api = {
    getState: async () => state,
    onState: (cb) => (stateSubs.add(cb), () => void stateSubs.delete(cb)),
    login: async () => set({ auth: { status: 'signingIn' } }),
    cancelLogin: () => set({ auth: { status: 'signedOut', error: undefined } }),
    logout: async () => set({ auth: { status: 'signedOut' } }),
    addSpace: async (input, name) =>
      input.includes('bad')
        ? { ok: false, error: '접근할 수 없는 Space입니다. ID와 멤버 여부를 확인하세요.' }
        : (set({ spaces: [...state.spaces, { spaceId: `spaces/${input}`, spaceName: name || input, enabled: true, status: 'syncing' }] }),
          { ok: true }),
    removeSpace: async (id) => set({ spaces: state.spaces.filter((s) => s.spaceId !== id) }),
    renameSpace: async (id, name) =>
      set({ spaces: state.spaces.map((s) => (s.spaceId === id ? { ...s, spaceName: name.trim() || id } : s)) }),
    chooseCustomMascot: async () => ({ ok: false, error: '브라우저 미리보기에서는 파일을 선택할 수 없습니다.' }),
    getCustomMascot: async () => null,
    setSpaceEnabled: async (id, enabled) =>
      set({ spaces: state.spaces.map((s) => (s.spaceId === id ? { ...s, enabled } : s)) }),
    retrySpace: noop,
    setMonitoring: async (running) => set({ monitoring: running ? 'running' : 'paused' }),
    updateSettings: async (patch) => set({ settings: { ...state.settings, ...patch } }),
    testBubble: noop,
    onBubble: (cb) => (bubbleSubs.add(cb), () => void bubbleSubs.delete(cb)),
    openSpace: (id) => console.log('[mock] open', id),
    setBubbleHover: () => {},
    notifyBubbleEmpty: () => console.log('[mock] bubble empty'),
    notifyBubbleReady: () => {},
  };
  window.api = api;

  // bubble 페이지: 샘플 메시지를 순차적으로 push
  if (location.pathname.includes('/bubble/')) {
    document.documentElement.style.background = '#6b7280';
    const now = new Date().toISOString();
    const samples: BubbleMessage[] = [
      { kind: 'message', id: 'm1', spaceId: 'spaces/AAAA1111', spaceName: 'Gen.AI Front-end 알림', sender: 'gitlab', text: '*배포 완료* production v1.4.2 배포가 완료되었습니다.', createTime: now },
      { kind: 'message', id: 'm2', spaceId: 'spaces/BBBB2222', spaceName: 'Gen.AI 소통', sender: '김OO', text: '오늘 회의 자료 공유드립니다. 확인 부탁드려요!\n두 번째 줄\n세 번째 줄\n네 번째 줄은 잘려야 합니다', createTime: now },
      {
        kind: 'message',
        id: 'm-long',
        spaceId: 'spaces/AAAA1111',
        spaceName: 'Gen.AI Front-end 알림',
        sender: 'gitlab-projects',
        text: Array.from({ length: 20 }, (_, i) => `${i + 1}번째 줄: 긴 코멘트 내용이 이어집니다.`).join('\n'),
        createTime: now,
      },
      { kind: 'summary', id: 's1', spaceId: 'spaces/AAAA1111', spaceName: 'Gen.AI Front-end 알림', count: 12, createTime: now },
    ];
    samples.forEach((m, i) =>
      setTimeout(
        () =>
          bubbleSubs.forEach((cb) =>
            cb({ messages: [m], durationMs: 60_000, appearance: { ...DEFAULT_BUBBLE_SETTINGS, ...appearanceFromUrl() } }),
          ),
        300 + i * 400,
      ),
    );
  }
}

/** ?pos=top-left&font=17&mascot=phone 로 bubble 모양 미리보기 */
function appearanceFromUrl(): Partial<BubblePayload['appearance']> {
  const q = new URLSearchParams(location.search);
  const out: Partial<BubblePayload['appearance']> = {};
  const pos = q.get('pos');
  if (pos) out.bubblePosition = pos as BubblePayload['appearance']['bubblePosition'];
  const font = Number(q.get('font'));
  if (font) out.bubbleFontSize = font;
  const mascot = q.get('mascot');
  if (mascot) out.mascot = mascot as BubblePayload['appearance']['mascot'];
  return out;
}
