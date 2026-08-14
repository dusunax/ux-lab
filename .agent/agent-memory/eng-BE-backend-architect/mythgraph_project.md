---
name: mythgraph_project_context
description: MythGraph 프로젝트 현황, Sprint 2 목표, 기술 스택 (Neo4j+GraphQL+Next.js)
type: project
---

# MythGraph 프로젝트

**프로젝트 개요:**
그리스·로마 신화 지식그래프 시스템. 신화 entity 간 관계를 Neo4j에서 관리하고 GraphQL Yoga를 통해 API 제공.

**현황 (2026-08-07):**
- Spring 1 완료: 70개 entity, 기본 검색 (전문), 1단계 그래프 구현
- 스택: Next.js, GraphQL Yoga, Neo4j Aura

**Sprint 2 목표 (진행 중):**
1. 의미론적 검색 (벡터 임베딩 기반)
2. 최단 경로 알고리즘 고도화 (의미론적 거리)
3. 데이터 안정성 강화

**주요 제약 조건:**
- 벡터 임베딩 비용: 월 $50-300
- 응답시간 SLA: 의미론적 검색 <1.5초, 경로 탐색 <2초
- 한국어 지원 필수 (신화 한글 entity 명칭)

**확정된 기술 선택:**
- OQ-6: **OpenAI text-embedding-3-small** (2026-08-07 권장)
- OQ-7: **Dijkstra 알고리즘** (Neo4j GDS, 2026-08-07 권장)

**구현 계획:**
- Phase 1 (주 1-2): OpenAI 임베딩 + Redis 캐시
- Phase 2 (주 2-3): Dijkstra 경로 탐색 통합
- Phase 3 (주 3-4): 통합 테스트 및 성능 튜닝

**기술 결정 근거:**
- OpenAI: 한글 지원 우수, 안정성 입증, 커뮤니티 풍부
- Dijkstra: 가중치 지원, Neo4j GDS 네이티브, Cypher 간결 구현

**다음 단계:**
1. OQ-6, OQ-7 최종 승인 미팅
2. 기술 검증 문서 검토 (https://claude.ai/code/artifact/c0559798-84b1-4de8-b900-194a946a5f85)
3. Phase 1 개발 착수

**Why:** Sprint 2에서 의미론적 검색과 관계 탐색이 핵심 기능. 기술 선택이 비용/성능/품질을 좌우함.

**How to apply:** 향후 MythGraph 개발/최적화 시 이 스택과 제약 조건을 기준으로 판단.
