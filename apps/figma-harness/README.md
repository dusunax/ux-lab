# figma-harness

Figma 디자인 컴포넌트를 구현하고 시각적으로 확인하는 쇼케이스 앱.

## 커맨드 구조

프로젝트 루트(`ux-lab`)에서 Claude Code로 실행한다.

| 커맨드 | 역할 | 쇼케이스 등록 | 문서 |
|---|---|:---:|---|
| `/figma-harness {url}` | 단일 컴포넌트 구현 | ❌ | [.claude/commands/figma-harness.md](../../.claude/commands/figma-harness.md) |
| `/figma-harness-all {url}` | 페이지 전체 구현 | ❌ | [.claude/commands/figma-harness-all.md](../../.claude/commands/figma-harness-all.md) |
| `/figma-harness-snapshots {N} {url}` | 스냅샷 형식 구현 | ❌ | [.claude/commands/figma-harness-snapshots.md](../../.claude/commands/figma-harness-snapshots.md) |
| `/figma-harness-showcase {url}` | 단일 구현 + 쇼케이스 등록 | ✅ | [.claude/commands/figma-harness-showcase.md](../../.claude/commands/figma-harness-showcase.md) |
| `/figma-harness-showcase {url} --all` | 전체 구현 + 쇼케이스 등록 | ✅ | ↑ |
| `/figma-harness-showcase {url} --snapshot [N]` | 스냅샷 구현 + 쇼케이스 등록 | ✅ | ↑ |
| `/figma-harness-showcase {url} --all --snapshot` | 전체 스냅샷 + 쇼케이스 등록 | ✅ | ↑ |

모든 커맨드에 `--json` 옵션 공통 지원 (완료 보고를 JSON 형식으로 출력).

---

## 커맨드 상세

### `/figma-harness {url} [--json]`

Figma URL의 **단일 노드** 하나를 컴포넌트로 구현한다.
구현 완료 후 Figma 원본과 정합성 검증을 **3회** 반복하여 퀄리티를 높인다.

```
/figma-harness https://www.figma.com/design/FILEID/...?node-id=0-40522
```

| 단계 | 내용 |
|---|---|
| 1 | URL에서 fileKey + nodeId 추출 |
| 2 | Figma MCP로 디자인 컨텍스트 + 스크린샷 수집 |
| 3 | 컴포넌트 파일 생성 (`app/components/{Name}.tsx`) |
| 4 | 타입 체크 (`tsc --noEmit`) |
| 5 | Playwright 스크린샷 → 정합성 검증 × 3회 |

---

### `/figma-harness-all {url} [--json]`

Figma **페이지 전체**의 모든 최상위 노드를 순서대로 구현한다.
전체 구현 완료 후 정합성 검증 **3회** 반복.

```
/figma-harness-all https://www.figma.com/design/FILEID/...?node-id=0-40222
```

| 단계 | 내용 |
|---|---|
| 1 | URL 파싱 |
| 2 | `get_metadata`로 페이지 내 노드 목록 수집 후 사용자 확인 |
| 3 | 노드별 순차 구현 |
| 4 | 타입 체크 |
| 5 | 정합성 검증 × 3회 (컴포넌트별) |

---

### `/figma-harness-snapshots {N} {url} [--json]`

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
| 4 | `app/components/snapshots/{Name}Snapshot.tsx` 생성 |
| 5 | 타입 체크 |
| 6 | 정합성 검증 × count회 (오차 0px 기준) |

---

### `/figma-harness-showcase {url} [--all] [--snapshot [N]] [--json]`

컴포넌트를 구현하고 `page.tsx` 쇼케이스에 등록한다.

```
# 단일 컴포넌트
/figma-harness-showcase https://www.figma.com/design/FILEID/...?node-id=0-40522

# 페이지 전체
/figma-harness-showcase https://www.figma.com/design/FILEID/...?node-id=0-40222 --all

# 스냅샷 형식 (기본 3회 검증)
/figma-harness-showcase https://www.figma.com/design/FILEID/...?node-id=0-40522 --snapshot

# 스냅샷 형식 + 검증 횟수 지정
/figma-harness-showcase https://www.figma.com/design/FILEID/...?node-id=0-40522 --snapshot 5

# 전체 페이지 × 스냅샷
/figma-harness-showcase https://www.figma.com/design/FILEID/...?node-id=0-40222 --all --snapshot
```

| 옵션 | 설명 |
|---|---|
| _(없음)_ | 단일 노드, 일반 컴포넌트 형식 |
| `--all` | 페이지의 모든 최상위 노드 처리 |
| `--snapshot [N]` | 스냅샷 형식으로 구현 (N회 검증, 기본 3회) |
| `--all --snapshot` | 전체 노드를 스냅샷 형식으로 |
| `--json` | 완료 보고를 JSON으로 출력 |

---

## 정합성 검증 항목

모든 커맨드의 검증은 픽셀 대조뿐 아니라 **상태·색상·속성** 전반을 포함한다.

| 카테고리 | 항목 |
|---|---|
| **픽셀 대조** | 크기, 색상, 타이포그래피, 간격, border-radius, box-shadow |
| **상태 체크** | Default, Hover, Active, Disabled, Focus (Figma 정의 여부 포함) |
| **색상 속성** | 배경색, 텍스트, 테두리, 아이콘 — hex 완전 일치 |
| **속성** | font-weight, letter-spacing, border-radius, box-shadow, 에셋 동일성 |

`--snapshot` 모드는 모든 항목 허용 오차 **0px** (픽셀 완전 일치 목표).

---

## 버저닝 규칙

동일한 Figma 노드 ID의 컴포넌트를 재구현할 때 기존 파일을 덮어쓰지 않는다.

- 기존 파일 없음 → `TopBar.tsx`
- 이미 존재 → `TopBarV2.tsx`
- V2도 존재 → `TopBarV3.tsx` …

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

---

## 스택

- Next.js 15 · React 19 · TypeScript
- Tailwind CSS · Nunito Sans (next/font/google)

## 시작하기

```bash
pnpm --filter figma-harness dev
```

브라우저에서 `http://localhost:3000` 열기.
