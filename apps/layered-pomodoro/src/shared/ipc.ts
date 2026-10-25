import type { Command } from './commands';
import type { Layer } from './layers';
import type { AppState } from './tabs';

export const IPC = {
  // renderer → main
  getState: 'state:get',
  command: 'state:command',
  openSettings: 'app:open-settings',
  // main → renderer
  state: 'state:changed',
  finished: 'layers:finished',
} as const;

/**
 * 탭·레이어 상태의 주인은 main이다. 시계 창과 설정 창은 같은 상태를 구독하고, 변경은 명령으로만 보낸다.
 */
export interface Api {
  getState: () => Promise<AppState>;
  onState: (cb: (state: AppState) => void) => () => void;
  /** 이번 tick에 끝난 레이어(활성 탭). 시계 창이 종소리를 낸다 */
  onFinished: (cb: (layers: Layer[]) => void) => () => void;
  command: (cmd: Command) => void;
  openSettings: () => void;
}
