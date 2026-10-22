import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import { applyCommand, type LayerCommand } from '../shared/commands';
import { sanitizeLayers, tick, type Layer } from '../shared/layers';

const TICK_MS = 250;
const FILE_NAME = 'layers.json';

interface StoreEvents {
  onChange: (layers: Layer[]) => void;
  onFinished: (finished: Layer[]) => void;
}

/**
 * 레이어 상태의 단일 원본. userData/layers.json에 저장하고 250ms마다 종료를 검사한다.
 * 앱을 꺼 둔 사이 끝난 레이어는 시작할 때 소리 없이 종료됨으로 바꾼다.
 */
export class LayerStore {
  private layers: Layer[];
  private readonly file = join(app.getPath('userData'), FILE_NAME);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly events: StoreEvents) {
    this.layers = tick(this.read(), Date.now()).layers;
    this.write();
  }

  get snapshot(): Layer[] {
    return this.layers;
  }

  start(): void {
    this.timer ??= setInterval(() => this.check(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  apply(cmd: LayerCommand): void {
    this.commit(applyCommand(this.layers, cmd, Date.now(), randomUUID));
  }

  private check(): void {
    const { layers, finished } = tick(this.layers, Date.now());
    if (!finished.length) return;
    this.commit(layers);
    this.events.onFinished(finished);
  }

  private commit(next: Layer[]): void {
    this.layers = next;
    this.write();
    this.events.onChange(next);
  }

  private read(): Layer[] {
    try {
      return sanitizeLayers(JSON.parse(readFileSync(this.file, 'utf8')), Date.now(), randomUUID);
    } catch {
      return sanitizeLayers(null, Date.now(), randomUUID);
    }
  }

  private write(): void {
    try {
      writeFileSync(this.file, JSON.stringify(this.layers, null, 2));
    } catch (error) {
      console.error('layers save failed:', error);
    }
  }
}
