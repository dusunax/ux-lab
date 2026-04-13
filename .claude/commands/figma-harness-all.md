---
description: Figma 페이지 URL을 받아 해당 페이지의 모든 최상위 노드를 순서대로 구현하고 쇼케이스에 등록한다. 전체 구현 완료 후 Figma 원본과 정합성 검증을 3회 반복하여 퀄리티를 높인다.
---

# Figma → Design Harness (전체 자동화)

**URL:** $ARGUMENTS

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
- 이미 `apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에 등록된 `figmaNode`는 건너뜀

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

`apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에서 동일한 `figmaNode` 값이 이미 등록되어 있는지 확인한다.

- **동일 figmaNode가 없으면**: `{ComponentName}.tsx` 생성
- **동일 figmaNode가 이미 존재하면**: 기존 파일을 절대 덮어쓰지 않고 `{ComponentName}V2.tsx` 생성
  - V2도 이미 존재하면 V3, V3도 존재하면 V4… 순서로 올린다.
  - 파일 존재 여부는 실제 파일 시스템(`Glob` 또는 `Read`)으로 확인한다.

`apps/figma-harness/app/components/{ComponentName}.tsx` (또는 버전 접미사 포함) 생성.

**규칙:**
- Figma의 `data-node-id` 어트리뷰트 제거
- `absolute contents` 같은 Figma 아티팩트 제거, 정리된 마크업으로 변환
- `font-nunito` 클래스 사용
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

여러 컴포넌트가 동일한 에셋을 공유하는 경우, 중복 다운로드하지 않고 이미 저장된 파일을 재사용한다.

### 3-3. page.tsx 쇼케이스에 등록

`apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열 끝에 추가:

```tsx
{
  name: 'Figma 컴포넌트 이름',
  figmaNode: '0:XXXXX',
  preview: <NewComponent />,
},
```

import도 상단에 추가한다.

모든 노드 반복이 끝나면 Step 4로 진행한다.

## Step 4 — 타입 체크

```bash
cd apps/figma-harness && npx tsc --noEmit
```

에러가 있으면 해당 파일만 수정 후 재확인한다.

## Step 5 — 정합성 검증 (3회 반복)

모든 컴포넌트 구현이 완료된 후, 쇼케이스 전체를 기준으로 Figma 원본과 비교한다.
**총 3회 반복하며 매 회차마다 발견된 차이를 수정한다.**

정합성 검증은 픽셀 대조뿐 아니라 **상태·색상·속성** 전반을 포함한다.

### 준비 — dev 서버 및 스크린샷 캡처

```bash
# dev 서버가 실행 중이 아니면 백그라운드로 실행
pnpm --filter figma-harness dev &
sleep 3

# 쇼케이스 전체 캡처
npx --yes playwright@latest screenshot \
  --full-page \
  http://localhost:3000 \
  /tmp/harness-render.png
```

### 회차별 절차

각 회차는 동일한 순서로 진행한다.

**① 이미지 열람**
- Figma 원본: 각 노드의 `get_design_context` 스크린샷 (Step 3-1에서 보관)
- 구현 결과: `/tmp/harness-render.png` (Read 도구로 열람)

**② 차이 항목 도출 — 컴포넌트별**

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

우선순위: 색상 → 크기 → 간격 → 타이포그래피 → 상태 → 속성 순으로 수정.

**③ 수정**
발견된 차이를 해당 컴포넌트 파일에 반영한다.
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
컴포넌트: {ComponentName}
발견된 차이:
- [픽셀] (항목): Figma → {값}  /  현재 → {값}
- [상태] (항목): Figma → {정의/미정의}  /  현재 → {구현/미구현}
- [색상] (항목): Figma → {hex}  /  현재 → {hex}
- [속성] (항목): Figma → {값}  /  현재 → {값}
수정 내용:
- (파일명:줄번호) {변경 전} → {변경 후}
```

## 완료 보고

처리 결과를 표로 요약:

| 노드 ID | 컴포넌트 이름 | 파일 | 구현 | 정합성 검증 |
|---|---|---|---|---|
| 0:XXXXX | ButtonCompose | ComposeButton.tsx | ✅ | 3회 완료 |
| 0:YYYYY | ... | ... | ⏭ 건너뜀 | — |

- ✅ 신규 생성
- 🔄 기존 파일 업데이트
- ⏭ 이미 등록됨 (건너뜀)
- ❌ 실패 (사유)

**정합성 검증 최종 결과:**

```
[픽셀 대조]
- 크기: ✅ / 색상: ✅ / 타이포그래피: ✅ / 간격: ✅ / 반경: ✅ / 그림자: ✅

[상태 체크]
- Default: ✅ / Hover: ✅ (또는 Figma 미정의) / Active: ✅ / Disabled: ✅ (또는 미정의)

[색상 속성]
- 배경: ✅ / 텍스트: ✅ / 테두리: ✅ / 아이콘: ✅

[속성]
- font-weight: ✅ / letter-spacing: ✅ / border-radius: ✅ / box-shadow: ✅ / 에셋: ✅

잔여 차이: 없음 | {N건 목록}
```
