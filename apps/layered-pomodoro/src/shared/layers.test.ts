import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  PALETTE,
  addLayer,
  formatClock,
  moveLayer,
  remainingMs,
  removeLayer,
  restartAll,
  restartLayer,
  sanitizeLayers,
  setColor,
  setDuration,
  tick,
  type Layer,
} from './layers';

const T0 = 1_000_000;
let seq = 0;
const makeId = () => `id-${++seq}`;

const stack = (count: number) => {
  let layers: Layer[] = [];
  for (let i = 0; i < count; i++) layers = addLayer(layers, { name: `L${i}`, minutes: i + 1 }, T0, makeId());
  return layers;
};

describe('addLayer', () => {
  it('비어 있는 색을 순서대로 배정하고 바로 흐르게 한다', () => {
    const layers = stack(3);
    expect(layers.map((l) => l.colorId)).toEqual(PALETTE.slice(0, 3).map((c) => c.id));
    expect(layers.every((l) => l.status === 'running')).toBe(true);
    expect(remainingMs(layers[2], T0)).toBe(3 * 60_000);
  });

  it('팔레트 개수를 넘으면 더 추가하지 않는다', () => {
    const full = stack(LIMITS.maxLayers);
    expect(addLayer(full, { name: 'x', minutes: 5 }, T0, makeId())).toHaveLength(LIMITS.maxLayers);
  });

  it('시간과 이름을 정리한다', () => {
    const [layer] = addLayer([], { name: '   ', minutes: 9999 }, T0, makeId());
    expect(layer.name).toBe('Layer 1');
    expect(layer.durationMs).toBe(LIMITS.maxMinutes * 60_000);
  });
});

describe('removeLayer', () => {
  it('마지막 한 개는 지우지 않는다', () => {
    const one = stack(1);
    expect(removeLayer(one, one[0].id)).toHaveLength(1);
    const two = stack(2);
    expect(removeLayer(two, two[0].id).map((l) => l.id)).toEqual([two[1].id]);
  });

  it('지운 레이어의 색은 다시 쓸 수 있다', () => {
    const layers = stack(2);
    const freed = removeLayer(layers, layers[0].id);
    const added = addLayer(freed, { name: 'n', minutes: 1 }, T0, makeId());
    expect(added[1].colorId).toBe(layers[0].colorId);
  });
});

describe('moveLayer', () => {
  it('지정한 위치로 옮기고 범위를 벗어나면 끝으로 붙인다', () => {
    const layers = stack(3);
    expect(moveLayer(layers, layers[0].id, 2).map((l) => l.name)).toEqual(['L1', 'L2', 'L0']);
    expect(moveLayer(layers, layers[2].id, -5).map((l) => l.name)).toEqual(['L2', 'L0', 'L1']);
  });
});

describe('setColor', () => {
  it('다른 레이어가 쓰는 색으로는 바꾸지 않는다', () => {
    const layers = stack(2);
    expect(setColor(layers, layers[0].id, layers[1].colorId)[0].colorId).toBe(layers[0].colorId);
  });

  it('빈 색으로는 바꾼다', () => {
    const layers = stack(2);
    expect(setColor(layers, layers[0].id, 'slate')[0].colorId).toBe('slate');
  });
});

describe('tick', () => {
  it('시간이 다 된 레이어만 종료됨으로 바꾸고 한 번만 알린다', () => {
    const layers = stack(2);
    const first = tick(layers, T0 + 60_000);
    expect(first.finished.map((l) => l.name)).toEqual(['L0']);
    expect(first.layers.map((l) => l.status)).toEqual(['done', 'running']);
    expect(tick(first.layers, T0 + 61_000).finished).toHaveLength(0);
  });

  it('재시작하면 다시 흐른다', () => {
    const { layers } = tick(stack(1), T0 + 60_000);
    const restarted = restartLayer(layers, layers[0].id, T0 + 90_000);
    expect(restarted[0].status).toBe('running');
    expect(remainingMs(restarted[0], T0 + 90_000)).toBe(60_000);
  });
});

describe('setDuration', () => {
  it('흐르는 레이어는 새 시간으로 처음부터 다시 흐른다', () => {
    const [layer] = stack(1);
    const now = T0 + 30_000;
    const [changed] = setDuration([layer], layer.id, 5, now);
    expect(changed.durationMs).toBe(5 * 60_000);
    expect(changed.status).toBe('running');
    expect(remainingMs(changed, now)).toBe(5 * 60_000);
  });

  it('종료된 레이어도 새 시간으로 다시 흐른다', () => {
    const { layers } = tick(stack(1), T0 + 60_000);
    const now = T0 + 90_000;
    const [changed] = setDuration(layers, layers[0].id, 3, now);
    expect(changed.status).toBe('running');
    expect(remainingMs(changed, now)).toBe(3 * 60_000);
  });

  it('다른 레이어는 건드리지 않는다', () => {
    const layers = stack(2);
    const changed = setDuration(layers, layers[0].id, 7, T0 + 10_000);
    expect(changed[1]).toBe(layers[1]);
  });
});

describe('restartAll', () => {
  it('모든 레이어를 처음 시간부터 다시 흐르게 한다', () => {
    const { layers } = tick(stack(3), T0 + 2 * 60_000);
    const now = T0 + 5 * 60_000;
    const reset = restartAll(layers, now);
    expect(reset.every((l) => l.status === 'running')).toBe(true);
    expect(reset.map((l) => remainingMs(l, now))).toEqual(layers.map((l) => l.durationMs));
  });
});

describe('sanitizeLayers', () => {
  it('깨진 값이면 기본 레이어 하나로 시작한다', () => {
    expect(sanitizeLayers('nope', T0, makeId)).toHaveLength(1);
    expect(sanitizeLayers([{ id: 1 }], T0, makeId)).toHaveLength(1);
  });

  it('색이 겹치는 항목은 버린다', () => {
    const [a, b] = stack(2);
    const result = sanitizeLayers([a, { ...b, colorId: a.colorId }], T0, makeId);
    expect(result.map((l) => l.id)).toEqual([a.id]);
  });
});

describe('formatClock', () => {
  it('분:초, 한 시간 이상이면 시:분:초', () => {
    expect(formatClock(25 * 60_000)).toBe('25:00');
    expect(formatClock(1_500)).toBe('00:02');
    expect(formatClock(65 * 60_000)).toBe('1:05:00');
  });
});
