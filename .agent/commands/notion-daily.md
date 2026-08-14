---
name: notion-daily
description: >-
  Creates or updates today's Notion daily log page (yymmdd), carries over
  unchecked todos, and appends work notes or concern logs. Use when the user
  runs /notion-daily, asks for a Notion daily page, 노션 일지, or mentions
  --update/--create/--log for daily Notion notes.
---

# Notion Daily

오늘자 노션 기록 페이지를 생성·업데이트한다. 워크스페이스와 무관하게 이 스킬을 따른다.

**인수:** 사용자 메시지 / `$ARGUMENTS`에서 파싱한다.

## Step 0 — 인수 파싱

| 패턴 | 별칭 | 동작 |
| --- | --- | --- |
| (없음) | | 오늘 페이지 생성 또는 URL 반환 |
| `--new` | `-n` | 오늘 페이지가 있어도 새 페이지 강제 생성 (`-2`, `-3` suffix) |
| `--update` | `-u` | 현재 작업 자동 기록 (헤딩 + staged diff) |
| `--create` | `-c` | 최근 커밋을 H2 + 불렛으로 오늘 페이지에 추가 |
| `--log "내용"` | `-l "내용"` | 고민 사항 로그 추가 (caption 아래 💬 blue callout에 쌓음) |
| (플래그 없는 자유 텍스트) | | `--log`와 동일 |

예시: `/notion-daily`, `/notion-daily -n`, `/notion-daily -u`, `/notion-daily -c`, `/notion-daily -l "토큰 충돌 가능성"`, `/notion-daily 고민 내용`

---

## 사전 조건 — Notion MCP

`user-Notion` MCP 도구를 사용한다 (`notion-search`, `notion-fetch`, `notion-create-pages`, `notion-update-page`).

연결/인증이 안 되어 있으면:

> Notion MCP가 연결되어 있지 않습니다. Cursor MCP 설정에서 Notion을 추가하고 인증해 주세요.

호출 전 `GetMcpTools`로 스키마를 확인한 뒤 `CallMcpTool`로 실행한다. server id는 `user-Notion`.

---

## 설정 — 부모 페이지

일지 부모 페이지 URL 또는 ID. 비어 있으면 워크스페이스 루트(Private)에 생성한다.

```
NOTION_DAILY_PARENT_URL=
```

---

## Step 1 — 현재 시각 재조회 후 오늘 날짜

세션에 캐시된 날짜/시간을 쓰지 말고, 실행할 때마다 로컬 시각을 다시 읽는다.

```powershell
Get-Date -Format "yyMMdd"
```

```bash
date +"%y%m%d"
```

결과 예: `260415` — 페이지 제목.

---

## Step 2 — 오늘 페이지 검색

`notion-search`:

```
query: <오늘 날짜 yymmdd>
query_type: internal
page_size: 25
```

결과에서 `title`이 오늘 날짜 패턴과 일치하는 페이지만 수집한다.

- `--new` 없이 오늘 페이지가 있으면: 가장 최근 URL을 기억하고 Step 3·4를 건너뛴다.
- `--new` 이거나 없으면: Step 3으로 진행.

**중복 방지:** 기존 페이지는 덮어쓰지 않는다. 새 페이지는 `-2`, `-3` suffix.
예: `260415` 존재 → `260415-2`, 그것도 있으면 `260415-3`.

---

## Step 3 — 이전 페이지 미완료 항목 수집

어제 날짜(`yymmdd`)로 `notion-search` 한다. 없으면 `어제-1일`, `어제-2일` … 로 가장 최근 존재 페이지를 찾는다.

```powershell
(Get-Date).AddDays(-1).ToString("yyMMdd")
```

```bash
date -v-1d +"%y%m%d"   # macOS
date -d "yesterday" +"%y%m%d"   # Linux
```

찾으면 `notion-fetch`로 내용을 가져와 체크 해제(`- [ ]`) to-do만 추출한다.

- `archived: true` / 휴지통 페이지는 제외.
- 못 찾거나 미완료가 없으면 기본 플레이스홀더 사용.

미완료 항목은 뎁스에 따라 헤딩으로 변환해 오늘 페이지 **오늘의 주요 할 일**에 넣는다:

| 체크박스 뎁스 | 변환 |
| --- | --- |
| 1뎁스 | `# 항목명` |
| 2뎁스 | `## 항목명` |
| 3뎁스 | `### 항목명` |
| 4뎁스 | `#### 항목명` |

### Step 3-1 — 오전/오후 캡션

