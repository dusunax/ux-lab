# Coding Style

## Immutability

Always create new objects, never mutate:

```typescript
// WRONG
user.name = newName
array.push(item)

// CORRECT
const updated = { ...user, name: newName }
const newArray = [...array, item]
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
- Files: `kebab-case.ts` or `PascalCase.tsx`

## Before Completion

- [ ] No console.log (except errors)
- [ ] No TODO without ticket/issue
- [ ] No magic numbers
- [ ] Error handling in place
- [ ] Types defined (no `any`)
