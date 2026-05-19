---
name: ai-empathy-diary-architecture
description: Architecture notes for apps/ai-empathy-diary/index.html — single-file HTML app, known recurring issues
metadata:
  type: project
---

Single-file HTML app (CSS + JS in one `index.html`, ~1938 lines). This is an intentional architectural choice — not a Next.js feature module.

**Known recurring issues found in Sprint 3 Firebase Auth review:**
- `initApp()` re-binds all event listeners on every `onAuthStateChanged` call; guard with a flag or teardown old listeners before re-binding. (Fixed: appInitialized guard now in place as of logging PR)
- Firestore write/delete errors are silently swallowed — no user feedback on failure. (Fixed: showError() calls added)
- `loadEntriesFromFirestore` catch block is completely silent (no `console.error`, no toast). (Fixed)
- `entriesRef()` has no null guard on `currentUser`. (Fixed: explicit throw added)

**Known issues found in Sprint 3 logging review (api/log.js, api/chat.js, index.html):**
- `sanitize()` in log.js strips non-primitive values but does NOT sanitize param keys — a client-supplied key named `"event"` or `"ts"` will silently override those fields in the JSON log line via spread (log.js:37).
- `errorReason()` has three uncovered throw sites: input-too-long (`'입력이 너무 길어요'`), `response.json()` parse failure (`'응답 형식이 올바르지 않아요'`), and non-429/5xx HTTP errors — all return `'unknown'`.
- `crypto.randomUUID()` used as a global in chat.js:53; Node 18 support depends on minor version (added in 18.7). Explicit `import { randomUUID }` is safer.
- Non-429, non-ok upstream responses (e.g. 500, 401) immediately return to client without trying next fallback model — may be intentional for auth errors but not for transient 5xx.

**Known issues found in Sprint 4 (showError refactor, request_id, retry, mobile CSS):**
- `applyAnalysisResult` retry bug: on Firestore save failure, `entry` is removed from `entries`. The retry callback calls `applyAnalysisResult(entry)` again without re-adding the entry to `entries`. On a successful retry save, the entry is written to Firestore but invisible in the UI (not in entryMap, updateRowDOM finds no element). [C-1]
- `logEvent('entry_delete', {})` fires before `deleteEntryFromFirestore` resolves — logs deletion even if the Firestore delete subsequently fails and rolls back. [W-1]
- `showError` dead fallback branch (line ~1520): when `retryLabel` is truthy but `retryCallback` is falsy, the else branch sets `input.value = retryLabel` and calls `handleSubmit()`. No current call site triggers this, but it is a latent bug. [W-2]
- `errorReason()` missing `upstream_exhausted` coverage was fixed this sprint. `request_id` null is safely dropped by sanitize() (not a bug).
- Mobile `!important` on `.excel-window` is intentional — desktop JS `.hidden` toggling is unaffected. Not a bug.

**Why:** App is intentionally single-file for deployment simplicity (Vercel static hosting). No bundler.
**How to apply:** When reviewing this file, watch for event listener accumulation on auth re-fires, silent catch blocks in Firestore functions, and optimistic-delete patterns where rollback state must be restored before retry.
