# CAD Viewer Lab

웹 브라우저에서 CAD 파일을 확인하기 위한 Next.js 앱입니다.

## 지원 포맷

- DWG/DXF (three-dxf-viewer 2D 렌더 경로)

## 실행

```bash
pnpm install
pnpm run dev:cad
```

- 기본 포트: `3366`
- 접속 주소: `http://localhost:3366`

## DWG/DXF 2D 렌더링 방식

`three-dxf-viewer`를 사용합니다.

- 우선 로컬 패키지 `three-dxf-viewer`를 로드 시도
- 설치되어 있지 않으면 CDN(`esm.sh`) fallback 로드
- `.dwg` 업로드 시 텍스트 기반(DXF 내용)인지 검사 후 가능하면 2D 렌더
- 순수 바이너리 DWG는 `three-dxf-viewer`로 직접 렌더링 불가
