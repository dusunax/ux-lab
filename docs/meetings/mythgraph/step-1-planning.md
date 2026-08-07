# Step 1 진행 계획서

**기간:** 2026-08-07 (당일)  
**목표:** Aura 환경 구성 + 4개 OQ 최종 협의 & 확정  
**총 소요시간:** 4-5시간  

---

## 📋 Step 1 액션 아이템 (우선순위별)

### Phase 1: 기술 확인 (P0, 1시간 30분)

| # | 액션 | 담당 | 예상 | 체크 | 산출물 |
|----|------|------|------|------|--------|
| 1 | **Aura 무료 평가판 제약 확인** | Blake | 30분 | [ ] | 2개 동시 생성 가능 여부 확인 |
| 2 | **Dev/Prod Aura 인스턴스 생성** | Blake | 30분 | [ ] | 2개 독립 인스턴스 URL + 자격증명 |
| 3 | 환경변수 3단계 분리 설정 시작 | Blake | 30분 | [ ] | .env 파일 템플릿 생성 |

**Go/No-Go 게이트:** Aura 인스턴스 2개 생성 완료 필수

---

### Phase 2: 제품 검토 (P0, 1시간)

| # | 액션 | 담당 | 예상 | 체크 | 산출물 |
|----|------|------|------|------|--------|
| 4 | **Seed 구조 최종 검토** (Myth/Event 포함) | Jordan | 1시간 | [ ] | OQ-2 최종 확정 |
| 5 | Myth 기준 문헌 선정 | Jordan | (병렬) | [ ] | Homer, Ovid, Diodorus 등 확정 |

---

### Phase 3: 팀 협의 (P0, 1시간 30분)

| # | 액션 | 담당 | 예상 | 체크 | 산출물 |
|----|------|------|------|------|--------|
| 6 | **4개 OQ 신속 협의 회의** | Team | 1시간 | [ ] | 최종 결정 기록 |
| 7 | 결정사항 문서 업데이트 | Alex(TS) | 30분 | [ ] | 회의록 갱신 |

---

## 🎯 각 액션 상세 가이드

### 1️⃣ Aura 무료 평가판 제약 확인 (Blake, 30분)

**하는 일:**
- neo4j.com 계정 접속 (또는 생성)
- AuraDB Free tier 선택
- **2개 인스턴스 동시 생성 시도**

**확인 사항:**
```
✅ 가능한가?
  → Yes: 전략 A (완전 분리) 확정
  → No: 전략 B (논리적 분리) 재검토

📊 인스턴스별 제약
  └─ 저장소 (Node 한계)
  └─ 연결 수 (동시 접속)
  └─ Rate limit (req/min)
  └─ 유효 기간 (자동 삭제 정책)
```

**예상 결과:** ✅ **2개 동시 생성 가능 (이미 검증됨)**

---

### 2️⃣ Dev/Prod Aura 인스턴스 생성 (Blake, 30분)

**순서:**
```
Step 1a: Dev 인스턴스 생성
├─ 이름: "MythGraph-Dev"
├─ 지역: 최근접 (Asia 권장)
└─ 기다려서 URI/Auth 받기 (~2-3분)

Step 1b: Prod 인스턴스 생성 (같은 계정)
├─ 이름: "MythGraph-Prod"
├─ 지역: 동일
└─ URI/Auth 받기

Step 1c: 정보 기록
├─ Dev URI, User, Password 메모
├─ Prod URI, User, Password 메모
└─ 1Password 또는 secure location에 저장
```

**산출물:**
```
Dev Instance:
  URI: neo4j+s://dev_xxxxx.databases.neo4j.io
  User: neo4j
  Password: xxxxxxxx

Prod Instance:
  URI: neo4j+s://prod_yyyyy.databases.neo4j.io
  User: neo4j
  Password: xxxxxxxx
```

---

### 3️⃣ 환경변수 3단계 분리 (Blake, 30분)

**생성할 파일들:**

**`.env.local` (로컬 개발)**
```env
# Neo4j Local (Docker)
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=dev_password_123

# 기타 개발용 변수
NODE_ENV=development
```

