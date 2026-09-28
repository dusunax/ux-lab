# Space Bubble

Google Chat Space의 새 메시지를 데스크톱 화면 우측 하단에 말풍선으로 알려주는 Electron 앱입니다.
명세는 [docs/spec.md](docs/spec.md)를 참고하세요.

## 준비

1. GCP 설정: [docs/spec.md §0](docs/spec.md) (OAuth 클라이언트 유형: 데스크톱 앱)
2. 루트에 `.env` 작성 (`.env.example` 참고, 커밋되지 않음)

ux-lab 모노레포(pnpm workspace)의 앱입니다. 의존성은 레포 루트에서 설치합니다.

```bash
pnpm install                      # 레포 루트에서
cp apps/google-space-bubble/.env.example apps/google-space-bubble/.env
```

## 실행

```bash
# 레포 루트에서
pnpm dev:bubble                                   # 개발 모드 (HMR)
pnpm --filter google-space-bubble test            # 단위 테스트
pnpm --filter google-space-bubble typecheck
pnpm --filter google-space-bubble dist:mac        # dmg 빌드
pnpm --filter google-space-bubble dist:win        # Windows 설치 파일 빌드
```

### UI만 브라우저에서 보기

`pnpm dev:bubble` 실행 중에 dev server 주소로 접속하면 mock 데이터로 화면을 확인할 수 있습니다. (dev 전용, 프로덕션 빌드에는 포함되지 않음)

- 로그인: `http://localhost:5173/settings/index.html?mock=signedOut`
- 설정: `http://localhost:5173/settings/index.html?mock=signedIn`
- Bubble: `http://localhost:5173/bubble/index.html` (`?pos=top-left&font=17&mascot=phone`으로 모양 지정)

## macOS 빌드와 설치

```bash
pnpm --filter google-space-bubble dist:mac   # dist/Space-Bubble-<version>-arm64.dmg
```

- Apple Silicon(arm64) 전용입니다. Intel Mac용은 `electron-builder.yml`의 `arch`에 `x64`를 추가하세요.
- Developer ID 인증서가 없어 **ad-hoc 서명**만 되어 있고 notarization은 하지 않았습니다.
  다른 사람이 내려받아 열면 "확인되지 않은 개발자" 경고가 뜹니다. 처음 한 번은 아래 방법 중 하나로 여세요.
  - Finder에서 앱을 **우클릭 → 열기**
  - 시스템 설정 → 개인정보 보호 및 보안 → **그래도 열기**
- `.env`의 OAuth Client ID/Secret이 앱 번들에 포함됩니다. 데스크톱 앱 유형이라 비밀 정보로 취급되지는 않지만, **사내 배포용으로만** 공유하세요.
- dev 모드와 설치한 앱은 같은 데이터 폴더를 씁니다 (로그인·설정 공유).

## Windows 빌드와 설치

```bash
pnpm --filter google-space-bubble dist:win   # dist/Space-Bubble-Setup-<version>-x64.exe (macOS에서도 빌드 가능)
```

- x64 전용 설치 파일(NSIS)입니다. 사용자 계정 단위로 설치되며 설치 경로를 바꿀 수 있습니다.
- 코드 서명 인증서가 없어 처음 실행 시 **Windows SmartScreen** 경고가 뜹니다. **추가 정보 → 실행**을 누르세요.
- 앱은 작업 표시줄 오른쪽 **알림 영역(트레이)**에 상주합니다. 아이콘을 클릭하면 설정 창이 열립니다.
  Windows 11에서는 숨겨진 아이콘(^) 안에 들어갈 수 있으니, 작업 표시줄 설정에서 항상 표시로 바꾸면 편합니다.

## 구조

```text
src/main/       OAuth, Token 저장(safeStorage), Chat API polling, 창/트레이 관리
src/preload/    contextBridge로 window.api 노출
src/renderer/   settings(로그인·설정 창), bubble(오버레이 창)
src/shared/     타입, IPC 채널, Space ID 정규화
spike/          Phase 0 API 검증 스크립트
design/         캐릭터 원본
```

## 로컬 데이터

`~/Library/Application Support/google-space-bubble/` (Windows: `%APPDATA%\google-space-bubble\`)

- `settings.json`: Space 목록, 마지막 처리 메시지
- `tokens.bin`: OAuth token (safeStorage 암호화)
