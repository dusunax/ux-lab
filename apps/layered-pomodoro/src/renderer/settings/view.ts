/**
 * 레이어 목록 한 줄. 사용자 입력(이름)은 textContent로만 넣는다.
 * 버튼은 data-action으로 표시하고 이벤트는 main.ts에서 위임 처리한다.
 */
import { LIMITS, PALETTE, colorOf, formatClock, remainingMs, type Layer } from '../../shared/layers';

export type RowAction = 'picker' | 'color' | 'up' | 'down' | 'restart' | 'remove';

export const STATUS_LABEL: Record<Layer['status'], string> = {
  running: '흐르는 중',
  done: '종료됨',
};

export interface RowRefs {
  clock: HTMLElement;
}

interface RowContext {
  index: number;
  total: number;
  pickerOpen: boolean;
  removable: boolean;
  /** 다른 레이어가 이미 쓰는 색 */
  takenColors: ReadonlySet<string>;
}

function h<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(action: RowAction, label: string, glyph: string, disabled = false): HTMLButtonElement {
  const btn = h('button', `icon-btn ${action}`, glyph);
  btn.type = 'button';
  btn.dataset.action = action;
  btn.title = label;
  btn.setAttribute('aria-label', label);
  btn.disabled = disabled;
  return btn;
}

function buildPicker(layer: Layer, taken: ReadonlySet<string>): HTMLElement {
  const picker = h('div', 'picker');
  picker.setAttribute('role', 'listbox');
  picker.setAttribute('aria-label', '레이어 색상');
  for (const color of PALETTE) {
    const isTaken = taken.has(color.id);
    const isCurrent = color.id === layer.colorId;
    const swatch = h('button', 'picker-swatch');
    swatch.type = 'button';
    swatch.dataset.action = 'color';
    swatch.dataset.color = color.id;
    swatch.style.setProperty('--c', color.hex);
    swatch.disabled = isTaken;
    swatch.setAttribute('role', 'option');
    swatch.setAttribute('aria-selected', String(isCurrent));
    swatch.title = isTaken ? `${color.name} · 다른 레이어가 사용 중` : color.name;
    swatch.setAttribute('aria-label', swatch.title);
    picker.append(swatch);
  }
  const caption = h('p', 'picker-caption', '같은 색은 한 레이어만 쓸 수 있어요');
  picker.append(caption);
  return picker;
}

/** 레이어 시간(분) 입력. 값은 change(Enter·포커스 이동) 때 main.ts가 duration 명령으로 보낸다 */
function buildDuration(layer: Layer): HTMLLabelElement {
  const label = h('label', 'duration');
  const input = h('input', 'duration-input');
  input.type = 'number';
  input.min = String(LIMITS.minMinutes);
  input.max = String(LIMITS.maxMinutes);
  input.step = '1';
  input.value = String(layer.durationMs / 60_000);
  input.draggable = false;
  input.dataset.duration = layer.id;
  input.setAttribute('aria-label', `${layer.name} 시간(분)`);
  label.append(input, h('span', 'duration-unit', 'min'));
  return label;
}

export function buildRow(layer: Layer, ctx: RowContext): { li: HTMLLIElement; refs: RowRefs } {
  const color = colorOf(layer.colorId);
  const li = h('li', `layer ${layer.status}`);
  li.dataset.id = layer.id;
  li.draggable = true;
  li.style.setProperty('--c', color.hex);

  const handle = h('span', 'handle', '⠿');
  handle.setAttribute('aria-hidden', 'true');

  const swatch = h('button', 'swatch');
  swatch.type = 'button';
  swatch.dataset.action = 'picker';
  swatch.setAttribute('aria-label', `색상 변경 · 현재 ${color.name}`);
  swatch.setAttribute('aria-expanded', String(ctx.pickerOpen));

  const meta = h('div', 'meta');
  const sub = h('span', 'sub');
  sub.append(h('span', 'status', STATUS_LABEL[layer.status]), buildDuration(layer));
  meta.append(h('strong', 'name', layer.name), sub);

  const clock = h('time', 'clock', formatClock(remainingMs(layer, Date.now())));

  const actions = h('div', 'actions');
  actions.append(
    actionButton('up', '위로', '↑', ctx.index === 0),
    actionButton('down', '아래로', '↓', ctx.index === ctx.total - 1),
    actionButton('restart', '다시 시작', '↻'),
    actionButton('remove', ctx.removable ? '삭제' : '레이어는 최소 1개', '×', !ctx.removable),
  );

  li.append(handle, swatch, meta, clock, actions);
  if (ctx.pickerOpen) li.append(buildPicker(layer, ctx.takenColors));
  return { li, refs: { clock } };
}

export function paintRow(refs: RowRefs, layer: Layer, now: number): void {
  refs.clock.textContent = formatClock(remainingMs(layer, now));
}
