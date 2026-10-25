# Layered Pomodoro
![Electron](https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Web Audio](https://img.shields.io/badge/Sound-Web%20Audio-111)

여러 개의 뽀모도로 타이머를 **동심원 레이어**로 겹쳐 동시에 흘려보내는 데스크탑 앱.  
화면 위에는 배경이 투명한 **원형 시계**가 항상 떠 있고 드래그로 위치를 조정할 수 있다. 
레이어 설정은 용두 버튼(3시 방향 손잡이)을 눌러 여는 **팝업**에서 한다.

| 원형 시계 | 레이어 설정 팝업 |
| --- | --- |
| <img width="332" height="303" alt="image" src="https://github.com/user-attachments/assets/8403f647-adc6-44fc-a7d1-99fd78bd6778" /> | <img width="577" height="737" alt="image" src="https://github.com/user-attachments/assets/2d0a6e31-b6dc-41be-8d55-011722e49950" /> |


## 화면

| 창 | 모양 | 조작 |
| --- | --- | --- |
| 시계 | 280×280 투명·무테 원형 창. 항상 위 | 원 전체를 드래그해 옮길 수 있다. 용두 버튼을 누르면 설정 팝업 |
| 레이어 설정 | 500×660 팝업. | 탭 추가·전환·이름 변경·삭제, 레이어 추가·삭제·순서·색·시간 변경, 전체 리셋, 알림음 미리 듣기 |

- 시계 가운데에는 가장 먼저 끝나는 레이어의 이름과 남은 시간, 흐르는 레이어 수를 보여준다. 탭이 2개 이상이면 맨 위에 활성 탭 이름을 단다.
- 메뉴 `레이어 › 레이어 설정…`(⌘,), `시계 보이기`(⌘⇧L). Dock 아이콘을 눌러도 설정이 열린다.

## 기능

| 기능 | 동작 |
| --- | --- |
| 탭 1~8개 | 탭마다 레이어 목록이 따로 있다. 시계와 설정은 활성 탭을 보여주고, 레이어 명령도 활성 탭에 적용된다 |
| 탭 전환 | 떠나는 탭의 레이어는 시간이 멈추고(탭에 일시정지 표시), 돌아오면 멈춘 시간부터 이어서 흐른다. 앱을 꺼 둔 동안에도 비활성 탭은 멈춰 있다 |
| 탭 관리 | `+ 탭`으로 추가(바로 활성), 활성 탭을 더블클릭해 이름 변경, ×를 3초 안에 두 번 눌러 삭제(레이어도 함께). 마지막 1개는 지울 수 없다 |
| 레이어 1~10개 | 추가하면 바로 흐르기 시작한다. 탭마다 마지막 1개는 지울 수 없다 |
| 상태 | `흐르는 중` → 시간이 다 되면 `종료됨`. 종료된 레이어는 ↻로 다시 시작 |
| 시간 수정 | 각 레이어의 분 입력칸을 고치고 Enter. 그 레이어는 새 시간으로 처음부터 다시 흐른다(종료된 레이어도) |
| 전체 리셋 | 활성 탭의 모든 레이어를 처음 시간부터 다시 흐르게 한다. 실수 방지를 위해 3초 안에 두 번 눌러야 실행 |
| 알림 | 레이어가 끝나면 종소리(Web Audio, 파일 없음) + 링 깜빡임 + macOS 알림 + Dock 바운스 |
| 순서 변경 | 설정에서 줄을 끌어 놓거나 ↑ ↓. 목록 첫 레이어가 가장 바깥 링 |
| 색상 변경 | 색 동그라미를 눌러 팔레트에서 고른다. 같은 탭의 다른 레이어가 쓰는 색은 고를 수 없다(다른 탭과는 겹쳐도 된다) |
| 저장 | `userData/layers.json`(탭·레이어 전체). 앱을 꺼 둔 사이 끝난 레이어(활성 탭)는 소리 없이 종료됨으로 표시. 탭 이전 형식(레이어 배열)은 `Tab 1` 하나로 자동 이전 |

## 실행

```bash
pnpm dev:pomodoro      # 루트에서
pnpm --filter @ux-lab/layered-pomodoro test
```

## 앱으로 빌드 (macOS, Apple Silicon)

```bash
pnpm --filter @ux-lab/layered-pomodoro icon       # build/icon.png·icon.icns 다시 만들기 (아이콘을 바꿀 때만)
pnpm --filter @ux-lab/layered-pomodoro dist:mac   # dist/에 .dmg와 mac-arm64/Layered Pomodoro.app
```

- Developer ID 인증서 없이 ad-hoc 서명이라, 다른 Mac에서 처음 열 때는 Finder에서 우클릭 › 열기로 한 번 허용해야 한다.
- 설치한 앱과 `pnpm dev:pomodoro`는 같은 저장 폴더(`~/Library/Application Support/@ux-lab/layered-pomodoro`)를 써서 레이어가 이어지고, 동시에 두 개가 뜨지 않는다.

## 구조

```
src/
  main/
    index.ts           IPC 연결, 메뉴, 종료 알림(시스템 알림·Dock 바운스)
    store.ts           탭·레이어 상태의 단일 원본. 250ms tick(활성 탭), layers.json 저장
    windows.ts         시계 창(투명·항상 위)과 설정 팝업 창
  preload/index.ts     window.api 노출
  shared/
    layers.ts          레이어 규칙(추가·삭제·순서·색·tick) — 순수 함수
    tabs.ts            탭 규칙(추가·삭제·전환 시 멈춤/재개·이전 형식 이전) — 순수 함수
    commands.ts        설정 창 → main 명령 검증·적용
    ipc.ts             채널 이름과 Api 타입
  renderer/
    clock/             원형 시계 (다이얼·링·용두, 종소리)
    settings/          레이어 설정 팝업 (탭 바·목록·색 팔레트·추가 폼·드래그 정렬)
    shared/            api(브라우저 미리보기용 대체 구현 포함), rings, chime, base.css
```

**시간/레이어 상태:** 상태는 main 프로세스가 가진다. 두 창은 `state:changed`를 구독하고 변경은 명령(`state:command`)으로만 보내며, main이 `parseCommand`로 검증한 뒤 적용한다. 시간은 남은 초를 깎지 않고 종료 시각(`endsAt`)과 현재 시각의 차로 계산한다. 비활성 탭은 멈춘 시각(`pausedAt`)을 남기고, 다시 활성이 되면 흐르던 레이어의 종료 시각을 멈춰 있던 만큼 뒤로 민다. 시계 창은 가려져도 늦지 않도록 `backgroundThrottling: false`, 알림음이 사용자 입력 없이 나도록 `autoplayPolicy: 'no-user-gesture-required'`를 켰다.

**브라우저로 열기**(개발용): `out/renderer`를 정적 서버로 열면 브라우저에서도 `clock/`, `settings/` 화면을 볼 수 있다. 이때는 `window.api` 대신 localStorage로 같은 규칙을 흉내 내는 대체 구현을 쓴다
