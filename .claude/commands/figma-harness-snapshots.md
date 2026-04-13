---
description: Figma URL의 컴포넌트를 스냅샷 형식으로 구현하고, 지정한 횟수만큼 Figma 원본과 픽셀 대조를 반복하여 퀄리티를 높인다. 사용법: /figma-harness-snapshots 횟수 URL
---

# Figma Snapshots

**인수:** $ARGUMENTS

## Step 0 — 인수 파싱

`$ARGUMENTS`에서 추출:
- `count`: 첫 번째 토큰 (정수). 픽셀 대조 반복 횟수.
- `url`: 두 번째 토큰. Figma URL.

예시: `/figma-harness-snapshots 5 https://www.figma.com/design/...?node-id=0-40522`
→ `count = 5`, `url = https://...`

count가 없거나 정수가 아니면 즉시 에러를 출력하고 중단한다.

## Step 1 — URL 파싱

url에서 추출:
- `fileKey`: `/design/:fileKey/` 부분
- `nodeId`: `node-id=` 값에서 `-`를 `:`으로 변환

Figma MCP 미인증 시 `mcp__plugin_figma_figma__authenticate` 먼저 호출.

## Step 2 — Figma 디자인 컨텍스트 수집

`mcp__plugin_figma_figma__get_design_context` 호출:
- `nodeId`, `fileKey`
- `clientFrameworks`: `"react,next.js"`
- `clientLanguages`: `"typescript"`

응답에서 아래를 보관한다:
- **스크린샷 이미지** → 픽셀 대조 레퍼런스
- **컴포넌트 크기** (width, height) → 스냅샷 컨테이너 치수
- **에셋 URL 목록** (`const imgXxx = "..."`) → 다운로드 대상

## Step 3 — 에셋 다운로드

응답 코드에 포함된 모든 `const imgXxx = "https://www.figma.com/api/mcp/asset/..."` URL을 다운로드한다.

```bash
mkdir -p apps/figma-harness/public/assets
curl -L "<url>" -o apps/figma-harness/public/assets/<kebab-name>.<ext>
```

**규칙:**
- 이모지, 플레이스홀더 SVG, 텍스트 대체 절대 금지
- SVG → `public/assets/` 저장 후 `<img src="/assets/..." />`
- PNG/WebP → `public/assets/` 저장 후 `next/image` `<Image>`
- 이미 존재하는 파일은 재다운로드하지 않는다
- 파일명: Figma 레이어 이름 기준 kebab-case (예: `UK Flag` → `uk-flag.png`)

## Step 4 — 스냅샷 컴포넌트 생성

### 버저닝 규칙 (CRITICAL)

`apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에서 동일한 `figmaNode` 값이 이미 등록되어 있는지 확인한다.

- **동일 figmaNode가 없으면**: `{ComponentName}Snapshot.tsx` 생성
- **동일 figmaNode가 이미 존재하면**: 기존 파일을 절대 덮어쓰지 않고 `{ComponentName}SnapshotV2.tsx` 생성
  - V2도 이미 존재하면 V3, V3도 존재하면 V4… 순서로 올린다.
  - 파일 존재 여부는 실제 파일 시스템(`Glob` 또는 `Read`)으로 확인한다.

`apps/figma-harness/app/components/snapshots/{ComponentName}Snapshot.tsx` (또는 버전 접미사 포함) 생성.

**스냅샷 형식의 특징:**
- Figma의 절대 좌표 레이아웃을 최대한 그대로 유지 (`position: absolute`, `inset`)
- 컴포넌트를 Figma 원본 크기(`width`, `height`)로 고정된 컨테이너에 래핑
- 외부에서 크기를 변경하지 않도록 `shrink-0` 적용
- 에셋은 Step 3에서 다운로드한 로컬 경로 사용

```tsx
// 에셋 경로 상수
const ICON_SEARCH = '/assets/icon-search.svg'

type {Name}SnapshotProps = {
  className?: string
}

export default function {Name}Snapshot({ className = '' }: {Name}SnapshotProps) {
  return (
    // Figma 원본 크기로 고정된 컨테이너
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: {width}px, height: {height}px }}
    >
      {/* Figma 절대 좌표 레이아웃 그대로 유지 */}
      ...
    </div>
  )
}
```

**금지 사항:**
- `data-node-id` 어트리뷰트 제거
- `absolute contents` 아티팩트 제거
- 외부 Figma asset URL 직접 참조 금지 (반드시 로컬 `/assets/` 경로 사용)

## Step 5 — 쇼케이스 등록

`apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에 추가:

```tsx
{
  name: '{컴포넌트 이름} [Snapshot]',
  figmaNode: '0:XXXXX',
  previewHeight: 'h-[{height + 32}px]',
  preview: <{Name}Snapshot />,
},
```

import도 추가한다.

