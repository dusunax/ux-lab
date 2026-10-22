/**
 * 레이어 상태와 규칙. 순수 함수만 두고 렌더러·테스트가 함께 쓴다.
 * 시간은 남은 초를 깎지 않고 종료 시각(endsAt)으로 계산해 창이 가려지거나 앱을 껐다 켜도 어긋나지 않는다.
 */

export type LayerStatus = 'running' | 'done';

export interface Layer {
  id: string;
  name: string;
  durationMs: number;
  colorId: ColorId;
  status: LayerStatus;
  /** running일 때 끝나는 시각(epoch ms) */
  endsAt: number;
}

/** 유럽 안료에서 따온 팔레트. id는 저장 파일에 쓰이므로 바꾸지 않는다. 레이어끼리 색은 겹칠 수 없으므로 레이어 최대 개수도 이 길이다 */
export const PALETTE = [
  { id: 'bordeaux', name: 'Burgundy', hex: '#7B2333' },
  { id: 'terracotta', name: 'Terracotta', hex: '#C0623B' },
  { id: 'ochre', name: 'Ochre', hex: '#C9962B' },
  { id: 'olive', name: 'Olive', hex: '#6B7A3A' },
  { id: 'sage', name: 'Sage', hex: '#8FA58A' },
  { id: 'prussian', name: 'Prussian Blue', hex: '#1F3A5F' },
  { id: 'delft', name: 'Delft Blue', hex: '#3E64A8' },
  { id: 'lavender', name: 'Lavender', hex: '#8A7BAE' },
  { id: 'rose', name: 'Dusty Rose', hex: '#C98B8B' },
  { id: 'slate', name: 'Slate', hex: '#4A4A48' },
] as const;

export type ColorId = (typeof PALETTE)[number]['id'];

export const LIMITS = {
  minLayers: 1,
  maxLayers: PALETTE.length,
  minMinutes: 1,
  maxMinutes: 240,
  maxNameLength: 24,
} as const;

const MINUTE_MS = 60_000;

export const colorOf = (id: ColorId) => PALETTE.find((c) => c.id === id) ?? PALETTE[0];

const isColorId = (v: unknown): v is ColorId => PALETTE.some((c) => c.id === v);

export const remainingMs = (layer: Layer, now: number) =>
  layer.status === 'done' ? 0 : Math.max(0, layer.endsAt - now);

/** 남은 비율 1 → 0 */
export const remainingRatio = (layer: Layer, now: number) =>
  layer.durationMs > 0 ? remainingMs(layer, now) / layer.durationMs : 0;

export const freeColors = (layers: readonly Layer[]) =>
  PALETTE.filter((c) => !layers.some((l) => l.colorId === c.id));

export const canAdd = (layers: readonly Layer[]) => layers.length < LIMITS.maxLayers;
export const canRemove = (layers: readonly Layer[]) => layers.length > LIMITS.minLayers;

export function clampMinutes(raw: number): number {
  if (!Number.isFinite(raw)) return LIMITS.minMinutes;
  return Math.min(LIMITS.maxMinutes, Math.max(LIMITS.minMinutes, Math.round(raw)));
}

export function cleanName(raw: string, fallback: string): string {
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, LIMITS.maxNameLength);
  return name || fallback;
}

export interface NewLayer {
  name: string;
  minutes: number;
}

/** 새 레이어는 비어 있는 첫 색을 받고 바로 흐르기 시작한다. 가득 찼으면 그대로 돌려준다 */
export function addLayer(layers: readonly Layer[], input: NewLayer, now: number, id: string): Layer[] {
  const color = freeColors(layers)[0];
  if (!canAdd(layers) || !color) return [...layers];
  const durationMs = clampMinutes(input.minutes) * MINUTE_MS;
  const layer: Layer = {
    id,
    name: cleanName(input.name, `Layer ${layers.length + 1}`),
    durationMs,
    colorId: color.id,
    status: 'running',
    endsAt: now + durationMs,
  };
  return [...layers, layer];
}

