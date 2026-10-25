import '../shared/base.css';
import './clock.css';
import { formatClock, remainingMs, type Layer } from '../../shared/layers';
import { activeTab, type AppState } from '../../shared/tabs';
import { api } from '../shared/api';
import { chime } from '../shared/chime';
import { paintRings, renderRings, soonest, svgEl, type RingGeometry, type RingRefs } from '../shared/rings';

const CENTER = 140;
const GEOMETRY: RingGeometry = { center: CENTER, outer: 96, inner: 56, maxStroke: 14 };
const TICK_OUTER = 116;
/** 눈금 길이: 분 · 5분 · 15분 */
const TICK_LENGTH = { minor: 5, major: 9, quarter: 15 } as const;
const PAINT_MS = 250;
const FLASH_MS = 3600;
const HOUR_MS = 3_600_000;

const $ = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
const dom = {
  clock: $<HTMLElement>('clock'),
  dial: $<SVGGElement>('dial'),
  rings: $<SVGGElement>('rings'),
  tab: $<HTMLElement>('centerTab'),
  name: $<HTMLElement>('centerName'),
  time: $<HTMLElement>('centerClock'),
  status: $<HTMLElement>('centerStatus'),
  crown: $<HTMLButtonElement>('crown'),
};

let layers: Layer[] = [];
let refs: RingRefs = new Map();
/** 방금 끝나 깜빡이는 링 id → 깜빡임이 끝나는 시각 */
const flashing = new Map<string, number>();

/** 분 눈금 60개. 5분은 길게, 12·3·6·9시 자리는 가장 길고 굵게 */
function drawDial(): void {
  for (let i = 0; i < 60; i++) {
    const kind = i % 15 === 0 ? 'quarter' : i % 5 === 0 ? 'major' : 'minor';
    const a = (i / 60) * Math.PI * 2;
    const r1 = TICK_OUTER - TICK_LENGTH[kind];
    dom.dial.append(
      svgEl('line', {
        x1: CENTER + Math.sin(a) * r1,
        y1: CENTER - Math.cos(a) * r1,
        x2: CENTER + Math.sin(a) * TICK_OUTER,
        y2: CENTER - Math.cos(a) * TICK_OUTER,
        class: `tick ${kind}`,
      }),
    );
  }
}

function render(): void {
  refs = renderRings(dom.rings, layers, GEOMETRY);
  const now = Date.now();
  for (const [id, until] of flashing) {
    if (until < now) flashing.delete(id);
    else refs.get(id)?.group.classList.add('flash');
  }
  paint();
}

function paint(): void {
  const now = Date.now();
  paintRings(refs, layers, now);
  const next = soonest(layers);
  const running = layers.filter((l) => l.status === 'running').length;
  if (next) {
    const left = remainingMs(next, now);
    dom.name.textContent = next.name;
    dom.time.textContent = formatClock(left);
    dom.time.classList.toggle('long', left > HOUR_MS);
    dom.status.textContent = running > 1 ? `외 ${running - 1}개 흐르는 중` : '흐르는 중';
  } else {
    dom.name.textContent = 'Done';
    dom.time.textContent = '00:00';
    dom.time.classList.remove('long');
    dom.status.textContent = '모두 종료됨';
  }
}

function onFinished(finished: Layer[]): void {
  chime();
  const until = Date.now() + FLASH_MS;
  for (const layer of finished) flashing.set(layer.id, until);
  dom.clock.classList.remove('chiming');
  void dom.clock.offsetWidth;
  dom.clock.classList.add('chiming');
  render();
}

drawDial();
dom.crown.addEventListener('click', () => api.openSettings());
/** 시계는 활성 탭의 레이어만 보여준다. 탭이 여러 개면 가운데 위에 탭 이름을 단다 */
function onState(state: AppState): void {
  const tab = activeTab(state);
  layers = tab.layers;
  dom.tab.textContent = state.tabs.length > 1 ? tab.name : '';
  dom.tab.hidden = state.tabs.length < 2;
  render();
}

api.onState(onState);
api.onFinished(onFinished);
void api.getState().then(onState);
setInterval(paint, PAINT_MS);
