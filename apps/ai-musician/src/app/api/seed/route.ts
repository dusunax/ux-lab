import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "private", "seed-personas.json");
    const raw = await readFile(filePath, "utf-8");
    const personas = JSON.parse(raw);
    return NextResponse.json({ personas });
  } catch {
    return NextResponse.json({ personas: [] });
  }
}
