---
description: 미사용 코드 탐지 및 안전하게 제거. knip, depcheck 사용.
---

# Refactor Clean

Safely identify and remove dead code.

## Steps

1. **Find dead code**
   ```bash
   # Unused exports/files
   npx knip

   # Unused dependencies
   npx depcheck

   # Unused TypeScript exports
   npx ts-prune
   ```

2. **Categorize by risk**
   - SAFE: Unused utilities, test helpers, old components
   - CAUTION: API routes, shared components
   - DANGER: Config files, entry points, providers

3. **Before each deletion**
   - Run tests (if available in workspace): `pnpm --filter <workspace> test`
   - Run build: `pnpm run build:all` or specific workspace build
   - Verify no errors
   - Delete only if safe

4. **Report findings**
   ```
   [SAFE] Unused export: formatDate in utils/date.ts
   [CAUTION] Unused component: OldButton.tsx (check imports)
   [DANGER] Skip: next.config.js (config file)
   ```

## Rules

- Never delete without verifying build passes
- Skip config files and entry points
- Check git history for recent usage
- When in doubt, ask user first

## Output

Summary of:
- Files analyzed
- Dead code found
- Items safely removed
- Items skipped (with reason)
