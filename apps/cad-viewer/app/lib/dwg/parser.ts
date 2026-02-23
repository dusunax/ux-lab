import { ByteReader } from "./byte-reader";
import type { DwgParseReport, DwgVersionCode } from "./types";

const KNOWN_ENTITY_MARKERS = [
  "AcDbLine",
  "AcDbCircle",
  "AcDbArc",
  "AcDbPolyline",
  "AcDb2dPolyline",
  "AcDb3dPolyline",
  "AcDbSpline",
  "AcDbMText",
  "AcDbText",
  "AcDbBlockReference",
  "AcDbHatch",
] as const;

function inferVersion(signature: string): DwgVersionCode {
  if (
    signature === "AC1012" ||
    signature === "AC1014" ||
    signature === "AC1015" ||
    signature === "AC1018" ||
    signature === "AC1021" ||
    signature === "AC1024" ||
    signature === "AC1027" ||
    signature === "AC1032"
  ) {
    return signature;
  }
  return "UNKNOWN";
}

function extractAsciiWindow(bytes: Uint8Array, maxChars = 2_000_000): string {
  const len = Math.min(bytes.length, maxChars);
  const slice = bytes.subarray(0, len);
  const decoder = new TextDecoder("latin1");
  return decoder.decode(slice);
}

function collectTextSnippets(blob: string): string[] {
  const out: string[] = [];
  const pattern = /[A-Za-z][A-Za-z0-9_:\-]{5,40}/g;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(blob)) && out.length < 16) {
    const token = match[0];
    if (token.includes("AcDb") || token.includes("AcDs") || token.includes("AC10")) {
      out.push(token);
    }
  }

  return [...new Set(out)].slice(0, 16);
}

function countEntityHints(blob: string) {
  return KNOWN_ENTITY_MARKERS.map((type) => {
    const escaped = type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const count = (blob.match(new RegExp(escaped, "g")) || []).length;
    return { type, count };
  }).filter((entry) => entry.count > 0);
}

function extractCandidateNumbers(buffer: ArrayBuffer): number[] {
  const view = new DataView(buffer);
  const limit = Math.min(view.byteLength - 8, 4_000_000);
  const out: number[] = [];

  for (let i = 0; i <= limit; i += 8) {
    const value = view.getFloat64(i, true);
    if (!Number.isFinite(value)) continue;
    const abs = Math.abs(value);
    if (abs < 1e-7 || abs > 1e7) continue;
    out.push(value);
    if (out.length >= 12_000) break;
  }

  return out;
}

function toPreviewSegments(nums: number[]) {
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const max = Math.min(nums.length - 3, 6_000);

  for (let i = 0; i <= max; i += 4) {
    const x1 = nums[i];
    const y1 = nums[i + 1];
    const x2 = nums[i + 2];
    const y2 = nums[i + 3];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);

    if (len < 1e-4 || len > 1e6) continue;
    segments.push({ x1, y1, x2, y2 });
    if (segments.length >= 1_500) break;
  }

  return segments;
}

export function parseDwgLocally(buffer: ArrayBuffer): DwgParseReport {
  const reader = new ByteReader(buffer);
  const signature = reader.readAscii(6);
  const version = inferVersion(signature);

  const bytes = new Uint8Array(buffer);
  const asciiWindow = extractAsciiWindow(bytes);
  const entityHints = countEntityHints(asciiWindow);
  const textSnippets = collectTextSnippets(asciiWindow);
  const previewSegments = toPreviewSegments(extractCandidateNumbers(buffer));

  const warnings: string[] = [];

  if (version === "UNKNOWN") {
    warnings.push("알 수 없는 DWG 버전 시그니처입니다.");
  }

  warnings.push("현재 파서는 엔티티 힌트/메타 추출 단계이며, 실제 형상 복원은 구현 중입니다.");
  warnings.push("2D 미리보기는 DWG 바이너리의 수치 패턴을 이용한 휴리스틱 결과라 정확하지 않을 수 있습니다.");

  return {
    signature,
    version,
    fileSize: buffer.byteLength,
    entityHints,
    textSnippets,
    previewSegments,
    warnings,
  };
}
