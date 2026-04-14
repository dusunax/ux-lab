---
description: Figma 페이지 URL을 받아 해당 페이지의 모든 최상위 노드를 순서대로 구현한다. 전체 구현 완료 후 Figma 원본과 정합성 검증을 3회 반복하여 퀄리티를 높인다. (쇼케이스 등록은 /figma-harness-showcase --all 사용)
---

# Figma → Component (전체 자동화)

**인수:** $ARGUMENTS

## Step 0 — 인수 파싱

`$ARGUMENTS`에서 추출:
- `url`: Figma 페이지 URL (필수)
- `--json`: 완료 보고를 JSON 형식으로 출력 (선택)

예시:
- `/figma-harness-all https://www.figma.com/design/...?node-id=0-40222`
- `/figma-harness-all https://www.figma.com/design/...?node-id=0-40222 --json`

## Step 1 — URL 파싱

주어진 URL에서 추출:
- `fileKey`: `/design/:fileKey/` 부분
- `pageNodeId`: `node-id=` 값에서 `-`를 `:`으로 변환 (없으면 첫 번째 페이지 사용)

Figma MCP가 인증되지 않은 경우 `mcp__plugin_figma_figma__authenticate`를 먼저 호출하여 OAuth 인증을 진행한다.

## Step 2 — 페이지 메타데이터로 노드 목록 수집

`mcp__plugin_figma_figma__get_metadata` 호출:
- `fileKey`: 추출한 파일 키
- `nodeId`: 파싱한 페이지 노드 ID (있는 경우)

응답에서 최상위 자식 노드(children)를 추출한다.
- 타입이 `FRAME`, `COMPONENT`, `COMPONENT_SET`, `GROUP`인 노드만 대상
- 타입이 `RECTANGLE`, `TEXT`, `VECTOR` 등 단순 원소는 건너뜀

수집된 노드 목록을 사용자에게 먼저 보여주고 계속 진행할지 확인한다.

## Step 3 — 노드별 순차 구현

각 노드에 대해 아래를 반복한다.

### 3-1. 디자인 컨텍스트 가져오기

`mcp__plugin_figma_figma__get_design_context` 호출:
- `nodeId`: 해당 노드 ID
- `fileKey`: 파일 키
- `clientFrameworks`: `"react,next.js"`
- `clientLanguages`: `"typescript"`

응답에 포함된 **스크린샷 이미지**를 해당 노드의 레퍼런스로 보관한다.

### 3-2. 컴포넌트 파일 생성

#### 버저닝 규칙 (CRITICAL)

`apps/figma-harness/app/components/` 디렉토리에서 동일한 이름의 파일이 이미 존재하는지 `Glob`으로 확인한다.

- **동일 파일이 없으면**: `{ComponentName}.tsx` 생성
- **동일 파일이 이미 존재하면**: 기존 파일을 절대 덮어쓰지 않고 `{ComponentName}V2.tsx` 생성
  - V2도 이미 존재하면 V3, V3도 존재하면 V4… 순서로 올린다.

`apps/figma-harness/app/components/{ComponentName}.tsx` (또는 버전 접미사 포함) 생성.

**규칙:**
- Figma의 `data-node-id` 어트리뷰트 제거
- `absolute contents` 같은 Figma 아티팩트 제거, 정리된 마크업으로 변환
- `font-nunito` 클래스 사용
- Props: `label?`, `onClick?`, `className?` 기본 포함

**아이콘 처리 (CRITICAL):**

이모지, 플레이스홀더 SVG, 텍스트 대체는 절대 금지. 반드시 실제 에셋을 사용한다.

```bash
mkdir -p apps/figma-harness/public/assets
curl -L "https://www.figma.com/api/mcp/asset/..." \
  -o apps/figma-harness/public/assets/{icon-name}.svg
```

- 파일명은 Figma 레이어 이름 기준으로 kebab-case 변환
- 여러 컴포넌트가 동일한 에셋을 공유하는 경우, 중복 다운로드하지 않고 재사용

모든 노드 반복이 끝나면 Step 4로 진행한다.

## Step 4 — 타입 체크

```bash
cd apps/figma-harness && npx tsc --noEmit
```

에러가 있으면 해당 파일만 수정 후 재확인한다.

## Step 5 — 정합성 검증 (3회 반복)

정합성 검증은 픽셀 대조뿐 아니라 **상태·색상·속성** 전반을 포함한다.

### 준비

```bash
pnpm --filter figma-harness dev &
sleep 3
npx --yes playwright@latest screenshot --full-page http://localhost:3000 /tmp/harness-render.png
```

### 회차별 절차

**① 이미지 열람** — 각 노드의 Figma 원본(Step 3-1 보관) vs `/tmp/harness-render.png`

**② 차이 항목 도출 — 컴포넌트별**

**[픽셀 대조]** 크기 / 색상 / 타이포그래피 / 간격 / border-radius / box-shadow / 정렬 / 투명도

**[상태 체크]** Default / Hover / Active / Disabled / Focus — 각각 Figma 정의 여부 및 CSS 구현 일치 확인

**[색상 속성]** 배경색 / 텍스트 색상 / 테두리 색상 / 아이콘 색상 — 정확한 hex 값 비교

**[속성]** font-family / font-weight / letter-spacing / border-radius / box-shadow / 에셋 동일성

우선순위: 색상 → 크기 → 간격 → 타이포그래피 → 상태 → 속성

**③ 수정** → 파일에 반영 후 `npx tsc --noEmit`

**④ 재캡처** → `npx --yes playwright@latest screenshot --full-page http://localhost:3000 /tmp/harness-render.png`

### 회차 종료 조건

3회 반복 후 또는: 픽셀 오차 ≤ 2px, 색상 완전 일치, 상태 모두 구현/미정의 확인, 속성 완전 일치

### 회차별 보고

```
[회차 N/3] {ComponentName}
- [픽셀] {항목}: Figma={값} / 현재={값}
- [상태] {항목}: Figma={정의/미정의} / 현재={구현/미구현}
- [색상] {항목}: Figma={hex} / 현재={hex}
- [속성] {항목}: Figma={값} / 현재={값}
수정: (파일명:줄번호) {전} → {후}
```

## 완료 보고

`--json` 없으면 텍스트, 있으면 JSON.

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

### 정합성 체크리스트
[픽셀] 크기 {✅|❌}  색상 {✅|❌}  타이포그래피 {✅|❌}  간격 {✅|❌}  border-radius {✅|❌}  box-shadow {✅|❌}
[상태] Default {✅|❌}  Hover {✅|❌|미정의}  Active {✅|❌|미정의}  Disabled {✅|❌|미정의}  Focus {✅|❌|미정의}
[색상] 배경 {✅|❌}  텍스트 {✅|❌}  테두리 {✅|❌}  아이콘 {✅|❌}
[속성] font-weight {✅|❌}  letter-spacing {✅|❌}  border-radius {✅|❌}  box-shadow {✅|❌}  에셋 {✅|❌}

### 잔여 차이
없음 | - {항목}: Figma={값} / 현재={값}
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

`fail` 값: `{ "status": "fail", "figma": "{값}", "current": "{값}" }` 객체로 상세 기록.
