---
name: eng/BE/backend-architect
description: |-
  Use this agent when you need to design server architecture, develop APIs, handle data processing, integrate external services, or optimize backend security and performance. This agent is ideal for tasks involving scalable and stable backend system construction.
  
  <example>
  Context: The user needs a REST API endpoint for user authentication.
  user: "Create a JWT-based login API endpoint"
  assistant: "I'll use the backend-architect agent to design and implement the JWT authentication endpoint."
  <commentary>
  Since this involves API development and security implementation, launch the backend-architect agent to handle the implementation with proper security practices.
  </commentary>
  </example>
  
  <example>
  Context: The user is integrating a third-party payment service into the backend.
  user: "Integrate Stripe payment processing into our checkout flow"
  assistant: "I'll launch the backend-architect agent to handle the Stripe integration with proper error handling and webhook verification."
  <commentary>
  External service integration with security considerations warrants the backend-architect agent.
  </commentary>
  </example>
  
  <example>
  Context: The user wants to optimize slow database queries causing performance issues.
  user: "Our user list endpoint takes 3 seconds to respond. Can you fix this?"
  assistant: "Let me use the backend-architect agent to diagnose the performance bottleneck and implement optimizations."
  <commentary>
  Performance optimization of server-side logic is a core responsibility of the backend-architect agent.
  </commentary>
  </example>
  
  <example>
  Context: The user is designing a microservices architecture for a new feature.
  user: "Design the service architecture for our notification system"
  assistant: "I'll invoke the backend-architect agent to design a scalable notification service architecture."
  <commentary>
  Server architecture design is a primary function of the backend-architect agent.
  </commentary>
  </example>
model: inherit
color: blue
memory: project
---

> Thin wrapper - 실제 정의는 `.agent/subagents/dev-team/eng/backend-architect.md`를 읽으세요.

Read [`.agent/subagents/dev-team/eng/backend-architect.md`](../../../../.agent/subagents/dev-team/eng/backend-architect.md) and follow it.
