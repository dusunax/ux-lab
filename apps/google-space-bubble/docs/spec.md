# Google Space Message Bubble — MVP Specification

## 1. 프로젝트 개요

### 목적

사용자가 Google Chat에 로그인한 뒤, 하나 이상의 Google Space에서 발생하는 새로운 메시지를 감지하여 데스크톱 화면에 말풍선(Floating Bubble) 형태로 표시하는 Electron 기반 앱을 개발한다.

### 목표 플랫폼

| 구분 | MVP |
|---|---|
| 개발/테스트 | macOS |
| 지원 | macOS, Windows |
| 앱 | Electron |
| UI | React + TypeScript |
| Google 연동 | Google Chat API |
| 인증 | Google OAuth 2.0 |
| 메시지 수신 | Polling |
| 알림 UI | Custom Floating Bubble |

> MVP에서는 Google Workspace Events API, Pub/Sub, 별도 Backend를 사용하지 않는다.

---

## 0. 사전 준비 (GCP / Workspace)

Google Chat API는 **Google Workspace 계정**에서만 동작한다. 개인 Gmail 계정은 사용할 수 없다.

### 필요 조건

| 항목 | 내용 |
|---|---|
| 계정 | 사내 Google Workspace 계정 |
| GCP 권한 | 조직 내 GCP 프로젝트 생성 권한 (또는 기존 프로젝트의 편집자 권한) |
| 관리자 정책 | Admin Console에서 내부 OAuth 앱과 Chat API 사용이 차단되어 있지 않아야 함 |

> 조직 정책으로 프로젝트 생성이 막혀 있거나, 동의 화면에서 "관리자 승인 필요"가 뜨면 Workspace 관리자에게 요청해야 한다.

### 설정 순서

1. GCP 프로젝트 생성 (사내 조직 하위)
2. **Google Chat API** 사용 설정
3. **Chat API > Configuration**에서 Chat 앱 정보 입력 (앱 이름, 아바타 URL, 설명)
   - 사용자 인증으로만 호출하더라도 이 구성이 없으면 API 호출이 실패한다.
   - Interactive features는 끈다.
4. **OAuth 동의 화면**: User Type을 **Internal**로 설정 (앱 검증 절차 생략)
   - Scope에 `chat.messages.readonly` 추가 (`openid`, `email`은 비민감 scope라 별도 등록 없이 요청 가능)
5. **사용자 인증 정보 > OAuth 클라이언트 ID** 생성, 유형은 **데스크톱 앱**
6. Client ID와 Secret은 로컬 `.env`에만 보관하고 저장소에 커밋하지 않는다.

> 데스크톱 앱 유형의 Client Secret은 배포 바이너리에 포함되므로 비밀 정보로 취급되지 않는다. 대신 PKCE로 보호한다.

---

## 2. 사용자 시나리오

### 최초 실행

```text
앱 실행
 ↓
Google 계정으로 로그인
 ↓
Google 권한 승인
 ↓
모니터링할 Space 등록
 ↓
모니터링 시작
```

### 이후 실행

```text
앱 실행
 ↓
저장된 인증 정보 확인
 ↓
자동 인증
 ↓
등록된 Space 모니터링 시작
```

사용자는 매번 Google 로그인을 수행하지 않는다. OAuth Token을 안전하게 저장하고 재사용한다.

---

## 3. 핵심 기능

## 3.1 Google 로그인

### 요구사항

- Google OAuth 2.0을 이용한다.
- 앱 최초 실행 시 Google 로그인 진행
- 사용자가 Google 계정 및 권한을 승인
- 인증 완료 후 앱으로 복귀
- 이후 실행에서는 저장된 Token을 이용하여 재로그인 최소화
- Token 만료 시 자동 갱신
- 인증 실패/취소 시 로그인 화면으로 복귀

### 최소 권한

```text
https://www.googleapis.com/auth/chat.messages.readonly
```

MVP에서는 메시지 읽기만 필요하므로 Chat 관련 scope는 `chat.messages.readonly` **하나만** 사용한다. 여기에 본인 식별용으로 비민감 scope `openid`, `email`을 함께 요청한다.

