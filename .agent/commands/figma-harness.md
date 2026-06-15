---
description: Figma URL 하나의 노드를 컴포넌트로 구현한다. 구현 후 Figma 원본과 정합성 검증을 3회 반복하여 퀄리티를 높인다. (쇼케이스 등록은 /figma-harness-showcase 사용)
---

# Figma → Component (단일)

**인수:** $ARGUMENTS

## Step 0 — 인수 파싱

`$ARGUMENTS`에서 추출:
- `url`: Figma URL (필수)
- `--json`: 완료 보고를 JSON 형식으로 출력 (선택)

예시:
- `/figma-harness https://www.figma.com/design/...?node-id=0-40522`
- `/figma-harness https://www.figma.com/design/...?node-id=0-40522 --json`

## Step 1 — URL 파싱

주어진 URL에서 추출:
- `fileKey`: `/design/:fileKey/` 부분
- `nodeId`: `node-id=` 값에서 `-`를 `:`으로 변환 (예: `0-40522` → `0:40522`)

## Step 2 — Figma MCP로 디자인 컨텍스트 가져오기

`mcp__plugin_figma_figma__get_design_context` 호출:
- `nodeId`: 변환된 노드 ID
- `fileKey`: 추출한 파일 키
- `clientFrameworks`: `"react,next.js"`
- `clientLanguages`: `"typescript"`

Figma MCP가 인증되지 않은 경우 `mcp__plugin_figma_figma__authenticate`를 먼저 호출하여 OAuth 인증을 진행한다.

응답에 포함된 **스크린샷 이미지**를 레퍼런스로 보관한다. 이후 픽셀 대조에 사용한다.

## Step 3 — 컴포넌트 파일 생성

### 버저닝 규칙 (CRITICAL)

`apps/figma-harness/app/components/` 디렉토리에서 동일한 이름의 파일이 이미 존재하는지 `Glob`으로 확인한다.

- **동일 파일이 없으면**: `{ComponentName}.tsx` 생성
- **동일 파일이 이미 존재하면**: 기존 파일을 절대 덮어쓰지 않고 `{ComponentName}V2.tsx` 생성
  - V2도 이미 존재하면 V3, V3도 존재하면 V4… 순서로 올린다.

`apps/figma-harness/app/components/{ComponentName}.tsx` (또는 버전 접미사 포함) 생성.

**규칙:**
- Figma의 `data-node-id` 어트리뷰트 제거
- `absolute contents` 같은 Figma 아티팩트 제거하고 정리된 마크업으로 변환
- `font-nunito` 클래스 사용 (Nunito Sans, layout.tsx에 이미 로드됨)
- Props: `label?`, `onClick?`, `className?` 기본 포함

**아이콘 처리 (CRITICAL):**

이모지, 플레이스홀더 SVG, 텍스트 대체는 절대 금지. 반드시 실제 에셋을 사용한다.

`get_design_context` 응답 코드에 `const imgXxx = "https://www.figma.com/api/mcp/asset/..."` 형태로 에셋 URL이 포함된다.

```bash
mkdir -p apps/figma-harness/public/assets
curl -L "https://www.figma.com/api/mcp/asset/..." \
  -o apps/figma-harness/public/assets/{icon-name}.svg
```

- SVG인 경우: `public/assets/{name}.svg` 저장 후 `<img src="/assets/{name}.svg" />` 또는 인라인 SVG로 사용
- PNG/WebP인 경우: `public/assets/{name}.png` 저장 후 `next/image`의 `<Image>` 컴포넌트로 사용
- 파일명은 Figma 레이어 이름 기준으로 kebab-case 변환 (예: `UK Flag` → `uk-flag.svg`)
- 다운로드한 에셋 경로를 컴포넌트 상단 상수로 선언:

```tsx
const ICON_SEARCH = '/assets/icon-search.svg'
const FLAG_UK = '/assets/flag-uk.png'
```

```tsx
type XxxProps = {
  label?: string
  onClick?: () => void
  className?: string
}

export default function Xxx({ label = '...', onClick, className = '' }: XxxProps) {
  return ( ... )
}
```

## Step 4 — 타입 체크

```bash
cd apps/figma-harness && npx tsc --noEmit
```

에러가 있으면 수정 후 재확인. 통과하면 Step 5로 진행한다.

## Step 5 — 정합성 검증 (3회 반복)

dev 서버를 실행하고 렌더링 결과를 Figma 원본 스크린샷과 시각적으로 비교한다.
**총 3회 반복하며 매 회차마다 발견된 차이를 수정한다.**

정합성 검증은 픽셀 대조뿐 아니라 **상태·색상·속성** 전반을 포함한다.

### 준비

```bash
pnpm --filter figma-harness dev &
sleep 3
npx --yes playwright@latest screenshot --full-page http://localhost:3000 /tmp/harness-render.png
```

### 회차별 절차

**① 이미지 열람** — Figma 원본(Step 2 보관) vs `/tmp/harness-render.png`

**② 차이 항목 도출**

**[픽셀 대조]** 크기 / 색상 / 타이포그래피 / 간격 / border-radius / box-shadow / 정렬 / 투명도

**[상태 체크]** Default / Hover / Active / Disabled / Focus — 각각 Figma 정의 여부 및 CSS 구현 일치 확인

**[색상 속성]** 배경색 / 텍스트 색상 / 테두리 색상 / 아이콘 색상 — 정확한 hex 값 비교

**[속성]** font-family / font-weight / letter-spacing / border-radius / box-shadow / 에셋 동일성

**③ 수정** → 파일에 반영 후 `npx tsc --noEmit`

**④ 재캡처** → `npx --yes playwright@latest screenshot --full-page http://localhost:3000 /tmp/harness-render.png`

### 회차 종료 조건

3회 반복 후 또는: 픽셀 오차 ≤ 2px, 색상 완전 일치, 상태 모두 구현/미정의 확인, 속성 완전 일치

### 회차별 보고

```
[회차 N/3]
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
| 컴포넌트      | {Name}.tsx                      |
| Figma 노드    | 0:XXXXX                         |
| 다운로드 에셋 | N개 (public/assets/)            |
| 정합성 검증   | {total}회 중 {completed}회 완료 |

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

`fail` 값: `{ "status": "fail", "figma": "{값}", "current": "{값}" }` 객체로 상세 기록.
