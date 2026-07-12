---
description: Figma 페이지 URL을 받아 해당 페이지의 모든 최상위 노드를 순서대로 구현한다. 전체 구현 완료 후 Figma 원본과 정합성 검증을 3회 반복하여 퀄리티를 높인다. (쇼케이스 등록은 /figma-harness-showcase --all 사용)
---

# Figma → Component (전체 자동화)

**인수:** $ARGUMENTS

> **먼저 `.agent/skills/FIGMA_HARNESS_CORE.md`(이하 코어)를 정독한다.** 공통 절차는 전부 코어를 따르고, 아래는 이 커맨드의 고유 사항만 기술한다.

## 모드 요약

| 항목 | 값 |
|---|---|
| 대상 | 페이지의 모든 최상위 노드 (필터링 후) |
| 검증 횟수 | 3회 (전체 구현 완료 후 일괄) |
| 허용 오차 | 일반 (코어 §7.4 테이블의 "일반" 열) |
| 쇼케이스 등록 | 없음 |
| 검증 대상 페이지 | `/preview` (코어 §7.2 — 구현한 컴포넌트 전부를 나열 마운트) |

## Step 0 — 인수 파싱

`$ARGUMENTS`에서 추출:
- `url`: Figma 페이지 URL (필수)
- `--json`: 완료 보고를 JSON 형식으로 출력 (선택)

예시:
- `/figma-harness-all https://www.figma.com/design/...?node-id=0-40222`
- `/figma-harness-all https://www.figma.com/design/...?node-id=0-40222 --json`

## 절차

1. **인증 확인** — 코어 §1
2. **URL 파싱** — 코어 §2 (`fileKey`, `pageNodeId` — 없으면 첫 번째 페이지)
3. **노드 목록 수집 (이 커맨드 고유)** — 현재 런타임의 Figma MCP `get_metadata` 호출 (`fileKey`, `nodeId`=pageNodeId):
   - 최상위 자식 노드(children) 중 타입이 `FRAME`, `COMPONENT`, `COMPONENT_SET`, `GROUP`인 것만 대상
   - `RECTANGLE`, `TEXT`, `VECTOR` 등 단순 원소는 건너뜀
   - **수집된 노드 목록을 사용자에게 먼저 보여주고 계속 진행할지 확인한다**
4. **노드별 순차 구현** — 각 노드에 대해 반복:
   - 디자인 컨텍스트 수집 (코어 §3, 노드별 스크린샷 보관)
   - 에셋 다운로드 (코어 §4 — 공유 에셋은 중복 다운로드 금지)
   - 컴포넌트 생성: `apps/figma-harness/app/components/{ComponentName}.tsx` (코어 §5)
5. **타입 체크** — 코어 §6 (에러 시 해당 파일만 수정)
6. **정합성 검증 3회** — 코어 §7. 이 커맨드 고유:
   - `app/preview/page.tsx`에 **구현한 컴포넌트 전부를 세로 나열**로 마운트하고, 각 래퍼에 `data-verify="{ComponentName}"` 부여 (§7.2)
   - element 캡처(§7.3)는 컴포넌트별로 수행하고, 회차 보고(§7.5)도 컴포넌트별로 작성
   - 종료 시 dev 서버 정리 (§7.6)

## 완료 보고

코어 §8의 규칙을 따른다.

### 텍스트

```
### 기본 정보
| 항목          | 값                              |
|---------------|---------------------------------|
| 다운로드 에셋 | N개 (public/assets/)            |
| 정합성 검증   | {total}회 중 {completed}회 완료 |

### 구현 결과
| 노드 ID  | 컴포넌트      | 파일              | 구현 | 검증  |
|----------|---------------|-------------------|------|-------|
| 0:XXXXX  | ButtonCompose | ComposeButton.tsx | ✅   | 3회   |
| 0:YYYYY  | ...           | ...               | ❌   | —     |
(✅ 신규생성 / 🔄 업데이트 / ❌ 실패)

(정합성 체크리스트·잔여 차이는 코어 §8 골격)
```

### JSON (`--json`)

```json
{
  "command": "figma-harness-all",
  "assets": N,
  "verification": { "total": 3, "completed": N },
  "components": [
    {
      "name": "ComposeButton",
      "figmaNode": "0:XXXXX",
      "file": "ComposeButton.tsx",
      "status": "created|updated|failed",
      "checks": {
        "pixel": { "size": "pass|fail", "color": "pass|fail", "typography": "pass|fail", "spacing": "pass|fail", "borderRadius": "pass|fail", "boxShadow": "pass|fail" },
        "state": { "default": "pass|fail", "hover": "pass|fail|not-defined", "active": "pass|fail|not-defined", "disabled": "pass|fail|not-defined", "focus": "pass|fail|not-defined" },
        "color": { "background": "pass|fail", "text": "pass|fail", "border": "pass|fail", "icon": "pass|fail" },
        "property": { "fontFamily": "pass|fail", "fontWeight": "pass|fail", "letterSpacing": "pass|fail", "borderRadius": "pass|fail", "boxShadow": "pass|fail", "assets": "pass|fail" }
      }
    }
  ],
  "summary": { "total": N, "created": N, "updated": N, "failed": N },
  "remainingDiffs": []
}
```

실패 시: 코어 §8 실패 스키마에 `"command": "figma-harness-all"`.
