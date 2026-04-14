---
description: Figma 컴포넌트를 구현하고 page.tsx 쇼케이스에 등록한다. --all로 페이지 전체를, --snapshot으로 스냅샷 형식을 선택할 수 있다. 사용법: /figma-harness-showcase URL [--all] [--snapshot [횟수]] [--json]
---

# Figma → Showcase

**인수:** $ARGUMENTS

## Step 0 — 인수 파싱

`$ARGUMENTS`에서 추출:
- `url`: Figma URL (필수)
- `--all`: 페이지의 모든 최상위 노드를 순서대로 처리 (선택)
- `--snapshot [N]`: 스냅샷 형식으로 구현, N회 픽셀 대조 반복 (선택, 기본 3회)
- `--json`: 완료 보고를 JSON 형식으로 출력 (선택)

예시:
```
/figma-harness-showcase https://figma.com/design/...?node-id=0-40522
/figma-harness-showcase https://figma.com/design/...?node-id=0-40222 --all
/figma-harness-showcase https://figma.com/design/...?node-id=0-40522 --snapshot
/figma-harness-showcase https://figma.com/design/...?node-id=0-40522 --snapshot 5
/figma-harness-showcase https://figma.com/design/...?node-id=0-40222 --all --snapshot
/figma-harness-showcase https://figma.com/design/...?node-id=0-40522 --json
```

## Step 1 — URL 파싱

주어진 URL에서 추출:
- `fileKey`: `/design/:fileKey/` 부분
- `nodeId` (단일 모드): `node-id=` 값에서 `-`를 `:`으로 변환
- `pageNodeId` (`--all` 모드): 동일하게 변환, 없으면 첫 번째 페이지 사용

Figma MCP가 인증되지 않은 경우 `mcp__plugin_figma_figma__authenticate`를 먼저 호출하여 OAuth 인증을 진행한다.

## Step 2 — 노드 목록 결정

**`--all` 없으면 (단일 모드):**
- 해당 노드 1개만 처리

**`--all` 있으면 (배치 모드):**
- `mcp__plugin_figma_figma__get_metadata` 호출 (`fileKey`, `pageNodeId`)
- 최상위 자식 노드 추출:
  - 타입이 `FRAME`, `COMPONENT`, `COMPONENT_SET`, `GROUP`인 노드만
  - `RECTANGLE`, `TEXT`, `VECTOR` 등 단순 원소 건너뜀
  - 이미 `apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에 등록된 `figmaNode` 건너뜀
- 수집된 노드 목록을 사용자에게 보여주고 계속 진행할지 확인한다

## Step 3 — 노드별 구현

각 노드에 대해 아래를 반복한다.

### 3-1. 디자인 컨텍스트 가져오기

`mcp__plugin_figma_figma__get_design_context` 호출:
- `nodeId`: 해당 노드 ID
- `fileKey`: 파일 키
- `clientFrameworks`: `"react,next.js"`
- `clientLanguages`: `"typescript"`

응답에 포함된 **스크린샷 이미지**를 해당 노드의 레퍼런스로 보관한다.

### 3-2. 에셋 다운로드

응답 코드에 포함된 모든 `const imgXxx = "https://www.figma.com/api/mcp/asset/..."` URL을 다운로드한다.

```bash
mkdir -p apps/figma-harness/public/assets
curl -L "<url>" -o apps/figma-harness/public/assets/<kebab-name>.<ext>
```

**규칙:**
- 이모지, 플레이스홀더 SVG, 텍스트 대체 절대 금지. 반드시 실제 에셋을 사용한다.
- SVG → `public/assets/` 저장 후 `<img src="/assets/..." />`
- PNG/WebP → `public/assets/` 저장 후 `next/image` `<Image>`
- 이미 존재하는 파일은 재다운로드하지 않는다
- 파일명: Figma 레이어 이름 기준 kebab-case
- 여러 컴포넌트가 동일한 에셋을 공유하는 경우, 중복 다운로드하지 않고 재사용

에셋 경로를 컴포넌트 상단 상수로 선언:
```tsx
const ICON_SEARCH = '/assets/icon-search.svg'
const FLAG_UK = '/assets/flag-uk.png'
```

### 3-3. 컴포넌트 파일 생성

#### 버저닝 규칙 (CRITICAL)

`apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에서 동일한 `figmaNode` 값이 이미 등록되어 있는지 확인한다.

- **동일 figmaNode가 없으면**: `{ComponentName}.tsx` (또는 `{ComponentName}Snapshot.tsx`) 생성
- **동일 figmaNode가 이미 존재하면**: 기존 파일을 절대 덮어쓰지 않고 V2 버전으로 생성
  - V2도 이미 존재하면 V3, V3도 존재하면 V4… 순서로 올린다.
  - 파일 존재 여부는 실제 파일 시스템(`Glob`)으로 확인한다.

**`--snapshot` 없으면 (일반 컴포넌트):**

`apps/figma-harness/app/components/{ComponentName}.tsx` 생성.

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

규칙:
- Figma의 `data-node-id` 어트리뷰트 제거
- `absolute contents` 같은 Figma 아티팩트 제거하고 정리된 마크업으로 변환
- `font-nunito` 클래스 사용 (Nunito Sans, layout.tsx에 이미 로드됨)

**`--snapshot` 있으면 (스냅샷 컴포넌트):**

`apps/figma-harness/app/components/snapshots/{ComponentName}Snapshot.tsx` 생성.

```tsx
type {Name}SnapshotProps = {
  className?: string
}

export default function {Name}Snapshot({ className = '' }: {Name}SnapshotProps) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: {width}px, height: {height}px }}
    >
      {/* Figma 절대 좌표 레이아웃 그대로 유지 */}
    </div>
  )
}
```

