import { parseIngredients } from "./parseIngredients";

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:3035";

export async function recognizeIngredients(imageBase64: string): Promise<string[]> {
  const res = await fetch(`${PROXY_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      messages: [
        {
          role: "system",
          content:
            'You are a kitchen inventory scanner. Output ONLY a valid JSON array of ingredient names in Korean. No explanation, no markdown, no extra text. Example output: ["달걀","우유","당근","양파"]',
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageBase64 } },
            {
              type: "text",
              text: "List all visible food ingredients in this refrigerator image. Return a JSON array only.",
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0,
    }),
  });

  if (!res.ok) throw new Error(`서버 오류 (${res.status})`);

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  const content: string = data.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("모델이 응답을 완성하지 못했습니다. 다시 시도해주세요.");

  return parseIngredients(content);
}
