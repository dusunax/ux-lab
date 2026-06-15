---
description: 커밋 전 코드 품질 및 보안 검토. 변경된 파일 분석.
---

# Code Review

Review uncommitted changes for quality and security.

## Steps

1. Run `git diff --name-only HEAD` to get changed files
2. Read each changed file
3. Check against criteria below
4. Report findings by severity

## Security (CRITICAL)

- Hardcoded credentials, API keys
- SQL injection (string concatenation in queries)
- XSS (unescaped user input in HTML)
- Missing input validation
- Exposed sensitive data in errors

## Quality (HIGH)

- Functions > 50 lines
- Files > 800 lines
- Nesting > 4 levels deep
- Missing error handling
- console.log statements
- Mutation instead of immutability

## Report Format

```
[CRITICAL] Issue title
File: path/to/file.ts:42
Problem: Description
Fix: How to resolve
```

## Decision

- ✅ Approve: No CRITICAL/HIGH issues
- ❌ Block: CRITICAL or HIGH issues found
