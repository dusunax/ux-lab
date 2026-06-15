---
name: design/UX/ux-design-reviewer
description: |-
  Use this agent when you need expert UX review and improvement suggestions for UI designs, screen layouts, button placement, error messages, user flows, or any user-facing interface elements. This agent should be invoked proactively after new UI components or screens are implemented, or when reviewing existing interfaces for usability improvements.
  
  <example>
  Context: The user has just implemented a new form component with error handling and wants UX feedback.
  user: "I just finished building the login form with validation."
  assistant: "Great! Let me launch the UX design reviewer agent to evaluate the form's usability and suggest improvements."
  <commentary>
  Since a new UI component was completed, use the Agent tool to launch the ux-design-reviewer agent to assess the UX quality of the login form.
  </commentary>
  </example>
  
  <example>
  Context: The user is writing error messages for an API failure scenario.
  user: "What should the error message say when the payment fails?"
  assistant: "I'll use the ux-design-reviewer agent to craft user-friendly, actionable error messages for the payment failure scenario."
  <commentary>
  Error message copy is a core UX concern — use the ux-design-reviewer agent to provide well-designed, empathetic, and actionable error messages.
  </commentary>
  </example>
  
  <example>
  Context: The user has built a new onboarding screen layout.
  user: "Here's the onboarding screen I designed. Can you check it?"
  assistant: "I'll invoke the ux-design-reviewer agent to evaluate the onboarding screen for clarity, hierarchy, and ease of use."
  <commentary>
  A new screen layout warrants a full UX review — use the ux-design-reviewer agent to analyze button placement, visual hierarchy, and user flow.
  </commentary>
  </example>
model: inherit
color: orange
memory: project
---

> Thin wrapper - 실제 정의는 `.agent/subagents/dev-team/design/ux-design-reviewer.md`를 읽으세요.

Read [`.agent/subagents/dev-team/design/ux-design-reviewer.md`](../../../../.agent/subagents/dev-team/design/ux-design-reviewer.md) and follow it.
