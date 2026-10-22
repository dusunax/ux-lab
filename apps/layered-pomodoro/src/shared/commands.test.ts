import { describe, expect, it } from 'vitest';
import { applyCommand, parseCommand } from './commands';
import { addLayer, type Layer } from './layers';

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
  });

  it('모르는 명령, 잘못된 값은 버린다', () => {
    expect(parseCommand(null)).toBeNull();
    expect(parseCommand({ type: 'drop-table' })).toBeNull();
    expect(parseCommand({ type: 'add', name: 'x', minutes: Number.NaN })).toBeNull();
    expect(parseCommand({ type: 'move', id: 'a', to: 1.5 })).toBeNull();
    expect(parseCommand({ type: 'color', id: 'a', colorId: '#ff0000' })).toBeNull();
    expect(parseCommand({ type: 'remove', id: '' })).toBeNull();
    expect(parseCommand({ type: 'duration', id: 'a', minutes: '15' })).toBeNull();
  });
});

describe('applyCommand', () => {
  it('명령을 레이어 규칙대로 적용한다', () => {
    let layers: Layer[] = addLayer([], { name: 'A', minutes: 1 }, T0, makeId());
    layers = applyCommand(layers, { type: 'add', name: 'B', minutes: 2 }, T0, makeId);
    expect(layers.map((l) => l.name)).toEqual(['A', 'B']);
    layers = applyCommand(layers, { type: 'move', id: layers[1].id, to: 0 }, T0, makeId);
    expect(layers.map((l) => l.name)).toEqual(['B', 'A']);
    layers = applyCommand(layers, { type: 'color', id: layers[0].id, colorId: layers[1].colorId }, T0, makeId);
    expect(layers[0].colorId).not.toBe(layers[1].colorId);
  });
});
