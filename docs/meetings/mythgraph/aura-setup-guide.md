# Neo4j Aura DB 생성 가이드

**목표:** MythGraph용 Cloud Staging 인스턴스 1개 생성  
**예상 소요:** 10분  
**필수 준비:** 이메일 주소, 웹 브라우저

---

## 📋 개요: 3단계 환경 전략

| 환경 | 용도 | 구성 | 자격증명 |
|------|------|------|---------|
| **Local** | 로컬 개발 | Docker Neo4j (localhost:7687) | 제약 없음 |
| **Aura Cloud** | Staging/Preview | Aura Free (1개) | cloud_password |
| **Prod** | 운영 (나중) | Aura Professional (추후 추가) | - |

**현재 단계:** Aura Free 1개만 생성 (비용·관리 효율성)

---

## 💡 왜 1개 인스턴스만 필요한가?

```
현재 단계 (Sprint 1-2):
├─ Local: Docker Neo4j (localhost:7687)
│  └─ 개발/테스트 용도 (제약 없음, 빠름)
│
└─ Cloud: Aura Free 1개
   └─ Staging/Preview 배포용 (Vercel preview)

향후 필요 시:
└─ 두 번째 인스턴스 추가 (Aura Professional)
   └─ 운영 환경 분리 (Spring 3+)

비용 절감:
└─ 현재: $0 (Free tier만)
└─ 추후: $65.70/월 (Professional 추가 시)
```

---

## 🚀 Step-by-Step 가이드

### **1단계: Neo4j 홈페이지 접속**

1. 브라우저에서 **https://neo4j.com** 접속
2. 우측 상단 **"Sign In"** 클릭
   - 계정이 없으면 **"Sign Up"** 선택

---

### **2단계: 계정 생성 (처음 사용자)**

**회원가입 폼:**
```
Email:          [your-email@example.com]
Password:       [secure-password-8chars+]
Confirm:        [repeat-password]
Terms:          ☑️ I agree to terms
Newsletter:     ☑️ (선택사항)
```

- **제출** → 이메일 확인 링크 수신
- 이메일의 "Verify Email" 클릭
- 자동으로 대시보드로 이동

**또는 기존 계정 로그인:**
```
Email:          [your-email]
Password:       [password]
[Sign In]
```

---

### **3단계: Aura DB 콘솔 접속**

대시보드에서:
1. 좌측 사이드바 **"Products"** → **"Aura DB"** 클릭
2. 또는 상단 **"AuraDB"** 메뉴 선택
3. **Aura DB Console**로 이동

**현재 상태:**
```
┌─ Aura DB Console ─┐
│                   │
│ No instances      │
│                   │
│ [+ Create]        │
└───────────────────┘
```

---

### **4단계: Aura Cloud 인스턴스 생성 (1개)**

#### 4-1. 인스턴스 생성 시작

**"+ Create instance"** (또는 **"New instance"**) 버튼 클릭

```
┌──────────────────────────────────┐
│ Create instance                  │
├──────────────────────────────────┤
│                                  │
│ Instance name: [MythGraph-Cloud] │
│                                  │
│ Type: ⊙ Free (selected)          │
│       ⊙ Professional             │
│       ⊙ Enterprise               │
│                                  │
│ Region: [Asia Pacific (Tokyo)]   │
│         (최근접 지역 선택)        │
│                                  │
│ Password: [auto-generated]       │
│           (또는 수동 입력)        │
│                                  │
│ [Create]  [Cancel]               │
└──────────────────────────────────┘
```

#### 4-2. 설정값

**필수 입력:**
- **Instance name:** `MythGraph-Cloud` (또는 `MythGraph-Staging`)
- **Type:** `Free` (선택됨)
- **Region:** `Asia Pacific - Tokyo` (아시아 권장)
- **Password:** 자동 생성 또는 수동 설정
  - 예: `MythGraph@Cloud2026!`
  - ⚠️ 안전한 곳에 저장할 것!

#### 4-3. 생성 확인

**[Create] 클릭** → 처리 중 (2-3분)

```
┌────────────────────────────────────┐
│ Creating MythGraph-Cloud...        │
│                                    │
│ █████████░░░░░░░░░░░  50%         │
│ (Provisioning instance)            │
│                                    │
│ Please wait...                     │
└────────────────────────────────────┘
```

