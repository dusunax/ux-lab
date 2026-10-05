import { join } from 'node:path';
import { BrowserWindow, screen, type WebPreferences } from 'electron';

/** 데스크탑에 띄우는 원형 창 크기. 화면 디자인은 466×466 기준이고 SVG viewBox로 축소된다 */
const DEVICE_SIZE = 300;
const MARGIN = 24;

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

async function loadRenderer(win: BrowserWindow, page: 'device' | 'console'): Promise<void> {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) await win.loadURL(`${devUrl}/${page}/index.html`);
  else await win.loadFile(join(__dirname, `../renderer/${page}/index.html`));
}

export function isAppUrl(url: string): boolean {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl && url.startsWith(devUrl)) return true;
  return url.startsWith('file://');
}

abstract class AppWindow {
  protected win: BrowserWindow | null = null;

  send(channel: string, payload: unknown): void {
    if (this.win && !this.win.isDestroyed()) this.win.webContents.send(channel, payload);
  }

  isOwner(contents: Electron.WebContents): boolean {
    return !!this.win && !this.win.isDestroyed() && this.win.webContents === contents;
  }
}

/** 원형 디바이스 화면. 투명·무테·항상 위, 드래그로 옮긴다 */
export class DeviceWindow extends AppWindow {
  show(): void {
    if (this.win && !this.win.isDestroyed()) return this.win.show();
    const area = screen.getPrimaryDisplay().workArea;
    const win = new BrowserWindow({
      width: DEVICE_SIZE,
      height: DEVICE_SIZE,
      x: area.x + area.width - DEVICE_SIZE - MARGIN,
      y: area.y + area.height - DEVICE_SIZE - MARGIN,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: false,
      alwaysOnTop: true,
      title: 'Tuffy',
      // 포커스가 없어도 애니메이션과 마이크 분석이 멈추지 않게 한다
      webPreferences: secureWebPreferences({ backgroundThrottling: false }),
    });
    win.setAlwaysOnTop(true, 'floating');
    win.setVisibleOnAllWorkspaces(true);
    win.once('ready-to-show', () => win.showInactive());
    win.on('closed', () => (this.win = null));
    this.win = win;
    void loadRenderer(win, 'device');
  }
}

/** 뇌 콘솔: 사고 로그, 상태 계측, 텍스트 대화 입력 */
export class ConsoleWindow extends AppWindow {
  show(): void {
    if (this.win && !this.win.isDestroyed()) {
      this.win.show();
      this.win.focus();
      return;
    }
    const win = new BrowserWindow({
      width: 560,
      height: 820,
      minWidth: 420,
      minHeight: 520,
      show: false,
      title: 'tuffy.brain',
      backgroundColor: '#000000',
      autoHideMenuBar: true,
      webPreferences: secureWebPreferences(),
    });
    win.once('ready-to-show', () => win.show());
    win.on('closed', () => (this.win = null));
    this.win = win;
    void loadRenderer(win, 'console');
  }
}
