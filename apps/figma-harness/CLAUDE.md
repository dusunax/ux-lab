# figma-harness

Figma 디자인 컴포넌트 쇼케이스 앱. Next.js + Tailwind CSS + TypeScript.

자세한 사용법은 [README.md](./README.md) 참고.

## 컴포넌트 추가 방법

```
/figma-harness <Figma URL>
```

## 아이콘 / 이미지 에셋 규칙 (CRITICAL)

이모지, 플레이스홀더 SVG, 텍스트 대체 절대 금지.
Figma MCP가 반환하는 에셋 URL을 반드시 다운로드하여 `public/assets/`에 저장한 뒤 사용한다.

```bash
mkdir -p apps/figma-harness/public/assets
curl -L "<figma-asset-url>" -o apps/figma-harness/public/assets/<name>.svg
```

- SVG → `<img src="/assets/name.svg" />` 또는 인라인 SVG
- PNG/WebP → `next/image`의 `<Image>` 컴포넌트
- 컴포넌트 상단에 경로 상수로 선언: `const ICON_SEARCH = '/assets/icon-search.svg'`
- 동일 에셋은 중복 다운로드 없이 재사용

## 구조

```
apps/figma-harness/
├── app/
│   ├── components/
│   │   ├── snapshots/
│   │   ├── ComposeButton.tsx
│   │   ├── ApplyButton.tsx
│   │   ├── SidebarItem.tsx
│   │   ├── SidebarNav.tsx
│   │   └── TopBar.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
└── public/assets/
```

## 등록된 컴포넌트

| 컴포넌트 | 파일 | Figma 노드 |
|---|---|---|
| Button / Compose Message | ComposeButton.tsx | 0:40522 |
| Button / Apply Now | ApplyButton.tsx | 0:40526 |
| Sidebar Item (6 variants) | SidebarItem.tsx | 0:40322 등 |
| Sidebar Nav (Light/Blue) | SidebarNav.tsx | 0:40298, 0:40223 |
| Top Bar (4 variants) | TopBar.tsx | 0:40369 등 |
