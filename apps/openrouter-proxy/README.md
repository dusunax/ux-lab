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
npm install
```

### 2) 환경변수

```bash
OPENROUTER_KEY=your_openrouter_api_key
PORT=3035 # 선택: 기본값 3035
```

### 3) 실행/빌드

```bash
npm run dev      # 개발 모드
npm run build    # 컴파일
npm start        # 빌드 결과 실행
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

## 유의사항

- `OPENROUTER_KEY` 미설정 시 앱 부팅 시 예외가 발생합니다.
- 멀티모달 메시지는 `messages[].content`가 `[{ "type": "image_url", ...}]` 형태로 들어와야 합니다.
- 클라이언트에는 OpenRouter API 키가 노출되지 않습니다.