```text
https://www.googleapis.com/auth/chat.messages.readonly
openid
email
```

- Space 이름은 API로 조회하지 않고 사용자가 입력한다. 그래서 `chat.spaces.readonly`는 요청하지 않는다.
- Sender 이름은 `messages.list` 응답의 `sender.displayName`을 그대로 사용한다. Spike에서 HUMAN과 BOT 모두 값이 채워지는 것을 확인했으므로 People API는 사용하지 않는다.
- `openid`로 받은 ID Token의 `sub`와 `email`은 로그인 계정 표시와 본인 메시지 식별(§6)에 사용한다.

### 로그인 방식

- **시스템 기본 브라우저**에서 로그인한다. Google은 임베디드 WebView 로그인을 차단하므로 Electron 창 내부 로그인은 사용하지 않는다.
- Redirect: loopback `http://127.0.0.1:{임의 포트}`
- **PKCE (S256)**와 `state` 파라미터로 code 가로채기 및 CSRF를 방지한다.
- `access_type=offline`으로 Refresh Token을 받는다.
- 로그인 대기 중에 사용자가 브라우저를 닫는 경우를 대비해 약 3분 후 timeout 처리하고 로그인 화면으로 돌아간다.

---

## 4. Space 설정

사용자는 **하나 이상의 Google Space를 모니터링 대상으로 등록**할 수 있다.

예:

```text
Google Space
├─ Gen.AI Front-end 알림
├─ Gen.AI 소통
└─ 기타 Space
```

### MVP 설정 화면

```text
┌──────────────────────────────────┐
│ Google Space                     │
│                                  │
│ ☑ Gen.AI Front-end 알림          │
│ ☑ Gen.AI 소통                    │
│                                  │
│ [+ Space 추가]                   │
│                                  │
│          [모니터링 시작]          │
└──────────────────────────────────┘
```

### MVP Space 등록 방식

초기 MVP에서는 사용자가 **Space ID와 Space 이름을 직접 입력**한다.

```text
┌──────────────────────────────────┐
│ Space 추가                       │
│                                  │
│ Space ID 또는 URL                │
│ [spaces/AAAA...               ]  │
│                                  │
│ 표시 이름                        │
│ [Gen.AI Front-end 알림        ]  │
│                                  │
│              [취소] [추가]        │
└──────────────────────────────────┘
```

#### 입력 허용 형식

아래 형식은 모두 `spaces/AAAA`로 정규화한다.

```text
spaces/AAAA
AAAA
https://chat.google.com/room/AAAA
https://mail.google.com/chat/u/0/#chat/space/AAAA
```

#### 등록 시 검증

- `spaces.messages.list` (`pageSize=1`)를 호출해 접근 가능한지 확인한다.
- 403/404 응답이면 "접근할 수 없는 Space"로 안내하고 등록하지 않는다.
- 이미 등록된 Space ID는 중복 등록을 막는다.
- 표시 이름을 비워 두면 Space ID를 이름으로 사용한다.

Space 자동 검색 및 선택 UI는 후속 기능으로 둔다.

### 데이터 구조

```ts
type MonitoredSpace = {
  spaceId: string;          // "spaces/AAAA"
  spaceName: string;        // 사용자가 입력한 표시 이름
  enabled: boolean;
  lastMessageName?: string;
  lastMessageTime?: string; // RFC3339
};

type SpaceStatus = 'syncing' | 'ok' | 'waiting' | 'error'; // 런타임 상태, 저장하지 않음

type AppSettings = {
  monitoredSpaces: MonitoredSpace[];
  pollIntervalSec: number;  // 기본 5
  bubbleDurationSec: number; // 기본 5
};
```

각 Space의 마지막 처리 메시지를 독립적으로 관리한다.

---

## 5. 메시지 감지

### MVP 방식: Polling

Electron Main Process에서 일정 주기로 등록된 각 Space의 Google Chat API를 호출한다.

```text
Electron Main
     │
     ├── Space A ──→ Google Chat API
     ├── Space B ──→ Google Chat API
     └── Space C ──→ Google Chat API
                    │
                    ▼
              새 메시지 확인
```

