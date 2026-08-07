# Neo4j Aura DB 생성 가이드

**목표:** MythGraph용 Dev/Prod 2개 독립 인스턴스 생성  
**예상 소요:** 15-20분  
**필수 준비:** 이메일 주소, 웹 브라우저

---

## 📋 개요: 생성할 인스턴스

| 이름 | 용도 | 환경 | 자격증명 |
|------|------|------|---------|
| **MythGraph-Dev** | 개발·테스트 | Aura Free | dev_password |
| **MythGraph-Prod** | 미래 스테이징/운영 | Aura Free | prod_password |

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

### **4단계: 첫 번째 인스턴스 생성 (Dev)**

#### 4-1. 인스턴스 생성 시작

**"+ Create instance"** (또는 **"New instance"**) 버튼 클릭

```
┌─────────────────────────────────┐
│ Create instance                 │
├─────────────────────────────────┤
│                                 │
│ Instance name: [MythGraph-Dev]  │
│                                 │
│ Type: ⊙ Free (selected)         │
│       ⊙ Professional            │
│       ⊙ Enterprise              │
│                                 │
│ Region: [Asia Pacific (Tokyo)]  │
│         (최근접 지역 선택)       │
│                                 │
│ Password: [auto-generated]      │
│           (또는 수동 입력)       │
│                                 │
│ [Create]  [Cancel]              │
└─────────────────────────────────┘
```

#### 4-2. 설정값

**필수 입력:**
- **Instance name:** `MythGraph-Dev`
- **Type:** `Free` (선택됨)
- **Region:** `Asia Pacific - Tokyo` (아시아 권장)
- **Password:** 자동 생성 또는 수동 설정
  - 예: `MythGraph@Dev2026!`
  - ⚠️ 안전한 곳에 저장할 것!

#### 4-3. 생성 확인

**[Create] 클릭** → 처리 중 (2-3분)

```
┌──────────────────────────────────┐
│ Creating MythGraph-Dev...        │
│                                  │
│ █████████░░░░░░░░░░░  50%       │
│ (Provisioning instance)          │
│                                  │
│ Please wait...                   │
└──────────────────────────────────┘
```

**완료 후:**
```
┌────────────────────────────────────────┐
│ ✅ MythGraph-Dev                       │
├────────────────────────────────────────┤
│ Status:      ✓ Running                 │
│ URI:         neo4j+s://abc123.db...    │
│ User:        neo4j                     │
│ Password:    ••••••••                  │
│ Created:     2026-08-07                │
│                                        │
│ [Connect] [Download] [Manage] [Delete] │
└────────────────────────────────────────┘
```

#### 4-4. 자격증명 저장

**화면에 표시되는 정보:**

```
Connection Details:
─────────────────────────────────────

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
📝 메모장 또는 1Password에 저장:

Dev Instance:
  Name: MythGraph-Dev
  URI: neo4j+s://abc12345xyz.databases.neo4j.io
  User: neo4j
  Password: [자동생성된 비밀번호]
```

---

### **5단계: 두 번째 인스턴스 생성 (Prod)**

#### 5-1. 두 번째 인스턴스 생성

**다시 "Create instance"** (또는 **[+ Create]** 버튼)

```
┌─────────────────────────────────┐
│ Create instance                 │
├─────────────────────────────────┤
│                                 │
│ Instance name: [MythGraph-Prod] │
│                                 │
│ Type: ⊙ Free (selected)         │
│                                 │
│ Region: [Asia Pacific (Tokyo)]  │
│         (Dev와 동일)             │
│                                 │
│ Password: [auto-generated]      │
│           (Dev와 다른 비밀번호)  │
│                                 │
│ [Create]  [Cancel]              │
└─────────────────────────────────┘
```

#### 5-2. 설정값

**필수 입력:**
- **Instance name:** `MythGraph-Prod`
- **Type:** `Free`
- **Region:** `Asia Pacific - Tokyo` (Dev와 동일)
- **Password:** 자동 생성 (Dev와 다르게!)
  - 예: `MythGraph@Prod2026!`
  - ⚠️ **Dev와 다른 비밀번호 필수**

#### 5-3. 생성 완료

2-3분 대기 후 완료

```
✅ Instances 목록:

┌────────────────────────────────────────┐
│ MythGraph-Dev                          │
│ Status: ✓ Running                      │
│ URI: neo4j+s://abc123...io             │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ MythGraph-Prod                         │
│ Status: ✓ Running                      │
│ URI: neo4j+s://def456...io             │
└────────────────────────────────────────┘
```

#### 5-4. 자격증명 저장

**Prod 정보도 저장:**

```
Prod Instance:
  Name: MythGraph-Prod
  URI: neo4j+s://def456xyz.databases.neo4j.io
  User: neo4j
  Password: [자동생성된 비밀번호]
```

---

## 📋 자격증명 최종 정리

**아래 정보를 안전한 위치에 저장 (1Password, Vault, 등):**

```
=== MythGraph Aura DB Credentials ===

Dev Instance:
  Name:     MythGraph-Dev
  URI:      neo4j+s://abc12345xyz.databases.neo4j.io
  User:     neo4j
  Password: [Dev 비밀번호]

Prod Instance:
  Name:     MythGraph-Prod
  URI:      neo4j+s://def456abc.databases.neo4j.io
  User:     neo4j
  Password: [Prod 비밀번호]

생성일: 2026-08-07
상태: ✅ 2개 인스턴스 모두 Running
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
☑️ 2개 Aura DB Free tier 인스턴스 생성 완료
☑️ Dev 인스턴스 (MythGraph-Dev)
  ├─ URI: neo4j+s://[dev-uri].databases.neo4j.io
  ├─ User: neo4j
  └─ Password: [저장됨]

☑️ Prod 인스턴스 (MythGraph-Prod)
  ├─ URI: neo4j+s://[prod-uri].databases.neo4j.io
  ├─ User: neo4j
  └─ Password: [저장됨]

☑️ 자격증명 안전한 위치에 저장
☑️ 연결 테스트 완료 (선택)
☑️ 팀원에게 안전하게 공유
```

---

## 🎯 다음 단계

1. **.env 파일 생성** (Step 1 Phase 1-3)
   ```bash
   # .env.local (로컬)
   NEO4J_URI=neo4j+s://[dev-uri].databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=[dev_password]
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
   vercel secrets add NEO4J_DEV_URI [dev-uri]
   vercel secrets add AURA_DEV_PASSWORD [dev_password]
   ```

---

## 📞 문제 해결

### Q. "Create 버튼을 눌렀는데 반응이 없다"
→ 페이지 새로고침 (F5) 후 재시도

### Q. "이메일 인증 메일을 받지 못했다"
→ 스팸 폴더 확인, 또는 "Resend" 클릭

### Q. "인스턴스 생성이 실패했다"
→ 다른 Region 시도, 또는 Contact Support

### Q. "2개를 동시에 만들 수 없나?"
→ 하나씩 생성 (2개 동시 생성 불가, 순차 생성 필수)

---

**🎉 Aura DB 2개 인스턴스 생성 완료!**

이제 `.env` 파일 설정으로 Step 1을 마무리합니다.

---

*가이드 작성: BE Blake | 검증: 2026-08-07*