**`.env.development` (Vercel Preview)**
```env
# Neo4j Aura Dev
NEO4J_URI=neo4j+s://dev_xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=${AURA_DEV_PASSWORD}  # Secret vault

NODE_ENV=development
```

**`.env.production` (Vercel Production)**
```env
# Neo4j Aura Prod
NEO4J_URI=neo4j+s://prod_yyyyy.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=${AURA_PROD_PASSWORD}  # Secret vault

NODE_ENV=production
```

**`.env.example` (공개 템플릿)**
```env
# Local development
# NEO4J_URI=neo4j://localhost:7687
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=xxxx

# Or Aura dev/prod
# NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=xxxx
```

**Vercel Secrets 설정 (별도, Step 2):**
```bash
vercel secrets add AURA_DEV_PASSWORD <dev_password>
vercel secrets add AURA_PROD_PASSWORD <prod_password>
```

---

### 4️⃣ Seed 구조 최종 검토 (Jordan, 1시간)

**검토 항목:**

**A. Entity 50-80개 확정**
```
Deity (신):
  ├─ Olympian 12명
  ├─ Chthonic 신 5명
  └─ Minor deities 10명

Human (인물):
  ├─ Heroes 15명
  └─ Mortals 20명

Monster (괴물):
  ├─ 10종

Place (장소):
  └─ 10개
```

**B. Myth 10-15개 확정 (OQ-2 의존)**
```
[ ] Trojan War
[ ] Heracles' Labors
[ ] Odyssey
[ ] Perseus and Medusa
[ ] Minotaur and Labyrinth
... (10-15개 최종 선정)
```

**C. Event 15-25개 설계 (OQ-2 의존)**
```
Trojan War 관련:
  ├─ Paris Abducts Helen
  ├─ Greeks Sail to Troy
  ├─ Wooden Horse
  └─ Troy Falls

Heracles 관련:
  ├─ Lion of Nemea
  ├─ Hydra of Lerna
  └─ ... (12개 labors)
```

**D. 기준 문헌 확정**
```
Primary Sources:
  [ ] Homer - Iliad, Odyssey
  [ ] Ovid - Metamorphoses
  [ ] Hesiod - Theogony, Works and Days
  [ ] Diodorus Siculus - Library of History
  [ ] Apollodorus - Library
```

**산출물:** Seed 데이터 구조 확정 문서

---

### 5️⃣ 4개 OQ 신속 협의 회의 (Team, 1시간)

**참석:** Jordan(PM), Blake(BE), Avery(FE), Alex(TS)  
**목적:** 4개 OQ 최종 확정 및 이상 없음 확인

**안건:**

**안건 1: OQ-1 (Entity 라벨)** — 10분
```
✅ 권장: 공통 Entity + 보조 라벨
┗ 이의 있는가? [ ] 있음 [ ] 없음
```

**안건 2: OQ-2 (Myth/Event)** — 15분
```
✅ 권장: 별도 노드 생성 (P0 필수)
┗ Seed 구조 최종 확정? [ ] YES [ ] 재검토
┗ 기한: Step 2-3 내 완료 동의? [ ] YES
```

**안건 3: OQ-3 (벡터 임베딩)** — 5분
```
✅ 권장: 결정 유보 (Sprint 3)
┗ 인터페이스 설계만 Step 1-2에서? [ ] YES
```

**안건 4: OQ-5 (Neo4j 분리)** — 15분
```
✅ 권장: dev/prod 완전 분리 (P0 필수)
┗ Aura 2개 인스턴스 생성 완료? [ ] YES
┗ CI/CD 파이프라인 설정 일정? Step 3-4 동의? [ ] YES
```

**체크:**
```
[ ] 4개 OQ 모두 이의 없음
[ ] Step 2-8 일정 합의
[ ] 의존성 명확함 (OQ-2, OQ-5 P0)
```

**산출물:** 회의록 (docs/meetings/mythgraph/step-1-meeting-notes.md)

---

