# Performance Rules

## React/Next.js

### Avoid Unnecessary Re-renders

```typescript
import { memo, useCallback, useMemo } from 'react'

// Use memo for expensive components
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />)
})

// Use useCallback for handlers passed to children
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// Use useMemo for expensive calculations
const sorted = useMemo(() =>
  items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
)
```

### Images

- Use `next/image` for automatic optimization
- Specify `width` and `height` to prevent layout shift
- Use `priority` for above-the-fold images
- Use appropriate formats (WebP, AVIF)

### Data Fetching

- Fetch at the page level, not component level
- Use React Server Components when possible
- Implement proper caching strategies
- Avoid waterfalls (parallel fetches)

## Algorithm Complexity

- Prefer O(n) or O(n log n) over O(n²)
- Use Map/Set for lookups instead of array.find()
- Paginate large lists (don't render 1000+ items)

## Bundle Size

- Dynamic import for heavy components
- Analyze with `next build --analyze`
- Tree-shake unused exports
- Lazy load below-the-fold content

```typescript
import dynamic from 'next/dynamic'

// Dynamic import
const HeavyChart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton />
})
```

## Checklist

- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Large lists virtualized or paginated
- [ ] Heavy components lazy loaded
- [ ] No O(n²) in hot paths
