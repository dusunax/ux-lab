import { join } from 'node:path';
import { BrowserWindow, screen, shell, type WebPreferences } from 'electron';
import { CLOCK_BASE_SIZE, CLOCK_SIZES, type ClockSize } from '../shared/tabs';

const MARGIN = 28;
const SETTINGS_WIDTH = 500;
const SETTINGS_HEIGHT = 660;
const GAP = 12;
const PAPER = '#FFFFFF';

type Page = 'clock' | 'settings';

function secureWebPreferences(extra: WebPreferences = {}): WebPreferences {
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

function isAppUrl(url: string): boolean {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl && url.startsWith(devUrl)) return true;
  return url.startsWith('file://');
}

function guard(win: BrowserWindow): void {
  win.webContents.on('will-navigate', (e, url) => {
    if (!isAppUrl(url)) e.preventDefault();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function loadRenderer(win: BrowserWindow, page: Page): Promise<void> {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) await win.loadURL(`${devUrl}/${page}/index.html`);
  else await win.loadFile(join(__dirname, `../renderer/${page}/index.html`));
}

abstract class AppWindow {
  protected win: BrowserWindow | null = null;

  get alive(): BrowserWindow | null {
    return this.win && !this.win.isDestroyed() ? this.win : null;
  }

  send(channel: string, payload: unknown): void {
    this.alive?.webContents.send(channel, payload);
  }
}

/**
 * 화면 위에 떠 있는 투명 원형 시계. 원 전체를 잡아 끌어 옮긴다.
 * 화면은 280px(M) 기준으로 그리고, S·L은 창 크기와 화면 배율(zoom factor)을 함께 바꿔 비율을 유지한다.
 */
export class ClockWindow extends AppWindow {
  private size: ClockSize = 'M';

  show(size: ClockSize = this.size): void {
    this.size = size;
    const existing = this.alive;
    if (existing) return existing.show();
    const px = CLOCK_SIZES[size];
    const area = screen.getPrimaryDisplay().workArea;
    const win = new BrowserWindow({
      width: px,
      height: px,
      x: area.x + area.width - px - MARGIN,
      y: area.y + MARGIN,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: false,
      alwaysOnTop: true,
      title: 'Layered Pomodoro',
      // 다른 앱을 쓰는 동안에도 시계와 종소리가 멈추지 않게 한다
      webPreferences: secureWebPreferences({
        backgroundThrottling: false,
        autoplayPolicy: 'no-user-gesture-required',
      }),
    });
    win.setAlwaysOnTop(true, 'floating');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.once('ready-to-show', () => win.showInactive());
    win.on('closed', () => (this.win = null));
    // 배율은 페이지를 다시 읽으면 초기화되므로 읽을 때마다 맞춘다
    win.webContents.on('did-finish-load', () => this.applyZoom());
    guard(win);
    this.win = win;
    void loadRenderer(win, 'clock');
  }

  /** 크기를 바꾼다. 화면에서 시계의 오른쪽 위 모서리가 그대로 있도록 옮긴다 */
  resize(size: ClockSize): void {
    if (size === this.size) return;
    this.size = size;
    const win = this.alive;
    if (!win) return;
    const px = CLOCK_SIZES[size];
    const b = win.getBounds();
    win.setBounds({ x: b.x + b.width - px, y: b.y, width: px, height: px });
    this.applyZoom();
  }

  private applyZoom(): void {
    this.alive?.webContents.setZoomFactor(CLOCK_SIZES[this.size] / CLOCK_BASE_SIZE);
  }
}

/** 레이어 설정 팝업. 시계 옆, 화면 안쪽으로 연다 */
export class SettingsWindow extends AppWindow {
  show(anchor: BrowserWindow | null): void {
    const existing = this.alive;
    if (existing) {
      existing.show();
      existing.focus();
      return;
    }
    const win = new BrowserWindow({
      width: SETTINGS_WIDTH,
      height: SETTINGS_HEIGHT,
      ...placeBeside(anchor),
      show: false,
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      minimizable: false,
      title: '레이어 설정',
      backgroundColor: PAPER,
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 16 },
      webPreferences: secureWebPreferences(),
    });
    win.once('ready-to-show', () => win.show());
    win.on('closed', () => (this.win = null));
    guard(win);
    this.win = win;
    void loadRenderer(win, 'settings');
  }
}

/** 시계 왼쪽에 공간이 있으면 왼쪽, 아니면 오른쪽 */
function placeBeside(anchor: BrowserWindow | null): { x?: number; y?: number } {
  if (!anchor || anchor.isDestroyed()) return {};
  const b = anchor.getBounds();
  const area = screen.getDisplayMatching(b).workArea;
  const leftX = b.x - SETTINGS_WIDTH - GAP;
  const x = leftX >= area.x ? leftX : Math.min(b.x + b.width + GAP, area.x + area.width - SETTINGS_WIDTH);
  const y = Math.min(Math.max(b.y, area.y), area.y + area.height - SETTINGS_HEIGHT);
  return { x, y };
}
