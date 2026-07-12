---
name: figma-harness-core
description: figma-harness 계열 커맨드 4종(단일/전체/스냅샷/쇼케이스)의 공통 절차 정의. 각 커맨드는 이 문서를 먼저 읽고, 자신의 모드 고유 차이만 커맨드 파일에서 따른다.
---

# Figma Harness — 공통 코어

`/figma-harness`, `/figma-harness-all`, `/figma-harness-snapshots`, `/figma-harness-showcase`가 공유하는 절차의 단일 진실 공급원(SSoT).

각 커맨드 문서는 이 코어의 섹션 번호(§)를 참조한다. 코어와 커맨드가 충돌하면 **커맨드의 모드 고유 지시가 우선**한다.

작업 대상 앱: `apps/figma-harness/` (Next.js + Tailwind + TypeScript, pnpm workspace 이름 `figma-harness`)

---

## §1 — Figma MCP 연결 전제 (모든 커맨드의 Step 0)

하네스는 Figma 공식 MCP의 아래 기능이 필요하다.

- `authenticate` 또는 OAuth login
- `get_metadata`
- `get_design_context`
- `get_screenshot`

에이전트 런타임마다 MCP 서버 이름이 다르므로, 커맨드 본문에서는 아래 표에 맞는 실제 툴명을 사용한다.

| Runtime | 권장 MCP 연결 | 예상 툴 접두사 | 상태 확인 |
|---|---|---|---|
| Codex | `codex mcp add figma --url https://mcp.figma.com/mcp --oauth-resource https://mcp.figma.com/mcp` 후 `codex mcp login figma` | `mcp__figma__*` | `codex mcp list`, `codex mcp get figma` |
| Claude Code | Figma 공식 플러그인 `figma@claude-plugins-official` | `mcp__plugin_figma_figma__*` | `claude mcp get plugin:figma:figma` |
| Cursor | Figma 공식 MCP가 동일 기능을 노출해야 함. 기존 `TalkToFigma`류 서버는 기능명이 다를 수 있어 어댑터 없이는 이 하네스의 대체물이 아니다. | Cursor가 노출한 서버명 기반 | Cursor MCP 설정/툴 목록 |

대표 툴명:

- Codex: `mcp__figma__get_metadata`, `mcp__figma__get_design_context`, `mcp__figma__get_screenshot`
- Claude Code: `mcp__plugin_figma_figma__get_metadata`, `mcp__plugin_figma_figma__get_design_context`, `mcp__plugin_figma_figma__get_screenshot`

현재 세션에 Figma MCP 툴이 노출되지 않았다면, 설정을 추가한 뒤 에이전트 세션을 재시작한다. MCP 툴 목록은 세션 시작 시점에 고정될 수 있다.

Figma MCP가 인증되지 않은 상태면 현재 런타임의 인증 방식을 사용하여 OAuth 인증을 진행한다. 예: Claude Code는 `mcp__plugin_figma_figma__authenticate`, Codex는 `codex mcp login figma`.

**비인터랙티브 세션(서브에이전트, headless 실행 등)에서는 OAuth 인증이 불가능하다.** 이 경우:

1. 사용자에게 "인터랙티브 세션에서 Figma MCP OAuth 선행 인증이 필요하다"고 안내한다.
2. 즉시 중단한다. `--json` 모드면 §8의 실패 JSON(`stage: "auth"`)을 출력한다.

인증 없이 구현 단계로 진행하는 것을 금지한다 — 레퍼런스 스크린샷 없이는 검증 루프가 성립하지 않는다.

## §2 — URL 파싱

주어진 Figma URL에서 추출:

- `fileKey`: `/design/:fileKey/` 경로 세그먼트
- `nodeId`: `node-id=` 쿼리 값에서 `-`를 `:`으로 변환 (예: `0-40522` → `0:40522`)
  - 페이지 순회 모드에서는 이 값이 `pageNodeId`가 되며, 없으면 첫 번째 페이지를 사용한다.

파싱 실패(fileKey 없음 등) 시 중단하고, `--json` 모드면 실패 JSON(`stage: "url-parse"`)을 출력한다.

## §3 — 디자인 컨텍스트 수집

현재 런타임의 Figma MCP `get_design_context` 호출 규약:

- `nodeId`: §2에서 변환한 노드 ID
- `fileKey`: §2에서 추출한 파일 키
- `clientFrameworks`: `"react,next.js"`
- `clientLanguages`: `"typescript"`

응답에서 보관할 것:

- **스크린샷 이미지** → 검증 루프(§7)의 픽셀 대조 레퍼런스
- **컴포넌트 크기**(width, height) → 스냅샷 모드의 고정 컨테이너 치수
- **에셋 URL 목록**(`const imgXxx = "https://www.figma.com/api/mcp/asset/..."`) → §4 다운로드 대상

