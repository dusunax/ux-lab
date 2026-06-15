---
name: project-empathy-diary-docs
description: ai-empathy-diary의 AI 문서 운영 구조 — prompt-review 버전 관리, baseline-samples 회귀 기준
metadata:
  type: project
---

Sprint 5에서 docs/ai/ 폴더 구조를 새로 만들었다.

파일 구조:
- `docs/ai/prompt-review-v1.md` — 프롬프트 리뷰, 모델 선택 근거, 개선안 포함
- `docs/ai/baseline-samples.md` — 회귀 감지용 기준 샘플 5개

프롬프트 변경 승인 절차:
1. Sage (AI) 초안 + baseline 검증
2. Jordan (PM) 승인
3. Riley (UX) 승인
4. Avery (FE) index.html SYSTEM_PROMPT 상수 교체 및 배포

버전 관리: 파일명 suffix 방식 (prompt-review-v2.md 등)

**Why:** 프롬프트는 사용자 대면 응답에 직접 영향을 주므로 코드 변경과 동일한 리뷰 절차를 적용하기로 결정.

**How to apply:** 새 프롬프트 작업 시 항상 새 버전 파일 생성. baseline-samples.md에 샘플 추가 후 회귀 체크.
