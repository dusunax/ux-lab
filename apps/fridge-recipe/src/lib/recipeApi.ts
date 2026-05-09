export interface Recipe {
  name: string;
  description: string;
  time: string;
  difficulty: string;
  usedIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  savedAt?: string;
}

export interface Conditions {
  maxTime: 15 | 30 | null;
  difficulty: "easy" | "normal" | "hard" | null;
  diet: "normal" | "vegetarian" | "vegan" | "low-sodium";
  cuisine: "any" | "korean" | "western" | "chinese" | "southeast-asian" | "weird";
}

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:3035";

const DIFF_LABEL: Record<string, string> = { easy: "쉬움", normal: "보통", hard: "어려움" };
const DIET_LABEL: Record<string, string> = { normal: "일반", vegetarian: "채식", vegan: "비건", "low-sodium": "무염식" };
const CUISINE_LABEL: Record<string, string> = {
  any: "상관없음", korean: "한식", western: "양식", chinese: "중식", "southeast-asian": "동남아식",
};

function buildConditionText(c: Conditions): string {
  const parts: string[] = [];
  if (c.maxTime) parts.push(`조리시간 ${c.maxTime}분 이내`);
  if (c.difficulty) parts.push(`난이도 ${DIFF_LABEL[c.difficulty]}`);
  if (c.diet === "vegetarian") parts.push("채식");
  else if (c.diet === "vegan") parts.push("비건");
  else if (c.diet === "low-sodium") parts.push("무염식 (소금·간장·된장 등 염분 재료 최소화)");
  if (c.cuisine === "weird") parts.push("딸기마라탕처럼 상상을 초월하는 괴식 — 재료 조합이 충격적이고 창의적일수록 좋음");
  else if (c.cuisine !== "any") parts.push(`${CUISINE_LABEL[c.cuisine]} 스타일`);
  return parts.length ? parts.join(", ") : "제한 없음";
}

// 누적 텍스트에서 완성된 레시피 객체를 순서대로 추출
function parseCompletedRecipes(text: string): Recipe[] {
  const results: Recipe[] = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "[" || ch === "{") {
      depth++;
      if (ch === "{" && depth === 2) objectStart = i;
    } else if (ch === "]" || ch === "}") {
      if (ch === "}" && depth === 2 && objectStart !== -1) {
        try {
          const obj = JSON.parse(text.slice(objectStart, i + 1));
          results.push(obj as Recipe);
        } catch {}
        objectStart = -1;
      }
      depth--;
    }
  }
  return results;
}

export async function fetchRecipes(
  ingredients: string[],
  conditions: Conditions,
  allergies: string[],
  excludeAllergies: boolean,
  specialNote: string,
  onRecipe?: (recipes: Recipe[]) => void,
): Promise<Recipe[]> {
  const excludeLine = excludeAllergies && allergies.length > 0
    ? `\n반드시 다음 재료는 사용하지 마세요: [${allergies.join(", ")}]`
    : "";
  const specialNoteLine = specialNote.trim()
    ? `\n[최우선 반영] ${specialNote.trim()}`
    : "";

  const res = await fetch(`${PROXY_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      messages: [
        {
          role: "system",
          content:
            "당신은 요리 전문가입니다. 주어진 재료로 만들 수 있는 레시피를 JSON 형식으로만 반환합니다. 설명, 마크다운, 추가 텍스트 없이 JSON 배열만 출력합니다.",
        },
        {
          role: "user",
          content: `재료: [${ingredients.join(", ")}]\n조건: ${buildConditionText(conditions)}${excludeLine}${specialNoteLine}\n\n위 재료로 만들 수 있는 레시피 2개를 다음 JSON 형식으로 반환해:\n[\n  {\n    "name": "레시피 이름",\n    "description": "한 줄 설명",\n    "time": "조리 시간 (분)",\n    "difficulty": "쉬움|보통|어려움",\n    "usedIngredients": ["사용 재료"],\n    "missingIngredients": ["없어서 필요한 재료"],\n    "steps": ["1. 단계", "2. 단계"]\n  }\n]`,
        },
      ],
      max_tokens: 1500,
      temperature: 0,
      stream: true,
    }),
  });

  if (!res.ok) {
    try {
      const body = await res.json();
      const msg = body?.error ?? `서버 오류 (${res.status})`;
      const tried = body?.tried as string[] | undefined;
      throw new Error(tried?.length ? `${msg}\n시도된 모델: ${tried.join(", ")}` : msg);
    } catch (e) {
      if (e instanceof Error && e.message !== `서버 오류 (${res.status})`) throw e;
      throw new Error(`서버 오류 (${res.status})`);
    }
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let lastRecipeCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
        if (delta) {
          accumulated += delta;
          const found = parseCompletedRecipes(accumulated);
          if (found.length > lastRecipeCount) {
            lastRecipeCount = found.length;
            onRecipe?.(found);
          }
        }
      } catch {}
    }
  }

  if (!accumulated) throw new Error("모델이 응답을 완성하지 못했습니다. 다시 시도해주세요.");

  const match = accumulated.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("레시피를 파싱할 수 없습니다. 다시 시도해주세요.");
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr) || arr.length === 0) throw new Error();
    return arr as Recipe[];
  } catch {
    throw new Error("레시피를 파싱할 수 없습니다. 다시 시도해주세요.");
  }
}
