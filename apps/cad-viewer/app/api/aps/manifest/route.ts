import { NextResponse } from "next/server";
import { getApsToken, getManifest } from "../../../lib/aps";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const urn = searchParams.get("urn");

    if (!urn) {
      return NextResponse.json({ error: "urn이 필요합니다." }, { status: 400 });
    }

    const token = await getApsToken(["viewables:read"]);
    const manifest = await getManifest(token.access_token, urn);

    return NextResponse.json(manifest);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
