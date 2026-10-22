/**
 * 레이어를 동심원으로 그린다. 목록의 첫 레이어가 가장 바깥 링이다.
 * 구조는 renderRings에서 한 번 만들고, 매 프레임에는 paintRings로 호의 길이만 바꾼다.
 */
import { colorOf, remainingRatio, type Layer } from '../../shared/layers';

export const SVG_NS = 'http://www.w3.org/2000/svg';
const STROKE_RATIO = 0.72;

export interface RingGeometry {
  center: number;
  outer: number;
  inner: number;
  maxStroke: number;
}

interface RingRef {
  arc: SVGCircleElement;
  group: SVGGElement;
  circumference: number;
}

export type RingRefs = Map<string, RingRef>;

export const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

export function renderRings(host: SVGGElement, layers: readonly Layer[], g: RingGeometry): RingRefs {
  host.replaceChildren();
  const refs: RingRefs = new Map();
  const band = (g.outer - g.inner) / Math.max(1, layers.length);
  const stroke = Math.min(g.maxStroke, band * STROKE_RATIO);
  layers.forEach((layer, i) => {
    const r = g.outer - band * i - band / 2;
    const color = colorOf(layer.colorId).hex;
    const common = { cx: g.center, cy: g.center, r, stroke: color, 'stroke-width': stroke };
    const group = svgEl('g', { class: `ring ${layer.status}`, 'data-id': layer.id });
    const arc = svgEl('circle', { ...common, class: 'arc', transform: `rotate(-90 ${g.center} ${g.center})` });
    const circumference = 2 * Math.PI * r;
    arc.setAttribute('stroke-dasharray', String(circumference));
    group.append(svgEl('circle', { ...common, class: 'track' }), arc);
    host.append(group);
    refs.set(layer.id, { arc, group, circumference });
  });
  return refs;
}

export function paintRings(refs: RingRefs, layers: readonly Layer[], now: number): void {
  for (const layer of layers) {
    const ref = refs.get(layer.id);
    if (!ref) continue;
    ref.arc.setAttribute('stroke-dashoffset', String(ref.circumference * (1 - remainingRatio(layer, now))));
  }
}

/** 가장 먼저 끝나는 흐르는 레이어 */
export function soonest(layers: readonly Layer[]): Layer | null {
  return layers.reduce<Layer | null>(
    (a, l) => (l.status === 'running' && (!a || l.endsAt < a.endsAt) ? l : a),
    null,
  );
}
