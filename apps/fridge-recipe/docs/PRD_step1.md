# PRD Step 1 — 냉장고 이미지에서 재료 인식

## 목표

사용자가 냉장고 사진을 업로드하면, 이미지를 분석해 포함된 식재료 목록을 추출한다.

---

## 사용자 흐름

1. 사용자가 이미지 업로드 영역에 사진을 드래그 앤 드롭하거나 파일을 선택한다.
2. 미리보기 이미지가 표시된다.
3. "재료 인식" 버튼을 누르면 분석이 시작된다.
4. 로딩 인디케이터가 표시되는 동안 API 요청이 진행된다.
5. 인식된 재료 목록이 태그 형태로 표시된다.
6. 사용자가 태그를 추가하거나 삭제해 목록을 수정할 수 있다.
7. "레시피 추천받기" 버튼으로 Step 2로 진행한다.

---

## API

**엔드포인트:** `POST /api/chat` (openrouter-proxy, `http://localhost:3035`)

**모델:** `"auto"` (프록시가 이미지 감지 후 자동 선택)

**이미지 폴백 체인** (프록시가 `model: "auto"` 수신 시 순서대로 시도):
1. `google/gemma-4-31b-it:free`
2. `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
3. `google/gemma-4-26b-a4b-it:free`
4. `baidu/qianfan-ocr-fast:free`

> 404(모델 없음) 등 429 이외의 오류는 폴백 없이 그대로 반환된다.

**요청 구조:**

```json
{
  "model": "google/gemma-4-31b-it:free",
  "messages": [
    {
      "role": "system",
      "content": "You are a kitchen inventory scanner. Output ONLY a valid JSON array of ingredient names in Korean. No explanation, no markdown, no extra text."
    },
    {
      "role": "user",
      "content": [
        { "type": "image_url", "image_url": { "url": "<base64 data URL>" } },
        { "type": "text", "text": "List all visible food ingredients in this refrigerator image. Return a JSON array only." }
      ]
    }
  ],
  "max_tokens": 300,
  "temperature": 0
}
```

**응답 파싱:**
- `choices[0].message.content` 또는 `choices[0].message.reasoning`에서 JSON 배열 추출
- 파싱 실패(JSON 배열이 아닌 경우) → 에러로 처리, "다시 시도" 안내 (텍스트 분리 fallback 없음)

---

## 이미지 전처리 (클라이언트)

업로드된 파일은 API 전송 전 Canvas로 압축된다:

- 최대 해상도: 1024px (긴 쪽 기준)
- 인코딩: JPEG, quality 0.82
- 서버 body 한도: 20MB (압축 후 실제 전송 크기는 통상 수십~수백 KB)

사용자에게 압축 통계(원본/압축 크기)는 표시하지 않는다.

---

## UI 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `ImageDropzone` | 드래그 앤 드롭 + 클릭 파일 선택, 미리보기 표시 |
| `AnalyzeButton` | 로딩 상태 포함, 이미지 없으면 비활성화 |
| `IngredientTagList` | 재료를 태그로 표시, 개별 삭제(×) + 직접 추가 입력 |
| `NextStepButton` | 재료 1개 이상일 때 활성화, Step 2로 상태 전달 |

---

## 상태

```ts
interface Step1State {
  imageFile: File | null;
  imageUrl: string | null;
  ingredients: string[];
  status: 'idle' | 'loading' | 'done' | 'error';
  errorMessage: string | null;
}
```

---

## 제약 및 예외 처리

- 이미지 파일만 허용 (JPEG, PNG, WebP)
- 클라이언트 압축 후 20MB 미만이면 서버에서 수용 (실제로는 압축 후 훨씬 작음)
- JSON 파싱 실패 시 에러 표시 및 재시도 유도 (텍스트 분리 fallback 없음)
- 429는 프록시 폴백 체인이 자동 처리
- 재료를 0개로 줄이면 "레시피 추천받기" 버튼 비활성화

---

## 완료 조건

- [x] 이미지 업로드 후 미리보기 표시
- [x] 클라이언트 이미지 압축 (1024px / JPEG 0.82)
- [x] API 호출 → 재료 목록 파싱 성공
- [x] 태그 추가 / 삭제 동작
- [x] 에러(네트워크, 파싱 실패) 시 사용자에게 메시지 표시
- [ ] Step 2로 재료 목록 전달
