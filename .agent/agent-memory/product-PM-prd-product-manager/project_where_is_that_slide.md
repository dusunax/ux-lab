---
name: where-is-that-slide
description: Where Is That Slide 프로젝트 현황 — AI 기반 Google Drive 문서 자연어 검색 서비스, PRD v0.1 및 Sprint 1 스코프
metadata:
  type: project
---

Where Is That Slide는 Google Drive 사내 발표자료(PDF/PPT)를 AI가 이해하여 자연어로 검색하고, 슬라이드 단위까지 짚어주는 서비스다. PRD v0.1 작성 완료 (2026-06-29).

**Why:** 사내 문서가 Drive에 분산 저장되어 있으나, 파일명 없이는 검색 불가. "OCR 발표 어디 있었지?" 같은 반복적 문의를 5초 내 해결이 목표.

**How to apply:** 이 프로젝트의 기술 결정, 스코프 논의, OQ 처리 결과를 이 메모리에 계속 업데이트한다.

## 확정 기술 스택

- Frontend: React + TypeScript, 배포: Vercel
- Backend: FastAPI (Python), 배포: Railway 또는 Render (미확정, OQ-4)
- AI — Embedding: OpenAI `text-embedding-3-small`
- AI — 요약: OpenAI Responses API (`gpt-4o-mini`)
- Vector DB: ChromaDB (파일 기반 셀프호스팅, OQ-3 미확정)
- 문서 파싱: PyMuPDF (PDF), python-pptx (PPT)
- Auth: Google OAuth 2.0, Google Drive API v3

## Sprint 1 스코프 (2026-06-29 ~ 2026-07-12)

목표: FastAPI + ChromaDB + OpenAI Embedding으로 Google Drive PDF/PPT 자연어 검색 MVP

백로그 주요 항목:
- Google OAuth 연동, Drive API 파일 다운로드
- PDF(PyMuPDF) + PPT(python-pptx) 텍스트 추출
- 페이지/슬라이드 단위 청킹 + 인접 페이지 병합
- OpenAI Embedding 생성 + ChromaDB 저장
- 수동 인덱싱 CLI 스크립트
- /search FastAPI 엔드포인트 + AI 요약
- 연속 청크 페이지 범위 병합 (예: "18~22페이지")
- React 검색 UI (입력창 + 결과 카드)
- 테스트 문서 10개 인덱싱 및 시연 검증

## 미결 Open Questions

| ID | 질문 | 기한 |
|----|------|------|
| OQ-1 | OpenAI API 데이터 전송 IT/법무 검토 | 2026-07-03 |
| OQ-2 | Google Drive 접근 범위 (전사 공유 드라이브 vs 특정 폴더) | 2026-07-03 |
| OQ-3 | ChromaDB 운영 방식 (파일 기반 vs Cloud) | 2026-07-05 |
| OQ-4 | FastAPI 배포 플랫폼 (Railway vs Render vs EC2) | 2026-07-05 |
| OQ-5 | Sprint 2 인덱싱 대상 선정 방식 (자동 스캔 vs 수동 등록) | 2026-07-10 |

## 확정 우선순위 결정

- Sprint 1은 수동 인덱싱 (CLI)으로 MVP 검증. 자동 동기화는 Sprint 2로 이연.
- 이미지 전용 슬라이드 OCR은 P2로 이연, Sprint 1은 텍스트 없는 슬라이드 메타데이터 표기로 대응.
- OQ-1 해결 전까지 민감 문서 대신 사내 공개용 문서(세미나 자료 등)로 파일럿 진행.
