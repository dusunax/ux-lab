import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "REPLICATE_API_TOKEN이 설정되지 않았습니다." }, { status: 500 });
  }

  const { prompt, duration = 15 } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: "prompt가 필요합니다." }, { status: 400 });
  }

  try {
    const output = await replicate.run("meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb", {
      input: {
        prompt,
        duration,
        model_version: "large",
        output_format: "mp3",
        normalization_strategy: "peak",
      },
    });

    // output is a ReadableStream or URL string depending on model version
    const audioUrl = typeof output === "string" ? output : (output as { url?: string })?.url ?? String(output);

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error("Replicate error:", error);
    return NextResponse.json({ error: "음원 생성에 실패했습니다." }, { status: 500 });
  }
}
