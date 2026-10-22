/**
 * 설정 창이 main에 보내는 레이어 변경 명령. IPC로 들어온 값은 parseCommand로 검증한 뒤에만 적용한다.
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
  type Layer,
} from './layers';

export type LayerCommand =
  | { type: 'add'; name: string; minutes: number }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; to: number }
  | { type: 'color'; id: string; colorId: ColorId }
  | { type: 'restart'; id: string }
  | { type: 'duration'; id: string; minutes: number }
  | { type: 'restartAll' };

const MAX_ID_LENGTH = 64;

const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID_LENGTH;

export function parseCommand(raw: unknown): LayerCommand | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  switch (v.type) {
    case 'add':
      if (typeof v.name !== 'string' || typeof v.minutes !== 'number' || !Number.isFinite(v.minutes)) return null;
      return { type: 'add', name: v.name.slice(0, LIMITS.maxNameLength * 2), minutes: v.minutes };
    case 'remove':
    case 'restart':
      return isId(v.id) ? { type: v.type, id: v.id } : null;
    case 'move':
      return isId(v.id) && Number.isInteger(v.to) ? { type: 'move', id: v.id, to: v.to as number } : null;
    case 'duration':
      return isId(v.id) && typeof v.minutes === 'number' && Number.isFinite(v.minutes)
        ? { type: 'duration', id: v.id, minutes: v.minutes }
        : null;
    case 'restartAll':
      return { type: 'restartAll' };
    case 'color':
      return isId(v.id) && PALETTE.some((c) => c.id === v.colorId) ? { type: 'color', id: v.id, colorId: v.colorId as ColorId } : null;
    default:
      return null;
  }
}

export function applyCommand(layers: readonly Layer[], cmd: LayerCommand, now: number, makeId: () => string): Layer[] {
  switch (cmd.type) {
    case 'add':
      return addLayer(layers, { name: cmd.name, minutes: cmd.minutes }, now, makeId());
    case 'remove':
      return removeLayer(layers, cmd.id);
    case 'move':
      return moveLayer(layers, cmd.id, cmd.to);
    case 'color':
      return setColor(layers, cmd.id, cmd.colorId);
    case 'restart':
      return restartLayer(layers, cmd.id, now);
    case 'duration':
      return setDuration(layers, cmd.id, cmd.minutes, now);
    case 'restartAll':
      return restartAll(layers, now);
  }
}
