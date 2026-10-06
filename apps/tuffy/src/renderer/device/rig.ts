import { CHORDS, type ActEvent, type BodyState, type Emotion, type Motion } from '../../shared/state';

/** 몸 그리기. 뇌가 보낸 emotion/motion 목표값으로 매 프레임 부드럽게 보간한다 */

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const CX = 233;
const SAY_FIT = 24;
const SAY_CLEAR_MS = 7000;
/** 생각하는 동안 아래 호에 "생각 중 ·", "생각 중 · ·", "생각 중 · · ·"을 돌린다 */
const PONDER_TICK_MS = 420;
const IDLE_SAY = '· · ·';
const LISTEN_TICK_MS = 1000;

const COLORS: Record<Emotion, string> = {
  calm: '#6fe7ff', curious: '#ffc857', amaze: '#ff6fb5', worried: '#ff8a5b', sleepy: '#8c9bff', focus: '#7cffb2',
};
/** 감정 → (valence, arousal) */
const AFFECT: Record<Emotion, [number, number]> = {
  calm: [0.6, 0.3], curious: [0.6, 0.6], amaze: [0.95, 0.9], worried: [0.25, 0.7], sleepy: [0.5, 0.1], focus: [0.6, 0.5],
};

interface Pose { bend: number; sway: number; hz: number; spin: number; hop: number; travel: number; tap: number; wave: number; size: number }
const POSES: Record<Motion, Pose> = {
  idle:    { bend: 0.55, sway: 0.08, hz: 0.45, spin: 0,    hop: 0,   travel: 0, tap: 0, wave: 0, size: 1 },
  perk:    { bend: 0.12, sway: 0.04, hz: 3,    spin: 0,    hop: 0.3, travel: 0, tap: 0, wave: 0, size: 1.04 },
  think:   { bend: 0.85, sway: 0.03, hz: 0.3,  spin: 0.35, hop: 0,   travel: 0, tap: 1, wave: 0, size: 1 },
  bounce:  { bend: 0.35, sway: 0.2,  hz: 2.2,  spin: 0,    hop: 1,   travel: 0, tap: 0, wave: 0, size: 1 },
  scuttle: { bend: 0.6,  sway: 0.38, hz: 3.2,  spin: 0,    hop: 0,   travel: 1, tap: 0, wave: 0, size: 1 },
  wave:    { bend: 0.5,  sway: 0.06, hz: 0.6,  spin: 0,    hop: 0,   travel: 0, tap: 0, wave: 1, size: 1 },
  shiver:  { bend: 1.3,  sway: 0.05, hz: 9,    spin: 0,    hop: 0,   travel: 0, tap: 0, wave: 0, size: 0.95 },
  curl:    { bend: 2.35, sway: 0.02, hz: 0.2,  spin: 0,    hop: 0,   travel: 0, tap: 0, wave: 0, size: 0.9 },
};

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;
const el = (tag: string, attrs: Record<string, string | number>, parent: Element) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  parent.appendChild(n);
  return n;
};

interface Leg { outline: Element; limb: Element; fingers: Element; knee: Element }
interface Note { g: Element; a: number; r: number; speed: number; life: number; delay: number; spin: number }