### 권장 Polling 주기

```text
5초
```

MVP에서는 약 5초 단위로 메시지를 확인한다.

### Quota

2026-09 기준 Google Chat API 공식 문서의 한도는 다음과 같다.

| 구분 | 대상 | 한도 |
|---|---|---|
| Per-project | `spaces.messages.list` / `get` (Message read) | **3,000 req / 60초** |
| Per-space | Space 하나에 대한 모든 앱의 read 합계 | **15 req / 초** |
| Per-user | Message read | 별도 제한 없음 |

**Per-project 한도는 같은 OAuth Client(GCP 프로젝트)를 쓰는 모든 사용자가 공유한다.**

```text
사용자 1명당 분당 호출 수 = (60 / pollInterval) × Space 수
5초, Space 3개 → 36 req/min
→ 약 80명까지 동시 사용 가능 (3,000 / 36)
```

### Polling 정책

- **요청 분산:** Space별 요청을 한꺼번에 보내지 않고 polling 주기 안에서 시간차를 두어 보낸다. 예를 들어 Space 3개면 약 1.7초 간격으로 순차 호출한다.
- **최소 주기:** `pollIntervalSec`는 5초 미만으로 설정할 수 없다.
- **Space 수 상한:** MVP에서는 사용자당 최대 10개로 제한한다 (5초 기준 120 req/min).
- **429 / 5xx / 네트워크 오류:** Truncated exponential backoff를 적용한다.
  - `wait = min(2^n × 1초 + jitter(0~1초), 60초)`
  - 성공하면 원래 주기로 복귀한다.
  - 429는 프로젝트 전체 한도 초과일 수 있으므로 **모든 Space의 polling을 함께 늦춘다.** 5xx와 네트워크 오류는 해당 Space만 늦춘다.
- **절전 / 화면 잠금:** `powerMonitor`의 `suspend`/`lock-screen` 이벤트에서 polling을 일시정지하고, `resume`/`unlock-screen`에서 재개한다.
- **오프라인:** 네트워크 오류가 연속 3회 발생하면 상태를 `● Google Chat 연결 대기 중`으로 표시한다.

> 사용자가 늘어나 한도에 가까워지면 §18의 Workspace Events API 구조로 전환한다.

---

## 6. 새 메시지 판별

최초 실행 시 기존 메시지를 모두 알림으로 띄우지 않는다.

### 최초 동기화

```text
앱 시작
 ↓
등록된 Space의 최근 메시지 조회
 ↓
가장 최신 Message ID / createTime 저장
 ↓
알림 표시하지 않음
```

### 이후 Polling

```text
새 메시지 조회
 ↓
기존 마지막 Message와 비교
 ↓
새로운 Message 발견
 ↓
Bubble 표시
 ↓
마지막 Message 갱신
```

### 식별 기준

가능하면 Google Chat `Message.name`을 기준으로 중복을 판별한다.

예:

```text
spaces/AAAA/messages/BBBB
```

각 Space마다 `lastMessageName`과 `lastMessageTime`을 별도로 관리한다.

### 조회 방식

```text
GET /v1/{spaceId}/messages
  ?filter=createTime > "{lastMessageTime}"
  &orderBy=createTime asc
  &pageSize=50
```

- `nextPageToken`이 있으면 이어서 조회한다. 한 번의 polling에서 최대 3페이지까지만 조회한다.
- 최초 동기화는 `orderBy=createTime desc&pageSize=1`로 최신 메시지 1건만 조회해 기준점으로 저장한다.
- 저장된 `lastMessageTime`이 있으면 최초 동기화를 건너뛰고 그 시점부터 이어서 조회한다. 단, 앱이 꺼져 있던 동안 쌓인 메시지는 알림 폭주를 막기 위해 아래 요약 규칙을 따른다.

### 중복 방지

- `createTime` 필터에 더해, 최근 처리한 `Message.name`을 Space당 최대 200개까지 메모리에 보관(LRU)하고 중복을 거른다.
- 수정된 메시지(`lastUpdateTime` 변경)는 새 메시지로 취급하지 않는다.
- 삭제된 메시지(`deletionMetadata` 있음)는 무시한다.

