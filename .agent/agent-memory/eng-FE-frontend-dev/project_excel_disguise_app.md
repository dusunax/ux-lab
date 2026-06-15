---
name: Excel-disguise AI diary app
description: ai-empathy-diary is a pure HTML/CSS/JS app disguised as Excel for office use — design tension is intentional (industrial shell, warm content)
type: project
---

The `apps/ai-empathy-diary/index.html` app (single-file, no dependencies) mimics Excel/Google Sheets chrome exactly: title bar, menu bar, ribbon tabs, toolbar, formula bar (name box + fx input), column headers, row numbers, sheet tabs, status bar.

**Why:** The conceit is a "safe to open at work" diary — looks like a spreadsheet, is actually an AI empathy journal. The intentional contrast between industrial/utilitarian UI and warm/serif cell content is the core design statement.

**How to apply:** If extending this app, preserve the Excel chrome fidelity. The formula bar input IS the diary entry input. All real interactivity is in the formula bar and the sheet body rows. The ribbon/toolbar/menus are purely decorative.

Key technical details:
- Uses `Consolas`/`Courier New` monospace for all chrome UI, `Georgia` serif for cell content
- Emotion tints applied as row `background-color` via CSS class (tint-joy, tint-sad, tint-stress, tint-anxiety, tint-tired, tint-calm)
- Emotion badges use separate bg/text color pairs per emotion category
- `rowSlideIn` CSS animation on new row insertion
- localStorage key: `ai-diary-entries`, format: `[{id, date, text, emotion, empathy}]`
- `_loading: true` flag on entry while API call is in flight; removed on completion
- Error recovery: failed entries removed from list, input text restored
- API: POST to `http://localhost:3035/api/chat` (openrouter-proxy), model `deepseek/deepseek-chat`
