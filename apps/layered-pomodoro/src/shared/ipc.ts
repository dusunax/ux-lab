import type { LayerCommand } from './commands';
import type { Layer } from './layers';

export const IPC = {
  // renderer → main
  getLayers: 'layers:get',
  command: 'layers:command',
  openSettings: 'app:open-settings',
  // main → renderer
  layers: 'layers:changed',
  finished: 'layers:finished',
} as const;

/**
 * 레이어 상태의 주인은 main이다. 시계 창과 설정 창은 같은 상태를 구독하고, 변경은 명령으로만 보낸다.
 */
export interface Api {
  getLayers: () => Promise<Layer[]>;
  onLayers: (cb: (layers: Layer[]) => void) => () => void;
  /** 이번 tick에 끝난 레이어. 시계 창이 종소리를 낸다 */
  onFinished: (cb: (layers: Layer[]) => void) => () => void;
  command: (cmd: LayerCommand) => void;
  openSettings: () => void;
}
