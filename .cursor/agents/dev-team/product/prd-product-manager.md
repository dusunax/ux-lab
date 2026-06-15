---
name: product/PM/prd-product-manager
description: |-
  Use this agent when the user needs to define, structure, or document product requirements, create PRDs (Product Requirements Documents), manage development schedules, prioritize features, or align technical implementation with product goals. This agent is particularly useful at the start of a new feature, product, or sprint planning cycle.
  
  <example>
  Context: The user wants to build a new onboarding flow for their app and needs to formalize the requirements.
  user: "새로운 사용자 온보딩 플로우를 만들려고 해. 어떻게 시작하면 좋을까?"
  assistant: "PRD를 먼저 작성해서 목표와 요구사항을 명확히 하겠습니다. prd-product-manager 에이전트를 실행합니다."
  <commentary>
  The user is starting a new product feature and needs structured planning. Use the prd-product-manager agent to create a PRD that defines objectives, user stories, and requirements.
  </commentary>
  assistant: "Now let me use the Agent tool to launch the prd-product-manager agent to draft the onboarding PRD."
  </example>
  
  <example>
  Context: The user is mid-development and realizes the scope is unclear or the team is misaligned on priorities.
  user: "개발 중에 기능 범위가 계속 바뀌어서 팀이 혼선을 겪고 있어."
  assistant: "현재 상황을 정리하고 PRD를 업데이트해서 우선순위와 범위를 명확히 하겠습니다. prd-product-manager 에이전트를 실행합니다."
  <commentary>
  Scope creep is a product management problem. Use the prd-product-manager agent to reassess priorities, redefine scope, and update the PRD.
  </commentary>
  assistant: "Let me use the Agent tool to launch the prd-product-manager agent to realign the product scope."
  </example>
  
  <example>
  Context: User wants to plan a sprint or release cycle.
  user: "다음 스프린트 계획을 짜야 해. 어떤 기능을 먼저 개발해야 할까?"
  assistant: "스프린트 계획을 위해 현재 백로그와 우선순위를 검토하겠습니다. prd-product-manager 에이전트를 실행합니다."
  <commentary>
  Sprint planning requires prioritization and scheduling — core PM tasks. Launch the prd-product-manager agent.
  </commentary>
  assistant: "I'll now use the Agent tool to launch the prd-product-manager agent to assist with sprint planning."
  </example>
model: inherit
color: red
memory: project
---

> Thin wrapper - 실제 정의는 `.agent/subagents/dev-team/product/prd-product-manager.md`를 읽으세요.

Read [`.agent/subagents/dev-team/product/prd-product-manager.md`](../../../../.agent/subagents/dev-team/product/prd-product-manager.md) and follow it.
