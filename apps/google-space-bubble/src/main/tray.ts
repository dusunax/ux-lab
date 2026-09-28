import { Menu, Tray, nativeImage } from 'electron';
import type { AppState } from '../shared/types';
import macIcon from '../../resources/trayTemplate.png?asset';
import winIcon from '../../resources/tray-win.png?asset';

export type TrayActions = {
  openSettings: () => void;
  testBubble: () => void;
  setMonitoring: (running: boolean) => void;
  logout: () => void;
  quit: () => void;
};

export class AppTray {
  private readonly tray: Tray;

  constructor(private readonly actions: TrayActions) {
    const isMac = process.platform === 'darwin';
    const image = nativeImage.createFromPath(isMac ? macIcon : winIcon);
    if (isMac) image.setTemplateImage(true);
    this.tray = new Tray(image);
    this.tray.setToolTip('Space Bubble');
    // Windows: 아이콘 클릭 시 설정 창 (macOS는 클릭 시 메뉴가 열림)
    if (!isMac) this.tray.on('click', () => actions.openSettings());
  }

  update(state: AppState): void {
    const signedIn = state.auth.status === 'signedIn';
    const enabled = state.spaces.filter((s) => s.enabled).length;
    const errors = state.spaces.filter((s) => s.enabled && s.status === 'error').length;

    const statusLabel =
      !signedIn ? '○ 로그인 필요'
      : state.monitoring === 'paused' ? '⏸ 모니터링 일시정지'
      : state.connection === 'waiting' ? '● Google Chat 연결 대기 중'
      : enabled === 0 ? '○ 등록된 Space 없음'
      : `● 모니터링 중 (Space ${enabled}개${errors ? `, 오류 ${errors}` : ''})`;

    this.tray.setToolTip(`Space Bubble — ${statusLabel.replace(/^\S+\s/, '')}`);
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: statusLabel, enabled: false },
        { type: 'separator' },
        {
          label: state.monitoring === 'paused' ? '모니터링 재개' : '모니터링 일시정지',
          enabled: signedIn,
          click: () => this.actions.setMonitoring(state.monitoring === 'paused'),
        },
        { label: '설정 열기', click: () => this.actions.openSettings() },
        { label: '테스트 알림 보내기', click: () => this.actions.testBubble() },
        { type: 'separator' },
        { label: '로그아웃', enabled: signedIn, click: () => this.actions.logout() },
        { label: '종료', click: () => this.actions.quit() },
      ]),
    );
  }

  destroy(): void {
    this.tray.destroy();
  }
}