### 6️⃣ 결정사항 문서 업데이트 (Alex, 30분)

**갱신:**
- Step 1 회의 시각, 참석자, 최종 확정사항 기록
- 각 OQ별 이의 사항 있으면 기록
- 다음 Step 2 일정 확정

---

## ⏰ Step 1 타임라인

```
Step 1 시작 (2026-08-07 오전)
│
├─ 09:00 ~ 09:30  Phase 1-1: Aura 제약 확인 (Blake)
├─ 09:30 ~ 10:00  Phase 1-2: Aura 인스턴스 생성 (Blake)
├─ 10:00 ~ 10:30  Phase 1-3: 환경변수 분리 (Blake)
│                   + Phase 2: Seed 검토 병렬 (Jordan)
│
├─ 10:30 ~ 12:00  Phase 3: 팀 협의 회의 (1시간)
│                   + 결정사항 문서 업데이트 (30분)
│
└─ 12:00          Step 1 완료 ✅
   다음 Step 2 시작 (Schema 설계, Seed 수집)
```

**예상 소요:** 4-5시간 (병렬 작업 고려)

---

## 🚨 Critical Path (변경 불가)

```
OQ-2 (Myth/Event) — P0
  ├─ 지금 미결정 → Step 4-5 일정 +2일
  ├─ 나중 변경 → Sprint 3 연기 (1주)
  └─ ⚠️ 반드시 Step 1 확정 필수

OQ-5 (Neo4j 분리) — P0
  ├─ 지금 미설정 → 나중 마이그레이션 1주 소요
  └─ ⚠️ 반드시 Step 1 확정 필수
```

**결론:** OQ-2, OQ-5는 **Step 1 내 반드시 확정**

---

## 📝 Step 1 체크리스트

### Phase 1 (기술)
- [ ] Aura 계정 접속
- [ ] 무료 평가판 2개 인스턴스 동시 생성 테스트
- [ ] Dev 인스턴스 생성 완료 (URI + Auth 저장)
- [ ] Prod 인스턴스 생성 완료 (URI + Auth 저장)
- [ ] `.env.local`, `.env.development`, `.env.production` 생성
- [ ] `.env.example` 생성 (공개 가능)

### Phase 2 (제품)
- [ ] Entity 50-80개 최종 확정 (목록화)
- [ ] Myth 10-15개 최종 선정 (OQ-2 의존)
- [ ] Event 15-25개 구조 설계 (OQ-2 의존)
- [ ] 기준 문헌 5개 선정 (Homer, Ovid, Hesiod, Diodorus, Apollodorus)

### Phase 3 (팀)
- [ ] 회의 개최 (1시간)
- [ ] OQ-1 최종 확정
- [ ] OQ-2 최종 확정 ⚠️ P0
- [ ] OQ-3 유보 확정
- [ ] OQ-5 최종 확정 ⚠️ P0
- [ ] Step 2-8 일정 합의
- [ ] 회의록 작성

### 결과
- [ ] Step 1 완료 → Step 2 준비 시작

---

## 🎯 Step 1 성공 기준

| 항목 | 기준 | 상태 |
|------|------|------|
| **Aura 환경** | 2개 독립 인스턴스 생성 | [ ] |
| **환경변수** | 3단계 분리 설정 | [ ] |
| **제품 결정** | OQ-1, 2, 3, 5 확정 | [ ] |
| **팀 동의** | 모든 이해관계자 합의 | [ ] |
| **문서화** | Step 1 회의록 작성 | [ ] |

**Step 1 Pass/Fail:** Go/No-Go

---

## 📌 주의사항

1. **OQ-2, OQ-5 (P0):** 반드시 Step 1 내 확정 필수
2. **Aura 자격증명:** 안전한 위치에 저장 (1Password, env files)
3. **병렬 작업:** Jordan(Seed 검토)와 Blake(Aura 구성) 동시 진행
4. **의사결정:** 회의록에 최종 확정 기록 (향후 추적용)

---

*Step 1 계획서 작성: TS Alex | 시작일: 2026-08-07*
