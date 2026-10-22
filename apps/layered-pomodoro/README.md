# Layered Pomodoro

여러 개의 뽀모도로 타이머를 **동심원 레이어**로 겹쳐 동시에 흘려보내는 데스크탑 앱.
화면 위에는 배경이 투명한 **원형 시계**만 떠 있고, 레이어 설정은 용두(3시 방향 손잡이)를 눌러 여는 **팝업**에서 한다.
흰 원판, 굵은 선과 눈금, 기하학 산세리프(Jost), 유럽 안료에서 따온 팔레트로 꾸민 유럽 편집 디자인 스타일. 멀리서도 읽히는 명시성을 우선한다.

![Electron](https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Web Audio](https://img.shields.io/badge/Sound-Web%20Audio-111)

## 화면

| 창 | 모양 | 조작 |
| --- | --- | --- |
| 시계 | 280×280 투명·무테 원형 창. 항상 위, 모든 데스크탑·전체 화면에서 보임 | 원 전체를 끌어 옮긴다. 용두를 누르면 설정 팝업 |
| 레이어 설정 | 500×660 팝업. 시계 옆(왼쪽 우선)에 열림 | 레이어 추가·삭제·순서·색·시간 변경, 전체 리셋, 알림음 미리 듣기 |

- 시계 가운데에는 가장 먼저 끝나는 레이어의 이름과 남은 시간, 흐르는 레이어 수를 보여준다.
- 메뉴 `레이어 › 레이어 설정…`(⌘,), `시계 보이기`(⌘⇧L). Dock 아이콘을 눌러도 설정이 열린다.

## 기능

| 기능 | 동작 |
| --- | --- |
| 레이어 1~10개 | 추가하면 바로 흐르기 시작한다. 마지막 1개는 지울 수 없다 |
| 상태 | `흐르는 중` → 시간이 다 되면 `종료됨`. 종료된 레이어는 ↻로 다시 시작 |
| 시간 수정 | 각 레이어의 분 입력칸을 고치고 Enter. 그 레이어는 새 시간으로 처음부터 다시 흐른다(종료된 레이어도) |
| 전체 리셋 | 모든 레이어를 처음 시간부터 다시 흐르게 한다. 실수 방지를 위해 3초 안에 두 번 눌러야 실행 |
| 알림 | 레이어가 끝나면 종소리(Web Audio, 파일 없음) + 링 깜빡임 + macOS 알림 + Dock 바운스 |
| 순서 변경 | 설정에서 줄을 끌어 놓거나 ↑ ↓. 목록 첫 레이어가 가장 바깥 링 |
| 색상 변경 | 색 동그라미를 눌러 팔레트에서 고른다. 다른 레이어가 쓰는 색은 고를 수 없다 |
| 저장 | `userData/layers.json`. 앱을 꺼 둔 사이 끝난 레이어는 소리 없이 종료됨으로 표시 |

색은 겹칠 수 없으므로 레이어 최대 개수는 팔레트 크기(10색: Burgundy, Terracotta, Ochre, Olive, Sage, Prussian Blue, Delft Blue, Lavender, Dusty Rose, Slate)와 같다.

## 실행

```bash
pnpm dev:pomodoro      # 루트에서
pnpm --filter @ux-lab/layered-pomodoro test
```

## 구조

```
src/
  main/
    index.ts           IPC 연결, 메뉴, 종료 알림(시스템 알림·Dock 바운스)
    store.ts           레이어 상태의 단일 원본. 250ms tick, layers.json 저장
    windows.ts         시계 창(투명·항상 위)과 설정 팝업 창
  preload/index.ts     window.api 노출
  shared/
    layers.ts          레이어 규칙(추가·삭제·순서·색·tick) — 순수 함수
    commands.ts        설정 창 → main 명령 검증·적용
    ipc.ts             채널 이름과 Api 타입
  renderer/
    clock/             원형 시계 (다이얼·링·용두, 종소리)
    settings/          레이어 설정 팝업 (목록·색 팔레트·추가 폼·드래그 정렬)
    shared/            api(브라우저 미리보기용 대체 구현 포함), rings, chime, base.css
```

상태는 main 프로세스가 가진다. 두 창은 `layers:changed`를 구독하고 변경은 명령(`layers:command`)으로만 보내며, main이 `parseCommand`로 검증한 뒤 적용한다.
시간은 남은 초를 깎지 않고 종료 시각(`endsAt`)과 현재 시각의 차로 계산한다. 시계 창은 가려져도 늦지 않도록 `backgroundThrottling: false`, 알림음이 사용자 입력 없이 나도록 `autoplayPolicy: 'no-user-gesture-required'`를 켰다.

`out/renderer`를 정적 서버로 열면 브라우저에서도 `clock/`, `settings/` 화면을 볼 수 있다. 이때는 `window.api` 대신 localStorage로 같은 규칙을 흉내 내는 대체 구현을 쓴다(디자인 확인용).
