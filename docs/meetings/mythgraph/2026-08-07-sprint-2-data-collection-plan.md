# Sprint 2 — Seed 데이터 확대 계획

**계획 일자:** 2026-08-07  
**담당:** PM Jordan  
**목표:** 70개 → 120개 entities (+50개)  
**일정:** Day 1-7

---

## 현재 상태

| 항목 | 개수 | 상태 |
|------|------|------|
| Entities | 70 | ✅ (Theoi Project 기반) |
| Events | 42 | ✅ |
| Myths | 14 | ✅ |
| Relationships | ~150 | ✅ |

---

## 확대 전략

### Phase 1 (Day 1-3): 추가 Entity 수집

#### 1-1. Theoi Project 재검토
**목표:** 현재 70개 중 누락된 주요 entities 확인

검토 대상:
- 올림푸스 신: 12명 (기본 + 부가)
- 타이탄/프리티: 15명
- 바다 신 (네레이드 등): 20명
- 명계 관련: 10명
- 영웅: 30명 (헤라클레스, 아르고나우타이 등)

**수집 방법:**
```
1. Theoi.com 카테고리별 탐색
2. 각 항목: name, type, aliases, description, relationships 추출
3. 스프레드시트로 정리 (ID, name, type, description, parentIds, childrenIds)
```

#### 1-2. Perseus Digital Library
**목표:** 고전 원전 기반 추가 entities (20-30개)

특징:
- 그리스 원전 (Homer, Ovid 등) 직접 참조
- 신 및 영웅의 상세 배경 정보
- 관계 메타데이터 풍부

**수집 대상:**
- 영웅 관련 신화 인물
- 지역 신 (로컬 데이티)
- 덜 알려진 신들

**URL:** https://www.perseus.tufts.edu/hopper/

#### 1-3. 로마 신화 확장 (10-15개)
**목표:** 그리스-로마 동등 신 추가

대응 관계:
- Zeus ↔ Jupiter (이미 있음)
- Hera ↔ Juno
- Ares ↔ Mars
- 로마 고유 신: Vesta, Terminus, Janus 등

---

### Phase 2 (Day 4-7): 데이터 정규화 & 검증

#### 2-1. 데이터 스키마 정규화
**필드 구조:**
```json
{
  "id": "deity_zeus_001",
  "name": "Zeus",
  "type": "DEITY",
  "aliases": ["Jupiter", "Dias"],
  "description": "King of gods and men...",
  "domain": ["Thunder", "Sky", "Justice"],
  "romanName": "Jupiter",
  "sourceIds": ["src:homer-iliad", "src:theoi"],
  "relationships": [
    {
      "targetId": "deity_hera_001",
      "type": "SPOUSE",
      "label": "spouse of"
    },
    {
      "targetId": "deity_hades_001",
      "type": "SIBLING",
      "label": "brother of"
    }
  ]
}
```

#### 2-2. 중복 제거 & 관계 검증
**체크리스트:**
- [ ] 동일 entity 중복 확인 (예: Zeus vs Jupiter)
- [ ] 관계 일관성 (A→B 있으면 B←A 확인)
- [ ] 무효 참조 제거 (orphan relationships)
- [ ] 필드 표준화 (공백, 대소문자)

#### 2-3. 품질 검증 (Peer Review)
**기준:**
- 정보 정확도 (학술 문헌 확인)
- 관계 인과성 (신화 로직 일치)
- 데이터 완성도 (필수 필드 모두 채워짐)

**리뷰어:** Blake(BE)

---

## 최종 로드 계획 (Day 7-10)

### Phase 3: Neo4j 로드 & 배포

#### 3-1. CSV 생성
```
scripts/entities.csv (70 → 120)
scripts/relationships.csv (150+ 관계)
```

#### 3-2. 로드 스크립트 생성
```bash
# Cypher 스크립트로 데이터 로드
./scripts/load-seed-data.cypher
```

#### 3-3. 검증 쿼리
```cypher
MATCH (e:Entity) RETURN count(e) as entity_count;
# Expected: 120

MATCH (e:Entity)-[r]-() RETURN count(r) as relationship_count;
# Expected: 250+
```

---

## 성공 신호 (Day 7 기준)

- ✅ Theoi 재검토 완료 (80+ entities 확보)
- ✅ Perseus 추가 수집 (20-30개)
- ✅ 로마 신화 확장 (10-15개)
- ✅ 중복 제거 및 정규화 (총 120개)
- ✅ Peer review 완료
- ✅ Neo4j 로드 성공
- ✅ 벡터 검색 테스트 통과 (신규 entities)

---

## 의존성

- **OQ-8 하이브리드 검색**: 120개 entities가 임베딩 성능에 영향
- **OQ-10 세션 레이아웃**: 데이터 규모 증가 → 레이아웃 성능 기준선 변경
- **QA 테스트**: 새로운 entities 기반 E2E 테스트 필요

---

## 위험 요소 & 완화

| 위험 | 완화 전략 |
|------|----------|
| 데이터 중복 | 자동화 검증 스크립트 작성 |
| 불완전한 관계 | 원전 참고 및 peer review |
| 성능 저하 | 벡터 임베딩 최적화 (Day 4+ Blake 협력) |
| 로드 실패 | 데이터 검증 먼저, 롤백 계획 수립 |

---

*작성: PM Jordan | 검토: Blake(BE) | 최종 승인: Alex(TS)*
