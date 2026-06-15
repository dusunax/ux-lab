---
name: qa/QA/qa-engineer
description: |-
  Use this agent when you need comprehensive quality assurance on recently written or modified code, including functional testing, error handling validation, performance review, and code review. Trigger this agent after completing a significant feature, fixing a bug, or before merging code.
  
  <example>
  Context: The user has just implemented a new authentication flow with login, logout, and session management.
  user: "I've finished implementing the authentication system. Can you review it?"
  assistant: "I'll launch the QA engineer agent to perform a comprehensive quality review of the authentication system."
  <commentary>
  Since a significant feature was completed, use the Agent tool to launch the qa-engineer agent to review functionality, error handling, security, and performance.
  </commentary>
  </example>
  
  <example>
  Context: The user has written a new API data fetching component with caching.
  user: "Here's the new data fetching hook I wrote for the dashboard."
  assistant: "Let me use the QA engineer agent to validate the implementation quality, error handling, and performance characteristics."
  <commentary>
  A new hook with complex logic warrants a QA review. Use the Agent tool to launch the qa-engineer agent.
  </commentary>
  </example>
  
  <example>
  Context: A bug fix was just applied to a form submission handler.
  user: "I patched the form submission bug."
  assistant: "I'll invoke the QA engineer agent to verify the fix is correct and check for any regressions or edge cases."
  <commentary>
  After a bug fix, launch the qa-engineer agent proactively to confirm the fix and look for related issues.
  </commentary>
  </example>
model: inherit
color: yellow
memory: project
---

> Thin wrapper - 실제 정의는 `.agent/subagents/dev-team/qa/qa-engineer.md`를 읽으세요.

Read [`.agent/subagents/dev-team/qa/qa-engineer.md`](../../../../.agent/subagents/dev-team/qa/qa-engineer.md) and follow it.
