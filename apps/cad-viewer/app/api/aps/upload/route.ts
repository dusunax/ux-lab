import { NextResponse } from "next/server";
import { ensureBucket, getApsConfig, getApsToken, uploadObjectToBucket } from "../../../lib/aps";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file 필드가 필요합니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "dwg") {
      return NextResponse.json({ error: "DWG 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    const token = await getApsToken(["bucket:create", "bucket:read", "data:read", "data:write"]);
    const { bucketKey } = getApsConfig();

    await ensureBucket(token.access_token, bucketKey);

    const payload = await uploadObjectToBucket({
      accessToken: token.access_token,
      bucketKey,
      objectName: `${Date.now()}-${file.name}`,
      contentType: file.type || "application/acad",
      data: await file.arrayBuffer(),
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
