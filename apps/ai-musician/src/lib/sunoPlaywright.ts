import { chromium } from "playwright";
import type { Cookie } from "playwright";

function parseCookieString(raw: string): Cookie[] {
  const cookies: Cookie[] = [];
  for (const pair of raw.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (!name) continue;
    cookies.push({ name, value, domain: ".suno.com", path: "/", httpOnly: false, secure: true, sameSite: "Lax", expires: -1 });
  }
  return cookies;
}

export async function generateWithSuno(
  tags: string,
  title: string,
  cookieStr: string
): Promise<string> {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--no-sandbox"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    });

    await context.addCookies(parseCookieString(cookieStr));

    const page = await context.newPage();

    // 생성된 오디오 URL 캡처
    let resolveAudio: (url: string) => void;
    let rejectAudio: (err: Error) => void;
    const audioPromise = new Promise<string>((res, rej) => {
      resolveAudio = res;
      rejectAudio = rej;
    });

    page.on("response", async (response) => {
      const url = response.url();
      if (!url.includes("/api/feed/") || response.status() !== 200) return;
      try {
        const data = await response.json();
        if (!Array.isArray(data)) return;
        const done = data.find(
          (c: { status: string; audio_url: string }) =>
            c.status === "complete" && c.audio_url
        );
        if (done) resolveAudio(done.audio_url);
      } catch {}
    });

    await page.goto("https://suno.com/create", { waitUntil: "networkidle" });

    // Custom 모드 전환
    const customBtn = page.locator('button:has-text("Custom"), [data-testid="custom-mode"]').first();
    if (await customBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await customBtn.click();
    }

    // Style 입력
    const styleInput = page
      .locator('textarea[placeholder*="style"], textarea[placeholder*="Style"], textarea[placeholder*="음악"]')
      .first();
    await styleInput.waitFor({ timeout: 10000 });
    await styleInput.fill(tags);

    // Title 입력
    const titleInput = page
      .locator('input[placeholder*="title"], input[placeholder*="Title"], input[placeholder*="제목"]')
      .first();
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill(title);
    }

    // Instrumental 토글
    const instrumental = page
      .locator('button:has-text("Instrumental"), input[type="checkbox"]')
      .first();
    if (await instrumental.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isChecked = await instrumental.isChecked().catch(() => null);
      if (isChecked === false) await instrumental.click();
    }

    // Create 버튼 클릭
    const createBtn = page
      .locator('button:has-text("Create"), button[type="submit"]')
      .first();
    await createBtn.waitFor({ timeout: 5000 });
    await createBtn.click();

    // 오디오 완성 대기 (최대 3분)
    const audioUrl = await Promise.race([
      audioPromise,
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("Suno 생성 시간 초과 (3분)")), 180_000)
      ),
    ]);

    return audioUrl;
  } finally {
    await browser.close();
  }
}
