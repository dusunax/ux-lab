# Agent File Scope Rules

에이전트가 파일을 수정할 때 적용되는 소유권 규칙.
오케스트레이터(Sam)는 브리핑 시 수신 에이전트에게 이 규칙을 기반으로 **담당 파일 범위**를 명시적으로 전달한다.

---

## 파일 소유권 테이블

| 역할 | 에이전트 | 쓰기 허용 경로 | 읽기 |
|------|---------|--------------|------|
| **FE** | Avery | `apps/**/app/**` (API 제외), `apps/**/components/**`, `apps/**/styles/**`, `apps/**/public/**`, `apps/**/src/**` (API 제외), `*.css`, `*.html` (API 파일 제외) | 전체 |
| **BE** | Blake | `apps/**/api/**`, `apps/**/lib/**`, `apps/**/app/api/**`, `apps/ai-empathy-diary/api/**`, `apps/puppeteer-api/**` | 전체 |
| **PERF** | Chase | `*.config.js`, `*.config.ts`, `vercel.json`, `vercel.ts`, `package.json`, `pnpm-lock.yaml`, `.npmrc`, `.env*`, `Dockerfile` | 전체 |
| **AI** | Sage | `apps/openrouter-proxy/**`, AI 관련 프롬프트·설정 파일 | 전체 |
| **PM** | Jordan | `docs/**`, `.claude/agent-memory/**` | 전체 |
| **TS** | Alex | `docs/meetings/**` | 전체 |
| **UX** | Riley | 읽기 전용 (피드백은 텍스트 출력만) | 전체 |
| **QA** | Morgan, Quinn | 읽기 전용 (결과는 텍스트 출력만) | 전체 |
| **OC** | Sam | `.claude/agents/**`, `.claude/commands/**`, `.claude/rules/**` | 전체 |

---

## 경계 파일 소유권 (OQ-2 결정)

단일 파일이 FE·BE 경계에 걸치는 경우 아래 기준으로 결정한다.

| 파일 패턴 | 소유 역할 | 근거 |
|-----------|---------|------|
| `apps/**/app/api/**/route.ts` | **BE** Blake | Next.js App Router API Route는 서버사이드 코드 |
| `apps/**/pages/api/**` | **BE** Blake | Pages Router API Route도 서버사이드 코드 |
| `apps/**/app/layout.tsx`, `page.tsx` | **FE** Avery | 렌더링 책임 |
| `package.json` (의존성 추가) | 요청자 역할 | FE 추가면 Avery, BE 추가면 Blake. 빌드 설정이면 Chase |
| `apps/ai-empathy-diary/index.html` | **FE** Avery | 싱글 HTML 구조의 UI 레이어 |
| `apps/ai-empathy-diary/api/*.js` | **BE** Blake | Vercel serverless function |

---

## 위반 처리 방침 (OQ-1 결정)

파일 영역 제약 위반이 감지되면 **경고 출력 후 계속 진행**한다. 작업을 거부하지 않는다.

**이유:** 프롬프트 레벨 제약은 기술적 강제 수단이 없으므로, 경고를 통해 사용자가 판단할 기회를 주는 것이 더 실용적이다.

Sam의 브리핑에 다음 형식으로 경고를 삽입한다:

```
⚠️ 파일 범위 주의: [파일명]은 [다른 역할]의 소유권 범위에 속합니다.
   필요하다면 [다른 에이전트]와 협의 후 수정하세요.
```

---

## 오케스트레이터 브리핑 삽입 규칙

Sam이 에이전트에게 태스크를 위임할 때, 컨텍스트 브리프의 **마지막 항목**으로 아래 블록을 항상 추가한다:

```
- 파일 범위 제약: [해당 역할의 쓰기 허용 경로 목록]
  (이 범위 외 파일은 수정하지 말 것. 불가피하면 오케스트레이터에게 보고)
```

QA·UX처럼 읽기 전용 역할의 경우:

```
- 파일 범위 제약: 읽기 전용. 파일 수정 금지. 결과는 텍스트 출력만.
```