**완료 후:**
```
┌──────────────────────────────────────────┐
│ ✅ MythGraph-Cloud                       │
├──────────────────────────────────────────┤
│ Status:      ✓ Running                   │
│ URI:         neo4j+s://abc123.db...      │
│ User:        neo4j                       │
│ Password:    ••••••••                    │
│ Created:     2026-08-07                  │
│                                          │
│ [Connect] [Download] [Manage] [Delete]   │
└──────────────────────────────────────────┘
```

#### 4-4. 자격증명 저장

**화면에 표시되는 정보:**

```
Connection Details:
────────────────────────────────────

Connection URI:
neo4j+s://abc12345xyz.databases.neo4j.io

Username:
neo4j

Password:
[Show/Hide] ••••••••••••••••••

Hostname:
abc12345xyz.databases.neo4j.io

Port:
7687
```

**저장 방법:**
```
📝 1Password 또는 안전한 위치에 저장:

Cloud Instance:
  Name: MythGraph-Cloud
  URI: neo4j+s://abc12345xyz.databases.neo4j.io
  User: neo4j
  Password: [자동생성된 비밀번호]
```

---

### **5단계: 로컬 개발 환경 준비 (Docker)**

**로컬에서는 Docker Neo4j 사용:**

```bash
# Docker 설치 후
docker run \
  --name mythgraph-local \
  -p 7687:7687 \
  -p 7474:7474 \
  -e NEO4J_AUTH=neo4j/dev_password_123 \
  neo4j:latest
```

**3가지 환경 요약:**
```
Local (Docker):
  URI:      neo4j://localhost:7687
  User:     neo4j
  Password: dev_password_123
  용도:     개발/테스트 (제약 없음)

Cloud (Aura Free):
  URI:      neo4j+s://abc12345xyz.databases.neo4j.io
  User:     neo4j
  Password: [cloud_password]
  용도:     Preview 배포 (Vercel preview)

Prod (나중):
  추가 예정 (Sprint 3+)
  비용:     $65.70/월 (Professional)
```

---

## 📋 자격증명 최종 정리

**아래 정보를 안전한 위치에 저장 (1Password, Vault, 등):**

```
=== MythGraph Neo4j Environments ===

Local (Docker):
  URI:      neo4j://localhost:7687
  User:     neo4j
  Password: dev_password_123
  상태:     개발 시 docker run으로 시작
  용도:     로컬 개발/테스트

Cloud (Aura Free):
  Name:     MythGraph-Cloud
  URI:      neo4j+s://abc12345xyz.databases.neo4j.io
  User:     neo4j
  Password: [Cloud 비밀번호]
  상태:     ✅ Running
  용도:     Vercel preview 배포

Prod (추가 예정):
  타입:     Aura Professional
  시점:     Sprint 3+ (필요 시)
  비용:     $65.70/월
  용도:     운영 환경

생성일: 2026-08-07
현재 비용: $0 (Free tier만)
```

---

## ✅ 연결 테스트 (선택사항)

### Neo4j Browser로 연결 확인

1. **MythGraph-Dev 인스턴스** → **[Connect]** 버튼
2. **"Open with Neo4j Browser"** 클릭

```
┌─────────────────────────────────┐
│ Neo4j Browser                   │
├─────────────────────────────────┤
│                                 │
│ URI: neo4j+s://abc123...        │
│ User: neo4j                     │
│ Password: [••••••••]            │
│                                 │
│ [Connect]                       │
└─────────────────────────────────┘
```

**연결 성공:**
```
┌─────────────────────────────────┐
│ MATCH (n) RETURN count(n)       │
│                                 │
│ Result: 0 (빈 데이터베이스)      │
│                                 │
│ ✅ 연결 성공!                   │
└─────────────────────────────────┘
```

---

## 🌐 Vercel Secrets에 저장 (Step 2에서)

생성한 자격증명을 Vercel 환경변수에 등록:

