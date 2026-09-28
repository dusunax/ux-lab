import { app, ipcMain, powerMonitor, shell, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import { IPC } from '../shared/ipc';
import { sanitizeBubbleSettings } from '../shared/bubble-settings';
import { normalizeSpaceId, spaceUrl } from '../shared/space-id';
import { LIMITS, type AddSpaceResult, type AppState } from '../shared/types';
import { AuthManager } from './auth/google-oauth';
import { TokenStore } from './auth/token-store';
import { classifyError, createListMessages } from './chat/chat-client';
import { MessagePoller } from './chat/message-poller';
import { BubbleWindow } from './notification/bubble-window';
import { AppStore } from './store/app-store';
import { CustomMascot } from './custom-mascot';
import { AppTray } from './tray';
import { SettingsWindow, isAppUrl } from './windows';

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  void app.whenReady().then(bootstrap);
}

async function bootstrap(): Promise<void> {
  if (process.platform === 'darwin') app.dock?.hide();
  // Windows 작업 표시줄/알림에서 앱을 구분하는 ID (electron-builder appId와 동일)
  if (process.platform === 'win32') app.setAppUserModelId('com.interxlab.google-space-bubble');

  const dir = app.getPath('userData');
  const store = new AppStore(dir);
  const auth = new AuthManager(new TokenStore(dir), store);
  const settingsWin = new SettingsWindow();
  const customMascot = new CustomMascot(dir);
  const bubble = new BubbleWindow(
    () => store.settings,
    () => customMascot.dataUrl(),
  );
  const bubbleDurationMs = () => store.settings.bubbleDurationSec * 1000;
  const listMessages = createListMessages(() => auth.authClient);
  const poller = new MessagePoller({
    listMessages,
    getSpaces: () => store.spaces,
    saveCursor: (id, cursor) => store.updateSpace(id, cursor),
    excludeSelf: () => (store.settings.includeOwnMessages ? undefined : auth.account),
    pollIntervalMs: () => store.settings.pollIntervalSec * 1000,
  });

  // ─── 상태 → Renderer / Tray ───────────────────────────

  const getState = (): AppState => {
    const signedIn = auth.state.status === 'signedIn';
    return {
      auth: auth.state,
      monitoring: !signedIn ? 'stopped' : poller.isUserPaused ? 'paused' : 'running',
      connection: signedIn && poller.waiting ? 'waiting' : 'ok',
      spaces: store.spaces.map((s) => ({ ...s, ...poller.statusOf(s.spaceId) })),
      settings: {
        pollIntervalSec: store.settings.pollIntervalSec,
        bubbleDurationSec: store.settings.bubbleDurationSec,
        bubbleFontSize: store.settings.bubbleFontSize,
        bubblePosition: store.settings.bubblePosition,
        bubbleDisplay: store.settings.bubbleDisplay,
        mascot: store.settings.mascot,
        includeOwnMessages: store.settings.includeOwnMessages,
        customMascotVersion: store.settings.customMascotVersion,
      },
    };
  };

  const testBubble = () =>
    bubble.push(
      [
        {
          kind: 'message',
          id: `test-${Date.now()}`,
          spaceId: store.spaces[0]?.spaceId ?? '',
          spaceName: store.spaces[0]?.spaceName ?? 'Space Bubble',
          sender: 'Space Bubble',
          text: '테스트 알림입니다.',
          createTime: new Date().toISOString(),
        },
      ],
      bubbleDurationMs(),
    );

  const tray = new AppTray({
    openSettings: () => settingsWin.show(),
    testBubble: () => void testBubble(),
    setMonitoring: (running) => poller.setUserPaused(!running),
    logout: () => void auth.logout(),
    quit: () => app.quit(),
  });

  let broadcastQueued = false;
  const broadcast = () => {
    if (broadcastQueued) return;
    broadcastQueued = true;
    queueMicrotask(() => {
      broadcastQueued = false;
      const state = getState();
      settingsWin.send(IPC.stateChanged, state);
      tray.update(state);
    });
  };

  store.on('change', broadcast);
  poller.on('status', broadcast);
  poller.on('messages', (messages) => void bubble.push(messages, bubbleDurationMs()));
  poller.on('authError', () => auth.handleInvalidGrant());
  auth.on('change', (state) => {
    if (state.status === 'signedIn') {
      poller.start();
      if (store.spaces.length === 0) settingsWin.show();
    } else {
      poller.stop();
      bubble.hide();
      if (state.status === 'signedOut') settingsWin.show();
    }
    broadcast();
  });

  // ─── 절전 / 화면 잠금 ─────────────────────────────────

  powerMonitor.on('suspend', () => poller.setSystemPaused(true));
  powerMonitor.on('lock-screen', () => poller.setSystemPaused(true));
  powerMonitor.on('resume', () => poller.setSystemPaused(false));
  powerMonitor.on('unlock-screen', () => poller.setSystemPaused(false));

  // ─── IPC ──────────────────────────────────────────────

  const fromSettings = (e: IpcMainInvokeEvent | IpcMainEvent) => settingsWin.isOwner(e.sender);
  const fromBubble = (e: IpcMainEvent) => bubble.isOwner(e.sender);
  const handle = <A extends unknown[], R>(channel: string, fn: (...args: A) => R | Promise<R>) =>
    ipcMain.handle(channel, (e, ...args) => {
      if (!fromSettings(e)) throw new Error('forbidden sender');
      return fn(...(args as A));
    });

  handle(IPC.getState, getState);
  handle(IPC.login, () => auth.login());
  ipcMain.on(IPC.cancelLogin, (e) => fromSettings(e) && auth.cancel());
  handle(IPC.logout, () => auth.logout());

  handle(IPC.addSpace, async (input: unknown, name: unknown): Promise<AddSpaceResult> => {
    if (typeof input !== 'string' || typeof name !== 'string') return { ok: false, error: '잘못된 입력입니다.' };
    const spaceId = normalizeSpaceId(input);
    if (!spaceId) return { ok: false, error: '올바른 Space ID 또는 URL이 아닙니다.' };
    if (store.getSpace(spaceId)) return { ok: false, error: '이미 등록된 Space입니다.' };
    if (store.spaces.length >= LIMITS.maxSpaces) {
      return { ok: false, error: `Space는 최대 ${LIMITS.maxSpaces}개까지 등록할 수 있습니다.` };
    }
    if (!auth.authClient) return { ok: false, error: '로그인이 필요합니다.' };

    try {
      await listMessages(spaceId, { pageSize: 1 });
    } catch (e) {
      const err = classifyError(e);
      if (err.kind === 'auth') {
        auth.handleInvalidGrant();
        return { ok: false, error: '로그인이 만료되었습니다.' };
      }
      if (err.kind === 'forbidden') {
        return { ok: false, error: '접근할 수 없는 Space입니다. ID와 멤버 여부를 확인하세요.' };
      }
      return { ok: false, error: '네트워크 오류로 확인하지 못했습니다. 잠시 후 다시 시도하세요.' };
    }

    store.addSpace({ spaceId, spaceName: name.trim().slice(0, 80) || spaceId, enabled: true });
    poller.refresh();
    return { ok: true };
  });

  handle(IPC.removeSpace, (spaceId: unknown) => {
    if (typeof spaceId !== 'string') return;
    store.removeSpace(spaceId);
    poller.refresh();
  });

  handle(IPC.renameSpace, (spaceId: unknown, name: unknown) => {
    if (typeof spaceId !== 'string' || typeof name !== 'string' || !store.getSpace(spaceId)) return;
    store.updateSpace(spaceId, { spaceName: name.trim().slice(0, 80) || spaceId });
  });

  handle(IPC.setSpaceEnabled, (spaceId: unknown, enabled: unknown) => {
    if (typeof spaceId !== 'string' || typeof enabled !== 'boolean') return;
    // 다시 켤 때는 기준점을 초기화해 꺼져 있던 동안의 메시지가 몰려 오지 않게 한다.
    store.updateSpace(spaceId, enabled ? { enabled, lastMessageName: undefined, lastMessageTime: undefined } : { enabled });
    poller.retry(spaceId);
  });

  handle(IPC.retrySpace, (spaceId: unknown) => {
    if (typeof spaceId === 'string') poller.retry(spaceId);
  });

  handle(IPC.setMonitoring, (running: unknown) => {
    if (typeof running === 'boolean') poller.setUserPaused(!running);
  });

  handle(IPC.updateSettings, (patch: unknown) => {
    const valid = sanitizeBubbleSettings(patch);
    if (valid.mascot === 'custom' && !customMascot.dataUrl()) delete valid.mascot;
    if (Object.keys(valid).length === 0) return;
    store.updateBubbleSettings(valid);
    bubble.applySettings(bubbleDurationMs());
  });

  handle(IPC.testBubble, () => testBubble());

  handle(IPC.chooseCustomMascot, async () => {
    const res = await customMascot.choose();
    if (res.ok) {
      store.setCustomMascotVersion(Date.now());
      store.updateBubbleSettings({ mascot: 'custom' });
      bubble.applySettings(bubbleDurationMs());
    }
    return res;
  });

  handle(IPC.getCustomMascot, () => customMascot.dataUrl());

  ipcMain.on(IPC.bubbleOpen, (e, spaceId: unknown) => {
    if (!fromBubble(e) || typeof spaceId !== 'string' || !store.getSpace(spaceId)) return;
    const url = spaceUrl(spaceId);
    if (url.startsWith('https://chat.google.com/')) void shell.openExternal(url);
  });
  ipcMain.on(IPC.bubbleHover, (e, hover: unknown) => {
    if (fromBubble(e) && typeof hover === 'boolean') bubble.setHover(hover);
  });
  ipcMain.on(IPC.bubbleReady, (e) => {
    if (fromBubble(e)) bubble.markReady();
  });
  ipcMain.on(IPC.bubbleEmpty, (e) => {
    if (fromBubble(e)) bubble.hide();
  });

  // ─── 시작 ─────────────────────────────────────────────

  app.on('second-instance', () => settingsWin.show());
  app.on('before-quit', () => poller.stop());

  tray.update(getState());
  await auth.restore();
  if (auth.state.status !== 'signedIn') settingsWin.show();
}

// 모든 창이 닫혀도 트레이에 상주
app.on('window-all-closed', () => {});

// 외부 URL 이동 / 새 창 차단
app.on('web-contents-created', (_e, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', (e, url) => {
    if (!isAppUrl(url)) e.preventDefault();
  });
});
