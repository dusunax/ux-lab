# Project Afterglow

>https://project-afterglow-2025.vercel.app/
>
> **AI 기반 연말 사진 회고 웹 서비스**  
> Project Afterglow는 올해의 소중한 순간들을 AI와 함께 되돌아보는 연말 회고 서비스입니다. 사용자가 올해 찍은 사진들을 업로드하면, AI가 사진을 분석하여 월별 감정, 성향, 키워드, 그리고 한 해를 요약하는 리포트를 생성합니다.

<img width="600" alt="image" src="https://github.com/user-attachments/assets/94bff9ff-033d-4a78-a524-47e14d4f0c06" />

## 📖 프로젝트

### 주요 특징

- 📸 **사진 기반 회고**: EXIF 데이터를 활용한 자동 월별 그룹화
- 🤖 **AI 분석**: Gemini API를 활용한 사진 분석 및 리포트 생성
  - [[apps/project-afterglow-2025] Docs: AI 활용 및 인프라 운영 비용 분석 리포트 (12/22~12/31)](https://github.com/dusunax/ux-lab/issues/11)
- 📄 **PDF 다운로드**: 생성된 리포트를 PDF로 저장하여 소장 가능 (데이터 스토리지 보관 x)
- 📊 **사용자 통계**: 실시간 참여 횟수 표시(Firestore) 및 이벤트 성공/실패 통계(Google Analytics, 주요 이벤트-사진 분석, PDF 생성)
  - [[apps/project-afterglow-2025] Docs: 사용자 행동 데이터 분석 리포트 (12/22~12/31)](https://github.com/dusunax/ux-lab/issues/9)
- 🎨 **디자인**: 프로젝트 감성에 맞는 베이지, 웜 그레이 톤의 따뜻한 UI/UX

## ✨ 기능

### 1. 사진 업로드 및 EXIF 데이터 추출

- 최대 24장의 사진 업로드 (이미지 리사이징)
  - 관련 레퍼런스 포함 이슈: _[#1](https://github.com/dusunax/ux-lab/issues/1#issuecomment-3692096162)_
- 날짜 자동 추출 (우선 순위: EXIF 촬영 날짜 > 파일 수정 날짜 > 날짜 알 수 없음 표기)
- 월별 사진 그룹화
- 드래그 앤 드롭 지원

<img width="490" height="248" alt="image" src="https://github.com/user-attachments/assets/c71c09b4-a07d-4da9-8f13-734eac0804bb" />

### 2. AI 기반 분석 및 리포트 생성

- Gemini API를 활용한 사진 분석 (gemini-2.0-flash-lite)

https://github.com/dusunax/ux-lab/blob/6226eed41fe14979fa2aa45a4a98ec9aff14fffd/apps/seasonal-project-2025/features/report/api/analyze.ts#L222

### 3. 인터랙티브 리포트 뷰

- 반응형 원페이지 스크롤 인터랙션
- 스크롤 애니메이션 섹션 래퍼

https://github.com/user-attachments/assets/4a22e0b3-06fa-49c6-bec5-a5ee0d22a819

### 4. PDF 다운로드

- 리포트를 PDF로 변환하여 다운로드 (Puppeteer 기반 서버 사이드 PDF 생성)
- 카카오톡 인앱 브라우저 감지 및 안내

<img width="1000" alt="image" src="https://github.com/user-attachments/assets/e2a23663-80ae-4854-a0d2-7194d5e085b2" />

### 5. 사용자 통계

- Firebase 통계 집계
  - IP+날짜 조합으로 해싱한 값으로 사용자 구분
    - 일일 요청 제한
      
      <img width="162" height="78" alt="image" src="https://github.com/user-attachments/assets/4a9077c9-fe7e-44b3-b269-6b1df7e1f4cf" />
    - 현재 요청한 횟수 합계
      
      <img width="268" height="43" alt="image" src="https://github.com/user-attachments/assets/aede91f5-7cf5-4a70-ae66-faaef2bd443a" />

## 🛠️ 기술 소개

### FE

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **React Context API**

### BE & Platform

- **Firestore, Firebase Admin SDK** - IP 기반 일일 요청 제한 및 통계 저장
- **Gemini API** - 사진 분석 및 리포트 생성 (`shared/lib/llm/`)
- **Google Analytics** - 사용자 행동 분석

### 이미지 처리 & PDF 생성

- **exifr** - EXIF 메타데이터 추출
- **Canvas API** - 브라우저 단 이미지 리사이징
- **Puppeteer** - PDF 생성 (별도 API 서버)
- **html2canvas**
- **jspdf**

## 🏗️ 아키텍처

### 프로젝트 구조

```
.
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── pdf/                  # PDF 생성 API Route
│   ├── components/             
│   ├── report/
│   │   └── page.tsx              # 리포트 페이지
│   └── page.tsx                  # 메인 페이지
│
├── features/report/              # 리포트 기능 모듈
│   ├── api/
│   │   └── analyze.ts            # AI 분석 Server Action
│   ├── model/
│   │   └── AnalysisContext.tsx   # 전역 상태 관리
│   ├── hooks/
│   └── ui/                       # 리포트 UI 컴포넌트
│
└── shared/                       # 공유 모듈
    ├── lib/                      # 유틸리티 함수
    │   ├── llm/                  # LLM Provider 추상화
    │   │   ├── types.ts          # LLMProvider 인터페이스
    │   │   ├── gemini.ts         # Gemini 구현체
    │   │   └── index.ts          # Provider factory
    │   ├── exifExtractor.ts      # EXIF 데이터 추출
    │   ├── imageResize.ts        # 이미지 리사이징
    │   ├── firebase-admin.ts     # Firebase Admin
    │   ├── rateLimit.ts          # 요청 제한
    │   └── getTotalUserCount.ts  # 사용자 통계
    ├── hooks/
    │   └── useKakaoInApp.ts      # 카카오톡 인앱 브라우저 감지
    └── ui/                       # 공용 UI 컴포넌트
        ├── Button.tsx
        └── ...
```

### 데이터 흐름

```
1. 사용자 사진 업로드
   ↓
2. EXIF 데이터 추출 (클라이언트)
   ↓
3. 이미지 리사이징 (클라이언트, 512x512)
   ↓
4. 월별 그룹화
   ↓
5. Gemini API 호출 (서버)
   ↓
6. 분석 결과 + 원본 이미지 매핑
   ↓
7. 리포트 생성 및 표시
```

### 주요 아키텍처 패턴

- **Feature-based 구조**: 기능별로 모듈화 (`features/report/`)
- **Shared 모듈**: 공통 유틸리티 및 UI 컴포넌트 (`shared/`)
- **Server Actions**: Next.js Server Actions를 활용한 서버 로직
- **Context API**: 전역 상태 관리 (사진, 분석 결과 등)
- **Custom Hooks**: 재사용 가능한 로직 분리

## 🚀 실행법

### 1. 의존성 설치

```bash
# 루트 디렉토리에서
pnpm install

# 또는 앱 디렉토리에서
cd apps/seasonal-project-2025
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Admin SDK
# Firebase Console > Project Settings > Service Accounts에서 JSON 키 다운로드 후
# JSON 내용을 한 줄로 변환하여 설정
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# Puppeteer API URL (PDF 생성용, 선택사항)
PUPPETEER_API_URL=https://your-puppeteer-api-url.com
```

#### Firebase 설정 방법

프로젝트 생성: `project-afterglow-2025`

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. `project-afterglow-2025` 프로젝트 선택
3. 프로젝트 설정(⚙️) > 서비스 계정 탭으로 이동
4. "새 비공개 키 생성" 클릭하여 JSON 키 다운로드
5. JSON 파일 내용을 한 줄로 변환하여 `FIREBASE_SERVICE_ACCOUNT_KEY`에 설정

#### Firestore 데이터베이스 설정

1. Firebase Console > Firestore Database로 이동
2. 데이터베이스 생성 (프로덕션 모드 또는 테스트 모드)
3. `rateLimits` 컬렉션이 자동으로 생성됩니다 (첫 요청 시)

### 3. 개발 서버 실행

```bash
# 루트 디렉토리에서
pnpm -w run dev:afterglow

# 또는 앱 디렉토리에서
cd apps/seasonal-project-2025
pnpm dev
```

개발 서버: http://localhost:3335

### 4. 빌드 및 배포

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

## 📝 그 외 정보

### 제한 사항

- 일일 요청 제한: IP당 5회 (한국 시간 기준, 자정 리셋)
- 최대 사진 첨부 개수: 24장
- 이미지 리사이징: 512x512 (분석용), 원본 유지 (표시용)

### 배포

- **프론트엔드**: Vercel
- **PDF API**: Google Cloud Run (Puppeteer)
