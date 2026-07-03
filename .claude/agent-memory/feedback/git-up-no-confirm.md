---
name: feedback-git-up-no-confirm
description: git:up 실행 시 브랜치·커밋·PR 단계에서 일일이 확인받지 않고 바로 진행
metadata:
  type: feedback
---

`/git:up` 커맨드 실행 시 각 단계에서 사용자 확인을 요청하지 않고 바로 진행한다.

**Why:** 사용자가 up 실행 자체로 의사를 명확히 표현한 것이므로 단계마다 되묻는 건 불필요한 마찰.

**How to apply:** git:up 흐름(branch→commit→PR) 전체를 중단 없이 실행한다. 단, 민감 파일 감지나 충돌처럼 판단이 필요한 예외 상황에서는 여전히 확인한다.
