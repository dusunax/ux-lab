import { describe, expect, it } from 'vitest';
import { applyCommand, parseCommand } from './commands';
import { activeTab, defaultState } from './tabs';

const T0 = 1_000_000;
let seq = 0;
const makeId = () => `id-${++seq}`;

describe('parseCommand', () => {
  it('형식이 맞는 명령만 통과시킨다', () => {
    expect(parseCommand({ type: 'add', name: 'Reading', minutes: 25 })).toEqual({ type: 'add', name: 'Reading', minutes: 25 });
    expect(parseCommand({ type: 'move', id: 'a', to: 2 })).toEqual({ type: 'move', id: 'a', to: 2 });
    expect(parseCommand({ type: 'color', id: 'a', colorId: 'delft' })).toEqual({ type: 'color', id: 'a', colorId: 'delft' });
    expect(parseCommand({ type: 'duration', id: 'a', minutes: 15 })).toEqual({ type: 'duration', id: 'a', minutes: 15 });
    expect(parseCommand({ type: 'restartAll', extra: 1 })).toEqual({ type: 'restartAll' });
    expect(parseCommand({ type: 'tabAdd', name: 'Work' })).toEqual({ type: 'tabAdd', name: 'Work' });
    expect(parseCommand({ type: 'tabSwitch', id: 't1' })).toEqual({ type: 'tabSwitch', id: 't1' });
    expect(parseCommand({ type: 'tabRename', id: 't1', name: 'x' })).toEqual({ type: 'tabRename', id: 't1', name: 'x' });
    expect(parseCommand({ type: 'clockSize', size: 'L' })).toEqual({ type: 'clockSize', size: 'L' });
  });

  it('모르는 명령, 잘못된 값은 버린다', () => {
    expect(parseCommand(null)).toBeNull();
    expect(parseCommand({ type: 'drop-table' })).toBeNull();
    expect(parseCommand({ type: 'add', name: 'x', minutes: Number.NaN })).toBeNull();
    expect(parseCommand({ type: 'move', id: 'a', to: 1.5 })).toBeNull();
    expect(parseCommand({ type: 'color', id: 'a', colorId: '#ff0000' })).toBeNull();
    expect(parseCommand({ type: 'remove', id: '' })).toBeNull();
    expect(parseCommand({ type: 'duration', id: 'a', minutes: '15' })).toBeNull();
    expect(parseCommand({ type: 'tabRename', id: 't1' })).toBeNull();
    expect(parseCommand({ type: 'tabRemove', id: 7 })).toBeNull();
    expect(parseCommand({ type: 'clockSize', size: 'XL' })).toBeNull();
  });
});

describe('applyCommand', () => {
  it('레이어 명령은 활성 탭에만 적용한다', () => {
    let state = defaultState(T0, makeId);
    state = applyCommand(state, { type: 'add', name: 'B', minutes: 2 }, T0, makeId);
    expect(activeTab(state).layers.map((l) => l.name)).toEqual(['Focus', 'B']);
    const firstTab = state.activeTabId;
    state = applyCommand(state, { type: 'tabAdd', name: 'Two' }, T0, makeId);
    state = applyCommand(state, { type: 'add', name: 'C', minutes: 3 }, T0, makeId);
    expect(activeTab(state).layers.map((l) => l.name)).toEqual(['Focus', 'C']);
    expect(state.tabs.find((t) => t.id === firstTab)?.layers).toHaveLength(2);
  });

  it('탭 명령을 적용한다', () => {
    let state = defaultState(T0, makeId);
    const first = state.activeTabId;
    state = applyCommand(state, { type: 'tabAdd', name: 'Two' }, T0, makeId);
    state = applyCommand(state, { type: 'tabRename', id: state.activeTabId, name: 'Deux' }, T0, makeId);
    expect(activeTab(state).name).toBe('Deux');
    state = applyCommand(state, { type: 'tabSwitch', id: first }, T0, makeId);
    expect(state.activeTabId).toBe(first);
    state = applyCommand(state, { type: 'tabRemove', id: first }, T0, makeId);
    expect(state.tabs.map((t) => t.name)).toEqual(['Deux']);
  });
});
