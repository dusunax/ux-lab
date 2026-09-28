import { join } from 'node:path';
import { BrowserWindow, type WebPreferences } from 'electron';

export function secureWebPreferences(extra: WebPreferences = {}): WebPreferences {
  return {
    ...extra,
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
    spellcheck: false,
  };
}

/** dev에서는 vite dev server, 빌드 후에는 out/renderer의 html을 로드 */
export async function loadRenderer(win: BrowserWindow, page: 'settings' | 'bubble'): Promise<void> {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    await win.loadURL(`${devUrl}/${page}/index.html`);
  } else {
    await win.loadFile(join(__dirname, `../renderer/${page}/index.html`));
  }
}

/** 앱 내부 페이지 URL인지 (외부 이동 차단용) */
export function isAppUrl(url: string): boolean {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl && url.startsWith(devUrl)) return true;
  return url.startsWith('file://');
}

export class SettingsWindow {
  private win: BrowserWindow | null = null;

  show(): void {
    if (this.win && !this.win.isDestroyed()) {
      if (this.win.isMinimized()) this.win.restore();
      this.win.show();
      this.win.focus();
      return;
    }
    const win = new BrowserWindow({
      width: 460,
      height: 760,
      minWidth: 400,
      minHeight: 480,
      show: false,
      title: 'Space Bubble',
      autoHideMenuBar: true,
      webPreferences: secureWebPreferences(),
    });
    win.once('ready-to-show', () => {
      win.show();
      win.focus();
    });
    win.on('closed', () => (this.win = null));
    this.win = win;
    void loadRenderer(win, 'settings');
  }

  send(channel: string, payload: unknown): void {
    if (this.win && !this.win.isDestroyed()) this.win.webContents.send(channel, payload);
  }

  isOwner(contents: Electron.WebContents): boolean {
    return this.win?.webContents === contents;
  }
}
