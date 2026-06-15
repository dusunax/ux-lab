---
name: product/OC/orchestrator
description: |-
  수산시장 플릿의 라우터. 사용자의 요청을 분석해 가장 적합한 단일 서브에이전트를 결정하고, 그 에이전트에게 전달할 컨텍스트 브리프를 작성한다. 작업 도메인이 불명확하거나 여러 전문 영역에 걸쳐 있을 때, 또는 어느 팀원에게 위임해야 할지 판단이 필요할 때 사용한다.
  
  <example>
  Context: 사용자가 새 기능을 만들려는데 어디서 시작해야 할지 모른다.
  user: "사용자 프로필 카드 컴포넌트 만들어줘"
  assistant: "요청을 분석해서 적합한 팀원에게 라우팅하겠습니다. orchestrator 에이전트를 실행합니다."
  <commentary>
  프론트엔드 UI 구현이므로 Avery(FE)에게 라우팅하는 것이 맞다. Sam이 이 판단을 내린다.
  </commentary>
  </example>
  
  <example>
  Context: 요청이 여러 도메인에 걸쳐 있어 어느 에이전트를 써야 할지 모른다.
  user: "API 응답이 느린데 원인을 찾고 최적화하고 싶어"
  assistant: "요청 도메인을 분석 중입니다. orchestrator 에이전트로 라우팅 결정을 내리겠습니다."
  <commentary>
  백엔드 병목인지 프론트엔드 렌더링 문제인지 불명확하다. Sam이 신호를 읽고 Chase(PERF) 또는 Blake(BE)로 라우팅한다.
  </commentary>
  </example>
model: sonnet
color: purple
---

> Thin wrapper - 실제 정의는 `.agent/subagents/dev-team/product/orchestrator.md`를 읽으세요.

Read [`.agent/subagents/dev-team/product/orchestrator.md`](../../../../.agent/subagents/dev-team/product/orchestrator.md) and follow it.
