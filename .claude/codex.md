# Codex 적용 가이드

이 레포에서 Codex가 규칙을 적용할 때 우선 확인할 기준 문서입니다.

## 반드시 읽을 파일

1. `.claude/rules/coding-style.md`
2. `.claude/rules/performance.md`
3. `.claude/rules/security.md`
4. `.claude/skills/README.md`
5. 관련 스킬 문서 (`.claude/skills/*.md`)

## Codex 적용 원칙

- `features` 폴더 기준으로 기능 단위를 확인한다.
- 가능하면 한 기능 단위는 한곳에 모아두고 분리를 지양한다.
- 빌드/실행/파일 삭제 등은 사용자가 명시하거나 요청했을 때만 수행한다.
- 모순되는 지시가 있으면, 사용자 요청(동작 목표)을 우선하고 내부 규칙은 보조로 적용한다.

## 변경 동기 문서 동기화 규칙

- 로직에 중요한 변경이 생기면, 기존 문서(md)는 즉시 최신 상태로 갱신한다.
- 코드 변경은 문서에서 제시한 동작과 일치해야 하며, 동작 변경이 있으면 README/가이드 문서를 먼저 정합성 있게 업데이트한다.

## 작업 정렬 규칙

- 규칙 충돌 시 `security` > `performance` > `coding-style` > `skills` 우선순위 적용.
- 문서에 없는 동작은 현재 상태를 유지한 채 최소 변경으로 해결한다.
