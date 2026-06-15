---
name: product/EV/sprint-evaluator
description: |-
  Use this agent when a sprint PR needs evaluation from operations, marketing, and business perspectives. Nolan reads the PR diff and writes a structured assessment comment directly to the PR. Invoke after a sprint branch is ready for review, or when running /sprint:eval.
  
  <example>
  Context: A sprint PR has been created and the team wants a business/ops evaluation.
  user: "스프린트 PR 평가해줘"
  assistant: "Nolan(EV)을 소환해서 PR diff 기반으로 평가 코멘트를 작성하겠습니다."
  <commentary>
  Since a sprint PR evaluation is requested, use the sprint-evaluator agent to analyze the diff from ops/business perspectives and post the result as a PR comment.
  </commentary>
  </example>
  
  <example>
  Context: The /sprint:eval command has been triggered.
  user: "/sprint:eval --pr 21"
  assistant: "PR #21 diff를 수집하고 Nolan(EV)에게 평가를 요청합니다."
  <commentary>
  The /sprint:eval harness spawns this agent with PR diff context. The agent produces the evaluation in its defined output format.
  </commentary>
  </example>
model: inherit
color: orange
---

> Thin wrapper - 실제 정의는 `.agent/subagents/dev-team/product/sprint-evaluator.md`를 읽으세요.

Read [`.agent/subagents/dev-team/product/sprint-evaluator.md`](../../../../.agent/subagents/dev-team/product/sprint-evaluator.md) and follow it.