### 알림 요약

한 번의 polling에서 한 Space의 새 메시지가 **5개를 넘으면** 개별 Bubble 대신 요약 Bubble 1개를 띄운다.

```text
┌──────────────────────────────┐
│ 💬 Gen.AI 소통               │
│ 새 메시지 12개               │
└──────────────────────────────┘
```

### 알림 제외

- **본인이 보낸 메시지 알림 여부는 설정으로 정한다.** 설정 창 "내가 보낸 메시지도 알림" (기본: 켬)
  - 끄면 `sender.name == "users/{ID Token의 sub}"` 또는 `sender.type == HUMAN && sender.email == 로그인 이메일`인 메시지를 제외한다.
  - 제외한 메시지도 cursor는 전진한다.
- `sender.type == BOT`인 메시지는 알림한다. 배포 알림 같은 봇 메시지가 주요 대상이기 때문이다.

### Sender 표시 규칙 (Spike 결과 기반)

- Incoming webhook 봇은 **같은 `sender.name`이라도 메시지마다 `displayName`이 다를 수 있다.** 예: 같은 user ID에 `gitlab`과 `gitlab-projects`가 번갈아 나옴.
  - 그래서 Sender 이름을 `sender.name` 기준으로 캐시하지 않고 **메시지마다 받은 `displayName`을 그대로** 표시한다.
- `displayName`이 비어 있으면 `sender.type`에 따라 "알 수 없는 사용자" 또는 "봇"으로 표시한다.

---

## 7. 말풍선 UI

### 화면 예시

```text
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│                                              │
│                             ┌──────────────┐ │
│                             │ 💬 Google Chat│ │
│                             │              │ │
│                             │ 김OO          │ │
│                             │ 배포 완료했습니다│ │
│                             └──────────────┘ │
│                                      ↘       │
└──────────────────────────────────────────────┘
```

### UI 요구사항

- 항상 위에 표시
- Borderless
- Transparent Window
- 화면 우측 하단 고정
- 다른 앱의 작업을 방해하지 않도록 작은 크기
- 자동으로 사라짐
- 여러 메시지가 연속으로 발생하면 Stack 처리

### 기본 표시 시간

```text
5초
```

- 마우스를 올리면 사라지는 타이머를 일시정지하고, 마우스가 벗어나면 다시 시작한다.
- Stack은 최대 4개까지 보여준다. 넘치는 알림은 가장 오래된 Bubble부터 제거한다.

### Window 구현 방침

- Bubble마다 창을 만들지 않고, **투명 오버레이 창 1개** 안에서 Stack을 렌더링한다.
- 옵션: `transparent`, `frame: false`, `focusable: false`, `skipTaskbar`, `resizable: false`, `hasShadow: false`
- 항상 위: `setAlwaysOnTop(true, 'screen-saver')`
- macOS 전체화면 위에도 표시: `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`
- `showInactive()`로 띄워 **현재 작업 중인 앱의 포커스를 빼앗지 않는다.**
- 위치: 설정한 모니터의 `workArea` 모서리 (여백 16px). 창 크기는 글자 크기에 비례한다 (보통 13px 기준 360×520).
- Renderer가 IPC 구독을 마치고 `bubble:ready`를 보낸 뒤에 메시지를 전달한다. 첫 메시지 유실 방지.
- Bubble이 모두 사라지면 창을 숨긴다.

### 알림 모양 설정

설정 창의 **알림 모양**에서 변경하며, 바꾸면 표시 중인 Bubble에도 바로 반영된다. [미리보기]로 테스트 알림을 띄운다 (트레이 메뉴의 "테스트 알림 보내기"와 같음).

