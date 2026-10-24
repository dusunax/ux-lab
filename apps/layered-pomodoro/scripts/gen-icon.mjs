// 앱 아이콘(build/icon.png, build/icon.icns)을 만든다. 실행: pnpm icon
// 별도 SVG 변환 도구 없이 Electron으로 SVG를 그려 캡처하고, macOS 기본 sips·iconutil로 icns를 묶는다.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BrowserWindow, app } from 'electron';

const SIZE = 1024;
const OUT = join(import.meta.dirname, '..', 'build');
const TAU = Math.PI * 2;
const INK = '#14110e';
/** 앱 팔레트(shared/layers.ts)의 앞 네 색과 남은 비율 */
const RINGS = [
  ['#7B2333', 0.82],
  ['#C0623B', 0.6],
  ['#C9962B', 0.38],
  ['#6B7A3A', 0.7],
];

/** 시계 창(clock)과 같은 모양: 흰 원판, 굵은 테두리·눈금, 동심원 레이어 링 */
function clockSvg() {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const kind = i % 15 === 0 ? 'quarter' : i % 5 === 0 ? 'major' : 'minor';
    const len = { quarter: 44, major: 28, minor: 14 }[kind];
    const width = { quarter: 12, major: 7, minor: 3.5 }[kind];
    const a = (i / 60) * TAU;
    const r2 = 330;
    const r1 = r2 - len;
    return `<line x1="${Math.sin(a) * r1}" y1="${-Math.cos(a) * r1}" x2="${Math.sin(a) * r2}" y2="${-Math.cos(a) * r2}" stroke="${kind === 'minor' ? '#625a4f' : INK}" stroke-width="${width}"/>`;
  }).join('');
  const band = (270 - 150) / RINGS.length;
  const rings = RINGS.map(([color, ratio], i) => {
    const r = 270 - band * i - band / 2;
    const c = TAU * r;
    const w = band * 0.74;
    return `<circle r="${r}" fill="none" stroke="${color}" stroke-opacity=".18" stroke-width="${w}"/>
      <circle r="${r}" fill="none" stroke="${color}" stroke-width="${w}" stroke-dasharray="${c * ratio} ${c}" transform="rotate(-90)"/>`;
  }).join('');
  // macOS 아이콘 격자: 1024 캔버스에 824 둥근 사각형(여백 100), 그 안에 원형 시계
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b2723"/><stop offset="1" stop-color="${INK}"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <rect x="100" y="100" width="824" height="824" rx="185" fill="url(#tile)"/>
  <g transform="translate(512 512)">
    <circle r="362" fill="#fff" stroke="${INK}" stroke-width="16" filter="url(#shadow)"/>
    <circle r="342" fill="none" stroke="#3d3730" stroke-width="4"/>
    ${ticks}
    ${rings}
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
  const html = `<!doctype html><html style="background:transparent;overflow:hidden"><body style="margin:0;background:transparent;overflow:hidden">${clockSvg().replace('<svg ', '<svg style="display:block" ')}</body></html>`;
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
