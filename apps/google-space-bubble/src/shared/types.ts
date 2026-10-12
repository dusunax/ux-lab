import type { BubbleSettings } from './bubble-settings';

export type MonitoredSpace = {
  spaceId: string; // "spaces/AAAA"
  spaceName: string; // 사용자가 입력한 표시 이름
  enabled: boolean;
  lastMessageName?: string;
  lastMessageTime?: string; // RFC3339
};

export type AppSettings = BubbleSettings & {
  monitoredSpaces: MonitoredSpace[];
  pollIntervalSec: number;
  /** Gmail INBOX 새 수신 메일도 Bubble로 표시 */
  gmailEnabled: boolean;
  gmailLastMessageId?: string;
  gmailLastMessageInternalDate?: string;
  /** 사용자 이미지(userData/custom-mascot.png)를 바꿀 때마다 증가. 캐시 무효화용 */
  customMascotVersion?: number;
};

/** 런타임 상태, 저장하지 않음 */
export type SpaceStatus = 'idle' | 'syncing' | 'ok' | 'waiting' | 'error';

export type SpaceView = MonitoredSpace & {
  status: SpaceStatus;
  error?: string;
};

export type AuthState =
  | { status: 'signedOut'; error?: string }
  | { status: 'signingIn' }
  | { status: 'signedIn'; email: string };

export type MonitoringState = 'running' | 'paused' | 'stopped';

/** Renderer에 노출하는 전체 상태. Token 등 민감 정보는 포함하지 않는다. */
export type AppState = {
  auth: AuthState;
  monitoring: MonitoringState;
  connection: 'ok' | 'waiting';
  spaces: SpaceView[];
  gmail: { status: SpaceStatus; error?: string };
  settings: Omit<AppSettings, 'monitoredSpaces' | 'gmailLastMessageId' | 'gmailLastMessageInternalDate'>;
};

export type BubbleMessage =
  | {
      kind: 'message';
      source?: 'chat' | 'gmail';
      id: string; // Message.name
      spaceId: string;
      spaceName: string;
      gmailMessageId?: string;
      sender: string;
      text: string;
      createTime: string;
    }
  | {
      kind: 'summary';
      source?: 'chat' | 'gmail';
      id: string;
      spaceId: string;
      spaceName: string;
      gmailMessageId?: string;
      count: number;
      createTime: string;
    };

export type AddSpaceResult = { ok: true } | { ok: false; error: string };

export const LIMITS = {
  maxSpaces: 10,
  minPollIntervalSec: 5,
  summaryThreshold: 5,
  maxBubbles: 4,
} as const;
