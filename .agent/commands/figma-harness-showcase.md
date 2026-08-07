---
description: |-
  Figma 컴포넌트를 구현하고 page.tsx 쇼케이스에 등록한다. --all로 페이지 전체를, --snapshot으로 스냅샷 형식을 선택할 수 있다. 사용법: /figma-harness-showcase URL [--all] [--snapshot [횟수]] [--json]
---

# Figma → Showcase

**인수:** $ARGUMENTS

> **먼저 `.agent/skills/FIGMA_HARNESS_CORE.md`(이하 코어)를 정독한다.** 공통 절차는 전부 코어를 따르고, 아래는 이 커맨드의 고유 사항만 기술한다.

## 모드 요약

| 항목 | 값 |
|---|---|
| 대상 | 단일 노드 / `--all`이면 페이지 전체 |
| 형식 | 일반 / `--snapshot`이면 스냅샷 |
| 검증 횟수 | `--snapshot N` 지정 시 N회, 미지정 시 3회 |
| 허용 오차 | 일반 열 / `--snapshot`이면 스냅샷 열(0px) — 코어 §7.4 테이블 |
| 쇼케이스 등록 | **있음** — `page.tsx` `COMPONENTS` 배열 + import |
| 검증 대상 페이지 | `page.tsx` 등록분(`http://localhost:3900/`)으로 가능하나, element 캡처는 `/preview` 마운트(코어 §7.2)가 더 정확하므로 권장 |

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

## 절차

1. **인증 확인** — 코어 §1
2. **URL 파싱** — 코어 §2 (단일: `nodeId` / `--all`: `pageNodeId`, 없으면 첫 번째 페이지)
3. **노드 목록 결정 (이 커맨드 고유)**
   - 단일 모드: 해당 노드 1개
   - `--all` 모드: 현재 런타임의 Figma MCP `get_metadata`로 최상위 자식 수집:
     - `FRAME`, `COMPONENT`, `COMPONENT_SET`, `GROUP`만, 단순 원소(`RECTANGLE`, `TEXT`, `VECTOR` 등) 건너뜀
     - **`apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에 이미 등록된 `figmaNode`는 건너뜀(⏭ skipped)**
     - 수집된 노드 목록을 사용자에게 보여주고 계속 진행할지 확인
4. **노드별 구현** — 각 노드에 대해: 디자인 컨텍스트(코어 §3) → 에셋(코어 §4) → 컴포넌트 생성(코어 §5):
   - `--snapshot` 없으면 일반: `app/components/{ComponentName}.tsx`
   - `--snapshot` 있으면 스냅샷 형식: `app/components/snapshots/{ComponentName}Snapshot.tsx` — 절대 좌표 유지, 원본 크기 고정 컨테이너, `shrink-0` (상세는 `/figma-harness-snapshots`의 Step 5 형식과 동일)
   - 버저닝 1차 기준은 `page.tsx`의 `figmaNode` 등록 여부, 파일 존재는 `Glob` 재확인 (코어 §5.1)
5. **쇼케이스 등록 (이 커맨드 고유)** — `apps/figma-harness/app/page.tsx`의 `COMPONENTS` 배열에 추가하고 상단 import도 추가한다:

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

6. **타입 체크** — 코어 §6 (page.tsx 등록 포함 전체 통과 확인)
7. **정합성 검증** — 코어 §7. 횟수·허용 오차는 모드 요약 표 참조. element 캡처 정확도가 필요하면 `/preview` 마운트(§7.2)를 사용하고, 쇼케이스 페이지로 검증할 경우 `http://localhost:3900/`에서 해당 카드의 preview 요소를 element 캡처한다(§7.3). 종료 시 dev 서버 정리 (§7.6)

## 완료 보고

코어 §8의 규칙을 따른다.

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

(정합성 체크리스트·잔여 차이는 코어 §8 골격)
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

실패 시: 코어 §8 실패 스키마에 `"command": "figma-harness-showcase"`.
