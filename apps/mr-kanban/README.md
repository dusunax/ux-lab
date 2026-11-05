# MR Kanban

GitLab Merge Request 또는 GitHub Pull Request를 담당자별로 모아 칸반으로 보여주는 항상 위(always-on-top) 데스크톱 위젯입니다. Electron 기반, 빌드 도구 없이 동작합니다.

## 컬럼 판정

위에서부터 처음 맞는 규칙을 적용합니다 (`src/common.js`의 `classify`).

| 컬럼 | 조건 |
|------|------|
| Merged | 최근 24시간 안에 머지된 MR |
| Approved | 승인 수가 필요 승인 수(최소 1)를 채움. GitHub는 리뷰어별 마지막 결론이 `APPROVED`인 수 |
| Reviewing | 작성자 본인이 아닌 사람의 댓글이 있음. GitHub는 리뷰 제출도 포함하고 봇은 제외 |
| Created | 그 외 |

파이프라인(GitHub는 check-run) 상태는 카드의 점으로만 표시하고, 리뷰 대기가 24시간을 넘으면 카드를 강조합니다.

## 실행

```bash
pnpm --filter mr-kanban install
pnpm --filter mr-kanban start
```

설정 탭에서 제공자, URL, 토큰, 담당자 username, 폴링 주기(30~300초), 필요 승인 수를 입력합니다. 설정이 비어 있으면 앱이 설정 탭으로 시작합니다.

| 제공자 | URL | 토큰 |
|--------|-----|------|
| GitLab | `https://gitlab.example.com` | 개인 토큰 (`api` 스코프) |
| GitHub | **github.com** 또는 **Enterprise Server**를 라디오로 선택. Enterprise는 브라우저로 접속하는 주소만 넣으면 `/api/v3`를 붙인다 | Fine-grained 토큰 (Pull requests·Checks 읽기) 또는 classic `repo` |

설정 탭 아래 **화면** 섹션에서 UI 크기(Small 0.85배 · Medium · Large 1.2배)를 고르면 글자·여백·아이콘·창 너비가 함께 바뀌고 바로 저장됩니다. 툴바의 축소 버튼을 누르면 툴바만 남기고 컬럼별 개수를 칩으로 보여줍니다.

GitHub 검색 API는 분당 30회 한도라 폴링 1회에 담당자당 2회를 씁니다. 60초 주기면 담당자 15명 정도까지 괜찮습니다.

## 구조

| 파일 | 역할 |
|------|------|
| `src/common.js` | URL 검증, 토큰 칸 구분, 컬럼 판정 |
| `src/gitlab.js` · `src/github.js` | 제공자별 API 호출. 같은 모양의 카드를 돌려준다 |
| `src/main.js` | 설정·토큰 저장, 폴링, 창 제어 |
| `src/renderer/` | 보드·설정 화면 (토큰을 보지 못한다) |

## 보안

- 토큰은 `safeStorage`(OS 키체인)로 암호화해 `userData/config.json`에 저장하고, 렌더러에는 넘기지 않습니다.
- 렌더러는 `contextIsolation`·`sandbox`와 CSP로 격리하며, 외부 문자열은 `textContent`로만 넣습니다.
- 링크는 설정한 호스트(GitHub는 웹 주소)의 URL만 기본 브라우저로 엽니다.
- 토큰은 GitLab · github.com · GitHub Enterprise 칸에 따로 저장합니다. 각 칸은 저장할 때의 주소를 함께 기억해서, 주소가 바뀌면 그 토큰을 새 호스트로 보내지 않습니다.
- 아바타는 설정한 호스트나 `avatars.githubusercontent.com`에서만 받고, 토큰은 설정한 호스트에만 보냅니다.

## 테스트

```bash
pnpm --filter mr-kanban test
```
