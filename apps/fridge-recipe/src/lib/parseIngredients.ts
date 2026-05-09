export function parseIngredients(text: string): string[] {
  const match = text.match(/\[[\s\S]*?\]/);
  if (match) {
    try {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr) && arr.every((i) => typeof i === "string")) {
        return arr.map((s) => s.trim()).filter((s) => s.length > 0 && s.length <= 20);
      }
    } catch {}
  }
  throw new Error("모델이 JSON 형식으로 응답하지 않았습니다. 다시 시도해주세요.");
}
