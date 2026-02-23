import { NextResponse } from "next/server";
import { getApsToken, requestTranslation } from "../../../lib/aps";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { urn } = (await request.json()) as { urn?: string };

    if (!urn) {
      return NextResponse.json({ error: "urn이 필요합니다." }, { status: 400 });
    }

    const token = await getApsToken(["data:read", "data:write"]);
    const result = await requestTranslation(token.access_token, urn);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
