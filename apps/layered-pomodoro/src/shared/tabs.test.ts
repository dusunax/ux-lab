import { describe, expect, it } from 'vitest';
import { addLayer, remainingMs, type Layer } from './layers';
import {
  TAB_LIMITS,
  activeTab,
  addTab,
  defaultState,
  hasPausedWork,
  removeTab,
  renameTab,
  sanitizeState,
  switchTab,
  tabRemainingMs,
  tickState,
  updateActiveLayers,
  type AppState,
} from './tabs';

const T0 = 1_000_000;
const MIN = 60_000;
let seq = 0;
const makeId = () => `id-${++seq}`;

/** 탭 두 개: A(활성, 10분 레이어), B(5분 레이어) */
function twoTabs(): AppState {
  let state = defaultState(T0, makeId);
  state = updateActiveLayers(state, () => addLayer([], { name: 'a', minutes: 10 }, T0, makeId()));
  state = addTab(state, 'B', T0, makeId);
  state = updateActiveLayers(state, () => addLayer([], { name: 'b', minutes: 5 }, T0, makeId()));
  return switchTab(state, state.tabs[0].id, T0);
}

describe('switchTab', () => {
  it('떠나는 탭은 멈추고 돌아오면 멈춘 시간부터 이어서 흐른다', () => {
    const start = twoTabs();
    const [a, b] = start.tabs;
    // A에서 3분 흐른 뒤 B로
    const onB = switchTab(start, b.id, T0 + 3 * MIN);
    expect(activeTab(onB).id).toBe(b.id);
    // B에 7분 있는 동안 A는 멈춰 있다
    const pausedA = onB.tabs[0];
    expect(tabRemainingMs(pausedA, pausedA.layers[0], T0 + 10 * MIN)).toBe(7 * MIN);
    // A로 돌아오면 남은 7분부터 흐른다
    const back = switchTab(onB, a.id, T0 + 10 * MIN);
    const resumed = activeTab(back);
    expect(resumed.pausedAt).toBeNull();
    expect(remainingMs(resumed.layers[0], T0 + 10 * MIN)).toBe(7 * MIN);
  });

  it('비활성 탭의 레이어는 시간이 지나도 끝나지 않는다', () => {
    const start = twoTabs();
    // B(5분)는 처음부터 멈춰 있으니 20분 뒤에도 종료되지 않는다
    const { finished } = tickState(start, T0 + 20 * MIN);
    expect(finished.map((l) => l.name)).toEqual(['a']);
    expect(hasPausedWork(start.tabs[1])).toBe(true);
  });

  it('없는 탭이나 이미 활성인 탭이면 그대로다', () => {
    const start = twoTabs();
    expect(switchTab(start, 'nope', T0)).toBe(start);
    expect(switchTab(start, start.activeTabId, T0 + MIN)).toBe(start);
  });
});

describe('탭별 색', () => {
  it('색 중복 검사는 탭 안에서만 한다', () => {
    const start = twoTabs();
    expect(start.tabs[0].layers[0].colorId).toBe(start.tabs[1].layers[0].colorId);
  });
});

describe('addTab · removeTab · renameTab', () => {
  it('새 탭은 바로 활성 탭이 되고 이전 탭은 멈춘다', () => {
    const state = addTab(defaultState(T0, makeId), '  Work  ', T0 + MIN, makeId);
    expect(state.tabs).toHaveLength(2);
    expect(activeTab(state).name).toBe('Work');
    expect(state.tabs[0].pausedAt).toBe(T0 + MIN);
  });

  it('탭은 최대 개수까지만 만든다', () => {
    let state = defaultState(T0, makeId);
    for (let i = 0; i < TAB_LIMITS.maxTabs + 2; i++) state = addTab(state, '', T0, makeId);
    expect(state.tabs).toHaveLength(TAB_LIMITS.maxTabs);
  });

  it('마지막 탭은 지우지 않고, 활성 탭을 지우면 옆 탭이 이어서 흐른다', () => {
    const one = defaultState(T0, makeId);
    expect(removeTab(one, one.activeTabId, T0)).toBe(one);
    const start = twoTabs();
    const removed = removeTab(start, start.tabs[0].id, T0 + 2 * MIN);
    expect(removed.tabs).toHaveLength(1);
    expect(activeTab(removed).pausedAt).toBeNull();
    expect(remainingMs(activeTab(removed).layers[0], T0 + 2 * MIN)).toBe(5 * MIN);
  });

  it('빈 이름으로는 바꾸지 않는다', () => {
    const state = defaultState(T0, makeId);
    expect(renameTab(state, state.activeTabId, '   ').tabs[0].name).toBe('Tab 1');
    expect(renameTab(state, state.activeTabId, 'Deep work').tabs[0].name).toBe('Deep work');
  });
});

describe('clockSize', () => {
  it('기본은 M이고, 탭을 바꾸거나 지워도 유지된다', () => {
    const start = twoTabs();
    expect(start.clockSize).toBe('M');
    const large = { ...start, clockSize: 'L' as const };
    expect(switchTab(large, large.tabs[1].id, T0).clockSize).toBe('L');
    expect(removeTab(large, large.activeTabId, T0).clockSize).toBe('L');
  });

  it('저장 파일의 잘못된 크기는 M으로 맞춘다', () => {
    const start = twoTabs();
    expect(sanitizeState({ ...start, clockSize: 'XL' }, T0, makeId).clockSize).toBe('M');
    expect(sanitizeState({ ...start, clockSize: 'S' }, T0, makeId).clockSize).toBe('S');
    expect(sanitizeState(start.tabs[0].layers, T0, makeId).clockSize).toBe('M');
  });
});

describe('sanitizeState', () => {
  it('탭 이전 형식(레이어 배열)은 탭 하나로 옮긴다', () => {
    const layers: Layer[] = addLayer([], { name: 'old', minutes: 25 }, T0, 'old');
    const state = sanitizeState(layers, T0, makeId);
    expect(state.tabs).toHaveLength(1);
    expect(activeTab(state).layers.map((l) => l.id)).toEqual(['old']);
  });

  it('깨진 값이면 기본 상태로 시작한다', () => {
    expect(sanitizeState(null, T0, makeId).tabs).toHaveLength(1);
    expect(sanitizeState({ tabs: [{ id: 3 }] }, T0, makeId).tabs).toHaveLength(1);
  });

  it('비활성 탭은 멈춰 있고 활성 탭은 흐르도록 맞춘다', () => {
    const start = twoTabs();
    const saved = JSON.parse(JSON.stringify({ ...start, activeTabId: 'missing' })) as unknown;
    const state = sanitizeState(saved, T0 + MIN, makeId);
    expect(state.activeTabId).toBe(start.tabs[0].id);
    expect(state.tabs[0].pausedAt).toBeNull();
    expect(state.tabs[1].pausedAt).not.toBeNull();
  });
});
