import { NextRequest, NextResponse } from "next/server";
import { generateWithSuno } from "@/lib/sunoPlaywright";

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const cookie = process.env.SUNO_BROWSER_COOKIE;
  if (!cookie) {
    return NextResponse.json(
      { error: "SUNO_BROWSER_COOKIE가 설정되지 않았습니다. .env.local을 확인해주세요." },
      { status: 500 }
    );
  }

  const { tags, title } = await req.json();
  if (!tags) {
    return NextResponse.json({ error: "tags가 필요합니다." }, { status: 400 });
  }

  try {
    const audioUrl = await generateWithSuno(tags, title ?? "Untitled", cookie);
    return NextResponse.json({ audioUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Suno Playwright error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
