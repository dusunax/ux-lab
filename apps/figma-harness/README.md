# figma-harness

## Claude command

프로젝트 루트(`ux-lab`)에서 Claude Code로 실행한다.

### `/figma-harness <url>`

Figma URL의 **단일 노드** 하나를 구현하고 쇼케이스에 등록한다.
구현 완료 후 Figma 원본과 픽셀 대조를 **3회** 반복하여 퀄리티를 높인다.

```
/figma-harness https://www.figma.com/design/FILEID/...?node-id=0-40522
```

| 단계 | 내용 |
|---|---|
| 1 | URL에서 fileKey + nodeId 추출 |
| 2 | Figma MCP로 디자인 컨텍스트 + 스크린샷 수집 |
| 3 | 에셋(아이콘/이미지) `public/assets/`에 다운로드 |
| 4 | `app/components/{Name}.tsx` 생성 |
| 5 | `page.tsx` COMPONENTS 배열에 등록 |
| 6 | `tsc --noEmit` 타입 체크 |
| 7 | Playwright 스크린샷 → Figma 원본과 픽셀 대조 × 3회 |

---

### `/figma-harness-all <url>`

Figma **페이지 전체**의 모든 최상위 노드를 순서대로 구현한다.
전체 구현 완료 후 픽셀 대조 **3회** 반복.

```
/figma-harness-all https://www.figma.com/design/FILEID/...?node-id=0-40222
```

| 단계 | 내용 |
|---|---|
| 1 | URL 파싱 |
| 2 | `get_metadata`로 페이지 내 노드 목록 수집 |
| 3 | 구현할 노드 목록 사용자에게 확인 후 순차 구현 |
| 4 | 전체 구현 완료 후 `tsc --noEmit` |
| 5 | 픽셀 대조 × 3회 (컴포넌트별) |

**건너뛰는 노드:** 이미 등록된 figmaNode, 단순 도형(RECTANGLE·TEXT·VECTOR)

**완료 보고 예시:**

| 노드 ID | 컴포넌트 | 파일 | 결과 |
|---|---|---|---|
| 0:40522 | ButtonCompose | ComposeButton.tsx | ✅ |
| 0:40526 | ButtonApply | ApplyButton.tsx | ⏭ 건너뜀 |

---

### `/figma-harness-snapshots <횟수> <url>`

Figma URL의 노드를 **스냅샷 형식**으로 구현한다.
Figma의 절대 좌표 레이아웃을 그대로 유지하며 원본 px에 고정된 정적 컴포넌트를 생성한다.
픽셀 대조를 **지정한 횟수**만큼 반복 (허용 오차 0px).

```
/figma-harness-snapshots 5 https://www.figma.com/design/FILEID/...?node-id=0-40522
```

| 단계 | 내용 |
|---|---|
| 0 | 인수에서 count + url 파싱 |
| 1–3 | URL 파싱 → 디자인 컨텍스트 수집 → 에셋 다운로드 |
| 4 | `app/components/snapshots/{Name}Snapshot.tsx` 생성 (절대 좌표 유지) |
| 5 | `page.tsx` 등록 |
| 6 | 타입 체크 |
| 7 | 픽셀 대조 × count회 (오차 0px 기준) |

**`/figma-harness`와 차이점:**

| | `/figma-harness` | `/figma-harness-snapshots` |
|---|---|---|
| 레이아웃 | flexbox 변환 (semantic) | Figma 절대 좌표 그대로 |
| 크기 | 유동적 | 원본 px 고정 |
| 반복 횟수 | 고정 3회 | 인수로 지정 |
| 허용 오차 | ≤ 2px | 0px |
| 저장 위치 | `components/` | `components/snapshots/` |

---

## 아이콘 / 이미지 에셋 규칙

이모지·플레이스홀더·텍스트 대체 **절대 금지**.
Figma MCP 에셋 URL을 반드시 `public/assets/`에 다운로드하여 사용한다.

```bash
curl -L "<figma-asset-url>" -o apps/figma-harness/public/assets/<name>.svg
```

- SVG → `<img src="/assets/name.svg" />`
- PNG/WebP → `next/image` `<Image>`
- 컴포넌트 상단에 상수 선언: `const ICON_SEARCH = '/assets/icon-search.svg'`

---

## 프로젝트 구조

```
apps/figma-harness/
├── app/
│   ├── components/           ← 구현된 컴포넌트
│   │   ├── snapshots/        ← 스냅샷 형식 컴포넌트
│   │   ├── ComposeButton.tsx
│   │   ├── ApplyButton.tsx
│   │   ├── SidebarItem.tsx
│   │   ├── SidebarNav.tsx
│   │   └── TopBar.tsx
│   ├── layout.tsx            ← Nunito Sans 폰트
│   ├── globals.css
│   └── page.tsx              ← COMPONENTS 배열로 쇼케이스 관리
├── public/
│   └── assets/               ← 다운로드된 Figma 에셋
├── CLAUDE.md
└── README.md
```

## 쇼케이스 앱

Figma 디자인을 구현한 컴포넌트를 시각적으로 확인하는 쇼케이스 앱.

## 스택

- Next.js 15 · React 19 · TypeScript
- Tailwind CSS · Nunito Sans (next/font/google)

## 시작하기

```bash
pnpm --filter figma-harness dev
```

브라우저에서 `http://localhost:3000` 열기.

