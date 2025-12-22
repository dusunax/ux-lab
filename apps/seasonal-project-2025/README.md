# Project Afterglow

AI 기반 연말 사진 회고 웹 서비스

## 기술 스택

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Firebase Admin SDK
- Google Analytics

## 디자인 원칙

- 베이지, 웜 그레이 톤의 미니멀리즘
- 충분한 여백과 둥근 모서리 (rounded-2xl 이상)
- Framer Motion 페이드인 인터랙션

## 코딩 원칙

- 모듈화 & Clean Code
- 브라우저 단 이미지 리사이징으로 서버 부하 감소
- 반응형 UI

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Admin SDK
# Firebase Console > Project Settings > Service Accounts에서 JSON 키 다운로드 후
# JSON 내용을 한 줄로 변환하여 설정
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Firebase 설정 방법:**

프로젝트 ID: `project-afterglow-2025`

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. `project-afterglow-2025` 프로젝트 선택
3. 프로젝트 설정(⚙️) > 서비스 계정 탭으로 이동
4. "새 비공개 키 생성" 클릭하여 JSON 키 다운로드
5. JSON 파일 내용을 한 줄로 변환하여 `FIREBASE_SERVICE_ACCOUNT_KEY`에 설정

**Firestore 데이터베이스 설정:**

1. Firebase Console > Firestore Database로 이동
2. 데이터베이스 생성 (프로덕션 모드 또는 테스트 모드)
3. `rateLimits` 컬렉션이 자동으로 생성됩니다 (첫 요청 시)

**JSON을 한 줄로 변환하는 방법:**

```bash
# Node.js 사용
node -e "console.log(JSON.stringify(require('./serviceAccountKey.json')))"

# 또는 온라인 도구 사용 (주의: 민감한 정보이므로 신뢰할 수 있는 도구만 사용)
```

### 3. 개발 서버 실행

```bash
pnpm dev:afterglow
# 또는 앱 디렉토리에서
pnpm dev
```

개발 서버: http://localhost:3334

## 경로 별칭

- `@shared/*` → `shared/*`
- `@features/*` → `features/*`
- `@/*` → `app/*`

## 프로젝트 구조

```
.
├── app/                          # Next.js App Router
│   ├── components/               # 페이지 컴포넌트
│   │   ├── ExampleModal.tsx
│   │   ├── Examples.tsx
│   │   ├── GoogleAnalytics.tsx
│   │   └── RateLimitBadge.tsx
│   ├── report/
│   │   └── page.tsx              # /report 페이지
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # 인덱스 페이지
│
├── features/report/              # 리포트 기능 모듈
│   ├── api/
│   │   └── analyze.ts            # AI 분석 Server Action (OpenAI)
│   ├── data/                     # 목업 데이터 등
│   ├── hooks/
│   │   └── useReportSections.ts
│   ├── model/
│   │   └── AnalysisContext.tsx   # Context API
│   ├── types.ts
│   └── ui/                       # 리포트 UI 컴포넌트
│       ├── AnimatedSection.tsx   # 섹션 공통 애니메이션 래퍼
│       ├── TitleSection.tsx
│       ├── SentenceSection.tsx
│       ├── PersonalitySection.tsx
│       ├── MeSection.tsx
│       ├── MoodSection.tsx
│       ├── ContinueSection.tsx
│       ├── AnalysisResultCard.tsx
│       ├── ReportView.tsx
│       └── TimelineSection.tsx
│
└── shared/                       # 공유 모듈
    ├── lib/                      # 유틸리티 함수
    │   ├── exifExtractor.ts
    │   ├── imageResize.ts
    │   ├── firebase-admin.ts     # Firebase Admin
    │   ├── rateLimit.ts
    │   └── ...
    └── ui/                       # 공용 UI 컴포넌트
        ├── Button.tsx
        ├── Card.tsx
        └── ...
```

## 주요 기능

- 사진 업로드 & 미리보기 (최대 24장)
- 원본 이미지 파일에서 촬영 일자 데이터 추출: EXIF
- 브라우저 단 리사이징 (1920x1920, 85% 품질)
- 부드러운 페이드인/호버 애니메이션
- IP 기반 일일 요청 제한 (하루 5회, 한국 시간 기준): Firebase
- Google Analytics 사용자 행동 분석: 페이지 접근, AI 분석 시작/실패 등

## Tailwind

- `beige-*` (50-900)
- `warmGray-*` (50-900)
- 반응형 폰트 크기
