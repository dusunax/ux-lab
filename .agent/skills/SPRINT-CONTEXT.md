# SPRINT-CONTEXT — 스프린트 컨텍스트 수집 절차 (공유)

> 모든 `/sprint:*` 커맨드가 공유하는 **앱(APP)·스프린트 번호(N)·킥오프·보고서** 탐지 절차.
> 각 커맨드의 "스프린트 N 탐지" / "컨텍스트 수집" 스텝은 이 문서를 따른다.
> 커맨드 고유 로직(90% 완료율 게이트, PR 생성 규칙 등)은 각 커맨드 문서에 남는다.

---

## 멀티앱 스킴 (현행 레포 구조)

| 항목 | 패턴 | 예시 (현재) |
|------|------|-------------|
| 브랜치 | `sprint/{app}/{N}` | `sprint/one-moon-date/1` |
| 킥오프 | `docs/meetings/{app}/YYYY-MM-DD-sprint-{N}-kickoff.md` | `docs/meetings/one-moon-date/2026-07-08-sprint-1-kickoff.md` |
| 보고서 | `docs/presentations/sprint-{app}-{N}-report-{yymmdd}.html` | `docs/presentations/sprint-agent-and-my-ax-2-report-260705.html` |
| 스크린샷 | `docs/presentations/sprint-{app}-{N}/shot-*.png` | `docs/presentations/sprint-agent-and-my-ax-2/…` |
| 회의록 인덱스 | `docs/meetings/README.md` (앱별 섹션) | — |

**원칙: 스프린트 번호 N은 앱별로 독립적이다.**
`one-moon-date`의 Sprint 1과 `projection-art`의 Sprint 1은 서로 무관하며,
"이전 스프린트", "최대 N", "N+1" 계산은 항상 **같은 앱 디렉터리 안에서만** 수행한다.
앱 경계를 넘어 N을 비교·증가시키지 않는다.

---

## Step C1 — 인수 우선

커맨드 인수로 `--app APP` / `--sprint N`이 주어지면 해당 값을 우선 사용한다.
둘 중 하나만 주어지면 나머지는 아래 절차로 추론한다.

## Step C2 — 현재 브랜치에서 APP·N 추출

```bash
git branch --show-current
```

| 브랜치 패턴 | 처리 |
|-------------|------|
| `sprint/{app}/{N}` (예: `sprint/one-moon-date/1`) | APP·N 즉시 확정 |
| `sprint/{N}` (구형 플랫, 예: `sprint/9`) | N 확정, APP은 미정 → `docs/meetings/{app}/`에서 `sprint-{N}` 킥오프를 가진 앱을 탐색해 확정. 후보가 여럿이면 사용자에게 질문. (참고: 레거시 `sprint/6`~`sprint/9`는 `ai-empathy-diary` 시절 브랜치) |
| 그 외 (`main`, `chore/*` 등) | Step C3으로 |

## Step C3 — 브랜치가 sprint 패턴이 아닐 때: 최신 킥오프로 추론

```bash
ls -d docs/meetings/*/            # 앱 디렉터리 목록 (README.md 등 파일은 제외)
ls docs/meetings/*/ | sort        # 앱별 킥오프 파일
```

1. 각 앱 디렉터리의 `*sprint-{N}-kickoff.md` 파일 중 **파일명 날짜(YYYY-MM-DD prefix)가 가장 최근**인 파일을 찾는다.
2. 그 파일의 디렉터리가 APP, 파일명의 N이 스프린트 번호다.
3. 최신 후보가 같은 날짜로 여러 앱에 걸쳐 모호하거나, 킥오프가 하나도 없으면 **사용자에게 어느 앱·스프린트인지 질문**한다. 추정으로 진행하지 않는다.

> `docs/meetings/` 루트의 플랫 파일(`2026-05-21-sprint-workflow.md`, `README.md` 등)은 스캔 대상이 아니다. 킥오프는 항상 앱 하위 디렉터리에만 존재한다.

## Step C4 — 킥오프 파일 탐색 (APP·N 확정 후)

아래 우선순위로 찾는다 (앱 하위 디렉터리 필수):

1. `docs/meetings/{APP}/*sprint-{N}-kickoff.md` — 현대 포맷
2. `docs/meetings/{APP}/*sprint-{N}.md` (`-pre`, `-kickoff` 미포함) — 레거시 포맷

`-pre` 단독 파일과 숫자 N이 없는 파일은 제외한다.

## Step C5 — 보고서 파일 탐색

```bash
ls -t docs/presentations/sprint-{APP}-{N}-report-*.html 2>/dev/null | head -1
```

하위 디렉터리에 있을 가능성까지 포함하려면 glob `docs/presentations/**/sprint-{APP}-{N}-report-*.html`을 사용한다.
`sprint-template.html`은 보고서가 아니다.

---

## 산출 변수

이 절차를 마치면 커맨드는 아래 변수를 확보한다:

| 변수 | 현재 레포 기준 예시 |
|------|---------------------|
| `APP` | `one-moon-date` |
| `N` | `1` |
| `BRANCH` = `sprint/{APP}/{N}` | `sprint/one-moon-date/1` |
| `KICKOFF` | `docs/meetings/one-moon-date/2026-07-08-sprint-1-kickoff.md` |
| `REPORT` | `docs/presentations/sprint-one-moon-date-1-report-*.html` (없으면 미생성) |

## 실패 처리

어느 절차로도 APP 또는 N을 확정하지 못하면, 각 커맨드가 정의한 중단 메시지를 출력하고 종료한다.
중단 메시지에는 `--app APP --sprint N` 인수 사용법과 `sprint/{app}/{N}` 브랜치 전환 안내를 포함한다.