| 항목 | 값 | 기본값 |
|---|---|---|
| 캐릭터 | 인사(`wave`) / 폰 보기(`phone`) / 내 이미지(`custom`) / 없음(`none`) | 인사 |
| 표시 시간 | 5초 / 10초 / 30초 / 닫을 때까지(`0`) | 10초 |
| 글자 크기 | 작게 12 / 보통 13 / 크게 15 / 아주 크게 17 (px) | 보통 |
| 표시 위치 | 오른쪽 아래 / 왼쪽 아래 / 오른쪽 위 / 왼쪽 위 | 오른쪽 아래 |
| 모니터 | 마우스가 있는 모니터 / 주 모니터 | 마우스가 있는 모니터 |

- 캐릭터는 선택한 모서리에 서 있고, 말풍선은 그 안쪽으로 쌓인다. 최신 말풍선이 캐릭터에 가장 가깝다.
- 말풍선 꼬리(뾰족한 모서리)는 캐릭터 쪽을 향한다. 캐릭터는 위치와 관계없이 좌우 반전하지 않는다.
- 앱에서 쓰는 캐릭터 이미지(256px)는 `src/renderer/assets/`에 있다.
- **내 이미지:** main의 파일 선택 창에서만 경로를 받는다(renderer가 경로를 넘기지 않음). PNG/JPG/WebP, 20MB 이하. 256px 이하로 줄여 `userData/custom-mascot.png`에 저장하고 renderer에는 data URL로 전달한다.
- 말풍선의 **X 버튼은 항상 표시**한다. 본문은 최대 4줄까지 보여 주고, 마우스를 올려도 펼치지 않는다 (전체 내용은 클릭해서 Chat에서 확인).
- 설정 창 하단 **[테스트 알림 보내기]**, 트레이 메뉴 "테스트 알림 보내기"로 현재 설정의 말풍선을 띄운다.

### Space 이름 변경

설정 창 Space 목록의 ✎ 버튼으로 표시 이름을 바꾼다. Enter 또는 포커스 이탈 시 저장, Esc 취소. 한글 조합 중 Enter는 무시한다. 빈 값이면 Space ID를 이름으로 쓴다.

### 동작

```text
새 메시지
 ↓
Bubble 등장
 ↓
5초 대기
 ↓
Fade Out
 ↓
제거
```

---

## 8. Bubble 정보

여러 Space를 동시에 모니터링하므로 **어느 Space에서 발생한 메시지인지 반드시 표시**한다.

```text
┌──────────────────────────────┐
│ 💬 Gen.AI Front-end 알림     │
│                              │
│ 김OO                         │
│ 배포가 완료되었습니다.        │
│                              │
│ 10:32                        │
└──────────────────────────────┘
```

### 표시 데이터

| 데이터 | MVP |
|---|---|
| Space Name | O |
| Sender | O |
| Message Text | O |
| Created Time | O |
| Avatar | 제외 |
| Thread | 제외 |
| Attachment | 제외 |
| Reaction | 제외 |

---

## 9. Bubble 클릭

Bubble을 클릭하면 기본 브라우저에서 해당 Google Chat Space를 연다.

```text
Bubble Click
     ↓
Default Browser
     ↓
Google Chat
     ↓
해당 Space
```

```text
https://chat.google.com/room/{spaceId에서 "spaces/"를 뗀 값}
```

- `shell.openExternal`로 열고, URL은 `https://chat.google.com/` 로 시작하는지 검증한 뒤에만 연다.
- 클릭한 Bubble은 즉시 닫는다.

MVP에서는 특정 메시지 위치까지 이동하는 deep-link 기능은 후순위로 둔다.

---

## 9.1 Tray

앱은 **트레이 상주형**으로 동작한다. 설정 창을 닫아도 모니터링은 계속된다.

- macOS: Menu bar 아이콘 사용, Dock 아이콘 숨김
- Windows: System tray 아이콘 사용

```text
● 모니터링 중 (Space 3개)
─────────────
모니터링 일시정지
설정 열기
─────────────
로그아웃
종료
```

---

## 10. Electron Architecture

