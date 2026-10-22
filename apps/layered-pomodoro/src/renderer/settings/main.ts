import '../shared/base.css';
import './settings.css';
import { LIMITS, canAdd, canRemove, freeColors, type ColorId, type Layer } from '../../shared/layers';
import { api } from '../shared/api';
import { chime } from '../shared/chime';
import { buildRow, paintRow, type RowAction, type RowRefs } from './view';

const PAINT_MS = 250;
/** 전체 리셋은 실수로 누르지 않도록 이 시간 안에 한 번 더 눌러야 실행된다 */
const RESET_CONFIRM_MS = 3000;
const RESET_LABEL = '↻ 전체 리셋';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const dom = {
  list: $<HTMLOListElement>('layers'),
  tally: $('tally'),
  summary: $('summary'),
  form: $<HTMLFormElement>('addForm'),
  addName: $<HTMLInputElement>('addName'),
  addMinutes: $<HTMLInputElement>('addMinutes'),
  addButton: $<HTMLButtonElement>('addButton'),
  addHint: $('addHint'),
  testSound: $<HTMLButtonElement>('testSound'),
  resetAll: $<HTMLButtonElement>('resetAll'),
};

const state = {
  layers: [] as Layer[],
  pickerFor: null as string | null,
  dragId: null as string | null,
};
let rowRefs = new Map<string, RowRefs>();
let pendingRender = false;

function render(): void {
  pendingRender = false;
  const { layers } = state;
  if (state.pickerFor && !layers.some((l) => l.id === state.pickerFor)) state.pickerFor = null;
  rowRefs = new Map();
  const rows = layers.map((layer, index) => {
    const { li, refs } = buildRow(layer, {
      index,
      total: layers.length,
      pickerOpen: state.pickerFor === layer.id,
      removable: canRemove(layers),
      takenColors: new Set(layers.filter((l) => l.id !== layer.id).map((l) => l.colorId)),
    });
    rowRefs.set(layer.id, refs);
    return li;
  });
  dom.list.replaceChildren(...rows);
  renderForm();
  paint();
}

function renderForm(): void {
  const full = !canAdd(state.layers);
  const running = state.layers.filter((l) => l.status === 'running').length;
  dom.tally.textContent = `${state.layers.length} / ${LIMITS.maxLayers}`;
  dom.summary.textContent = `흐르는 중 ${running} · 종료됨 ${state.layers.length - running}`;
  dom.addButton.disabled = full;
  dom.addName.disabled = full;
  dom.addMinutes.disabled = full;
  const next = freeColors(state.layers)[0];
  dom.addHint.textContent = full
    ? `색이 겹치지 않도록 레이어는 최대 ${LIMITS.maxLayers}개까지예요.`
    : `다음 레이어 색 · ${next?.name ?? ''}`;
  dom.form.style.setProperty('--next', next?.hex ?? 'transparent');
}

function paint(): void {
  const now = Date.now();
  for (const layer of state.layers) {
    const refs = rowRefs.get(layer.id);
    if (refs) paintRow(refs, layer, now);
  }
}

function closePicker(): void {
  if (!state.pickerFor) return;
  state.pickerFor = null;
  render();
}

function onRowAction(action: RowAction, id: string, target: HTMLElement): void {
  const index = state.layers.findIndex((l) => l.id === id);
  switch (action) {
    case 'picker':
      state.pickerFor = state.pickerFor === id ? null : id;
      return render();
    case 'color':
      state.pickerFor = null;
      return api.command({ type: 'color', id, colorId: target.dataset.color as ColorId });
    case 'up':
      return api.command({ type: 'move', id, to: index - 1 });
    case 'down':
      return api.command({ type: 'move', id, to: index + 1 });
    case 'restart':
      return api.command({ type: 'restart', id });
    case 'remove':
      return api.command({ type: 'remove', id });
  }
}

