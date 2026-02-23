# CAD Viewer Lab

웹 브라우저에서 CAD 파일을 확인하기 위한 Next.js 앱입니다.

<img width="1024" src="https://github.com/user-attachments/assets/9b121e4c-a600-405c-a9ab-960d75aab0ef" />

## 지원 포맷

- DXF (three-dxf-viewer 2D 렌더 경로)

## 실행

```bash
pnpm install
pnpm run dev:cad
```

- 기본 포트: `3366`
- 접속 주소: `http://localhost:3366`

## DXF 2D 렌더링 방식

`three-dxf-viewer`를 사용합니다.

- 우선 로컬 패키지 `three-dxf-viewer`를 로드 시도
- 설치되어 있지 않으면 CDN(`esm.sh`) fallback 로드
- `.dxf` 파일을 파싱하여 2D로 렌더링

## 조작 방법

- 마우스 휠: 확대/축소
- 좌클릭 드래그: 패닝 이동
- 우클릭 드래그: 패닝 이동
- 가운데 버튼 드래그: 패닝 이동
- 트랙패드: 두 손가락 드래그 패닝, 핀치 줌

## 이미지 

<img width="200" alt="character" src="https://github.com/user-attachments/assets/c8f2ea8b-efee-41ab-b9a2-bb200be246ca" />  
<img width="250" alt="tools" src="https://github.com/user-attachments/assets/d6c22e7c-fc95-4274-8991-beb2d4a49a24" />
<img width="300" alt="tools2" src="https://github.com/user-attachments/assets/5ec1077c-438a-4e0a-b341-475d2b8093b1" />  

