# CLAUDE Context

이 폴더의 문서를 통해 Claude/Codex가 작업 규칙을 읽고 동작할 수 있도록 정리합니다.

## 적용 우선순위

1. `rules/` (필수 규칙)
2. `skills/` (반복 작업 단위)
3. `commands/` (검증/리팩터 실행 규약)

변경 전에 먼저 해당 문서를 기준으로 판단합니다.

- 최소 가이드: [rules/coding-style.md](/Users/du/repository/ux-lab/.claude/rules/coding-style.md)
- 성능 가이드: [rules/performance.md](/Users/du/repository/ux-lab/.claude/rules/performance.md)
- 보안 가이드: [rules/security.md](/Users/du/repository/ux-lab/.claude/rules/security.md)

## Skill 폴더

- `skills/`는 Claude/Codex가 반복 작업을 수행할 때 빠르게 호출 가능한 지침 모음입니다.
- 스킬 이름은 문서 제목의 영문 키(예: `showcase-generation`)로 정렬합니다.
- 스킬은 “무엇을 하는지”보다 “언제 쓰는지/어떤 출력이 나와야 하는지”에 초점을 둡니다.

## 공통 원칙

- 기능은 `features` 폴더 기준으로 묶는다.
- 기능 관련 코드 분리는 최소화한다.
- 과도한 구조 분해보다 기능 동작성이 먼저다.
- 변경 후 콘솔/로그/에러 규칙은 `rules/*`를 준수한다.

