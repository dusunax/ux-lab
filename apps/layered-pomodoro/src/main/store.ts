import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import { applyCommand, type Command } from '../shared/commands';
import type { Layer } from '../shared/layers';
import { sanitizeState, tickState, type AppState } from '../shared/tabs';

const TICK_MS = 250;
/** 탭 이전에는 레이어 배열을 저장했다. 같은 파일을 읽어 sanitizeState가 탭 하나로 옮긴다 */
const FILE_NAME = 'layers.json';

interface StoreEvents {
  onChange: (state: AppState) => void;
  onFinished: (finished: Layer[]) => void;
}

/**
 * 탭·레이어 상태의 단일 원본. userData/layers.json에 저장하고 250ms마다 활성 탭의 종료를 검사한다.
 * 앱을 꺼 둔 사이 끝난 레이어(활성 탭)는 시작할 때 소리 없이 종료됨으로 바꾼다. 비활성 탭은 멈춰 있다.
 */
export class StateStore {
  private state: AppState;
  private readonly file = join(app.getPath('userData'), FILE_NAME);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly events: StoreEvents) {
    this.state = tickState(this.read(), Date.now()).state;
    this.write();
  }

  get snapshot(): AppState {
    return this.state;
  }

  start(): void {
    this.timer ??= setInterval(() => this.check(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  apply(cmd: Command): void {
    this.commit(applyCommand(this.state, cmd, Date.now(), randomUUID));
  }

  private check(): void {
    const { state, finished } = tickState(this.state, Date.now());
    if (!finished.length) return;
    this.commit(state);
    this.events.onFinished(finished);
  }

  private commit(next: AppState): void {
    this.state = next;
    this.write();
    this.events.onChange(next);
  }

  private read(): AppState {
    try {
      return sanitizeState(JSON.parse(readFileSync(this.file, 'utf8')), Date.now(), randomUUID);
    } catch {
      return sanitizeState(null, Date.now(), randomUUID);
    }
  }

  private write(): void {
    try {
      writeFileSync(this.file, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('state save failed:', error);
    }
  }
}