```text
┌─────────────────────────────────────┐
│              Electron               │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Main Process                  │  │
│  │                               │  │
│  │ - OAuth                       │  │
│  │ - Token 관리                  │  │
│  │ - Google Chat API             │  │
│  │ - Polling                     │  │
│  │ - Message Detection           │  │
│  │ - Window Management           │  │
│  └──────────────┬────────────────┘  │
│                 │ IPC                │
│  ┌──────────────▼────────────────┐  │
│  │ Renderer                      │  │
│  │                               │  │
│  │ React                         │  │
│  │ - Login UI                    │  │
│  │ - Space Settings              │  │
│  │ - Bubble UI                   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Main Process 담당

- Google OAuth
- Token 관리
- Google Chat API 호출
- Space별 Polling
- 새로운 메시지 판별
- Bubble Window 생성/제거
- Window 관리

### Renderer 담당

- React UI
- 로그인 화면
- Space 설정
- Bubble UI
- 연결 상태 표시

> Google API 호출은 Renderer가 아니라 Main Process에서 수행한다.

### 보안 기본값

- 모든 BrowserWindow: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Renderer는 preload의 `contextBridge`로 노출한 API만 사용한다.
- Renderer에 전달하는 정보: 로그인 여부, 사용자 이메일, Space 설정과 상태, Bubble 데이터
- Renderer에 **전달하지 않는** 정보: Access Token, Refresh Token, Client Secret
- 외부 URL 이동(`will-navigate`, `setWindowOpenHandler`)은 모두 차단한다.

---

## 11. 권장 프로젝트 구조

```text
google-space-bubble/
├─ docs/
│  └─ spec.md
├─ spike/                      # Phase 0 API 검증 스크립트
├─ src/
│  ├─ main/
│  │  ├─ index.ts
│  │  ├─ tray.ts
│  │  ├─ auth/
│  │  │  ├─ google-oauth.ts     # loopback + PKCE
│  │  │  └─ token-store.ts      # safeStorage
│  │  ├─ chat/
│  │  │  ├─ chat-client.ts
│  │  │  ├─ message-poller.ts
│  │  │  └─ backoff.ts
│  │  ├─ notification/
│  │  │  └─ bubble-window.ts
│  │  └─ store/
│  │     └─ app-store.ts        # electron-store
│  │
│  ├─ preload/
│  │  └─ index.ts               # contextBridge
│  │
│  ├─ renderer/
│  │  ├─ settings/              # 설정 창 (Login, Settings)
│  │  │  ├─ App.tsx
│  │  │  └─ pages/
│  │  │     ├─ Login.tsx
│  │  │     └─ Settings.tsx
│  │  └─ bubble/                # 오버레이 창
│  │     ├─ App.tsx
│  │     └─ MessageBubble.tsx
│  │
│  └─ shared/
│     ├─ types.ts
│     ├─ ipc.ts                 # IPC 채널과 payload 타입
│     └─ space-id.ts            # Space ID 정규화
│
├─ electron-builder.yml
├─ electron.vite.config.ts
├─ package.json
└─ README.md
```

---

## 12. 인증 흐름

```text
Electron
   │
   │ Google OAuth URL 생성
   ▼
Browser
   │
   │ Google Login
   ▼
Google
   │
   │ Authorization Code
   ▼
Local Callback
   │
   ▼
Electron Main
   │
   ├── Access Token
   └── Refresh Token
          │
          ▼
       Secure Storage
```

OAuth Client Secret이나 Refresh Token 등의 민감한 인증 정보를 Renderer에 노출하지 않는다.

---

## 13. 데이터 저장

MVP에서 로컬에 저장할 데이터:

```json
{
  "spaceId": "spaces/AAAA...",
  "spaceName": "Gen.AI Front-end 알림",
  "enabled": true,
  "lastMessageName": "spaces/AAAA/messages/BBBB...",
  "lastMessageTime": "2026-09-28T01:30:00Z"
}
```

실제 앱 설정은 여러 Space를 배열로 관리한다.

```json
{
  "monitoredSpaces": [
    {
      "spaceId": "spaces/AAAA...",
      "spaceName": "Gen.AI Front-end 알림",
      "enabled": true,
      "lastMessageName": "spaces/AAAA/messages/BBBB..."
    },
    {
      "spaceId": "spaces/CCCC...",
      "spaceName": "Gen.AI 소통",
      "enabled": true,
      "lastMessageName": "spaces/CCCC/messages/DDDD..."
    }
  ]
}
```

Token은 일반 JSON 설정 파일에 평문으로 저장하지 않는다.

- Electron **`safeStorage`**로 암호화한 뒤 `userData/tokens.bin`에 저장한다.
  - macOS → Keychain에 보관된 키로 암호화
  - Windows → DPAPI
- `safeStorage.isEncryptionAvailable()`이 false이면 token을 디스크에 저장하지 않는다. 이 경우 메모리에만 두고, 앱을 다시 켜면 재로그인한다.
- `keytar`는 deprecated이므로 사용하지 않는다.
- 로그아웃하면 token 파일을 삭제하고 Google token revoke 엔드포인트를 호출한다.

---

## 14. 예외 처리

### Google 인증 실패

```text
인증 실패
 ↓