## §4 — 에셋 다운로드 규칙

이모지, 플레이스홀더 SVG, 텍스트 대체는 **절대 금지**. 반드시 실제 에셋을 다운로드하여 사용한다.

```bash
mkdir -p apps/figma-harness/public/assets
curl -L "https://www.figma.com/api/mcp/asset/..." \
  -o apps/figma-harness/public/assets/{kebab-name}.{ext}
```

- 파일명: Figma 레이어 이름 기준 kebab-case 변환 (예: `UK Flag` → `uk-flag.svg`)
- SVG → `public/assets/` 저장 후 `<img src="/assets/{name}.svg" />` 또는 인라인 SVG
- PNG/WebP → `public/assets/` 저장 후 `next/image`의 `<Image>` 컴포넌트
- 이미 존재하는 파일은 재다운로드하지 않는다. 여러 컴포넌트가 동일 에셋을 공유하면 재사용한다.
- 외부 Figma asset URL 직접 참조 금지 — 반드시 로컬 `/assets/` 경로 사용
- 에셋 경로는 컴포넌트 상단 상수로 선언:

```tsx
const ICON_SEARCH = '/assets/icon-search.svg'
const FLAG_UK = '/assets/flag-uk.png'
```

## §5 — 구현 공통 규칙

### 5.1 버저닝 (CRITICAL — 덮어쓰기 금지)

대상 디렉토리(일반: `apps/figma-harness/app/components/`, 스냅샷: `.../components/snapshots/`)에서 동일 이름 파일 존재 여부를 `Glob`으로 확인한다.

- **동일 파일이 없으면**: `{ComponentName}.tsx` 생성
- **동일 파일이 이미 존재하면**: 기존 파일을 절대 덮어쓰지 않고 `{ComponentName}V2.tsx` 생성
  - V2도 존재하면 V3, V3도 존재하면 V4… 순서로 올린다.
- 쇼케이스 모드는 파일명 대신 `page.tsx`의 `COMPONENTS` 배열 내 동일 `figmaNode` 등록 여부를 1차 기준으로 삼되, 파일 존재 여부는 항상 `Glob`으로 재확인한다.

예외: `apps/figma-harness/app/preview/page.tsx`는 검증 전용 스크래치 파일로, 버저닝 없이 매 실행마다 덮어쓴다(§7.2).

### 5.2 마크업 정리

- Figma의 `data-node-id` 어트리뷰트 제거
- `absolute contents` 같은 Figma 아티팩트 제거, 정리된 마크업으로 변환
- `font-nunito` 클래스 사용 (Nunito Sans, layout.tsx에 이미 로드됨)
- 일반 컴포넌트 Props 기본형: `label?`, `onClick?`, `className?`

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

### 5.3 디자인 품질

구현 전에 `.agent/skills/FRONTEND_DESIGN.md`를 읽고 따른다. 단, 이 하네스의 목표는 **Figma 원본 재현**이므로, 창의적 재해석보다 원본 정합성이 우선한다. FRONTEND_DESIGN.md는 마크업 품질·이모지 금지·정밀한 실행 기준으로 적용한다.

## §6 — 타입 체크

```bash
pnpm --filter figma-harness exec tsc --noEmit
```

(pnpm workspace 환경에서 `cd apps/figma-harness && npx tsc`는 stub 패키지로 오해석될 수 있으므로 위 형태를 사용한다.)

에러가 있으면 해당 파일을 수정 후 재확인한다. 통과 전에는 검증 단계(§7)로 진행하지 않는다.

## §7 — 정합성 검증 절차

검증 반복 횟수와 허용 오차는 커맨드별로 다르다(각 커맨드 문서 참조). 아래는 공통 절차.

### 7.1 dev 서버 기동 (포트 3900 고정)

포트 3000은 다른 앱에 밀릴 수 있으므로 **3900 고정**. `sleep N` 고정 대기 금지 — 헬스체크 루프를 사용한다.

```bash
# 백그라운드 기동 (Bash 도구의 run_in_background 사용)
pnpm --filter figma-harness exec next dev -p 3900
```

```bash
# 헬스체크: 성공할 때까지 최대 30초 대기
for i in $(seq 1 30); do
  curl -s -o /dev/null http://localhost:3900 && break
  sleep 1
done
curl -s -o /dev/null http://localhost:3900 || echo "DEV_SERVER_FAILED"
```

`DEV_SERVER_FAILED`면 서버 로그를 확인·수정 후 재시도. 복구 불가면 중단하고 `--json` 모드에서 실패 JSON(`stage: "dev-server"`)을 출력한다.

**정리 스텝(필수):** 검증이 끝나면(성공/실패 무관) 기동한 프로세스를 종료한다.

```bash
pkill -f "next dev -p 3900" || true
```

### 7.2 프리뷰 마운트

