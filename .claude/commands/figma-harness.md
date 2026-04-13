---
description: Figma URL 하나의 노드를 design-harness 컴포넌트로 구현하고 쇼케이스에 등록한다. 구현 후 Figma 원본과 픽셀 대조를 3회 반복하여 퀄리티를 높인다.
---

# Figma → Design Harness (단일 컴포넌트)

**URL:** $ARGUMENTS

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

`apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에서 동일한 `figmaNode` 값이 이미 등록되어 있는지 확인한다.

- **동일 figmaNode가 없으면**: `{ComponentName}.tsx` 생성
- **동일 figmaNode가 이미 존재하면**: 기존 파일을 절대 덮어쓰지 않고 `{ComponentName}V2.tsx` 생성
  - V2도 이미 존재하면 V3, V3도 존재하면 V4… 순서로 올린다.
  - 파일 존재 여부는 실제 파일 시스템(`Glob` 또는 `Read`)으로 확인한다.

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
# 아이콘/이미지 에셋을 public/assets/ 에 다운로드
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

## Step 4 — page.tsx 쇼케이스에 등록

`apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에 추가:

```tsx
{
  name: 'Figma 컴포넌트 이름',
  figmaNode: '0:XXXXX',
  preview: <NewComponent />,
},
```

상단 import도 추가한다.

## Step 5 — 타입 체크

```bash
cd apps/figma-harness && npx tsc --noEmit
```

에러가 있으면 수정 후 재확인. 통과하면 Step 6으로 진행한다.

## Step 6 — 정합성 검증 (3회 반복)

dev 서버를 실행하고 렌더링 결과를 Figma 원본 스크린샷과 시각적으로 비교한다.
**총 3회 반복하며 매 회차마다 발견된 차이를 수정한다.**

정합성 검증은 픽셀 대조뿐 아니라 **상태·색상·속성** 전반을 포함한다.

### 준비 — dev 서버 및 스크린샷 캡처

```bash
# dev 서버가 실행 중이 아니면 백그라운드로 실행
pnpm --filter figma-harness dev &
sleep 3

# 해당 컴포넌트가 보이는 URL 캡처 (localhost:3000)
npx --yes playwright@latest screenshot \
  --full-page \
  http://localhost:3000 \
  /tmp/harness-render.png
```

### 회차별 절차

각 회차는 동일한 순서로 진행한다:

**① 이미지 열람**
- Figma 원본: `get_design_context` 응답의 스크린샷 (Step 2에서 보관)
- 구현 결과: `/tmp/harness-render.png` (Read 도구로 열람)

**② 차이 항목 도출**

아래 항목을 순서대로 점검하여 차이를 명시한다:

**[픽셀 대조]**

| 항목 | 확인 내용 |
|---|---|
| 크기 | width / height (px) |
| 색상 | background, text, border 색상값 |
| 타이포그래피 | font-size, font-weight, letter-spacing, line-height |
| 간격 | padding, margin, gap (px) |
| 반경 | border-radius (px) |
| 그림자 | box-shadow 값 |
| 정렬 | flex/grid 정렬 방향 및 위치 |
| 투명도 | opacity 값 |

**[상태 체크]**

| 항목 | 확인 내용 |
|---|---|
| Default 상태 | Figma의 기본 상태와 렌더링 일치 여부 |
| Hover 상태 | Figma hover 스타일 정의 여부 및 CSS :hover 구현 일치 |
| Active / Pressed 상태 | Figma active 스타일 정의 여부 및 CSS :active 구현 일치 |
| Disabled 상태 | Figma disabled 스타일 정의 여부 및 opacity/pointer-events 처리 |
| Focus 상태 | Figma focus 스타일 정의 여부 및 :focus-visible 구현 |
| 선택됨 / 활성화됨 | 토글·탭·체크박스 등 selected/checked 상태 스타일 |

**[색상 속성 체크]**

| 항목 | 확인 내용 |
|---|---|
| 배경색 | 정확한 hex 값 (예: #3749A6) |
| 텍스트 색상 | 상태별 색상 변화 포함 |
| 테두리 색상 | border 색상 및 두께 |
| 아이콘 색상 | SVG fill / stroke 값 |
| 오버레이 / 스크림 | 반투명 레이어 색상 및 opacity |

**[속성 체크]**

| 항목 | 확인 내용 |
|---|---|
| 폰트 패밀리 | 지정된 폰트 사용 여부 |
| 폰트 굵기 | font-weight 수치 일치 |
| letter-spacing | em/px 단위 일치 |
| border-radius | 각 모서리별 값 일치 |
| box-shadow | offset, blur, spread, color 모두 일치 |
| z-index / 레이어 순서 | 오버랩 요소 순서 일치 |
| 이미지/아이콘 에셋 | 동일 에셋 파일 사용 여부 |

**③ 수정**
발견된 차이를 컴포넌트 파일에 반영한다.
수정 후 `npx tsc --noEmit`으로 타입 체크.

**④ 재캡처**
```bash
npx --yes playwright@latest screenshot \
  --full-page \
  http://localhost:3000 \
  /tmp/harness-render.png
```

### 회차 종료 조건

3회 반복 후 또는 아래 기준을 모두 충족하면 조기 종료:
- 픽셀: 색상값 완전 일치, 크기 오차 ≤ 2px, 간격 오차 ≤ 2px, 타이포그래피 완전 일치
- 상태: Default / Hover / Active / Disabled 스타일 모두 구현 또는 Figma에 미정의 확인
- 색상 속성: 모든 hex 값 완전 일치
- 속성: font-weight, letter-spacing, border-radius, shadow 모두 일치

### 회차별 결과 보고 형식

```
[회차 N/3]
발견된 차이:
- [픽셀] (항목): Figma → {값}  /  현재 → {값}
- [상태] (항목): Figma → {정의/미정의}  /  현재 → {구현/미구현}
- [색상] (항목): Figma → {hex}  /  현재 → {hex}
- [속성] (항목): Figma → {값}  /  현재 → {값}
수정 내용:
- (파일명:줄번호) {변경 전} → {변경 후}
```

## 완료 보고

```
컴포넌트: {Name}.tsx (또는 버전 파일명)
Figma 노드: 0:XXXXX
쇼케이스 등록: ✅

정합성 검증 결과 ({N}회 완료):
[픽셀 대조]
- 크기: ✅ / 색상: ✅ / 타이포그래피: ✅ / 간격: ✅ / 반경: ✅ / 그림자: ✅

[상태 체크]
- Default: ✅ / Hover: ✅ (또는 Figma 미정의) / Active: ✅ / Disabled: ✅ (또는 미정의) / Focus: ✅ (또는 미정의)

[색상 속성]
- 배경: ✅ / 텍스트: ✅ / 테두리: ✅ / 아이콘: ✅

[속성]
- font-weight: ✅ / letter-spacing: ✅ / border-radius: ✅ / box-shadow: ✅ / 에셋: ✅

잔여 차이: 없음 | {N건 목록}
```
