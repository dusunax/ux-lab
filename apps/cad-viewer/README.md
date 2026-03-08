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

## Redis 연동 (방문자/블루프린트 카운터)

이 프로젝트의 카운터 기능은 `apps/cad-viewer/app/api/visitors/route.ts`에서 동작합니다.

- `GET /api/visitors`
  - 오늘 날짜 키: `cadviewer:daily:visitors:YYYY-MM-DD`
  - 쿠키 `cadviewer_visit_day`와 비교해 하루 1회 방문으로 간주되어 오늘 방문자 수를 증가시킵니다.
  - 오늘 방문자 수(`visitors`)와 전체 블루프린트 확인 수(`blueprintsChecked`)를 반환합니다.
- `POST /api/visitors`
  - 블루프린트가 정상 렌더링될 때 호출되어 `cadviewer:blueprints:checks`를 1 증가시킵니다.
  - `blueprintsChecked` 갱신 값을 반환합니다.

연결은 환경변수 `REDIS_URL` 하나만 사용합니다.

```env
REDIS_URL=redis://default:password@host:port
```

- 로컬 실행: `.env.local` 또는 `env.local`에 `REDIS_URL`을 추가
- Vercel 배포: Project Settings → Environment Variables에 `REDIS_URL` 등록 후 재배포
- 실제 접속/조회 실패 시 API는 `redisConnected: false`를 반환하고, 화면에서 상태가 표시됩니다.

참고: `APS_CLIENT_ID`, `APS_CLIENT_SECRET`는 현재 카운터/렌더링 기능과 무관하며, 필요한 API 키가 아닙니다.

## 이미지 

<img width="200" alt="character" src="https://github.com/user-attachments/assets/c8f2ea8b-efee-41ab-b9a2-bb200be246ca" />  
<img width="250" alt="tools" src="https://github.com/user-attachments/assets/d6c22e7c-fc95-4274-8991-beb2d4a49a24" />
<img width="300" alt="tools2" src="https://github.com/user-attachments/assets/5ec1077c-438a-4e0a-b341-475d2b8093b1" />  