검증 전에 `apps/figma-harness/app/preview/page.tsx`를 **검증 대상 컴포넌트를 마운트하는 내용으로 덮어쓴다**. 이 파일은 검증 전용 스크래치로, 매 실행마다 덮어쓰는 것이 정상이며 버저닝 대상이 아니다.

```tsx
// figma-harness 검증 전용 스크래치 — 커맨드가 매 실행마다 덮어씀
'use client'

import Target from '../components/{TargetComponent}'

export default function PreviewPage() {
  return (
    <div data-verify-root className="min-h-screen flex items-center justify-center bg-[#f4f6fb] p-8">
      <Target />
    </div>
  )
}
```

- 복수 컴포넌트 검증 시 대상들을 세로로 나열하고 각 대상 래퍼에 `data-verify="{ComponentName}"`를 부여한다.
- 스냅샷 컴포넌트는 원본 크기 고정이므로 래퍼가 크기에 영향을 주지 않게 한다.
- 쇼케이스 모드는 `page.tsx` 등록분(`http://localhost:3900/`)으로 검증해도 되지만, element 단위 캡처는 `/preview`가 더 정확하므로 /preview 마운트를 권장한다.

### 7.3 element 단위 스크린샷 (Playwright MCP)

전체 페이지 캡처(`npx playwright screenshot --full-page`)는 **사용 금지** — 검증 대상 요소만 캡처한다.

1. `mcp__playwright__browser_navigate` → `http://localhost:3900/preview`
2. `mcp__playwright__browser_snapshot`으로 페이지 스냅샷을 얻어 대상 요소의 ref 확인
3. `mcp__playwright__browser_take_screenshot`에 `target=<ref>`, `element=<사람이 읽을 설명>`을 넘겨 컴포넌트 요소만 캡처

저장 경로: `/tmp` 금지. **세션 scratchpad 디렉토리** 또는 `apps/figma-harness/.verify/`(gitignore 대상)를 사용한다.

예: `{scratchpad}/harness-{ComponentName}-round{N}.png` 또는 `apps/figma-harness/.verify/{ComponentName}-round{N}.png`

### 7.4 회차별 절차

**① 이미지 열람** — Figma 원본(§3 보관 스크린샷) vs 7.3 element 캡처

**② 차이 항목 도출** — 아래 4개 축 전부:

**[픽셀 대조]** — 허용 오차 테이블:

| 항목 | 일반 허용 오차 | 스냅샷 허용 오차 |
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

우선순위: 색상 → 크기 → 간격 → 타이포그래피 → 상태 → 속성

**③ 수정** → 파일에 반영 후 타입 체크(§6) 재실행

**④ 재캡처** → 7.3 절차로 element 재캡처 (회차 번호를 파일명에 반영)

### 7.5 회차별 보고 포맷

```
[회차 N/{count}] {ComponentName}
- [픽셀] {항목}: Figma={값} / 현재={값}
- [상태] {항목}: Figma={정의/미정의} / 현재={구현/미구현}
- [색상] {항목}: Figma={hex} / 현재={hex}
- [속성] {항목}: Figma={값} / 현재={값}
수정: (파일명:줄번호) {전} → {후}
잔여 차이: {없음 | N건}
```

### 7.6 종료 조건

- 지정 횟수 완료, **또는** 모든 항목이 해당 모드의 허용 오차를 달성하면 조기 종료
- 종료 시 반드시 7.1의 정리 스텝(dev 서버 종료)을 실행한다

## §8 — 완료 보고 포맷

`--json` 없으면 텍스트, 있으면 JSON. 커맨드별 필드 구성(`command` 값, `components` 배열 유무 등)은 각 커맨드 문서의 스키마를 따른다.

### 텍스트 공통 골격

```
### 기본 정보
| 항목          | 값                              |
|---------------|---------------------------------|
| (커맨드별 항목: 컴포넌트/모드/원본 크기 등) |
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

### JSON 공통 규칙

- 체크 항목 값: `"pass"` | `"fail"` | (상태 항목 한정) `"not-defined"`
- `fail`은 문자열 대신 상세 객체로 기록: `{ "status": "fail", "figma": "{값}", "current": "{값}" }`
- `remainingDiffs`: 잔여 차이 배열 (없으면 `[]`)

### 실패 JSON 스키마 (공통)

파이프라인 도중 중단된 경우 `--json` 모드에서는 아래를 출력한다:

```json
{
  "command": "figma-harness|figma-harness-all|figma-harness-snapshots|figma-harness-showcase",
  "status": "error",
  "stage": "auth|url-parse|design-context|asset-download|implement|type-check|dev-server|verify|report",
  "reason": "사람이 읽을 수 있는 원인 설명"
}
```

`--json`이 아니면 동일 정보를 텍스트로 보고한다. 실패 시에도 dev 서버 정리 스텝(§7.1)을 잊지 않는다.
