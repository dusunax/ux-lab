---
name: eng/PERF/perf-optimizer
description: |-
  Use this agent when you need to identify and resolve performance bottlenecks, optimize application speed, reduce bundle size, improve rendering efficiency, or conduct a performance audit on recently written or modified code. Ideal after implementing new features, refactoring components, or when users report slowness.
  
  <example>
  Context: The user just implemented a large data table component with filtering and sorting.
  user: "I've finished the DataTable component with 500+ rows, sorting, and filtering."
  assistant: "Great! Let me launch the performance optimizer to audit the component for potential bottlenecks."
  <commentary>
  A complex data-heavy component was just written. Use the Agent tool to launch the perf-optimizer agent to review rendering efficiency, memoization, and algorithm complexity.
  </commentary>
  assistant: "I'll use the perf-optimizer agent to review this for performance issues before we ship it."
  </example>
  
  <example>
  Context: The user is experiencing slow page loads after adding several new dependencies.
  user: "The dashboard page feels sluggish now. I added recharts and a date picker library recently."
  assistant: "I'll use the perf-optimizer agent to investigate the bundle impact and rendering performance."
  <commentary>
  Bundle size regression and potential unnecessary re-renders after adding libraries. Launch the perf-optimizer agent to identify the root cause.
  </commentary>
  </example>
  
  <example>
  Context: The user just wrote a search/filter function over a large dataset.
  user: "Here's my search function that filters products by multiple criteria."
  assistant: "Let me have the perf-optimizer agent check the algorithm complexity and suggest improvements."
  <commentary>
  Search/filter logic over datasets can easily become O(n²). Use the perf-optimizer agent proactively.
  </commentary>
  </example>
model: opus
color: green
memory: project
---

> Thin wrapper - 실제 정의는 `.agent/subagents/dev-team/eng/perf-optimizer.md`를 읽으세요.

Read [`.agent/subagents/dev-team/eng/perf-optimizer.md`](../../../../.agent/subagents/dev-team/eng/perf-optimizer.md) and follow it.
