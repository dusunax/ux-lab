# Project Afterglow

AI 기반 연말 사진 회고 웹 서비스

## 기술 스택
- Next.js 15 (App Router)
- Tailwind CSS
- Framer Motion
- Lucide React
- TypeScript

## 디자인 원칙
- 베이지, 웜 그레이 톤의 미니멀리즘
- 충분한 여백과 둥근 모서리 (rounded-2xl 이상)
- Framer Motion 페이드인 인터랙션

## 코딩 원칙
- 모듈화 & Clean Code
- 브라우저 단 이미지 리사이징으로 서버 부하 감소
- 반응형 UI

## 시작하기
```bash
pnpm install
pnpm dev:afterglow
# 또는 앱 디렉토리에서
pnpm dev
```
개발 서버: http://localhost:3334

## 경로 별칭
- `@components/*` → `app/components/*`
- `@utils/*` → `app/utils/*`
- `@/*` → `app/*`

예시
```ts
import { Button } from "@components/common/Button";
import { cn } from "@utils/cn";
import { resizeImage } from "@utils/imageResize";
```

## 프로젝트 구조
```
app/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── FadeIn.tsx
│   └── photo/
│       └── PhotoUploader.tsx
├── utils/
│   ├── cn.ts
│   └── imageResize.ts
├── globals.css
├── layout.tsx
└── page.tsx
```

## 주요 기능
- 사진 업로드 & 미리보기 (최대 30장)
- 브라우저 단 리사이징 (1920x1920, 85% 품질)
- 부드러운 페이드인/호버 애니메이션

## 커스텀 컬러 (Tailwind)
- `beige-*` (50-900)
- `warmGray-*` (50-900)