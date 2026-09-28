import { EventEmitter } from 'node:events';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_BUBBLE_SETTINGS, sanitizeBubbleSettings, type BubbleSettings } from '../../shared/bubble-settings';
import type { AppSettings, MonitoredSpace } from '../../shared/types';
import { LIMITS } from '../../shared/types';

export type Account = { userName: string; email: string }; // userName: "users/{sub}"

type StoreData = AppSettings & { account?: Account };

const DEFAULTS: StoreData = {
  ...DEFAULT_BUBBLE_SETTINGS,
  monitoredSpaces: [],
  pollIntervalSec: 5,
};

/**
 * 설정 JSON 저장소 (userData/settings.json). Token은 여기에 저장하지 않는다.
 * 쓰기는 임시 파일 → rename 으로 원자적으로 처리한다.
 */
export class AppStore extends EventEmitter<{ change: [] }> {
  private data: StoreData;
  private readonly file: string;

  constructor(dir: string) {
    super();
    this.file = join(dir, 'settings.json');
    this.data = this.load();
  }

  private load(): StoreData {
    if (!existsSync(this.file)) return structuredClone(DEFAULTS);
    try {
      const parsed = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<StoreData>;
      return {
        ...DEFAULTS,
        ...parsed,
        // 잘못 저장된 값은 기본값으로 되돌린다
        ...DEFAULT_BUBBLE_SETTINGS,
        ...sanitizeBubbleSettings(parsed),
        pollIntervalSec: Math.max(LIMITS.minPollIntervalSec, parsed.pollIntervalSec ?? DEFAULTS.pollIntervalSec),
        monitoredSpaces: Array.isArray(parsed.monitoredSpaces) ? parsed.monitoredSpaces : [],
      };
    } catch (e) {
      console.error('[store] settings.json 읽기 실패, 기본값 사용:', e);
      return structuredClone(DEFAULTS);
    }
  }

  private save(): void {
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    renameSync(tmp, this.file);
    this.emit('change');
  }

  get settings(): Readonly<StoreData> {
    return this.data;
  }

  get spaces(): readonly MonitoredSpace[] {
    return this.data.monitoredSpaces;
  }

  getSpace(spaceId: string): MonitoredSpace | undefined {
    return this.data.monitoredSpaces.find((s) => s.spaceId === spaceId);
  }

  addSpace(space: MonitoredSpace): void {
    this.data.monitoredSpaces.push(space);
    this.save();
  }

  removeSpace(spaceId: string): void {
    this.data.monitoredSpaces = this.data.monitoredSpaces.filter((s) => s.spaceId !== spaceId);
    this.save();
  }

  updateSpace(spaceId: string, patch: Partial<Omit<MonitoredSpace, 'spaceId'>>): void {
    const space = this.getSpace(spaceId);
    if (!space) return;
    Object.assign(space, patch);
    this.save();
  }

  setCustomMascotVersion(version: number): void {
    this.data.customMascotVersion = version;
    this.save();
  }

  updateBubbleSettings(patch: Partial<BubbleSettings>): void {
    Object.assign(this.data, patch);
    this.save();
  }

  setAccount(account: Account | undefined): void {
    this.data.account = account;
    this.save();
  }
}