export function createRig() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body: BodyState = { emotion: 'calm', motion: 'idle', energy: 0.9, turns: 0, thinking: false };
  const rig = { ...POSES.idle, spinAngle: 0, v: 0.6, a: 0.3 };
  const legs = drawLegs();
  drawShell();
  drawTicks();
  const dots = [0, 1, 2].map(() => el('circle', { r: 4, fill: 'var(--emo)', filter: 'url(#glow)' }, $('#dots')));
  const notes: Note[] = [];
  let audio: AudioContext | null = null;
  let sayTimer = 0;
  /** 말이 떠 있는 동안은 "듣는 중"으로 덮지 않는다 */
  let saying = false;
  let micLive = false;

  /** 대화 중이고 마이크가 켜져 있으면, 비어 있는 아래 호에 "듣는 중 · 남은 초"를 띄운다 */
  function idleText(): string {
    const left = Math.ceil(((body.listeningUntil ?? 0) - Date.now()) / 1000);
    return micLive && left > 0 ? `듣는 중 · ${left}초` : IDLE_SAY;
  }
  window.setInterval(() => {
    if (!saying && !ponderTimer) $('#sayText').textContent = idleText();
  }, LISTEN_TICK_MS);
  let ponderTimer = 0;

  function startPonder() {
    if (ponderTimer) return;
    clearTimeout(sayTimer);
    saying = false;
    let n = 0;
    const tick = () => {
      $('#sayText').textContent = `생각 중 ${Array.from({ length: (n++ % 3) + 1 }, () => '·').join(' ')}`;
    };
    tick();
    ponderTimer = window.setInterval(tick, PONDER_TICK_MS);
  }

  function stopPonder() {
    if (!ponderTimer) return;
    clearInterval(ponderTimer);
    ponderTimer = 0;
    $('#sayText').textContent = saying ? $('#sayText').textContent : idleText();
  }
  let last = performance.now();

  function poseLeg(leg: Leg, i: number, t: number) {
    const amp = reduced ? 0.4 : 1;
    const L1 = 52, L2 = 46, hip = 32;
    let th1 = rig.sway * amp * Math.sin(t * TAU * rig.hz + i * 1.26);
    let bend = rig.bend + rig.tap * 0.6 * Math.max(0, Math.sin(t * 7 - i * 1.25)) ** 2;
    if (i === 0 && rig.wave > 0.01) {
      th1 += rig.wave * (-0.9 + 0.45 * Math.sin(t * 9) * amp);
      bend *= 1 - rig.wave * 0.8;
    }
    const kx = hip + L1 * Math.cos(th1), ky = L1 * Math.sin(th1);
    const th2 = th1 + bend;
    const hx = kx + L2 * Math.cos(th2), hy = ky + L2 * Math.sin(th2);
    const d = `M${hip},0 L${kx.toFixed(1)},${ky.toFixed(1)} L${hx.toFixed(1)},${hy.toFixed(1)}`;
    leg.outline.setAttribute('d', d);
    leg.limb.setAttribute('d', d);
    leg.knee.setAttribute('cx', kx.toFixed(1));
    leg.knee.setAttribute('cy', ky.toFixed(1));
    leg.fingers.setAttribute('d', [-0.6, 0, 0.6].map((o) =>
      `M${hx.toFixed(1)},${hy.toFixed(1)} l${(Math.cos(th2 + o) * 8).toFixed(1)},${(Math.sin(th2 + o) * 8).toFixed(1)}`).join(' '));
  }

  function step(dt: number) {
    const target = POSES[body.motion];
    const k = 1 - Math.exp(-dt * 6);
    for (const key of Object.keys(target) as (keyof Pose)[]) rig[key] += (target[key] - rig[key]) * k;
    const [v, a] = AFFECT[body.emotion];
    rig.v += (v - rig.v) * k * 0.5;
    rig.a += (a - rig.a) * k * 0.5;
    if (target.spin > 0) rig.spinAngle += rig.spin * dt;
    else {
      // 회전을 멈출 때는 가장 가까운 5각 대칭 자세로 안착시킨다
      const snap = Math.round(rig.spinAngle / (TAU / 5)) * (TAU / 5);
      rig.spinAngle += (snap - rig.spinAngle) * k;
    }
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    step(dt);
    const hop = rig.hop * 0.07 * Math.abs(Math.sin(t * Math.PI * 2.2));
    const breath = 0.015 * Math.sin(t * TAU * 0.25);
    const x = CX + rig.travel * 34 * Math.sin(t * 1.4);
    $('#rig').setAttribute('transform',
      `translate(${x.toFixed(1)} ${CX}) rotate(${((rig.spinAngle * 180) / Math.PI).toFixed(2)}) scale(${(rig.size + hop + breath).toFixed(3)})`);
    legs.forEach((leg, i) => poseLeg(leg, i, t));
    // AMOLED 번인 방지: 화면 전체가 1분에 한 바퀴, 2px 반경으로 돈다
    $('#drift').setAttribute('transform', `translate(${(2 * Math.cos((t / 60) * TAU)).toFixed(2)} ${(2 * Math.sin((t / 60) * TAU)).toFixed(2)})`);
    $('#vent').setAttribute('opacity', (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * TAU * (0.2 + rig.a * 0.6)))).toFixed(2));
    const circ = TAU * 224;
    $('#arousalArc').setAttribute('stroke-dasharray', `${(circ * rig.a).toFixed(1)} ${circ}`);
    $('#auraCircle').setAttribute('r', (120 + rig.a * 50).toFixed(1));
    dots.forEach((d, i) => {
      const ang = t * 2.4 + (i * TAU) / 3;
      d.setAttribute('cx', (CX + Math.cos(ang) * 96).toFixed(1));
      d.setAttribute('cy', (CX + Math.sin(ang) * 96).toFixed(1));
    });
    stepNotes(dt);
    requestAnimationFrame(frame);
  }

  function spawnNotes(count: number) {
    for (let i = 0; i < count; i++) {
      const g = el('g', { fill: 'var(--emo)', stroke: 'var(--emo)', 'stroke-width': 2.4, 'stroke-linecap': 'round', filter: 'url(#glow)' }, $('#notes'));
      el('ellipse', { cx: 0, cy: 0, rx: 5.5, ry: 4, transform: 'rotate(-20)', stroke: 'none' }, g);
      el('path', { d: 'M4.5 -1 V-20 q8 4 6 12', fill: 'none' }, g);
      notes.push({ g, a: Math.random() * TAU, r: 50, speed: 55 + Math.random() * 40, life: 0, delay: i * 0.18, spin: (Math.random() - 0.5) * 60 });
    }
  }

  function stepNotes(dt: number) {
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      if (n.delay > 0) { n.delay -= dt; n.g.setAttribute('opacity', '0'); continue; }
      n.life += dt;
      n.r += n.speed * dt;
      const op = Math.max(0, 1 - n.life / 1.9);
      n.g.setAttribute('transform', `translate(${(CX + Math.cos(n.a) * n.r).toFixed(1)} ${(CX + Math.sin(n.a) * n.r).toFixed(1)}) rotate(${(n.spin * n.life).toFixed(1)})`);
      n.g.setAttribute('opacity', op.toFixed(2));
      if (op <= 0) { n.g.remove(); notes.splice(i, 1); }
    }
  }

  function playChord(hz: number[]) {
    if (!audio || audio.state !== 'running') return;
    hz.forEach((f, i) => {
      const o = audio!.createOscillator(), g = audio!.createGain();
      const t0 = audio!.currentTime + i * 0.09;
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.06, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      o.connect(g).connect(audio!.destination);
      o.start(t0);
      o.stop(t0 + 0.6);
    });
  }

  requestAnimationFrame(frame);

  return {
    setBody(next: BodyState) {
      Object.assign(body, next);
      document.documentElement.style.setProperty('--emo', COLORS[body.emotion]);
      $('#topText').textContent = `${body.emotion.toUpperCase()} · ${body.motion.toUpperCase()}`;
      $('#dots').setAttribute('opacity', body.thinking ? '1' : '0');
      if (body.thinking) startPonder();
      else stopPonder();
    },
    act(e: ActEvent) {
      // 몸짓만 할 때(say 없음)는 화음과 음표로만 반응한다
      if (e.say) {
        $('#sayText').textContent = e.say.length > SAY_FIT ? `${e.say.slice(0, SAY_FIT - 1)}…` : e.say;
        $('#sayLive').textContent = e.say;
        clearTimeout(sayTimer);
        saying = true;
        sayTimer = window.setTimeout(() => {
          saying = false;
          $('#sayText').textContent = idleText();
        }, SAY_CLEAR_MS);
      }
      if (e.speechOnly) return;
      spawnNotes(Math.round(2 + e.intensity * 6));
      playChord(CHORDS[e.emotion].hz);
    },
    setSound(on: boolean) {
      if (on && !audio) audio = new AudioContext();
      if (audio) void (on ? audio.resume() : audio.suspend());
    },
    setMicLive(on: boolean) {
      micLive = on;
      $('#micDot').setAttribute('opacity', on ? '0.9' : '0');
    },
  };
}

