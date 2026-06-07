import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const CLERK_BASE = "https://clerk.suno.com";
const STUDIO_BASE = "https://studio-api.suno.ai";
const CLERK_VERSION = "_clerk_js_version=4.70.5";

async function getJWT(cookie: string): Promise<string> {
  const clientRes = await fetch(`${CLERK_BASE}/v1/client?${CLERK_VERSION}`, {
    headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0" },
  });
  if (!clientRes.ok) throw new Error(`Clerk client fetch failed: ${clientRes.status}`);
  const { response } = await clientRes.json();
  const sessionId = response?.last_active_session_id;
  if (!sessionId) throw new Error("Suno 세션을 찾을 수 없습니다. 쿠키를 다시 확인해주세요.");

  const tokenRes = await fetch(
    `${CLERK_BASE}/v1/client/sessions/${sessionId}/tokens/api?${CLERK_VERSION}`,
    {
      method: "POST",
      headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0" },
    }
  );
  if (!tokenRes.ok) throw new Error(`JWT 발급 실패: ${tokenRes.status}`);
  const { jwt } = await tokenRes.json();
  return jwt;
}

async function startGeneration(jwt: string, tags: string, title: string): Promise<string[]> {
  const res = await fetch(`${STUDIO_BASE}/api/generate/v2/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0",
    },
    body: JSON.stringify({
      prompt: "",
      mv: "chirp-v3-5",
      title,
      tags,
      make_instrumental: true,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`생성 요청 실패 (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const ids: string[] = data.clips?.map((c: { id: string }) => c.id) ?? [];
  if (ids.length === 0) throw new Error("생성된 클립이 없습니다.");
  return ids;
}

async function pollForAudio(jwt: string, ids: string[]): Promise<string> {
  const query = ids.join(",");
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${STUDIO_BASE}/api/feed/?ids=${query}`, {
      headers: { Authorization: `Bearer ${jwt}`, "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) continue;
    const clips: Array<{ status: string; audio_url: string }> = await res.json();
    const done = clips.find((c) => c.status === "complete" && c.audio_url);
    if (done) return done.audio_url;
    const failed = clips.every((c) => c.status === "error");
    if (failed) throw new Error("Suno 생성 실패 — 크레딧 부족이거나 서버 오류입니다.");
  }
  throw new Error("생성 시간 초과 (120초). Suno 서버가 혼잡할 수 있습니다.");
}

export async function POST(req: NextRequest) {
  const cookie = process.env.SUNO_COOKIE;
  if (!cookie) {
    return NextResponse.json({ error: "SUNO_COOKIE가 설정되지 않았습니다." }, { status: 500 });
  }

  const { tags, title } = await req.json();
  if (!tags) return NextResponse.json({ error: "tags가 필요합니다." }, { status: 400 });

  try {
    const jwt = await getJWT(cookie);
    const ids = await startGeneration(jwt, tags, title ?? "Untitled");
    const audioUrl = await pollForAudio(jwt, ids);
    return NextResponse.json({ audioUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Suno error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
