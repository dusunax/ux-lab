import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { powerMonitor } from 'electron';
import type { Signal } from '../../shared/state';

const run = promisify(execFile);

const IDLE_POLL_MS = 5000;
const IDLE_SIGNAL_SEC = 600;
/** 이 시간 이상 비웠다가 돌아와야 '복귀'로 본다 */
const AWAY_MIN_SEC = 120;
const APP_POLL_MS = 3000;
const CLOCK_POLL_MS = 30_000;

/**
 * OQ-4 확정 범위의 데스크탑 신호: 자리 복귀 / 유휴 / 시간 / 활성 앱.
 * 활성 앱은 앱 이름만 읽는다 (창 제목·내용은 수집하지 않음).
 */
export class DesktopSensors {
  private timers: NodeJS.Timeout[] = [];
  private maxIdleSec = 0;
  private idleSent = false;
  private lastHour = new Date().getHours();
  private app: string | null = null;
  private pendingApp: string | null = null;

  constructor(
    private readonly emit: (sig: Signal) => void,
    private readonly onApp: (app: string) => void,
  ) {}

  start(): void {
    this.timers.push(setInterval(() => this.pollIdle(), IDLE_POLL_MS));
    this.timers.push(setInterval(() => this.pollClock(), CLOCK_POLL_MS));
    if (process.platform === 'darwin') this.timers.push(setInterval(() => void this.pollApp(), APP_POLL_MS));
    powerMonitor.on('unlock-screen', this.onUnlock);
  }

  stop(): void {
    this.timers.forEach(clearInterval);
    this.timers = [];
    powerMonitor.off('unlock-screen', this.onUnlock);
  }

  private onUnlock = () => {
    this.emit({ kind: 'return', awaySec: Math.max(this.maxIdleSec, AWAY_MIN_SEC) });
    this.maxIdleSec = 0;
    this.idleSent = false;
  };

  private pollIdle(): void {
    const idle = powerMonitor.getSystemIdleTime();
    if (idle >= IDLE_SIGNAL_SEC && !this.idleSent) {
      this.idleSent = true;
      this.emit({ kind: 'idle' });
    }
    if (idle > this.maxIdleSec) this.maxIdleSec = idle;
    if (idle < IDLE_POLL_MS / 1000 && this.maxIdleSec >= AWAY_MIN_SEC) {
      this.emit({ kind: 'return', awaySec: this.maxIdleSec });
      this.maxIdleSec = 0;
      this.idleSent = false;
    } else if (idle < IDLE_POLL_MS / 1000) {
      this.maxIdleSec = 0;
    }
  }

  private pollClock(): void {
    const hour = new Date().getHours();
    if (hour === this.lastHour) return;
    this.lastHour = hour;
    this.emit({ kind: 'clock', hour });
  }

  /** macOS: lsappinfo는 별도 권한 없이 맨 앞 앱 이름을 돌려준다. 두 번 연속 같아야 전환으로 본다 */
  private async pollApp(): Promise<void> {
    try {
      const { stdout: asn } = await run('lsappinfo', ['front']);
      const { stdout } = await run('lsappinfo', ['info', '-only', 'name', asn.trim()]);
      const name = /"LSDisplayName"="(.+)"/.exec(stdout)?.[1]?.slice(0, 60);
      if (!name || name === 'Tuffy' || name === 'Electron') return;
      if (name !== this.pendingApp) {
        this.pendingApp = name;
        return;
      }
      if (name === this.app) return;
      this.app = name;
      this.onApp(name);
      this.emit({ kind: 'app', app: name });
    } catch {
      // 조회 실패는 무시하고 다음 폴링에서 다시 시도
    }
  }
}