- 1뎁스 순서 유지 상위 우선.
- 상위 1\~2개 → 오전, 다음 1\~2개 → 오후. 부족하면 기본 텍스트.

기본:

- 오전: 오늘의 핵심 과제부터 안정적으로 시작해 컨텍스트 손실을 줄이는 편이 좋습니다.
- 오후: 오전에 못 끝낸 항목의 연속성을 살려 마무리 성과를 확보하는 것이 좋습니다.

노션 본문 — caption 바로 아래에 고민 로그용 callout을 둔다:

```
<callout icon="💡" color="gray_bg">
	오전: <오전 추천 문장>
	오후: <오후 추천 문장>
</callout>
<callout icon="💬" color="blue_bg">
</callout>
```

- caption은 gray `callout`(💡)만 사용. `caption:` 일반 텍스트 블록 금지.
- 고민 로그는 그 아래 blue `callout`(💬 말풍선)에만 쌓는다. 생성 시 비어 있어도 블록은 미리 둔다.

### Step 3-2 — CLI/응답 출력

```
caption:
오전: <오전 추천 문장>
오후: <오후 추천 문장>
```

---

## Step 4 — 오늘 페이지 생성 (Step 2에서 미발견 시에만)

`notion-create-pages`:

- `NOTION_DAILY_PARENT_URL`이 있으면 `parent: { page_id: ... }`.
- 비어 있으면 `parent` 생략 (워크스페이스 루트).
- **금지:** Step 3에서 찾은 어제/이전 페이지 ID를 parent로 쓰지 않는다.
- 제목: Step 2 중복 방지 규칙 (`yymmdd` 또는 `yymmdd-N`).

```
pages:
  - properties:
      title: <결정된 제목>
    content: |
      # Todo
      - [ ] <어제 미완료 계층 그대로>
      ← 없으면:
      - [ ] 오늘의 주요 할일
      - [ ] 오늘의 주요 할일2

      <callout icon="💡" color="gray_bg">
        오전: ...
        오후: ...
      </callout>
      <callout icon="💬" color="blue_bg">
      </callout>

      ---

      # <뎁스→헤딩 변환 결과>
      ← 없으면: # 오늘의 주요 할 일
```

응답 URL을 저장한다.

---

## Step 5 — 내용 추가 (인수가 있을 때만)

시각은 이 단계 직전에 다시 구한다:

```powershell
Get-Date -Format "HH:mm"
```

```bash
date +"%H:%M"
```

플래그 없는 자유 텍스트만 있으면 `--log`와 동일하게 처리한다.

### `--update` / `-u`

1. `notion-fetch`로 마지막 H1·H2·H3 추출 (현재 작업 맥락).
2. `git diff --staged` → 없으면 `git diff HEAD`.
3. 컨텍스트로 불렛 요약 후 `insert_content`로 append:

```
---
- (HH:MM) <변경 항목 1>
- <변경 항목 2>
```

### `--create` / `-c`

1. `git log --oneline -10`
2. conventional commit prefix 제거 → H2 제목
3. `git show --stat <해시>`로 불렛 요약
4. `insert_content`로 append:

```
## <prefix 제거한 커밋 제목>
- <변경 요약>
```

### `--log "내용"` / `-l "내용"`

고민 로그는 **페이지 끝이 아니라** caption(💡 gray) **바로 아래**의 💬 / `blue_bg` callout 안에 쌓는다.

1. `notion-fetch`로 오늘 페이지를 읽는다.
2. `icon="💬"` 이고 `color="blue_bg"` 인 callout을 찾는다.
3. 없으면 caption callout 바로 뒤에 빈 블록을 삽입한다:

```
<callout icon="💬" color="blue_bg">
</callout>
```

4. 기존 callout 내용 끝에 아래 형식을 **추가**한다 (`update_content`로 callout 전체를 교체하거나, callout 안 마지막 조각 뒤에 이어 붙인다). 페이지 하단에 `## 💭 고민` 섹션을 만들지 않는다.

```
고민(HH:mm):
- <사용자 입력>
```

여러 번 호출하면 같은 callout 안에 시간순으로 쌓인다:

```
<callout icon="💬" color="blue_bg">
	고민(09:01):
	- 첫 번째 로그
	고민(10:11):
	- 두 번째 로그
</callout>
```

---

## Step 6 — 완료 보고

```
노션 일지 {created|updated|logged}: <오늘 날짜>
URL: <페이지 URL>
caption:
오전: <실행된 오전 추천 문장>
오후: <실행된 오후 추천 문장>
```

MCP 오류는 메시지를 그대로 출력한다.
