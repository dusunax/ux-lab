// 앱 아이콘(build/icon.png, build/icon.icns)을 만든다. 실행: pnpm icon
// 별도 SVG 변환 도구 없이 Electron으로 SVG를 그려 캡처하고, macOS 기본 sips·iconutil로 icns를 묶는다.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BrowserWindow, app } from 'electron';

const SIZE = 1024;
const OUT = join(import.meta.dirname, '..', 'build');
const TAU = Math.PI * 2;

/** 렌더러 리그(rig.ts)와 같은 기하: 5족 탑뷰, idle 자세, 고정 시드로 깎은 등딱지 */
function tuffySvg() {
  let s = 7;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pts = Array.from({ length: 10 }, (_, k) => {
    const a = ((k * 36 - 90) * Math.PI) / 180 + (rand() - 0.5) * 0.12;
    const r = (k % 2 === 0 ? 56 : 46) * (1 + (rand() - 0.5) * 0.12);
    return [Math.cos(a) * r, Math.sin(a) * r, a];
  });
  const c = [-3, -5];
  const facets = pts.map((p, k) => {
    const q = pts[(k + 1) % 10];
    const tone = Math.round(98 + Math.cos((p[2] + q[2]) / 2 + 2.3) * 34);
    return `<polygon points="${c} ${p[0]},${p[1]} ${q[0]},${q[1]}" fill="rgb(${tone + 14},${tone + 4},${tone - 12})" stroke="#2a241f" stroke-width="1.5" stroke-linejoin="round"/>`;
  }).join('');
  const outline = `<polygon points="${pts.map((p) => `${p[0]},${p[1]}`).join(' ')}" fill="none" stroke="#14110e" stroke-width="3" stroke-linejoin="round"/>`;
  const legs = Array.from({ length: 5 }, (_, i) => {
    const th1 = 0.08 * Math.sin(i * 1.26);
    const bend = 0.55;
    const kx = 32 + 52 * Math.cos(th1), ky = 52 * Math.sin(th1);
    const hx = kx + 46 * Math.cos(th1 + bend), hy = ky + 46 * Math.sin(th1 + bend);
    const d = `M32,0 L${kx},${ky} L${hx},${hy}`;
    const fingers = [-0.6, 0, 0.6].map((o) => `M${hx},${hy} l${Math.cos(th1 + bend + o) * 8},${Math.sin(th1 + bend + o) * 8}`).join(' ');
    return `<g transform="rotate(${i * 72 - 90})">
      <path d="${d}" fill="none" stroke="#14110e" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="#8c7f6d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${fingers}" fill="none" stroke="#b7a993" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${kx}" cy="${ky}" r="5.5" fill="#b7a993" stroke="#14110e" stroke-width="2"/></g>`;
  }).join('');
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * TAU, major = i % 5 === 0, r1 = major ? 196 : 201;
    return `<line x1="${Math.cos(a) * r1}" y1="${Math.sin(a) * r1}" x2="${Math.cos(a) * 205}" y2="${Math.sin(a) * 205}" stroke="${major ? '#3a3a3a' : '#1f1f1f'}" stroke-width="3" stroke-linecap="round"/>`;
  }).join('');
  const arc = TAU * 212;
  // macOS 아이콘 격자: 1024 캔버스에 824 둥근 사각형(여백 100), 그 안에 원형 디바이스 화면
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bezel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e2e33"/><stop offset="1" stop-color="#0c0c0e"/></linearGradient>
    <radialGradient id="aura"><stop offset="0" stop-color="#ff6fb5" stop-opacity=".28"/><stop offset="1" stop-color="#ff6fb5" stop-opacity="0"/></radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <rect x="100" y="100" width="824" height="824" rx="185" fill="url(#bezel)"/>
  <circle cx="512" cy="512" r="370" fill="#000"/>
  <g transform="translate(512 512) scale(1.62)">
    <circle r="150" fill="url(#aura)"/>
    ${ticks}
    <circle r="212" fill="none" stroke="#ff6fb5" stroke-width="5" stroke-linecap="round" stroke-dasharray="${arc * 0.68} ${arc}" transform="rotate(-90)" filter="url(#glow)"/>
    <circle r="212" fill="none" stroke="#ff6fb5" stroke-width="4" stroke-linecap="round" stroke-dasharray="${arc * 0.68} ${arc}" transform="rotate(-90)"/>
    <g transform="scale(1.35)">${legs}${facets}${outline}
      <circle cx="${c[0]}" cy="${c[1]}" r="9" fill="#0f0c0a"/>
      <circle cx="${c[0]}" cy="${c[1]}" r="6" fill="#ff6fb5" filter="url(#glow)"/>
      <circle cx="${c[0]}" cy="${c[1]}" r="4.5" fill="#ff6fb5"/>
    </g>
  </g>
</svg>`;
}

function buildIcns(png) {
  const iconset = join(OUT, 'icon.iconset');
  rmSync(iconset, { recursive: true, force: true });
  mkdirSync(iconset);
  for (const size of [16, 32, 128, 256, 512]) {
    for (const [scale, suffix] of [[1, ''], [2, '@2x']]) {
      const px = String(size * scale);
      execFileSync('sips', ['-z', px, px, png, '--out', join(iconset, `icon_${size}x${size}${suffix}.png`)], { stdio: 'ignore' });
    }
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', join(OUT, 'icon.icns')]);
  rmSync(iconset, { recursive: true, force: true });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const win = new BrowserWindow({ width: SIZE, height: SIZE, show: false, frame: false, transparent: true, backgroundColor: '#00000000', webPreferences: { offscreen: true } });
  win.webContents.setFrameRate(1);
  const html = `<!doctype html><html style="background:transparent;overflow:hidden"><body style="margin:0;background:transparent;overflow:hidden">${tuffySvg().replace('<svg ', '<svg style="display:block" ')}</body></html>`;
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise((r) => setTimeout(r, 300));
  const image = (await win.webContents.capturePage()).resize({ width: SIZE, height: SIZE, quality: 'best' });
  const png = join(OUT, 'icon.png');
  writeFileSync(png, image.toPNG());
  buildIcns(png);
  console.log(`아이콘 생성: ${png}, ${join(OUT, 'icon.icns')}`);
}

// ESM 진입 파일에서 최상위 await로 ready를 기다리면 모듈 로딩이 끝나지 않아 ready가 영영 오지 않는다
app.dock?.hide();
app.whenReady().then(main).catch((e) => {
  console.error('아이콘 생성 실패:', e);
  process.exitCode = 1;
}).finally(() => app.quit());
