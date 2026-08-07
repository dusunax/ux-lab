---
description: |-
  Figma URL의 컴포넌트를 스냅샷 형식으로 구현하고, 지정한 횟수만큼 Figma 원본과 픽셀 대조를 반복하여 퀄리티를 높인다. 사용법: /figma-harness-snapshots 횟수 URL (쇼케이스 등록은 /figma-harness-showcase --snapshot 사용)
---

# Figma → Snapshot Component

**인수:** $ARGUMENTS

> **먼저 `.agent/skills/FIGMA_HARNESS_CORE.md`(이하 코어)를 정독한다.** 공통 절차는 전부 코어를 따르고, 아래는 이 커맨드의 고유 사항만 기술한다.

## 모드 요약

| 항목 | 값 |
|---|---|
| 대상 | 단일 노드 1개 (스냅샷 형식) |
| 검증 횟수 | `count`회 (인수 필수) |
| 허용 오차 | **0px** (코어 §7.4 테이블의 "스냅샷" 열) |
| 쇼케이스 등록 | 없음 |
| 검증 대상 페이지 | `/preview` (코어 §7.2 프리뷰 마운트 필수) |
| 조기 종료 | 모든 항목 허용 오차 0 달성 시 남은 횟수 생략 |

## Step 0 — 인수 파싱

`$ARGUMENTS`에서 추출:
- `count`: 첫 번째 토큰 (정수). 픽셀 대조 반복 횟수. **없거나 정수가 아니면 즉시 에러를 출력하고 중단한다.**
- `url`: 두 번째 토큰. Figma URL.
- `--json`: 완료 보고를 JSON 형식으로 출력 (선택)

예시:
- `/figma-harness-snapshots 5 https://www.figma.com/design/...?node-id=0-40522`
- `/figma-harness-snapshots 5 https://www.figma.com/design/...?node-id=0-40522 --json`

## 절차

1. **인증 확인** — 코어 §1
2. **URL 파싱** — 코어 §2 (`fileKey`, `nodeId`)
3. **디자인 컨텍스트 수집** — 코어 §3. 스크린샷·**컴포넌트 크기(width, height)**·에셋 URL 목록 보관
4. **에셋 다운로드** — 코어 §4
5. **스냅샷 컴포넌트 생성 (이 커맨드 고유 형식)** — `apps/figma-harness/app/components/snapshots/{ComponentName}Snapshot.tsx`. 버저닝은 코어 §5.1 (`{Name}SnapshotV2.tsx` …), 마크업 정리·품질은 코어 §5.2–5.3.

   **스냅샷 형식의 특징:**
   - Figma의 절대 좌표 레이아웃을 최대한 그대로 유지 (`position: absolute`, `inset`)
   - 컴포넌트를 Figma 원본 크기(`width`, `height`)로 **고정된 컨테이너**에 래핑
   - 외부에서 크기를 변경하지 않도록 `shrink-0` 적용
   - Props는 `className?`만 (label/onClick 불필요)

   ```tsx
   const ICON_SEARCH = '/assets/icon-search.svg'

   type {Name}SnapshotProps = {
     className?: string
   }

   export default function {Name}Snapshot({ className = '' }: {Name}SnapshotProps) {
     return (
       <div
         className={`relative shrink-0 ${className}`}
         style={{ width: {width}px, height: {height}px }}
       >
         ...
       </div>
     )
   }
   ```

6. **타입 체크** — 코어 §6
7. **정합성 검증 `count`회** — 코어 §7. 이 커맨드 고유:
   - 허용 오차는 §7.4 테이블의 **스냅샷 열(0px)** 적용, 색상·투명도·타이포·box-shadow는 완전 일치
   - 프리뷰 마운트(§7.2) 시 래퍼가 스냅샷의 고정 크기에 영향을 주지 않게 한다
   - **조기 종료**: 모든 항목에서 허용 오차 0 달성 시 남은 횟수 없이 종료
   - 종료 시 dev 서버 정리 (§7.6)

## 완료 보고

코어 §8의 규칙을 따른다.

### 텍스트

```
### 기본 정보
| 항목          | 값                              |
|---------------|---------------------------------|
| 컴포넌트      | {Name}Snapshot.tsx              |
| Figma 노드    | 0:XXXXX                         |
| 원본 크기     | {width} × {height}px            |
| 다운로드 에셋 | N개 (public/assets/)            |
| 정합성 검증   | {total}회 중 {completed}회 완료 |

### 정합성 체크리스트 (스냅샷 확장판)
[픽셀] 위치 {✅|❌}  크기 {✅|❌}  색상 {✅|❌}  투명도 {✅|❌}  border-radius {✅|❌}  폰트크기 {✅|❌}  font-weight {✅|❌}  letter-spacing {✅|❌}  box-shadow {✅|❌}  에셋 {✅|❌}
[상태] Default {✅|❌}  Hover {✅|❌|미정의}  Active {✅|❌|미정의}  Disabled {✅|❌|미정의}
[색상]·[속성]은 코어 §8 골격과 동일

### 잔여 차이
없음 | - {항목}: Figma={값} / 현재={값}
```

### JSON (`--json`)

```json
{
  "command": "figma-harness-snapshots",
  "component": "{Name}Snapshot.tsx",
  "figmaNode": "0:XXXXX",
  "originalSize": { "width": N, "height": N },
  "assets": N,
  "verification": { "total": N, "completed": N },
  "checks": {
    "pixel": { "position": "pass|fail", "size": "pass|fail", "color": "pass|fail", "opacity": "pass|fail", "borderRadius": "pass|fail", "fontSize": "pass|fail", "fontWeight": "pass|fail", "letterSpacing": "pass|fail", "boxShadow": "pass|fail", "assets": "pass|fail" },
    "state": { "default": "pass|fail", "hover": "pass|fail|not-defined", "active": "pass|fail|not-defined", "disabled": "pass|fail|not-defined" },
    "color": { "background": "pass|fail", "text": "pass|fail", "border": "pass|fail", "icon": "pass|fail" },
    "property": { "fontFamily": "pass|fail", "fontWeight": "pass|fail", "letterSpacing": "pass|fail", "borderRadius": "pass|fail", "boxShadow": "pass|fail", "assets": "pass|fail" }
  },
  "remainingDiffs": []
}
```

실패 시: 코어 §8 실패 스키마에 `"command": "figma-harness-snapshots"`.