/** 레이어는 최소 1개 남긴다 */
export function removeLayer(layers: readonly Layer[], id: string): Layer[] {
  if (!canRemove(layers)) return [...layers];
  return layers.filter((l) => l.id !== id);
}

export function moveLayer(layers: readonly Layer[], id: string, toIndex: number): Layer[] {
  const from = layers.findIndex((l) => l.id === id);
  if (from < 0) return [...layers];
  const to = Math.min(layers.length - 1, Math.max(0, toIndex));
  const next = [...layers];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** 다른 레이어가 쓰는 색으로는 바꿀 수 없다 */
export function setColor(layers: readonly Layer[], id: string, colorId: ColorId): Layer[] {
  const takenByOther = layers.some((l) => l.colorId === colorId && l.id !== id);
  if (takenByOther) return [...layers];
  return layers.map((l) => (l.id === id ? { ...l, colorId } : l));
}

export function restartLayer(layers: readonly Layer[], id: string, now: number): Layer[] {
  return layers.map((l) => (l.id === id ? { ...l, status: 'running', endsAt: now + l.durationMs } : l));
}

/** 모든 레이어를 처음 시간부터 다시 흐르게 한다 */
export function restartAll(layers: readonly Layer[], now: number): Layer[] {
  return layers.map((l) => ({ ...l, status: 'running', endsAt: now + l.durationMs }));
}

/** 시간을 바꾸면 그 레이어는 새 시간으로 처음부터 다시 흐른다 (종료된 레이어도) */
export function setDuration(layers: readonly Layer[], id: string, minutes: number, now: number): Layer[] {
  const durationMs = clampMinutes(minutes) * MINUTE_MS;
  return layers.map((l) => (l.id === id ? { ...l, durationMs, status: 'running', endsAt: now + durationMs } : l));
}

/** 시간이 다 된 레이어를 종료됨으로 바꾸고, 이번에 끝난 레이어를 함께 돌려준다 */
export function tick(layers: readonly Layer[], now: number): { layers: Layer[]; finished: Layer[] } {
  const finished = layers.filter((l) => l.status === 'running' && l.endsAt <= now);
  if (!finished.length) return { layers: [...layers], finished };
  const next = layers.map((l) => (finished.includes(l) ? { ...l, status: 'done' as const } : l));
  return { layers: next, finished };
}

export function defaultLayers(now: number, makeId: () => string): Layer[] {
  return addLayer([], { name: 'Focus', minutes: 25 }, now, makeId());
}

/** localStorage에서 읽은 값을 검증한다. 형식이 틀리거나 색이 겹친 항목은 버린다 */
export function sanitizeLayers(raw: unknown, now: number, makeId: () => string): Layer[] {
  if (!Array.isArray(raw)) return defaultLayers(now, makeId);
  const result: Layer[] = [];
  for (const item of raw.slice(0, LIMITS.maxLayers)) {
    const layer = sanitizeLayer(item);
    if (layer && !result.some((l) => l.colorId === layer.colorId || l.id === layer.id)) result.push(layer);
  }
  return result.length ? result : defaultLayers(now, makeId);
}

function sanitizeLayer(item: unknown): Layer | null {
  if (!item || typeof item !== 'object') return null;
  const v = item as Record<string, unknown>;
  const durationMs = Number(v.durationMs);
  const endsAt = Number(v.endsAt);
  if (typeof v.id !== 'string' || typeof v.name !== 'string' || !isColorId(v.colorId)) return null;
  if (!Number.isFinite(durationMs) || durationMs < MINUTE_MS || !Number.isFinite(endsAt)) return null;
  return {
    id: v.id,
    name: cleanName(v.name, 'Layer'),
    durationMs: clampMinutes(durationMs / MINUTE_MS) * MINUTE_MS,
    colorId: v.colorId,
    status: v.status === 'done' ? 'done' : 'running',
    endsAt,
  };
}

/** 25:00 · 1:05:00 */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