규칙:
- Figma의 절대 좌표 레이아웃 그대로 유지 (`position: absolute`, `inset`)
- `data-node-id` 어트리뷰트 제거
- `absolute contents` 아티팩트 제거
- 외부 Figma asset URL 직접 참조 금지 (반드시 로컬 `/assets/` 경로 사용)

### 3-4. 쇼케이스 등록

`apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에 추가:

**일반 컴포넌트:**
```tsx
{
  name: 'Figma 컴포넌트 이름',
  figmaNode: '0:XXXXX',
  preview: <NewComponent />,
},
```

**스냅샷 컴포넌트:**
```tsx
{
  name: '{컴포넌트 이름} [Snapshot]',
  figmaNode: '0:XXXXX',
  previewHeight: 'h-[{height + 32}px]',
  preview: <{Name}Snapshot />,
},
```

상단 import도 추가한다.

모든 노드 반복이 끝나면 Step 4로 진행한다.

## Step 4 — 타입 체크

```bash
cd apps/figma-harness && npx tsc --noEmit
```

에러가 있으면 해당 파일만 수정 후 재확인한다.

## Step 5 — 정합성 검증

정합성 검증 횟수: `--snapshot N` 지정 시 N회, 미지정 시 3회.

정합성 검증은 픽셀 대조뿐 아니라 **상태·색상·속성** 전반을 포함한다.
`--snapshot` 모드는 허용 오차 0px (픽셀 완전 일치 목표).

### 준비

```bash
pnpm --filter figma-harness dev &
sleep 3
npx --yes playwright@latest screenshot --full-page http://localhost:3000 /tmp/harness-render.png
```

### 회차별 절차

**① 이미지 열람** — 각 노드의 Figma 원본(Step 3-1 보관) vs `/tmp/harness-render.png`

**② 차이 항목 도출**

**[픽셀 대조]**

| 항목 | 일반 허용 오차 | --snapshot 허용 오차 |
|---|---|---|
| 크기 (width/height) | ≤ 2px | 0px |
| 위치 (top/left) | ≤ 2px | 0px |
| 색상 (hex) | 완전 일치 | 완전 일치 |
| 투명도 (opacity) | 완전 일치 | 완전 일치 |
| border-radius | ≤ 1px | 0px |
| 폰트 크기 | 완전 일치 | 완전 일치 |
| letter-spacing | 완전 일치 | 완전 일치 |
| box-shadow | 완전 일치 | 완전 일치 |
| 이미지/아이콘 | 동일 에셋 | 동일 에셋 |

**[상태 체크]** Default / Hover / Active / Disabled / Focus — 각각 Figma 정의 여부 및 CSS 구현 일치 확인

**[색상 속성]** 배경색 / 텍스트 색상 / 테두리 색상 / 아이콘 색상 — 정확한 hex 값 비교

**[속성]** font-family / font-weight / letter-spacing / border-radius / box-shadow / 에셋 동일성

**③ 수정** → 파일에 반영 후 `npx tsc --noEmit`

**④ 재캡처** → `npx --yes playwright@latest screenshot --full-page http://localhost:3000 /tmp/harness-render.png`

### 회차 종료 조건

지정 횟수 완료 또는 모든 항목에서 허용 오차 달성 시 조기 종료.

### 회차별 보고

```
[회차 N/{count}] {ComponentName}
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
| 항목          | 값                                       |
|---------------|------------------------------------------|
| 모드          | 단일 | 전체(--all) | 스냅샷(--snapshot)   |
| 다운로드 에셋 | N개 (public/assets/)                     |
| 쇼케이스 등록 | ✅ N개 등록됨                             |
| 정합성 검증   | {total}회 중 {completed}회 완료           |

### 구현 결과
| 노드 ID  | 컴포넌트      | 파일              | 구현 | 검증  |
|----------|---------------|-------------------|------|-------|
| 0:XXXXX  | ButtonCompose | ComposeButton.tsx | ✅   | 3회   |
| 0:YYYYY  | ...           | ...               | ⏭   | —     |
(✅ 신규생성 / 🔄 업데이트 / ⏭ 건너뜀 / ❌ 실패)

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
  "command": "figma-harness-showcase",
  "mode": "single|all|snapshot|all+snapshot",
  "assets": N,
  "verification": { "total": N, "completed": N },
  "components": [
    {
      "name": "ComposeButton",
      "figmaNode": "0:XXXXX",
      "file": "ComposeButton.tsx",
      "status": "created|updated|skipped|failed",
      "checks": {
        "pixel": { "size": "pass|fail", "color": "pass|fail", "typography": "pass|fail", "spacing": "pass|fail", "borderRadius": "pass|fail", "boxShadow": "pass|fail" },
        "state": { "default": "pass|fail", "hover": "pass|fail|not-defined", "active": "pass|fail|not-defined", "disabled": "pass|fail|not-defined", "focus": "pass|fail|not-defined" },
        "color": { "background": "pass|fail", "text": "pass|fail", "border": "pass|fail", "icon": "pass|fail" },
        "property": { "fontFamily": "pass|fail", "fontWeight": "pass|fail", "letterSpacing": "pass|fail", "borderRadius": "pass|fail", "boxShadow": "pass|fail", "assets": "pass|fail" }
      }
    }
  ],
  "summary": { "total": N, "created": N, "updated": N, "skipped": N, "failed": N },
  "remainingDiffs": []
}
```

`fail` 값: `{ "status": "fail", "figma": "{값}", "current": "{값}" }` 객체로 상세 기록.
