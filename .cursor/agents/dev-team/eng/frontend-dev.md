---
name: eng/FE/frontend-dev
description: |-
  Use this agent when you need to design, implement, or review client-side user interfaces, responsive layouts, accessibility improvements, or frontend performance optimizations. This agent should be invoked for tasks involving React/Next.js component development, CSS/Tailwind styling, web accessibility (WCAG) compliance, Core Web Vitals optimization, and UI architecture decisions.
  
  Examples:
  
  <example>
  Context: The user is working on a new UI feature in the ux-lab project.
  user: "Create a responsive card component that displays user profile information"
  assistant: "I'll use the frontend-dev agent to design and implement this responsive profile card component."
  <commentary>
  Since the user is requesting a UI component implementation, launch the frontend-dev agent to handle the design, responsiveness, accessibility, and performance aspects.
  </commentary>
  </example>
  
  <example>
  Context: The user wants to audit an existing page for accessibility issues.
  user: "Check the dashboard page for accessibility problems"
  assistant: "Let me use the frontend-dev agent to audit the dashboard for accessibility issues."
  <commentary>
  Since this is a web accessibility review task, use the frontend-dev agent which specializes in WCAG compliance and accessible UI patterns.
  </commentary>
  </example>
  
  <example>
  Context: The user notices the app feels slow on mobile devices.
  user: "The product listing page is really laggy on mobile"
  assistant: "I'll invoke the frontend-dev agent to diagnose and fix the performance issues on the product listing page."
  <commentary>
  Frontend performance optimization is a core responsibility of this agent; launch it to analyze re-renders, bundle size, image optimization, and rendering strategies.
  </commentary>
  </example>
  
  <example>
  Context: The user is building a new feature and a significant UI chunk has been completed.
  user: "I've just finished building the checkout flow components"
  assistant: "Great! Now let me use the frontend-dev agent to review the checkout flow for responsiveness, accessibility compliance, and performance best practices."
  <commentary>
  After a meaningful UI feature is completed, proactively use the frontend-dev agent to review the code against quality standards before it's considered done.
  </commentary>
  </example>
model: inherit
color: green
memory: project
---

> Thin wrapper - 실제 정의는 `.agent/subagents/dev-team/eng/frontend-dev.md`를 읽으세요.

Read [`.agent/subagents/dev-team/eng/frontend-dev.md`](../../../../.agent/subagents/dev-team/eng/frontend-dev.md) and follow it.
