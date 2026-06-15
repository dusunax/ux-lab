---
name: project-empathy-diary-prompts
description: ai-empathy-diary 앱의 시스템 프롬프트 구조, 감정 카테고리, 모델 fallback 설계 요약
metadata:
  type: project
---

ai-empathy-diary의 SYSTEM_PROMPT는 index.html 내 JS 상수로 정의되어 있다 (line ~1282).

핵심 설계:
- 13개 감정 카테고리: 기쁨/설렘/뿌듯함/슬픔/외로움/스트레스/분노/억울함/불안/혼란/피로/무기력함/평온
- 출력 형식: JSON 두 키만 (`emotion`, `empathy`)
- empathy 제약: 한국어, 150자 이하, 조언 금지
- few-shot 예시: 1개 (스트레스) — 편향 개선 필요

모델 fallback (api/chat.js FALLBACKS, 모두 :free tier):
1. openai/gpt-oss-120b:free (1순위 — 한국어 품질)
2. meta-llama/llama-3.3-70b-instruct:free
3. nvidia/nemotron-3-super-120b-a12b:free
4. openai/gpt-oss-20b:free
5. qwen/qwen3-next-80b-a3b-instruct:free (한중일 특화)
6. minimax/minimax-m2.5:free (최후 보루)

fallback 트리거: HTTP 429 또는 5xx

**Why:** 비용 제로 운영을 위해 free tier만 사용. 여러 provider 분산으로 동시 rate limit 위험 감소.

**How to apply:** 프롬프트 변경 전 prompt-review-vN.md 작성 필수. Qwen 모델 순서 상향이나 DeepSeek 추가를 검토할 때는 baseline-samples.md 회귀 결과를 먼저 확인.
