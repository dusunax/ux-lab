# Coding Style

## Immutability

Prefer immutable patterns for state and props:

```typescript
// Prefer immutable for state/props
const updated = { ...user, name: newName }
const newArray = [...array, item]

// Mutation acceptable for:
// - Local temporary arrays during construction
// - Performance-critical loops
// - Builder patterns
```

## File Size

- Target: 200-400 lines
- Maximum: 800 lines
- Extract when exceeding limits

## Function Size

- Target: < 30 lines
- Maximum: 50 lines
- Single responsibility

## Error Handling

```typescript
try {
  const result = await operation()
  return result
} catch (error) {
  console.error('Context:', error)
  throw new Error('User-friendly message')
}
```

## Naming

- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `camelCase.ts` or `PascalCase.tsx`

## Before Completion

- [ ] No console.log in client-side production code
- [ ] Server-side/dev console.log is acceptable for debugging
- [ ] No TODO without ticket/issue
- [ ] No magic numbers
- [ ] Error handling in place
- [ ] Types defined (no `any`)
