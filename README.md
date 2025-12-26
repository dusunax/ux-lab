# UX Lab

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
```

## 🔧 환경 설정

### Firebase 프로젝트 설정 시 ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)

1. `.env.local` 파일 생성 (apps/flow/.env.example 참고)
2. Firebase 설정 값 입력

## 📦 패키지/앱

- **@ux-lab/ui** - 공통 UI 컴포넌트 라이브러리
- **@ux-lab/showcase** - 컴포넌트 쇼케이스
- **@ux-lab/flow** - UX Flow 다이어그램 에디터 ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
- **@ux-lab/applications** - 이력서 지원 현황 관리 앱 ([상세 문서](./apps/applications/README.md))
- **@ux-lab/seasonal-project-2025** - AI 기반 연말 사진 회고 웹 서비스 ![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)
 ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black) ![Google Analytics](https://img.shields.io/badge/Google%20Analytics-E37400?logo=googleanalytics&logoColor=white)


## 🛠️ 기술 스택

- React 19.1.0
- Next.js 15.5.2
- TypeScript 5.0+
- Tailwind CSS 3.4.0
- Firebase (@ux-lab/flow, @ux-lab/seasonal-project-2025)
- OpenAI API (@ux-lab/seasonal-project-2025)
- Framer Motion (@ux-lab/seasonal-project-2025)
- React Flow (@ux-lab/flow)
- pdfjs-dist (PDF 파싱)(@ux-lab/applications)
- EXIF 데이터 추출 (exifr) (@ux-lab/seasonal-project-2025)

## 📸 스크린샷

### @ux-lab/seasonal-project-2025

- 사진 분석 요청
- 원페이지 스크롤 이벤트
- PDF 저장
- Firebase 기반 일일 요청 횟수 제한

<img width="1200" height="2072" alt="image" src="https://github.com/user-attachments/assets/b147b4f0-2df6-46c0-8a1e-d955069c99e4" />

<img width="1421" height="877" alt="image" src="https://github.com/user-attachments/assets/565b7146-3047-40f3-b80a-7a8855fb0b5d" />


### @ux-lab/applications

- 원티드 PDF 파싱 후 리스트 생성
- 로컬 스토리지 기반 리스트 데이터 관리

<img width="1612" height="1394" alt="image" src="https://github.com/user-attachments/assets/dd01ff33-fd8d-4911-bb4e-d22fc619a600" />


### @ux-lab/flow

<img width="1375" height="917" alt="image" src="https://github.com/user-attachments/assets/014fb138-ca0e-4de7-95cf-461613507091" />
