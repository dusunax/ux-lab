---
description: Figma URL 하나의 노드를 컴포넌트로 구현한다. 구현 후 Figma 원본과 정합성 검증을 3회 반복하여 퀄리티를 높인다. (쇼케이스 등록은 /figma-harness-showcase 사용)
---

# Figma → Component (단일)

**인수:** $ARGUMENTS

> **먼저 `.agent/skills/FIGMA_HARNESS_CORE.md`(이하 코어)를 정독한다.** 공통 절차(인증·URL 파싱·디자인 컨텍스트·에셋·버저닝·타입 체크·검증·보고)는 전부 코어를 따르고, 아래는 이 커맨드의 고유 사항만 기술한다.

## 모드 요약

| 항목 | 값 |
|---|---|
| 대상 | 단일 노드 1개 |
| 검증 횟수 | 3회 |
| 허용 오차 | 일반 (코어 §7.4 테이블의 "일반" 열) |
| 쇼케이스 등록 | 없음 |
| 검증 대상 페이지 | `/preview` (코어 §7.2 프리뷰 마운트 필수) |

## Step 0 — 인수 파싱

`$ARGUMENTS`에서 추출:
- `url`: Figma URL (필수)
- `--json`: 완료 보고를 JSON 형식으로 출력 (선택)

예시:
- `/figma-harness https://www.figma.com/design/...?node-id=0-40522`
- `/figma-harness https://www.figma.com/design/...?node-id=0-40522 --json`

## 절차

1. **인증 확인** — 코어 §1
2. **URL 파싱** — 코어 §2 (`fileKey`, `nodeId`)
3. **디자인 컨텍스트 수집** — 코어 §3. 스크린샷을 레퍼런스로 보관
4. **에셋 다운로드** — 코어 §4
5. **컴포넌트 생성** — `apps/figma-harness/app/components/{ComponentName}.tsx`. 버저닝·마크업·품질 규칙은 코어 §5 (FRONTEND_DESIGN.md 포함)
6. **타입 체크** — 코어 §6
7. **정합성 검증 3회** — 코어 §7 전체를 따른다:
   - dev 서버 3900 포트 기동 + 헬스체크 (§7.1)
   - **`app/preview/page.tsx`를 이 컴포넌트 마운트로 덮어쓰기 (§7.2)** — 이 커맨드는 쇼케이스에 등록하지 않으므로 /preview 마운트 없이는 렌더링 결과 자체가 없다. 반드시 수행한다.
   - Playwright MCP element 캡처로 대조 (§7.3), 회차 절차·보고 (§7.4–7.5)
   - 종료 시 dev 서버 정리 (§7.6)

## 완료 보고

코어 §8의 규칙(텍스트/JSON 분기, fail 상세 객체, 실패 JSON)을 따른다.

### 텍스트

```
### 기본 정보
| 항목          | 값                              |
|---------------|---------------------------------|
| 컴포넌트      | {Name}.tsx                      |
| Figma 노드    | 0:XXXXX                         |
| 다운로드 에셋 | N개 (public/assets/)            |
| 정합성 검증   | {total}회 중 {completed}회 완료 |

(정합성 체크리스트·잔여 차이는 코어 §8 골격)
```

### JSON (`--json`)

```json
{
  "command": "figma-harness",
  "component": "{Name}.tsx",
  "figmaNode": "0:XXXXX",
  "assets": N,
  "verification": { "total": 3, "completed": N },
  "checks": {
    "pixel": { "size": "pass|fail", "color": "pass|fail", "typography": "pass|fail", "spacing": "pass|fail", "borderRadius": "pass|fail", "boxShadow": "pass|fail" },
    "state": { "default": "pass|fail", "hover": "pass|fail|not-defined", "active": "pass|fail|not-defined", "disabled": "pass|fail|not-defined", "focus": "pass|fail|not-defined" },
    "color": { "background": "pass|fail", "text": "pass|fail", "border": "pass|fail", "icon": "pass|fail" },
    "property": { "fontFamily": "pass|fail", "fontWeight": "pass|fail", "letterSpacing": "pass|fail", "borderRadius": "pass|fail", "boxShadow": "pass|fail", "assets": "pass|fail" }
  },
  "remainingDiffs": []
}
```

실패 시: 코어 §8 실패 스키마에 `"command": "figma-harness"`.