dom.list.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
  const id = target?.closest<HTMLElement>('.layer')?.dataset.id;
  if (!target || !id || (target as HTMLButtonElement).disabled) return;
  e.stopPropagation();
  onRowAction(target.dataset.action as RowAction, id, target);
});

document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('.picker')) closePicker();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePicker();
});

dom.form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!canAdd(state.layers)) return;
  api.command({ type: 'add', name: dom.addName.value, minutes: Number(dom.addMinutes.value) });
  dom.addName.value = '';
});

dom.testSound.addEventListener('click', () => chime());

// 레이어 시간 수정: Enter·포커스 이동으로 값이 확정될 때 보낸다
dom.list.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  const id = input.dataset.duration;
  const minutes = Number(input.value);
  if (!id || !input.value || !Number.isFinite(minutes)) return render();
  api.command({ type: 'duration', id, minutes });
});
dom.list.addEventListener('keydown', (e) => {
  const input = e.target as HTMLInputElement;
  if (e.key === 'Enter' && input.dataset.duration) input.blur();
});
// 시간을 입력하는 동안 다른 레이어가 끝나도 입력이 날아가지 않게, 포커스가 빠진 뒤 다시 그린다
dom.list.addEventListener('focusout', () => {
  if (pendingRender) render();
});

let resetTimer: ReturnType<typeof setTimeout> | null = null;
function disarmReset(): void {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = null;
  dom.resetAll.classList.remove('armed');
  dom.resetAll.textContent = RESET_LABEL;
}
dom.resetAll.addEventListener('click', () => {
  if (!resetTimer) {
    dom.resetAll.classList.add('armed');
    dom.resetAll.textContent = '한 번 더 누르면 리셋';
    resetTimer = setTimeout(disarmReset, RESET_CONFIRM_MS);
    return;
  }
  disarmReset();
  api.command({ type: 'restartAll' });
});

/** 줄을 끌어 순서를 바꾼다. 놓는 위치는 대상 줄의 위·아래 절반으로 정한다 */
function setupDrag(): void {
  const rowOf = (e: DragEvent) => (e.target as HTMLElement).closest<HTMLLIElement>('.layer');
  const isAfter = (row: HTMLElement, e: DragEvent) => {
    const rect = row.getBoundingClientRect();
    return e.clientY > rect.top + rect.height / 2;
  };
  const clearDropMarks = () =>
    dom.list.querySelectorAll('.drop-before, .drop-after').forEach((n) => n.classList.remove('drop-before', 'drop-after'));

  dom.list.addEventListener('dragstart', (e) => {
    const row = rowOf(e);
    if (!row || !e.dataTransfer) return;
    state.dragId = row.dataset.id ?? null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', state.dragId ?? '');
    row.classList.add('dragging');
  });
  dom.list.addEventListener('dragover', (e) => {
    const row = rowOf(e);
    if (!row || !state.dragId) return;
    e.preventDefault();
    clearDropMarks();
    row.classList.add(isAfter(row, e) ? 'drop-after' : 'drop-before');
  });
  dom.list.addEventListener('drop', (e) => {
    const row = rowOf(e);
    const dragId = state.dragId;
    if (!row || !dragId) return;
    e.preventDefault();
    const from = state.layers.findIndex((l) => l.id === dragId);
    let to = state.layers.findIndex((l) => l.id === row.dataset.id) + (isAfter(row, e) ? 1 : 0);
    if (from < to) to -= 1;
    state.dragId = null;
    api.command({ type: 'move', id: dragId, to });
  });
  dom.list.addEventListener('dragend', () => {
    state.dragId = null;
    clearDropMarks();
    dom.list.querySelectorAll('.dragging').forEach((n) => n.classList.remove('dragging'));
  });
}

setupDrag();
api.onLayers((layers) => {
  state.layers = layers;
  const editing = (document.activeElement as HTMLElement | null)?.dataset?.duration;
  if (editing) pendingRender = true;
  else render();
});
void api.getLayers().then((layers) => {
  state.layers = layers;
  render();
});
setInterval(paint, PAINT_MS);
