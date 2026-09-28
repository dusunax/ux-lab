import { BrowserWindow, screen } from 'electron';
import { bubbleWindowSize, type BubbleSettings } from '../../shared/bubble-settings';
import { IPC, type BubblePayload } from '../../shared/ipc';
import type { BubbleMessage } from '../../shared/types';
import { loadRenderer, secureWebPreferences } from '../windows';

const MARGIN = 16;

/**
 * 화면 모서리의 투명 오버레이 창 1개. 안에서 Bubble Stack을 렌더링한다.
 * - 포커스를 빼앗지 않음 (showInactive, focusable: false)
 * - 빈 영역 클릭은 뒤 창으로 통과 (setIgnoreMouseEvents + forward)
 * - 위치(모서리, 모니터)와 크기(글자 크기 비례)는 설정을 따른다
 */
export class BubbleWindow {
  private win: BrowserWindow | null = null;
  /** renderer가 IPC 구독을 마치고 bubbleReady를 보내면 resolve */
  private ready: Promise<void> | null = null;
  private resolveReady: (() => void) | null = null;

  constructor(
    private readonly getSettings: () => BubbleSettings,
    private readonly getCustomMascotUrl: () => string | null,
  ) {}

  private ensure(): Promise<void> {
    if (this.win && !this.win.isDestroyed() && this.ready) return this.ready;

    const { width, height } = bubbleWindowSize(this.getSettings().bubbleFontSize);
    const win = new BrowserWindow({
      width,
      height,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      hasShadow: false,
      focusable: false,
      alwaysOnTop: true,
      ...(process.platform === 'win32' ? { type: 'toolbar' as const } : {}),
      // 포커스를 받지 않는 창이라 throttling되면 애니메이션/타이머가 멈춘 채로 보일 수 있다
      webPreferences: secureWebPreferences({ backgroundThrottling: false }),
    });
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setIgnoreMouseEvents(true, { forward: true });

    this.win = win;
    this.ready = new Promise<void>((resolve) => (this.resolveReady = resolve));
    void loadRenderer(win, 'bubble');
    win.on('closed', () => {
      this.win = null;
      this.ready = null;
      this.resolveReady = null;
    });
    return this.ready;
  }

  /** bubble renderer 준비 완료 (IPC.bubbleReady) */
  markReady(): void {
    this.resolveReady?.();
  }

  private position(): void {
    if (!this.win) return;
    const { bubbleFontSize, bubblePosition, bubbleDisplay } = this.getSettings();
    const display =
      bubbleDisplay === 'primary'
        ? screen.getPrimaryDisplay()
        : screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const area = display.workArea;
    const { width, height } = bubbleWindowSize(bubbleFontSize);
    const left = bubblePosition.endsWith('left');
    const top = bubblePosition.startsWith('top');
    this.win.setBounds({
      x: left ? area.x + MARGIN : area.x + area.width - width - MARGIN,
      y: top ? area.y + MARGIN : area.y + area.height - height - MARGIN,
      width,
      height,
    });
  }

  private payload(messages: BubbleMessage[], durationMs: number): BubblePayload {
    const { bubbleFontSize, bubblePosition, mascot } = this.getSettings();
    const customMascotUrl = mascot === 'custom' ? (this.getCustomMascotUrl() ?? undefined) : undefined;
    return { messages, durationMs, appearance: { bubbleFontSize, bubblePosition, mascot, customMascotUrl } };
  }

  async push(messages: BubbleMessage[], durationMs: number): Promise<void> {
    if (messages.length === 0) return;
    await this.ensure();
    const win = this.win!;
    if (!win.isVisible()) {
      this.position();
      win.showInactive();
      win.setAlwaysOnTop(true, 'screen-saver');
    }
    win.webContents.send(IPC.bubblePush, this.payload(messages, durationMs));
  }

  /** 설정 변경 시 표시 중인 Bubble에 바로 반영 */
  applySettings(durationMs: number): void {
    if (!this.win?.isVisible()) return;
    this.position();
    this.win.webContents.send(IPC.bubblePush, this.payload([], durationMs));
  }

  /** Bubble 위에 마우스가 있을 때만 클릭을 받는다 */
  setHover(hover: boolean): void {
    this.win?.setIgnoreMouseEvents(!hover, { forward: true });
  }

  hide(): void {
    if (!this.win?.isVisible()) return;
    this.win.setIgnoreMouseEvents(true, { forward: true });
    this.win.hide();
  }

  isOwner(contents: Electron.WebContents): boolean {
    return this.win?.webContents === contents;
  }

  destroy(): void {
    this.win?.destroy();
  }
}
