import { NextResponse } from "next/server";
import { getApsToken } from "../../../lib/aps";

export const runtime = "nodejs";

export async function GET() {
  try {
    const token = await getApsToken(["viewables:read"]);
    return NextResponse.json({
      access_token: token.access_token,
      expires_in: token.expires_in,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
