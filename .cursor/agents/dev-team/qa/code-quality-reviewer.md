---
name: qa/QA/code-quality-reviewer
description: |-
  Use this agent when you need a thorough code review of recently written or modified code. It checks for bugs, coding standard compliance, and performance optimization opportunities based on the project's established rules.
  
  <example>
  Context: The user has just written a new React component and wants it reviewed.
  user: "I just finished writing the UserProfile component. Can you take a look?"
  assistant: "I'll launch the code-quality-reviewer agent to thoroughly review your UserProfile component."
  <commentary>
  Since a significant piece of code was written, use the Agent tool to launch the code-quality-reviewer agent to review the newly written component.
  </commentary>
  </example>
  
  <example>
  Context: The user has implemented a new API route and wants to make sure it's correct and secure.
  user: "I've added a new POST /api/users endpoint. Please review it."
  assistant: "Let me use the code-quality-reviewer agent to check the new endpoint for bugs, coding standards, security issues, and performance."
  <commentary>
  A new API endpoint was written, so use the Agent tool to launch the code-quality-reviewer agent to inspect it.
  </commentary>
  </example>
  
  <example>
  Context: The user refactored a utility function and wants to verify quality.
  user: "I refactored the data transformation logic in utils/transform.ts."
  assistant: "I'll invoke the code-quality-reviewer agent to review the refactored transformation logic."
  <commentary>
  Refactored code should be reviewed for regressions and improvement opportunities, so use the Agent tool to launch the code-quality-reviewer agent.
  </commentary>
  </example>
tools: ListMcpResourcesTool, Read, ReadMcpResourceTool, TaskStop, WebFetch, WebSearch
model: sonnet
color: blue
memory: project
---

> Thin wrapper - 실제 정의는 `.agent/subagents/dev-team/qa/code-quality-reviewer.md`를 읽으세요.

Read [`.agent/subagents/dev-team/qa/code-quality-reviewer.md`](../../../../.agent/subagents/dev-team/qa/code-quality-reviewer.md) and follow it.
