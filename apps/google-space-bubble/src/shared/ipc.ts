import type { BubbleSettings } from './bubble-settings';
import type { AddSpaceResult, AppState, BubbleMessage } from './types';

export const IPC = {
  // settings window → main
  getState: 'app:get-state',
  login: 'auth:login',
  cancelLogin: 'auth:cancel-login',
  logout: 'auth:logout',
  addSpace: 'space:add',
  removeSpace: 'space:remove',
  renameSpace: 'space:rename',
  setSpaceEnabled: 'space:set-enabled',
  retrySpace: 'space:retry',
  setMonitoring: 'monitoring:set',
  updateSettings: 'settings:update',
  testBubble: 'bubble:test',
  chooseCustomMascot: 'mascot:choose',
  getCustomMascot: 'mascot:get',
  // main → settings window
  stateChanged: 'app:state-changed',
  // main → bubble window
  bubblePush: 'bubble:push',
  // bubble window → main
  bubbleOpen: 'bubble:open',
  bubbleHover: 'bubble:hover',
  bubbleEmpty: 'bubble:empty',
  bubbleReady: 'bubble:ready',
} as const;

export type BubblePayload = {
  messages: BubbleMessage[];
  durationMs: number;
  appearance: Pick<BubbleSettings, 'bubbleFontSize' | 'bubblePosition' | 'mascot'> & {
    /** mascot === 'custom'일 때 사용자 이미지 data URL */
    customMascotUrl?: string;
  };
};

/** preload가 window.api로 노출하는 API */
export type Api = {
  getState(): Promise<AppState>;
  onState(cb: (state: AppState) => void): () => void;
  login(): Promise<void>;
  cancelLogin(): void;
  logout(): Promise<void>;
  addSpace(input: string, name: string): Promise<AddSpaceResult>;
  removeSpace(spaceId: string): Promise<void>;
  renameSpace(spaceId: string, name: string): Promise<void>;
  setSpaceEnabled(spaceId: string, enabled: boolean): Promise<void>;
  retrySpace(spaceId: string): Promise<void>;
  setMonitoring(running: boolean): Promise<void>;
  updateSettings(patch: Partial<BubbleSettings>): Promise<void>;
  testBubble(): Promise<void>;
  /** 파일 선택 창을 열어 사용자 이미지를 캐릭터로 지정 */
  chooseCustomMascot(): Promise<{ ok: true } | { ok: false; error?: string }>;
  /** 사용자 이미지 data URL (없으면 null) */
  getCustomMascot(): Promise<string | null>;

  onBubble(cb: (payload: BubblePayload) => void): () => void;
  openSpace(spaceId: string): void;
  setBubbleHover(hover: boolean): void;
  notifyBubbleEmpty(): void;
  notifyBubbleReady(): void;
};
