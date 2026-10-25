import { BrowserWindow, Menu, Notification, app, ipcMain, type IpcMainEvent } from 'electron';
import { parseCommand } from '../shared/commands';
import { IPC } from '../shared/ipc';
import type { Layer } from '../shared/layers';
import { StateStore } from './store';
import { ClockWindow, SettingsWindow } from './windows';

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  void app.whenReady().then(bootstrap);
}

function notifyFinished(finished: Layer[]): void {
  if (Notification.isSupported()) {
    for (const layer of finished) {
      // 소리는 시계 창의 종소리로 내므로 시스템 알림은 무음
      new Notification({ title: `${layer.name} — 종료됨`, body: '레이어의 시간이 다 됐어요.', silent: true }).show();
    }
  }
  app.dock?.bounce('informational');
}

function bootstrap(): void {
  const clock = new ClockWindow();
  const settings = new SettingsWindow();
  const broadcast = (channel: string, payload: unknown) => {
    clock.send(channel, payload);
    settings.send(channel, payload);
  };
  const store = new StateStore({
    onChange: (state) => broadcast(IPC.state, state),
    onFinished: (finished) => {
      broadcast(IPC.finished, finished);
      notifyFinished(finished);
    },
  });
  const openSettings = () => settings.show(clock.alive);

  // 우리 창에서 온 IPC만 받는다
  const fromApp = (e: IpcMainEvent | Electron.IpcMainInvokeEvent) =>
    BrowserWindow.fromWebContents(e.sender) === clock.alive || BrowserWindow.fromWebContents(e.sender) === settings.alive;

  ipcMain.handle(IPC.getState, (e) => (fromApp(e) ? store.snapshot : null));
  ipcMain.on(IPC.command, (e, raw: unknown) => {
    const cmd = fromApp(e) ? parseCommand(raw) : null;
    if (cmd) store.apply(cmd);
  });
  ipcMain.on(IPC.openSettings, (e) => {
    if (fromApp(e)) openSettings();
  });

  installMenu(openSettings, () => clock.show());
  clock.show();
  store.start();

  app.on('second-instance', () => clock.show());
  // Dock 아이콘을 누르면 설정을 연다
  app.on('activate', () => {
    clock.show();
    openSettings();
  });
  app.on('before-quit', () => store.stop());
}

function installMenu(openSettings: () => void, showClock: () => void): void {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'editMenu' },
      {
        label: '레이어',
        submenu: [
          { label: '레이어 설정…', accelerator: 'CmdOrCtrl+,', click: openSettings },
          { label: '시계 보이기', accelerator: 'CmdOrCtrl+Shift+L', click: showClock },
        ],
      },
      { role: 'windowMenu' },
    ]),
  );
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
