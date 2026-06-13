# UX Lab

## 📦 패키지/앱

| 패키지/앱 | 설명 | 시작일 | 작업자 | 기술 스택 |
| --- | --- | --- | --- | --- |
| **quiz-drill-ai** | CSV/TSV 기반 시험 대비 퀴즈 드릴 앱 ([앱](./apps/quiz-drill-ai), [배포](https://quiz-drill-ai.vercel.app/)) | 2026-06-13 | ![수산시장](https://img.shields.io/badge/dev--team-수산시장-0EA5E9?logoColor=white) | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white) |
| **projection-art** | WebGL 기반 인터랙티브 프로젝션 아트 PoC ([앱](./apps/projection-art)) | 2026-05-29 | ![수산시장](https://img.shields.io/badge/dev--team-수산시장-0EA5E9?logoColor=white) | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white) ![MediaPipe](https://img.shields.io/badge/MediaPipe-0097A7?logo=google&logoColor=white) |
| **ai-empathy-diary** | Excel 위장 AI 감정 일기 앱 ([배포](https://ai-empathy-diary.vercel.app/)) | 2026-05-11 | ![수산시장](https://img.shields.io/badge/dev--team-수산시장-0EA5E9?logoColor=white) | ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black) ![Google Analytics](https://img.shields.io/badge/Google%20Analytics-E37400?logo=googleanalytics&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white) |
| **@ux-lab/stellas-archive** | 게임 ([개발 일지](https://github.com/dusunax/ux-lab/wiki/Development-Log#stellas-archive-game), [배포](https://ux-lab-stellas-archive.vercel.app/)) | 2026-03-14 | dusunax | |
| **@ux-lab/cad-viewer** | DXF 도면 확인용 CAD 뷰어 ([배포](https://ux-lab-cad-viewer.vercel.app/)) | 2026-02-23 | dusunax | ![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white) ![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white) ![React Three Fiber](https://img.shields.io/badge/React%20Three%20Fiber-20232A?logo=react&logoColor=61DAFB) |
| **@ux-lab/seasonal-project-2025** | AI 기반 연말 사진 회고 웹 서비스 | 2025-12-20 | dusunax | ![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white) ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black) ![Google Analytics](https://img.shields.io/badge/Google%20Analytics-E37400?logo=googleanalytics&logoColor=white) |
| **@ux-lab/applications** | 이력서 지원 현황 관리 앱 ([상세 문서](./apps/applications/README.md)) | 2025-11-24 | dusunax | - |
| **@ux-lab/flow** | UX Flow 다이어그램 에디터 | 2025-10-03 | dusunax | ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black) |
| **@ux-lab/ui** | 공통 UI 컴포넌트 라이브러리 | - | dusunax | - |
| **@ux-lab/showcase** | 컴포넌트 쇼케이스 | - | dusunax | - |

## 📸 스크린샷

### 📍 quiz-drill-ai

- CSV/TSV와 내장 샘플 데이터 기반 퀴즈 세션 생성
- 숫자키 답 선택, Enter/Space 이동, 정답/오답 효과음 지원
- LocalStorage 기반 학습 이력과 오답 다시 풀기 제공

<img width="800" src="./docs/presentations/sprint-quiz-drill-ai-2/shot-answer-correct.png" />

### 📍 projection-art

- WebGL/Three.js 기반 인터랙티브 프로젝션 아트 PoC
- 마우스, 손 추적, 전신 포즈 기반 반응형 비주얼 데모
- 프로젝터 실기기 시연을 기준으로 60fps 동작 검증

### 📍 ai-empathy-diary

- Excel UI로 위장한 AI 감정 일기
- 일기 입력 시 AI가 감정 분석 후 한마디 응답
- Firebase Auth 기반 인증 + Firestore 저장
- 모델별 피드백 통계 대시보드

<img width="800" src="./docs/screenshots/ai-empathy-diary.png" />

### 📍 @ux-lab/cad-viewer

- DXF 도면 업로드 및 2D 뷰어
- 마우스/트랙패드 기반 확대/이동 조작

<img width="800" src="https://github.com/user-attachments/assets/e88a0589-a42e-4a06-8861-057717419d39" />

### 📍 @ux-lab/seasonal-project-2025

- 사진 분석 요청
- 원페이지 스크롤 이벤트
- PDF 저장
- Firebase 기반 일일 요청 횟수 제한

<img width="800" alt="image" src="https://github.com/user-attachments/assets/b147b4f0-2df6-46c0-8a1e-d955069c99e4" />

<img width="800" alt="image" src="https://github.com/user-attachments/assets/565b7146-3047-40f3-b80a-7a8855fb0b5d" />

### 📍 @ux-lab/applications

- 원티드 PDF 파싱 후 리스트 생성
- 로컬 스토리지 기반 리스트 데이터 관리

<img width="800" alt="image" src="https://github.com/user-attachments/assets/dd01ff33-fd8d-4911-bb4e-d22fc619a600" />

### 📍 @ux-lab/flow

<img width="800" alt="image" src="https://github.com/user-attachments/assets/014fb138-ca0e-4de7-95cf-461613507091" />


## 🚀 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm -w run dev:all

# 브라우저에서 확인
# Showcase: http://localhost:3000
# Flow: http://localhost:3333
# Applications: http://localhost:3334
# Project Afterglow: http://localhost:3335
# Stella's Archive: http://localhost:3336
```

## 🔧 환경 설정

### Firebase 프로젝트 설정 시 ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)

1. `.env.local` 파일 생성 (apps/flow/.env.example 참고)
2. Firebase 설정 값 입력

## 🛠️ 기술 스택

- React 19.1.0
- Next.js 15.5.2
- TypeScript 5.0+
- Tailwind CSS 3.4.0
- Firebase (@ux-lab/flow, @ux-lab/seasonal-project-2025)
- OpenAI API (@ux-lab/seasonal-project-2025)
- Framer Motion (@ux-lab/seasonal-project-2025)
- React Flow (@ux-lab/flow)
- Three.js, @react-three/fiber, @react-three/drei (@ux-lab/cad-viewer)
- three-dxf-viewer (DXF 렌더링)(@ux-lab/cad-viewer)
- pdfjs-dist (PDF 파싱)(@ux-lab/applications)
- EXIF 데이터 추출 (exifr) (@ux-lab/seasonal-project-2025)
