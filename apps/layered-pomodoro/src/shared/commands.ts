/**
 * 설정 창이 main에 보내는 변경 명령. IPC로 들어온 값은 parseCommand로 검증한 뒤에만 적용한다.
 * 레이어 명령은 활성 탭에, 탭 명령은 탭 목록에 적용된다.
 */
import {
  LIMITS,
  PALETTE,
  addLayer,
  moveLayer,
  removeLayer,
  restartAll,
  restartLayer,
  setColor,
  setDuration,
  type ColorId,
} from './layers';
import { TAB_LIMITS, addTab, removeTab, renameTab, switchTab, updateActiveLayers, type AppState } from './tabs';

export type Command =
  | { type: 'add'; name: string; minutes: number }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; to: number }
  | { type: 'color'; id: string; colorId: ColorId }
  | { type: 'restart'; id: string }
  | { type: 'duration'; id: string; minutes: number }
  | { type: 'restartAll' }
  | { type: 'tabAdd'; name: string }
  | { type: 'tabRemove'; id: string }
  | { type: 'tabRename'; id: string; name: string }
  | { type: 'tabSwitch'; id: string };

const MAX_ID_LENGTH = 64;

const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID_LENGTH;
const isMinutes = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function parseCommand(raw: unknown): Command | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  switch (v.type) {
    case 'add':
      if (typeof v.name !== 'string' || !isMinutes(v.minutes)) return null;
      return { type: 'add', name: v.name.slice(0, LIMITS.maxNameLength * 2), minutes: v.minutes };
    case 'remove':
    case 'restart':
    case 'tabRemove':
    case 'tabSwitch':
      return isId(v.id) ? { type: v.type, id: v.id } : null;
    case 'move':
      return isId(v.id) && Number.isInteger(v.to) ? { type: 'move', id: v.id, to: v.to as number } : null;
    case 'duration':
      return isId(v.id) && isMinutes(v.minutes) ? { type: 'duration', id: v.id, minutes: v.minutes } : null;
    case 'restartAll':
      return { type: 'restartAll' };
    case 'color':
      return isId(v.id) && PALETTE.some((c) => c.id === v.colorId) ? { type: 'color', id: v.id, colorId: v.colorId as ColorId } : null;
    case 'tabAdd':
      return typeof v.name === 'string' ? { type: 'tabAdd', name: v.name.slice(0, TAB_LIMITS.maxNameLength * 2) } : null;
    case 'tabRename':
      return isId(v.id) && typeof v.name === 'string'
        ? { type: 'tabRename', id: v.id, name: v.name.slice(0, TAB_LIMITS.maxNameLength * 2) }
        : null;
    default:
      return null;
  }
}

export function applyCommand(state: AppState, cmd: Command, now: number, makeId: () => string): AppState {
  switch (cmd.type) {
    case 'add':
      return updateActiveLayers(state, (l) => addLayer(l, { name: cmd.name, minutes: cmd.minutes }, now, makeId()));
    case 'remove':
      return updateActiveLayers(state, (l) => removeLayer(l, cmd.id));
    case 'move':
      return updateActiveLayers(state, (l) => moveLayer(l, cmd.id, cmd.to));
    case 'color':
      return updateActiveLayers(state, (l) => setColor(l, cmd.id, cmd.colorId));
    case 'restart':
      return updateActiveLayers(state, (l) => restartLayer(l, cmd.id, now));
    case 'duration':
      return updateActiveLayers(state, (l) => setDuration(l, cmd.id, cmd.minutes, now));
    case 'restartAll':
      return updateActiveLayers(state, (l) => restartAll(l, now));
    case 'tabAdd':
      return addTab(state, cmd.name, now, makeId);
    case 'tabRemove':
      return removeTab(state, cmd.id, now);
    case 'tabRename':
      return renameTab(state, cmd.id, cmd.name);
    case 'tabSwitch':
      return switchTab(state, cmd.id, now);
  }
}