function drawTicks() {
  const g = $('#ticks');
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    const r1 = i % 5 === 0 ? 212 : 217;
    el('line', {
      x1: CX + Math.cos(a) * r1, y1: CX + Math.sin(a) * r1, x2: CX + Math.cos(a) * 221, y2: CX + Math.sin(a) * 221,
      stroke: i % 5 === 0 ? '#3a3a3a' : '#1c1c1c', 'stroke-width': 2, 'stroke-linecap': 'round',
    }, g);
  }
}

function drawShell() {
  // 고정 시드: 깎인 돌 모양이 실행할 때마다 바뀌지 않게
  let s = 7;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const g = $('#shell');
  const pts = Array.from({ length: 10 }, (_, k) => {
    const a = ((k * 36 - 90) * Math.PI) / 180 + (rand() - 0.5) * 0.12;
    const r = (k % 2 === 0 ? 56 : 46) * (1 + (rand() - 0.5) * 0.12);
    return [Math.cos(a) * r, Math.sin(a) * r, a] as const;
  });
  const c = [-3, -5] as const;
  pts.forEach((p, k) => {
    const q = pts[(k + 1) % 10];
    const tone = Math.round(98 + Math.cos((p[2] + q[2]) / 2 + 2.3) * 34);
    el('polygon', {
      points: `${c} ${p[0]},${p[1]} ${q[0]},${q[1]}`,
      fill: `rgb(${tone + 14},${tone + 4},${tone - 12})`, stroke: '#2a241f', 'stroke-width': 1.5, 'stroke-linejoin': 'round',
    }, g);
  });
  el('polygon', { points: pts.map((p) => `${p[0]},${p[1]}`).join(' '), fill: 'none', stroke: '#14110e', 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
  for (let i = 0; i < 9; i++) {
    const a = rand() * TAU, r = 14 + rand() * 28;
    el('circle', { cx: Math.cos(a) * r, cy: Math.sin(a) * r, r: 1 + rand() * 1.8, fill: '#3b332b', opacity: 0.7 }, g);
  }
  el('circle', { cx: c[0], cy: c[1], r: 9, fill: '#0f0c0a' }, g);
  el('circle', { id: 'vent', cx: c[0], cy: c[1], r: 4.5, fill: 'var(--emo)', filter: 'url(#glow)' }, g);
}

function drawLegs(): Leg[] {
  const g = $('#legs');
  return Array.from({ length: 5 }, (_, i) => {
    const lg = el('g', { transform: `rotate(${i * 72 - 90})` }, g);
    const stroke = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    return {
      outline: el('path', { ...stroke, stroke: '#14110e', 'stroke-width': 17 }, lg),
      limb: el('path', { ...stroke, stroke: '#8c7f6d', 'stroke-width': 12 }, lg),
      fingers: el('path', { fill: 'none', stroke: '#b7a993', 'stroke-width': 4, 'stroke-linecap': 'round' }, lg),
      knee: el('circle', { r: 5.5, fill: '#b7a993', stroke: '#14110e', 'stroke-width': 2 }, lg),
    };
  });
}