```bash
# 터미널에서 실행 (나중에)
vercel secrets add NEO4J_DEV_URI neo4j+s://abc123...
vercel secrets add NEO4J_DEV_PASSWORD [dev_password]

vercel secrets add NEO4J_PROD_URI neo4j+s://def456...
vercel secrets add NEO4J_PROD_PASSWORD [prod_password]
```

---

## ⚠️ 중요 주의사항

### 1. 비밀번호 보안
```
✅ 해야 할 일:
  - 안전한 Password Manager에 저장 (1Password, Bitwarden)
  - 팀원과 안전한 채널로 공유
  - 정기적으로 변경 (분기별)

❌ 하면 안 될 일:
  - Slack/이메일에 평문 저장
  - GitHub에 커밋
  - 공개 노트나 문서에 기록
```

### 2. 30일 미활동 정책
```
⚠️ Aura Free tier 제약:
  - 30일 동안 미활동 시 자동 삭제
  - 해결책: 3주마다 한 번씩 활동 기록
  - 개발 중이면 자동으로 해결됨
```

### 3. Rate Limit
```
⚠️ Free tier 제약:
  - 25 requests/min 제한
  - 해결책: GraphQL 캐싱 + 배치 쿼리
  - 프로토타입 규모(50-80 nodes)에는 충분
```

### 4. 스토리지 제한
```
⚠️ Free tier 제약:
  - 저장소: ~50K nodes (MythGraph는 80 entities로 충분)
  - 관계: ~175K relationships (충분)
```

---

## ✨ 생성 완료 체크리스트

```
☑️ Aura DB Free tier 인스턴스 1개 생성 완료
☑️ Cloud 인스턴스 (MythGraph-Cloud)
  ├─ URI: neo4j+s://[cloud-uri].databases.neo4j.io
  ├─ User: neo4j
  └─ Password: [저장됨]

☑️ 자격증명 안전한 위치에 저장 (1Password)
☑️ 연결 테스트 완료 (선택)
☑️ 팀원에게 안전하게 공유

☑️ Docker Neo4j 설치 (로컬 개발용)
  └─ docker run ... neo4j:latest

현재 비용: $0 (Free tier)
향후 확장: Sprint 3+에서 필요 시 Professional 추가
```

---

## 🎯 다음 단계

1. **.env 파일 생성** (Step 1 Phase 1-3)
   ```bash
   # .env.local (로컬 개발)
   NEO4J_URI=neo4j://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=dev_password_123
   
   # .env.development (Vercel preview)
   NEO4J_URI=neo4j+s://[cloud-uri].databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=${AURA_CLOUD_PASSWORD}
   ```

2. **GraphQL Yoga + Neo4j Driver 연동** (Step 2)
   ```typescript
   const driver = neo4j.driver(
     process.env.NEO4J_URI,
     neo4j.auth.basic(
       process.env.NEO4J_USER,
       process.env.NEO4J_PASSWORD
     )
   )
   ```

3. **Vercel에 Secrets 등록** (Step 2)
   ```bash
   # Preview 배포용 (Cloud)
   vercel secrets add AURA_CLOUD_URI [cloud-uri]
   vercel secrets add AURA_CLOUD_PASSWORD [cloud_password]
   
   # Prod은 나중에 (Sprint 3+)
   ```

---

## 📞 문제 해결

### Q. "Create 버튼을 눌렀는데 반응이 없다"
→ 페이지 새로고침 (F5) 후 재시도

### Q. "이메일 인증 메일을 받지 못했다"
→ 스팸 폴더 확인, 또는 "Resend" 클릭

### Q. "인스턴스 생성이 실패했다"
→ 다른 Region 시도, 또는 Contact Support

### Q. "나중에 운영용 인스턴스를 추가하려면?"
→ 필요할 때 Aura Professional 인스턴스 추가 ($65.70/월)
→ 현재는 Free tier 1개만 유지하면 충분

---

**🎉 Aura DB 생성 완료! (1개 Free tier + 로컬 Docker)**

현재 구성:
- ✅ Local: Docker Neo4j (localhost:7687)
- ✅ Cloud: Aura Free 1개 (Preview/Staging용)
- 📅 Prod: 필요 시 추가 (Sprint 3+)

이제 `.env` 파일 설정으로 Step 1을 마무리합니다.

---

*가이드 작성: BE Blake | 검증: 2026-08-07*
