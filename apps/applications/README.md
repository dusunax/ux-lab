# @ux-lab/applications

이력서 지원 현황을 기록하고 관리하는 웹 애플리케이션입니다.

## 주요 기능

- **지원 현황 관리(현재 로컬 스토리지)**: 회사명, 포지션, 지원일, 상태, 지원처 등 지원 정보 CRUD
- **상태 관리**: 작성 중, 지원함, 서류통과, 면접, 최종합격, 불합격
- **날짜별/리스트 뷰**: 날짜별 그룹화 또는 리스트 형태로 지원 현황 확인
- **필터링**: 날짜, 상태, 즐겨찾기별 필터링
- **즐겨찾기**: 중요 지원 내역 즐겨찾기 표시
- **선택 삭제**: 여러 항목 선택 후 일괄 삭제
- **PDF 파싱**: 원티드 취업활동 증명서 PDF 업로드 시 지원 내역 자동 추출 및 일괄 등록

## 기술 스택

- Next.js 15.5.2
- TypeScript
- Tailwind CSS
- pdfjs-dist (PDF 파싱)

## 실행

```bash
# 개발 서버 실행
pnpm -w run dev:applications

# 브라우저에서 확인
# http://localhost:3334
```

## 프로젝트 구조

```
apps/applications/
├── app/
│   ├── components/
│   │   ├── ApplicationsPage.tsx       # 메인 페이지
│   │   ├── ApplicationForm.tsx        # 지원 현황 폼
│   │   ├── ApplicationList.tsx        # 리스트 뷰
│   │   ├── ApplicationListByDate.tsx  # 날짜별 뷰
│   │   ├── ApplicationModal.tsx       # 모달
│   │   ├── DatePicker.tsx             # 날짜 선택기
│   │   ├── WantedCertificateParser.tsx # PDF 파서
│   │   └── PDFUploader.tsx            # PDF 업로더
│   ├── hooks/                         # 커스텀 훅
│   │   ├── useApplications.ts         # 지원 현황 관리
│   │   └── useFavoriteApplications.ts # 즐겨찾기 관리
│   ├── types/
│   │   └── application.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── public/
│   └── pdf.worker.min.js    # PDF.js 워커
└── package.json
```
