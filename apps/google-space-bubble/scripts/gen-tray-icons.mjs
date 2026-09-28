// 트레이 아이콘(말풍선)을 PNG로 생성한다. 의존성 없이 zlib만 사용.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

// 0~1 좌표계에서 말풍선 영역 여부 (둥근 사각형 + 좌하단 꼬리)
function coverage(x, y) {
  const inRoundRect = (px, py, x0, y0, x1, y1, r) => {
    const cx = Math.min(Math.max(px, x0 + r), x1 - r);
    const cy = Math.min(Math.max(py, y0 + r), y1 - r);
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r && px >= x0 && px <= x1 && py >= y0 && py <= y1;
  };
  const body = inRoundRect(x, y, 0.06, 0.1, 0.94, 0.72, 0.2);
  // 꼬리: (0.22,0.66) (0.44,0.66) (0.2,0.92) 삼각형
  const tail = (() => {
    const [ax, ay, bx, by, cx, cy] = [0.22, 0.66, 0.46, 0.66, 0.2, 0.92];
    const d = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
    const d1 = d(x, y, ax, ay, bx, by), d2 = d(x, y, bx, by, cx, cy), d3 = d(x, y, cx, cy, ax, ay);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  })();
  return body || tail;
}

function png(size, [r, g, b]) {
  const ss = 4; // supersampling
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x++) {
      let hit = 0;
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++)
          if (coverage((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size)) hit++;
      row.set([r, g, b, Math.round((hit / (ss * ss)) * 255)], 1 + x * 4);
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// macOS: Template 이미지 (검정 + alpha, OS가 다크/라이트 자동 반전)
writeFileSync('resources/trayTemplate.png', png(16, [0, 0, 0]));
writeFileSync('resources/trayTemplate@2x.png', png(32, [0, 0, 0]));
// Windows: 컬러 아이콘
writeFileSync('resources/tray-win.png', png(32, [26, 115, 232]));
console.log('tray icons generated');