## Step 6 — 타입 체크

```bash
cd apps/figma-harness && npx tsc --noEmit
```

에러가 있으면 수정 후 재확인.

## Step 7 — 정합성 검증 루프 (`count`회 반복)

**count** 횟수만큼 아래 루프를 반복한다.

정합성 검증은 픽셀 대조뿐 아니라 **상태·색상·속성** 전반을 포함한다. 스냅샷은 픽셀 정확도가 목표이므로 허용 오차가 더 엄격하다.

### 준비

```bash
# dev 서버 실행 (미실행 시)
pnpm --filter figma-harness dev &
sleep 3

# 초기 스크린샷
npx --yes playwright@latest screenshot \
  --full-page \
  http://localhost:3000 \
  /tmp/harness-snapshot.png
```

### 루프 (1회 ~ count회)

**① 이미지 열람**
- Figma 원본: Step 2 스크린샷
- 구현 결과: `/tmp/harness-snapshot.png` (Read 도구로 열람)

**② 차이 도출**

**[픽셀 대조 — 스냅샷 전용 허용 오차]**

| 항목 | 허용 오차 |
|---|---|
| 위치 (top / left) | 0px |
| 크기 (width / height) | 0px |
| 색상 (hex) | 완전 일치 |
| 투명도 (opacity) | 완전 일치 |
| border-radius | 0px |
| 폰트 크기 | 0px |
| 폰트 굵기 | 완전 일치 |
| letter-spacing | 완전 일치 |
| box-shadow | 완전 일치 |
| 이미지/아이콘 | 동일 에셋 사용 여부 확인 |

**[상태 체크]**

| 항목 | 확인 내용 |
|---|---|
| Default 상태 | Figma의 기본 상태와 렌더링 일치 여부 |
| Hover 상태 | Figma hover 스타일 정의 여부 및 CSS :hover 구현 일치 |
| Active / Pressed 상태 | Figma active 스타일 정의 여부 및 CSS :active 구현 일치 |
| Disabled 상태 | Figma disabled 스타일 정의 여부 및 opacity/pointer-events 처리 |

**[색상 속성 체크]**

| 항목 | 확인 내용 |
|---|---|
| 배경색 | 정확한 hex 값 (완전 일치) |
| 텍스트 색상 | 상태별 색상 변화 포함 |
| 테두리 색상 | border 색상 및 두께 (완전 일치) |
| 아이콘 색상 | SVG fill / stroke 값 (완전 일치) |

**[속성 체크]**

| 항목 | 확인 내용 |
|---|---|
| 폰트 패밀리 | 지정된 폰트 사용 여부 |
| font-weight | 수치 완전 일치 |
| letter-spacing | em/px 단위 완전 일치 |
| border-radius | 각 모서리별 값 완전 일치 |
| box-shadow | offset, blur, spread, color 모두 완전 일치 |
| 이미지/아이콘 에셋 | 동일 에셋 파일 사용 여부 |

**③ 수정**

발견된 차이를 스냅샷 컴포넌트 파일에 반영.
수정 후 `npx tsc --noEmit` 체크.

**④ 재캡처**

```bash
npx --yes playwright@latest screenshot \
  --full-page \
  http://localhost:3000 \
  /tmp/harness-snapshot.png
```

**⑤ 회차 보고**

```
[회차 N/{count}]
차이 항목:
- [픽셀] {항목}: Figma={값} / 현재={값} → 수정 완료
- [상태] {항목}: Figma={정의/미정의} / 현재={구현/미구현} → 수정 완료
- [색상] {항목}: Figma={hex} / 현재={hex} → 수정 완료
- [속성] {항목}: Figma={값} / 현재={값} → 수정 완료
잔여 차이: {없음 | N건}
```

### 조기 종료

모든 항목에서 허용 오차 0 달성 시 남은 횟수 없이 종료.

## 완료 보고

```
컴포넌트: {Name}Snapshot.tsx (또는 버전 파일명)
Figma 노드: 0:XXXXX
원본 크기: {width} × {height}px
다운로드 에셋: N개 (public/assets/)
정합성 검증: {count}회 중 {실행 횟수}회 완료

[픽셀 대조]
- 위치: ✅ / 크기: ✅ / 색상: ✅ / 투명도: ✅ / border-radius: ✅ / 폰트: ✅ / 그림자: ✅ / 에셋: ✅

[상태 체크]
- Default: ✅ / Hover: ✅ (또는 Figma 미정의) / Active: ✅ / Disabled: ✅ (또는 미정의)

[색상 속성]
- 배경: ✅ / 텍스트: ✅ / 테두리: ✅ / 아이콘: ✅

[속성]
- font-weight: ✅ / letter-spacing: ✅ / border-radius: ✅ / box-shadow: ✅

최종 잔여 차이: 없음 | {N건 목록}
```