로그인 화면
 ↓
다시 로그인
```

### Token 만료

```text
Access Token 만료
 ↓
Refresh Token
 ↓
새 Access Token
 ↓
Polling 계속
```

### 인터넷 연결 끊김

```text
API 요청 실패
 ↓
Polling 일시 실패
 ↓
재시도
```

사용자에게는 다음과 같이 간단히 표시한다.

```text
● Google Chat 연결 대기 중
```

### 특정 Space 접근 권한 상실

```text
API 403 / 404
 ↓
해당 Space 접근 불가
 ↓
Space 상태를 오류로 표시하고 해당 Space의 polling 중지
```

다른 Space의 모니터링은 계속 유지한다. 설정 화면의 [재시도] 버튼으로 다시 시작할 수 있다.

### Refresh Token 무효화

```text
invalid_grant (비밀번호 변경, 권한 철회, 관리자 정책 등)
 ↓
저장된 token 삭제
 ↓
모든 polling 중지
 ↓
로그인 화면
```

### 에러 코드별 처리 요약

| 응답 | 처리 |
|---|---|
| 401 | token 갱신 후 1회 재시도. 실패하면 로그인 화면으로 |
| 403 / 404 | 해당 Space만 오류 상태 |
| 429 | 모든 Space에 backoff 적용 |
| 5xx / 네트워크 오류 | 해당 Space에 backoff 적용 |

---

## 15. MVP 제외 범위

다음 기능은 MVP에서 구현하지 않는다.

- Google Workspace Events API
- Pub/Sub
- 별도 Backend
- Space 자동 검색/선택 UI
- 메시지 전송
- 메시지 수정/삭제
- Thread 표시
- 파일/이미지 Attachment
- Reaction
- 읽음 상태 동기화
- 메시지 검색
- 관리자용 배포 시스템
- 자동 업데이트
- 시스템 로그인 시 자동 실행
- 모바일 지원
- 특정 메시지까지 이동하는 deep-link

> 단, **여러 Space 동시 모니터링은 MVP 핵심 기능이므로 제외하지 않는다.**

---

## 16. MVP 완료 기준

체크는 **실제 앱에서 확인한 뒤에** 한다. 진행 표시:
🧪 단위 테스트로 로직 검증 · 👀 브라우저 mock에서 UI 확인 · 🔶 부분 확인 · 🔧 구현 완료, 실사용 검증 필요 · ⬜ 미착수

### Authentication

- [x] macOS에서 Google 로그인 가능
- [x] Google 권한 승인 가능
- [x] 앱 재실행 시 재로그인하지 않아도 됨
- [ ] Token 만료 시 갱신 가능 🔧

### Google Chat

- [x] 하나 이상의 Space 등록 가능
- [ ] 여러 Space를 동시에 모니터링 가능 🔧
- [x] Space별 메시지 조회 가능
- [ ] 새 메시지를 약 5~10초 이내 감지 🔧
- [ ] 앱 시작 시 기존 메시지가 알림으로 나오지 않음 🧪
- [ ] 동일 메시지가 중복 알림되지 않음 🧪
- [ ] 한 Space의 오류가 다른 Space의 모니터링을 중단시키지 않음 🧪

### UI

- [ ] 새 메시지 발생 시 Floating Bubble 표시 🔶 (테스트 알림으로 확인, 실제 메시지는 재확인 필요)
- [x] Space 이름 표시
- [x] Sender 표시
- [x] Message 표시
- [x] Created Time 표시
- [ ] 일정 시간 후 자동 제거 🔧
- [ ] 여러 메시지 발생 시 Stack 처리 👀
- [ ] Bubble 클릭 시 해당 Space 열기 🔧

### Platform

- [ ] macOS에서 정상 동작 🔶 (dmg 빌드·설치 앱 실행·자동 로그인·테스트 알림 확인)
- [x] Windows 빌드 가능 (macOS에서 NSIS x64 설치 파일 생성)
- [ ] Windows에서 핵심 기능 정상 동작 🔧 (Windows 실기기 검증 필요)

---

## 17. MVP 기술 스택

| 영역 | 기술 |
|---|---|
| Desktop | Electron |
| UI | React + TypeScript |
| Build | electron-vite + electron-builder |
| Google 인증 | OAuth 2.0 (loopback + PKCE), `google-auth-library` |
| Chat | Google Chat API REST v1 (`OAuth2Client.request`) |
| 상태 | React State (필요하면 Zustand) |
| Local Storage | `safeStorage` (token) + `electron-store` (설정) |
| 테스트 | macOS |
| Target | macOS / Windows |

---

## 18. 향후 확장 구조

MVP에서는 Polling으로 구현하고, 운영 환경에서 실시간성이 더 중요해지면 Google Workspace Events API 기반으로 확장한다.

### MVP

```text
Electron
   │
   └── 5초 Polling
          ↓
      Google Chat API
