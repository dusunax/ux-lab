import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

// 배포 환경에서는 private/ 폴더가 존재하지 않으므로 빈 배열 반환
// 로컬 개발 전용 시드 엔드포인트
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ personas: [] });
  }

  try {
    const filePath = join(process.cwd(), "private", "seed-personas.json");
    const raw = await readFile(filePath, "utf-8");
    const personas = JSON.parse(raw);
    return NextResponse.json({ personas });
  } catch {
    return NextResponse.json({ personas: [] });
  }
}
