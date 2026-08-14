---
name: mythgraph-sprint1-prd-decisions
description: Sprint 1 4개 즉시 결정사항(OQ-1~4)에 대한 제품 관점 가이드 — 권장 선택, 영향도, 변경 리스크 분석
metadata:
  type: project
---

# MythGraph Sprint 1 — 제품 관점 의사결정 가이드

**문서 작성:** 2026-08-07  
**버전:** 1.0  
**상태:** 승인 대기 (Jordan PM 결정 필요)

## 결정 우선순위 & 권장사항 (한눈에)

| 우선도 | OQ | 결정사항 | 권장선택 | 기한 | 담당 | 변경 리스크 |
|--------|-------|----------|----------|------|------|-----------|
| P0 | OQ-2 | Myth/Event 노드 | A (별도 노드) | Day 1 | Jordan | 높음 (마이그레이션 불가능에 가까움) |
| P0 | OQ-5 | Neo4j 계정 분리 | A (완전 분리) | Day 1 | Blake | 높음 (초기 미분리 시 마이그레이션 복잡) |
| P1 | OQ-1 | Entity 라벨 | A (공통 + 보조라벨) | Day 1 | Blake | 중간 (타 옵션으로 마이그레이션 가능하지만 비용 높음) |
| P2 | OQ-3 | 임베딩 공급자 | 유보 (Sprint 3) | - | Blake | 낮음 (언제든 변경 가능) |

---

## 결정 1: Entity 라벨 전략 (OQ-1)

**권장:** A) 공통 Entity 노드 + 보조 라벨 (`:Deity`, `:Human`, `:Monster`, `:Place`)

**Why:** 
- MVP 단계의 검색/필터링이 가장 직관적
- 향후 새로운 엔티티 유형 추가 가장 간편
- 공통 속성/관계 관리를 중앙화할 수 있음

**How to apply:**
- GraphQL Schema: `type Entity` 기본 타입, 특수 속성은 interface Field로 분리 (예: `Deity { domains: [Domain] }`)
- Neo4j Full-text Index가 복합 라벨 지원하는지 검증 → 성능 영향 측정
- 향후 "유형 계층화" (Entity > Deity > OlympianGod) 필요 시점을 미리 정의

**영향:**
- **단기 (Sprint 1-2):** 검색/필터링 구현 단순. GraphQL Schema 설계 직관적.
- **장기 (Sprint 3+):** 새 유형 추가 용이. 공통 관계 표현이 자연스러움.
- **MVP 성공:** Entity 검색(MG-01) 구현 속도 ↑. 필터 UI 사용성 ↑.

**변경 가능성:** 중간 리스크. B(분리 노드)로 변경은 마이그레이션 어려움.

---

## 결정 2: Myth/Event 노드 포함 여부 (OQ-2)

**권장:** A) 별도 노드 생성 (`Myth` + `Event`)

**Why:**
- 로드맵상 Sprint 2 "Myth 탐색(MG-05)" 필수
- 초기 데이터 모델을 올바르게 구성하지 않으면 마이그레이션 거의 불가능
- 향후 의미 검색(Sprint 3) 신화-중심 임베딩 지원

**How to apply:**
- Seed 데이터: Myth 10-15개, Event 15-25개 미리 정의
- GraphQL Schema: `type Myth { entities: [Entity], events: [Event] }` 등 역방향 관계 처리
- 데이터 검증: Entity-Myth-Event 참조 무결성 자동 체크 스크립트 필수

**영향:**
- **Sprint 1 구현 비용:** PM(Jordan) Seed 데이터 준비 +2-3일
- **Sprint 2 준비:** MG-05 거의 준비됨. Day 2 이후 착수 가능.
- **B에서 A로 마이그레이션 비용:** 엄청남 (데이터 재구성, 1주 일정 소비, Sprint 2 지연 위험)

**변경 가능성:** 높음 리스크. 초기에 반드시 결정해야 함.

---

## 결정 3: 벡터 임베딩 공급자 (OQ-3)

**권장:** 결정 유보 (Sprint 3 도입 시점에 선택)

**Why:**
- 벡터 임베딩은 Sprint 2-3 "의미 검색(MG-06)"에만 필요
- Sprint 1-2에서는 keyword 기반 검색으로 충분
- 현재 결정은 불필요한 조기 의사결정 → 정보 부족

**조건부 권장 (Sprint 3 시점):**
- **B) DeepSeek:** 비용 절감($50-100/월) + 양호한 품질(80-90%) = 가장 실용적
- **A) OpenAI:** 예산 충분 + 최고 품질 우선 → 선택
- **C) 로컬:** R&D 목적 + 데이터 프라이버시 우선 → 선택

**How to apply:**
- "Embedding Service" 추상화 interface 설계 (향후 공급자 변경 용이)
- 각 Entity/Myth에 대한 "Knowledge Chunk" (임베딩 대상 텍스트) 미리 정의 → Sprint 3 도입 시 즉시 활용
- Sprint 2 말 또는 Sprint 3 초에 재평가

**변경 가능성:** 낮음 리스크. 언제든 변경 가능.

---

## 결정 4: Neo4j 계정 분리 (OQ-5)

**권장:** A) 계정 완전 분리 (별도 Aura 인스턴스: dev + prod)

**Why:**
- 프로덕션 안정성이 초기 비용 절감보다 중요
- Vercel 배포 이후 서비스 중단 리스크 최소화
- 초기부터 분리하지 않으면 C → A 마이그레이션이 매우 복잡

**How to apply:**
- Aura 무료 평가판 제약 확인 (하나만 생성 가능한가?) → 제약 있으면 B(DB 분리)로 조정
- 개발 환경 3단계: local Neo4j (Docker) + Aura dev + Aura prod
- 환경변수 분리: `.env.local`, `.env.development`, `.env.production`
- CI/CD 파이프라인: 각 환경이 올바른 DB를 타겟하도록 명확히

**영향:**
- **Sprint 1 (평가판 기간):** Aura 두 인스턴스 생성. 비용 $0. (무료 제약 확인 필수)
- **Sprint 2+ (결제 전환):** 월 비용 2배. 하지만 prod 안정성 보장.
- **C → A 마이그레이션:** 데이터 분할, 자격증명 전환, 배포 파이프라인 재구성. 비용 매우 높음.

**변경 가능성:** 높음 리스크. 초기에 반드시 올바르게 결정해야 함.

---

## Sprint 1 Day 1 킥오프 액션 아이템

| 담당 | 액션 | 예상 시간 | 산출물 |
|------|------|---------|--------|
| Blake (BE) | Aura 무료 평가판 제약 확인 (A vs B) | 30분 | OQ-5 최종 결정 |
| Blake (BE) | 1-3 결정사항 검토 → 기술 제약 확인 | 1시간 | 기술 검증 의견 |
| Jordan (PM) | Seed 데이터셋 Myth/Event 구조 검토 | 1시간 | OQ-2 최종 결정 |
| Jordan (PM) | Seed 데이터 준비 일정 재평가 (A 선택 시 +2-3일) | 30분 | 일정 조정안 |
| Team | 4개 OQ 신속 협의 회의 | 1.5시간 | 최종 결정 기록 |

---

## 관련 링크

- [[project_mythgraph]] — Sprint 1 플랜 전체
- 킥오프 문서: `docs/meetings/mythgraph/2026-08-07-sprint-1-mythgraph-kickoff.md`
