# PRD Step 2 — 재료 기반 레시피 추천

## 목표

Step 1에서 추출한 재료 목록을 바탕으로 만들 수 있는 레시피 2개를 스트리밍으로 생성해 보여준다.

---

## 사용자 흐름

1. Step 1에서 전달된 재료 목록이 상단에 요약 표시된다.
2. 조리 조건 패널(접힘/펼침)에서 조건을 설정한다.
3. "레시피 추천" 버튼을 누르면 조건 패널이 접히고 API 요청이 시작된다.
4. 스켈레톤 카드 1개가 "레시피 구상 중 n.ns" 타이머와 함께 표시된다.
5. 레시피 JSON 객체가 완성되는 순서대로 실제 카드로 교체된다. 남은 레시피는 스켈레톤으로 유지.
6. 각 카드에서 "저장" 버튼으로 Step 3 저장소에 저장할 수 있다.
7. "다시 추천" 버튼으로 같은 재료·조건으로 새 레시피를 요청할 수 있다.

---

## API

**엔드포인트:** `POST /api/chat` (openrouter-proxy, `http://localhost:3035`)

**모델:** `"auto"` (프록시가 텍스트로 감지 후 폴백 체인 자동 선택)

**텍스트 폴백 체인** (429 발생 시 순서대로):
1. `openai/gpt-oss-120b:free`
2. `meta-llama/llama-3.3-70b-instruct:free`
3. `nvidia/nemotron-3-super-120b-a12b:free`
4. `openai/gpt-oss-20b:free`
5. `qwen/qwen3-next-80b-a3b-instruct:free`
6. `minimax/minimax-m2.5:free`

> 스트리밍 지원: 프록시가 `stream: true` 요청을 OpenRouter SSE로 pass-through한다. 429 폴백도 스트리밍 모드에서 동작한다.

**요청 구조:**

```json
{
  "model": "auto",
  "messages": [
    {
      "role": "system",
      "content": "당신은 요리 전문가입니다. 주어진 재료로 만들 수 있는 레시피를 JSON 형식으로만 반환합니다. 설명, 마크다운, 추가 텍스트 없이 JSON 배열만 출력합니다."
    },
    {
      "role": "user",
      "content": "재료: [달걀, 우유, 버터]\n조건: 조리시간 30분 이내, 난이도 쉬움, 한식 스타일\n\n위 재료로 만들 수 있는 레시피 2개를 다음 JSON 형식으로 반환해:\n[{\n  \"name\": \"\", \"description\": \"\", \"time\": \"\",\n  \"difficulty\": \"쉬움|보통|어려움\",\n  \"usedIngredients\": [], \"missingIngredients\": [], \"steps\": []\n}]"
    }
  ],
  "max_tokens": 1500,
  "temperature": 0,
  "stream": true
}
```

**스트리밍 파싱:**
- SSE 청크에서 `choices[0].delta.content`를 누적
- 누적 텍스트에서 완성된 `{...}` JSON 객체를 실시간 추출 (brace-depth 추적)
- 객체 완성 시 `onRecipe` 콜백으로 UI에 즉시 전달
- 스트림 종료 후 전체 누적 텍스트로 최종 파싱 및 반환

---

## 조건 옵션

| 항목 | 선택지 |
|---|---|
| 조리 시간 | 제한 없음 / 15분 이내 / 30분 이내 |
| 난이도 | 상관없음 / 쉬움 / 보통 / 어려움 |
| 식단 | 일반 / 채식 / 비건 / 괴식 (딸기마라탕류 창의적 조합) |
| 요리 스타일 | 상관없음 / 한식 / 양식 / 중식 / 동남아식 |

조건 선택 패널은 토글로 접힘/펼침. 추천 버튼 클릭 시 자동으로 닫힘.

---

## UI 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `ConditionSelector` | 조리 시간 / 난이도 / 식단 / 요리 스타일 칩 선택 |
| `RecipeCard` | 레시피 이름·설명·시간·난이도·재료·단계(접힘), 저장 버튼 |
| `RecipeCardSkeleton` | 생성 중 표시, "레시피 구상 중 n.ns" 타이머 |

---

## 상태

```ts
interface Step2State {
  ingredients: string[];
  conditions: Conditions;
  recipes: Recipe[];
  streamingRecipes: Recipe[];        // 스트리밍 중 완성된 레시피 (순차)
  status: 'idle' | 'streaming' | 'done' | 'error';
  conditionsOpen: boolean;           // 조건 패널 열림 여부
  streamStartedAt: number;           // 스켈레톤 타이머 기준
  errorMessage: string | null;
  savedIds: Set<string>;
  showScrollBtn: boolean;
}

interface Conditions {
  maxTime: 15 | 30 | null;
  difficulty: 'easy' | 'normal' | 'hard' | null;
  diet: 'normal' | 'vegetarian' | 'vegan' | 'weird';
  cuisine: 'any' | 'korean' | 'western' | 'chinese' | 'southeast-asian';
}

interface Recipe {
  name: string;
  description: string;
  time: string;
  difficulty: string;
  usedIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  savedAt?: string;
}
```

---

## 스크롤 UX

- 추천 버튼 클릭 시 `window.scrollTo(bottom)` 1회
- 레시피 카드 완성(스켈레톤 → 카드 교체) 시 스크롤 (streaming 중, autoScroll ON일 때만)
- 사용자가 위로 스크롤 → autoScroll OFF, 우하단 다운 버튼 표시
- 바닥 근처(80px 이내)로 돌아오면 autoScroll 재활성, 버튼 사라짐
- 페이지 초기 로딩 시 자동 스크롤 없음

---

## 페이지 간 상태 전달

```
/step2?ingredients=달걀,우유,버터,밀가루
```

---

## 제약 및 예외 처리

- 재료가 없으면 `/`로 리다이렉트
- JSON 파싱 실패 시 에러 메시지 + "다시 추천" 유도
- 429는 프록시 텍스트 폴백 체인이 처리
- reasoning 모델은 이미지 폴백에서 제외됨 (content null 문제)

---

## 완료 조건

- [x] URL 파라미터에서 재료 목록 수신 및 표시
- [x] 조건 선택 UI (조리 시간 / 난이도 / 식단 / 요리 스타일)
- [x] 식단: 괴식 옵션 (창의적 레시피 유도 프롬프트)
- [x] 요리 스타일: 한식 / 양식 / 중식 / 동남아식
- [x] 조건 패널 접힘/펼침, 추천 시 자동 닫힘
- [x] SSE 스트리밍 API 호출
- [x] 레시피 완성 순서대로 카드 점진 렌더링
- [x] 스켈레톤 카드 1개 + "레시피 구상 중 n.ns" 타이머
- [x] 로딩 중 자동 스크롤 + 사용자 스크롤 오버라이드 + 다운 버튼
- [x] 레시피 카드 (이름 / 설명 / 재료 / 단계 접힘)
- [x] "저장" → localStorage `fridge_saved_recipes`
- [x] "다시 추천" 동작