```

### 향후 Production

```text
Google Chat
     ↓
Workspace Events
     ↓
Pub/Sub
     ↓
Backend
     ↓
WebSocket / SSE
     ↓
Electron
     ↓
💬 Bubble
```

이렇게 하면 MVP에서는 서버 없이 최대한 단순하게 시작하고, 실제 사내 배포가 필요해졌을 때 Backend/Event 기반 구조로 확장할 수 있다.

---

## 19. MVP 한 줄 정의

> **Google OAuth로 1회 로그인한 뒤, 사용자가 등록한 하나 이상의 Google Chat Space를 주기적으로 조회하여 새로운 메시지를 macOS/Windows 화면의 Floating Bubble로 알리는 Electron 기반 데스크톱 앱.**

---

## 20. Open Issues

| # | 항목 | 확인 방법 | 상태 |
|---|---|---|---|
| 1 | 사용자 인증으로 `messages.list`를 호출했을 때 `sender.displayName`이 채워지는지 | Phase 0 Spike | ✅ 해결: HUMAN과 BOT 모두 채워짐 (HUMAN은 `email`도 포함) |
| 2 | Sender 이름 조회 방법 | 1의 결과 | ✅ 해결: `displayName`을 그대로 사용, People API 불필요 |
| 3 | 본인 식별 방법 | Spike | ✅ 해결: ID Token `sub`로 만든 `users/{sub}`가 Chat의 `sender.name`과 일치. email도 일치 |
| 4 | 사내 Admin 정책으로 내부 OAuth 앱이나 Chat API가 차단되어 있는지 | §0 설정 | ✅ 해결: 차단 없음, refresh token 정상 수신 |
| 5 | `createTime > "…"` filter 동작 | Phase 0 Spike | ✅ 해결: 정상 동작 |

---

## 21. 구현 단계

| Phase | 내용 | 예상 |
|---|---|---|
| 0 | API Spike (§20 Open Issues 해소) | 0.5~1일 |
| 1 | 프로젝트 골격 (electron-vite, preload, tray) | 0.5일 |
| 2 | OAuth / Token 저장 | 1~1.5일 |
| 3 | 설정 저장소 / Space 관리 UI | 1일 |
| 4 | Polling / 새 메시지 판별 / backoff | 1.5일 |
| 5 | Bubble Overlay UI | 1.5~2일 |
| 6 | 예외 처리 / Tray 상태 | 0.5일 |
| 7 | macOS / Windows 빌드 및 검증 | 1일 |
| | **합계** | **약 7.5~9일** |
