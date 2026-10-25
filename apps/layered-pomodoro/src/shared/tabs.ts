/**
 * 탭 상태와 규칙. 탭마다 레이어 목록이 따로 있고(색 중복 검사도 탭 안에서만), 활성 탭은 하나다.
 * 비활성 탭은 시간이 멈춘다: 비활성이 된 시각(pausedAt)을 남기고, 다시 활성이 되면
 * 흐르던 레이어의 종료 시각을 멈춰 있던 만큼 뒤로 민다. 레이어 규칙(layers.ts)은 그대로 쓴다.
 */
import { defaultLayers, remainingMs, sanitizeLayers, tick, type Layer } from './layers';

export interface Tab {
  id: string;
  name: string;
  layers: Layer[];
  /** 비활성 탭이 멈춘 시각(epoch ms). 활성 탭은 null */
  pausedAt: number | null;
}

export interface AppState {
  tabs: Tab[];
  activeTabId: string;
}

export const TAB_LIMITS = {
  minTabs: 1,
  maxTabs: 8,
  maxNameLength: 16,
} as const;

export const activeTab = (state: AppState): Tab =>
  state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0];

export const canAddTab = (state: AppState) => state.tabs.length < TAB_LIMITS.maxTabs;
export const canRemoveTab = (state: AppState) => state.tabs.length > TAB_LIMITS.minTabs;

/** 탭 기준 남은 시간. 멈춘 탭은 멈춘 시각에서 잰다 */
export const tabRemainingMs = (tab: Tab, layer: Layer, now: number) => remainingMs(layer, tab.pausedAt ?? now);

/** 흐르다 멈춘 레이어가 있는 탭 */
export const hasPausedWork = (tab: Tab) => tab.pausedAt !== null && tab.layers.some((l) => l.status === 'running');

export function cleanTabName(raw: string, fallback: string): string {
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, TAB_LIMITS.maxNameLength);
  return name || fallback;
}

function pause(tab: Tab, now: number): Tab {
  return tab.pausedAt === null ? { ...tab, pausedAt: now } : tab;
}

function resume(tab: Tab, now: number): Tab {
  if (tab.pausedAt === null) return tab;
  const shift = Math.max(0, now - tab.pausedAt);
  const layers = tab.layers.map((l) => (l.status === 'running' ? { ...l, endsAt: l.endsAt + shift } : l));
  return { ...tab, layers, pausedAt: null };
}

/** 활성 탭의 레이어만 바꾼다. 레이어 명령은 모두 활성 탭에 적용된다 */
export function updateActiveLayers(state: AppState, fn: (layers: Layer[]) => Layer[]): AppState {
  const id = activeTab(state).id;
  return { ...state, tabs: state.tabs.map((t) => (t.id === id ? { ...t, layers: fn(t.layers) } : t)) };
}

/** 지금 탭을 멈추고 대상 탭을 이어서 흐르게 한다 */
export function switchTab(state: AppState, id: string, now: number): AppState {
  if (id === activeTab(state).id || !state.tabs.some((t) => t.id === id)) return state;
  const tabs = state.tabs.map((t) => (t.id === id ? resume(t, now) : pause(t, now)));
  return { tabs, activeTabId: id };
}

/** 새 탭은 기본 레이어 하나를 갖고 바로 활성 탭이 된다 */
export function addTab(state: AppState, name: string, now: number, makeId: () => string): AppState {
  if (!canAddTab(state)) return state;
  const tab: Tab = {
    id: makeId(),
    name: cleanTabName(name, `Tab ${state.tabs.length + 1}`),
    layers: defaultLayers(now, makeId),
    pausedAt: now,
  };
  return switchTab({ ...state, tabs: [...state.tabs, tab] }, tab.id, now);
}

/** 탭은 최소 1개 남긴다. 활성 탭을 지우면 옆 탭이 이어서 흐른다 */
export function removeTab(state: AppState, id: string, now: number): AppState {
  const index = state.tabs.findIndex((t) => t.id === id);
  if (!canRemoveTab(state) || index < 0) return state;
  const tabs = state.tabs.filter((t) => t.id !== id);
  if (id !== state.activeTabId) return { ...state, tabs };
  const next = tabs[Math.min(index, tabs.length - 1)];
  return { tabs: tabs.map((t) => (t.id === next.id ? resume(t, now) : t)), activeTabId: next.id };
}

export function renameTab(state: AppState, id: string, name: string): AppState {
  return { ...state, tabs: state.tabs.map((t) => (t.id === id ? { ...t, name: cleanTabName(name, t.name) } : t)) };
}

/** 활성 탭만 시간이 흐르므로 종료 검사도 활성 탭에만 한다 */
export function tickState(state: AppState, now: number): { state: AppState; finished: Layer[] } {
  const { layers, finished } = tick(activeTab(state).layers, now);
  if (!finished.length) return { state, finished };
  return { state: updateActiveLayers(state, () => layers), finished };
}

export function defaultState(now: number, makeId: () => string): AppState {
  const id = makeId();
  return { tabs: [{ id, name: 'Tab 1', layers: defaultLayers(now, makeId), pausedAt: null }], activeTabId: id };
}

/**
 * 저장 파일을 검증한다. 탭 이전 형식(레이어 배열)은 탭 하나로 옮긴다.
 * 활성 탭은 흐르고(pausedAt null) 비활성 탭은 멈춰 있도록(pausedAt 숫자) 맞춘다.
 */
export function sanitizeState(raw: unknown, now: number, makeId: () => string): AppState {
  if (Array.isArray(raw)) {
    const id = makeId();
    return { tabs: [{ id, name: 'Tab 1', layers: sanitizeLayers(raw, now, makeId), pausedAt: null }], activeTabId: id };
  }
  const v = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const tabs: Tab[] = [];
  for (const item of Array.isArray(v.tabs) ? v.tabs.slice(0, TAB_LIMITS.maxTabs) : []) {
    const tab = sanitizeTab(item, tabs.length, now, makeId);
    if (tab && !tabs.some((t) => t.id === tab.id)) tabs.push(tab);
  }
  if (!tabs.length) return defaultState(now, makeId);
  const activeTabId = tabs.some((t) => t.id === v.activeTabId) ? (v.activeTabId as string) : tabs[0].id;
  return {
    tabs: tabs.map((t) => (t.id === activeTabId ? resume(t, now) : pause(t, now))),
    activeTabId,
  };
}

function sanitizeTab(item: unknown, index: number, now: number, makeId: () => string): Tab | null {
  if (!item || typeof item !== 'object') return null;
  const v = item as Record<string, unknown>;
  if (typeof v.id !== 'string' || !v.id) return null;
  const pausedAt = Number(v.pausedAt);
  return {
    id: v.id,
    name: cleanTabName(typeof v.name === 'string' ? v.name : '', `Tab ${index + 1}`),
    layers: sanitizeLayers(v.layers, now, makeId),
    pausedAt: v.pausedAt === null || !Number.isFinite(pausedAt) ? null : Math.min(pausedAt, now),
  };
}
