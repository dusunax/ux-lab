# Security Rules

## Secrets (CRITICAL)

Never hardcode secrets:

```typescript
// NEVER
const apiKey = "sk-proj-xxxxx"

// ALWAYS
const apiKey = process.env.API_KEY
if (!apiKey) throw new Error('API_KEY not configured')
```

## Before Every Commit

- [ ] No hardcoded API keys, passwords, tokens
- [ ] No .env files committed
- [ ] User inputs validated (zod recommended)
- [ ] SQL/NoSQL queries parameterized
- [ ] HTML outputs sanitized (XSS prevention)
- [ ] Error messages don't expose internals

## Input Validation

```typescript
// Recommended: Use validation library like zod
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  amount: z.number().positive()
})

const data = schema.parse(userInput)

// Alternative: Manual validation
if (!email || !email.includes('@')) {
  throw new Error('Invalid email')
}
```

## If Security Issue Found

1. STOP immediately
2. Fix before continuing
3. Rotate any exposed secrets
4. Check for similar issues elsewhere
