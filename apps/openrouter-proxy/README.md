# openrouter-proxy

OpenRouter API를 호출하는 NestJS 중계 서버입니다.  
프론트엔드에서 바로 OpenRouter 키를 노출하지 않고, 공통 백엔드 엔드포인트로 요청을 전달하기 위한 프록시입니다.

## 특징

- `POST /api/chat` 요청을 받아 OpenRouter `chat/completions` API로 전달
- 요청 본문(`messages`)의 타입을 보고 `image`/`text` 모델 그룹을 자동 판별
- 요청 실패 시(HTTP 429) fallback 모델을 순차적으로 시도
- OpenRouter 응답 상태 코드/본문을 그대로 클라이언트로 반환

## 폴더 구조

```
apps/openrouter-proxy/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── decisions/            # jev(Decisions) 프록시
│   │   ├── decisions.controller.ts
│   │   ├── decisions.dto.ts
│   │   ├── decisions.module.ts
│   │   └── decisions.service.ts
│   ├── chat/
│   │   ├── chat.controller.ts
│   │   ├── chat.dto.ts
│   │   ├── chat.module.ts
│   │   └── chat.service.ts
│   └── openrouter/
│       └── openrouter.service.ts
├── package.json
└── README.md
```

## 실행

### 1) 설치

```bash
cd apps/openrouter-proxy
pnpm install
```

### 2) 환경변수

앱 루트(`apps/openrouter-proxy/.env`)에 파일을 만들거나, 서버 기동 시 환경변수로 주입합니다.

```bash
OPENROUTER_KEY=your_openrouter_api_key
PORT=3035  # 선택: 기본값 3035
```

`.env`는 빌드 결과 `dist/` 기준 상대 경로(`../..env`)로 자동 로드됩니다.  
배포 환경에서는 `.env` 없이 환경변수를 직접 주입하면 동일하게 동작합니다.

### 3) 실행/빌드

```bash
pnpm dev      # 개발 모드 (nest start --watch)
pnpm build    # 컴파일 (dist/)
pnpm start    # 빌드 결과 실행
```

또는 ux-lab 루트에서:

```bash
pnpm dev:openrouter    # 개발 모드
pnpm build:openrouter  # 빌드
pnpm start:openrouter  # 실행
```

기본 실행 주소는 `http://localhost:3035` 입니다.

## API

### POST /api/chat

OpenRouter `chat/completions` 형식과 호환되는 바디를 전달합니다.

```http
POST /api/chat
Content-Type: application/json
```

```json
{
  "model": "openai/gpt-oss-120b:free",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "max_tokens": 256,
  "stream": false
}
```

### POST /api/decisions

`~typesafe/jev-latest`(decisions 모델)용 프록시입니다. 이 모델은 `chat/completions`로 호출할 수 없고
OpenRouter 알파 엔드포인트 `/api/alpha/decisions`를 사용합니다. 모델은 서버에서 고정되며 클라이언트는 `state`와 `questions`만 보냅니다.

```json
{
  "state": { "situation": "초인종이 울렸다" },
  "questions": {
    "action": {
      "type": "choice",
      "instructions": "다음 행동을 고른다",
      "criteria": { "hide": "숨는다", "ignore": "무시한다" }
    }
  }
}
```

- 질문 타입: `choice`(선택지별 확률), `noul`(참/거짓 확률), `score`(0~1 점수)
- 응답: `{ answers: { action: { choice, probabilities, confidence } }, usage }`
- 제한: questions 1~8개, state 8,000자 이하 → 위반 시 `400`
- 알파 엔드포인트 특성상 응답이 간헐적으로 지연되어 20초 타임아웃 후 `504`를 반환합니다.
- 사용처: `apps/cat-game`
- 배포: cat-game용 인스턴스는 Vercel 프로젝트 `cat-game-proxy`로 운영 중이며, [cat-game-wheat-sigma.vercel.app](https://cat-game-wheat-sigma.vercel.app/)의 `VITE_PROXY_URL`이 이 인스턴스를 가리킵니다.
- 모니터링: [Vercel Analytics](https://vercel.com/dusuna/cat-game-proxy/analytics?environment=all) (Vercel 계정 접근 권한 필요)

### 동작

1. `requestedModel`을 먼저 시도
2. 실패(`429`) 시 이미지/텍스트 그룹별 fallback 모델 순으로 재시도
3. 최종 응답은 OpenRouter 응답 status/body를 그대로 반환

## 폴백 모델

- 이미지(멀티모달) 관련 메시지일 때
  - `google/gemma-4-31b-it:free`
  - `google/gemma-4-26b-a4b-it:free`
  - `nvidia/nemotron-nano-12b-v2-vl:free`
  - `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
  - `baidu/qianfan-ocr-fast:free`
- 텍스트 메시지일 때
  - `openai/gpt-oss-120b:free`
  - `meta-llama/llama-3.3-70b-instruct:free`
  - `nvidia/nemotron-3-super-120b-a12b:free`
  - `openai/gpt-oss-20b:free`
  - `qwen/qwen3-next-80b-a3b-instruct:free`
  - `minimax/minimax-m2.5:free`

> 요청 본문의 `model`도 fallback 후보의 첫 번째로 포함됩니다.

## 요청 크기 제한

이미지를 base64로 전송하는 경우 body 크기가 커집니다. 기본 설정:

| 항목 | 값 |
|---|---|
| JSON body 한도 | **20MB** |
| 권장 클라이언트 전처리 | 최대 1024px 리사이즈 + JPEG quality 0.82 압축 |

클라이언트에서 이미지를 압축하지 않고 원본을 그대로 전송하면 10MB 이미지가 base64로 ~13.3MB가 되어 한도 내에 들어오지만, 토큰 소비가 불필요하게 늘어납니다.  
`fridge-recipe` 앱은 Canvas API로 전처리 후 전송합니다.

## 유의사항

- `OPENROUTER_KEY` 미설정 시 앱 부팅 즉시 종료됩니다.
- 멀티모달 메시지는 `messages[].content`가 `[{ "type": "image_url", ...}]` 형태로 들어와야 합니다.
- nvidia nemotron 계열 reasoning 모델은 `content`가 `null`이고 응답이 `message.reasoning`에 담길 수 있습니다. 클라이언트에서 `content ?? reasoning` 순으로 추출하세요.
- 클라이언트에는 OpenRouter API 키가 노출되지 않습니다.
