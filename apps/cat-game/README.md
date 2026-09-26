<div align="center">

# 고양이의 결정

**상황만 알려주세요. 행동은 고양이가 결정합니다.**

[**▶ 지금 플레이하기**](https://cat-game-wheat-sigma.vercel.app/)

<sub>개발 문서는 [Developer Notes](#developer-notes)에 있어요.</sub>

<a href="https://cat-game-wheat-sigma.vercel.app/"><img src="./docs/promo/feature-graphic.webp" alt="고양이의 결정 — 상황만 알려주세요. 행동은 고양이가 결정합니다." width="720"></a>

</div>

## 게임 소개

"초인종이 울렸다", "바퀴벌레가 나타났다!" 같은 **상황을 한 줄 적으면**, 고양이가 자기 성격과 지금 기분에 따라 **스스로 행동을 정합니다.** 어떤 행동을 할지 확률도 함께 볼 수 있어요.
같은 상황이라도 겁쟁이는 숨고, 장난꾸러기는 달려들고, 도도한 고양이는 못 본 척해요. 고양이를 바꿔 가며 반응을 비교해 보세요.

<table>
  <tr>
    <td align="center"><img src="./docs/promo/screenshot-1-start.webp" alt="시작 화면" width="200"></td>
    <td align="center"><img src="./docs/promo/screenshot-2-select.webp" alt="성격 선택 화면" width="200"></td>
    <td align="center"><img src="./docs/promo/screenshot-3-decision.webp" alt="장난꾸러기 고양이의 결정 결과" width="200"></td>
    <td align="center"><img src="./docs/promo/screenshot-4-timid.webp" alt="겁쟁이 고양이의 결정 결과" width="200"></td>
  </tr>
</table>

## 플레이 방법

1. **집사와 고양이를 정해요.** 집사 이름·성별, 고양이 성격·이름(기본 `Jev`, 최대 10자)·성별·나이를 고릅니다.
2. **상황을 알려주세요.** 직접 쓰거나 예시 칩을 눌러도 좋아요.
3. **고양이의 결정을 확인해요.** 선택한 행동, 행동별 확률, 놀람·즐거움·확신 게이지와 기분이 나옵니다.
4. **함께 자라요.** 상황을 2번 겪을 때마다 한 달씩 자라고, 결정은 기록 탭에 쌓입니다.

이런 상황을 넣어 보세요: `초인종이 울렸다` · `주인이 참치캔을 딴다` · `낯선 택배 상자가 도착했다` · `창밖에 새가 날아왔다` · `청소기 소리가 켜졌다` · `천둥이 크게 쳤다`

## 고양이 성격 5가지

| | 성격 | 돌봄 난이도 | 이런 고양이예요 |
| :---: | --- | :---: | --- |
| <img src="./docs/promo/type-timid.webp" alt="겁쟁이" width="72"> | **겁쟁이** | 보통 | 작은 소리에도 깜짝 놀라는 새가슴. 큰 소리나 낯선 존재가 나타나면 먼저 숨어요 |
| <img src="./docs/promo/type-playful.webp" alt="장난꾸러기" width="72"> | **장난꾸러기** | 어려움 | 움직이는 건 일단 잡고 보는 에너자이저. 지치면 금세 곯아떨어져요 |
| <img src="./docs/promo/type-aloof.webp" alt="도도한" width="72"> | **도도한** | 보통 | 대부분 못 본 척해요. 귀찮게 하면 하악질! |
| <img src="./docs/promo/type-glutton.webp" alt="먹보" width="72"> | **먹보** | 쉬움 | 음식이라면 무조건 먹으러 가요. 배부르면 낮잠 시간 |
| <img src="./docs/promo/type-explorer.webp" alt="모험가" width="72"> | **모험가** | 어려움 | 새로운 건 먼저 살펴봐요. 흥미가 식으면 다른 곳으로 떠나요 |

돌봄 난이도는 성격별 행동 성향으로 본 기준이에요. 에너지를 많이 쓰는 성격일수록 게이지 관리가 어렵고, 먹는 걸 좋아하는 성격은 쉬워요. 실제 결과는 상황에 따라 달라져요.

성격을 못 고르겠다면 **랜덤**을 눌러 보세요. 시작하는 순간 다섯 성격 중 하나로 정해져요.

## 하트와 돌봄

상태 카드에는 **하트 5칸**이 있어요. 포만감·에너지·친밀도 중 하나라도 0이 되면 하트가 한 칸 줄고, 게이지가 가득 차면 다음 턴에 한 칸 차올라요. 하트가 모두 사라지면 게임이 끝나요.
같은 상황이 반복되면 익숙해져서 덜 놀라고, 같은 행동이 이어지면 싫증도 내요. 친밀도가 높은 고양이는 골골거리며 다가와요.

## 영상으로 보기

[![바퀴벌레 등장! 고양이의 결정은? — 쇼츠 썸네일](./docs/promo/shorts-thumbnail.webp)](https://www.youtube.com/shorts/bqDxxiKSjlg)

[▶ 유튜브 쇼츠](https://www.youtube.com/shorts/bqDxxiKSjlg) · [▶ 인스타그램 릴스](https://www.instagram.com/reel/Ddoot83Szbg/)

## 유의사항

- 진행 상태(고양이·집사 설정, 스탯, 하트, 기록)는 **내 브라우저에만** 자동 저장돼요. 새로고침해도 이어서 할 수 있고, 고양이를 바꾸면 기존 저장은 초기화돼요.
- 입력한 상황은 고양이의 결정을 만들기 위해 AI 모델(OpenRouter)로 전송돼요. 개인정보는 입력하지 마세요.
- 서버가 응답하지 못하면 성격과 상태로 고르는 **본능 결정**으로 대신하고, 그 이유를 결과에 보여줘요.

---

# Developer Notes

사용자가 **상황**을 입력하면, 고양이가 타입별 행동 패턴과 현재 상태를 바탕으로 **스스로 행동을 결정**하는 게임입니다.
결정은 OpenRouter의 decisions 모델 `~typesafe/jev-latest`(Jev)가 내립니다.

## 시작하기

### 배포

**배포**: [cat-game-wheat-sigma.vercel.app](https://cat-game-wheat-sigma.vercel.app/)
프록시(`openrouter-proxy`)는 별도 Vercel 프로젝트 `cat-game-proxy`로 배포되어 있고, `VITE_PROXY_URL` 환경변수로 프론트와 연결됩니다.

### 실행

```bash
pnpm dev:openrouter   # 프록시 (http://localhost:3035, apps/openrouter-proxy/.env 의 OPENROUTER_KEY 필요)
pnpm dev:cat          # 게임   (http://localhost:5180)
```

프록시 주소가 다르면 `apps/cat-game/.env`에 `VITE_PROXY_URL`을 지정합니다. (`.env.example` 참고)

## 동작 방식

### 결정 요청 흐름

1. 사용자가 상황을 입력 (예: "초인종이 울렸다")
2. 클라이언트가 `state`(고양이 타입·성격·행동 패턴·성향·배고픔/에너지/친밀도·최근 사건 3개·상황)와
   `questions`를 만들어 `POST /api/decisions`로 전송
3. Jev가 아래 3개 질문에 답함
   - `action` (choice): 8개 행동 중 하나 + 행동별 확률
   - `mood` (choice): 결정 후 기분
   - `startled` (noul): 깜짝 놀랐을 확률
4. 선택된 행동에 따라 스탯이 변하고 로그에 확률 상위 3개가 표시됨
5. 프록시 호출이 실패(타임아웃 등)하면 타입별 가중치 + 상태(배고픔/피곤)로 고르는 **본능** 결정으로 대체하고 로그에 표시

### 시작 흐름

단계를 하나씩 통과하는 퍼널 구조입니다.

```mermaid
flowchart LR
  A[시작] --> B["1단계 집사는?<br/>이름·성별"]
  B --> C["2단계 고양이는?<br/>성격·이름·성별·나이"]
  C --> D[일상 채팅]
  D <--> E[기록]
  S([저장된 진행 상태]) -. 있으면 건너뜀 .-> D
```

- 집사는 이름(기본 `집사`, 최대 10자)과 성별(여자/남자)만 정합니다. 성별에 맞는 아바타가 채팅에서 내 말풍선 옆에 이름과 함께 표시되고, 이름·성별은 jev에게도 전달됩니다.
- 성격 목록의 마지막 칸은 **랜덤**입니다. 고르면 시작하는 순간 다섯 성격 중 하나로 정해집니다.
- 고양이를 바꾸면 기존 기록을 초기화하고 1단계부터 다시 시작합니다.

### 행동 판정

고양이는 **확률이 가장 높은 행동**을 합니다. jev 응답은 화면의 확률 표에서 1위인 행동을 그대로 쓰고, 본능 결정도
타입 가중치 + 상태 + 상황(시드)으로 확률을 만든 뒤 1위를 고릅니다(같은 상황·같은 턴이면 같은 결과).

### 세션 기록에 따라 달라지는 4가지 (멀티턴, `features/cat/session.ts`)

이전 턴들의 기록이 아래 4가지로 이번 반응에 영향을 주고, jev 요청의 `state.session`에도 요약되어 전달됩니다.
영향을 준 항목은 말풍선 아래 칩으로 표시됩니다.

| 항목 | 조건 | 효과 |
|---|---|---|
| 익숙해짐 | 같은 상황을 다시 겪음(공백·문장부호 무시) | 놀람 게이지가 반복마다 ×0.6 |
| 싫증 | 같은 행동이 2번 이상 이어진 뒤 또 같은 행동 | 에너지 -5 추가, 본능 결정에서는 그 행동 가중치 ×0.5 |
| 유대 | 친밀도 ≥ 70(친밀) / ≤ 20(경계) | 울음소리 끝이 `골골~` / `…`, 본능 결정에서 다가감·숨음 가중치 조정 |
| 기분 | 평온이 아닌 같은 기분이 2턴 연속 | 본능 결정에서 그 기분에 맞는 행동 가중치 상승(불안→숨기 등) |

### 결정 실패(본능 대체)

프록시 호출이 실패하면 타입별 성향 + 상태(배고픔·피곤)로 고르는 **본능 결정**으로 대체하고, 차트 제목에 이유를 표시합니다.
`서버에 연결할 수 없어요`(프록시 꺼짐/주소 오류) · `jev의 응답이 늦어졌어요`(25초 초과, 프록시 504) · `서버에서 오류가 났어요` · `jev의 응답을 읽지 못했어요`.
본능 결정에는 놀람·확신 게이지가 없고 확률은 성향 가중치입니다.

### 하트(체력)

상태 카드 우측 상단에 하트 5칸이 있습니다(`features/cat/turn.ts`에서 정산).

- 한 턴의 결과로 0이 된 게이지(포만감·에너지·친밀도)가 하나라도 있으면 하트가 한 칸 줄어듭니다(한 턴에 최대 1칸).
- 게이지가 100%가 되면 **다음 턴**에 하트가 한 칸 차오르고, 새로 찬 칸이 반짝입니다. 같은 턴에 줄어들면 상쇄됩니다.
- 하트가 모두 없어지면 입력창 대신 "다시하기"가 나옵니다.

### 나이

고양이는 **1개월**부터 시작해, 상황을 2번 겪을 때마다 한 달씩 자랍니다(`age.ts`). 나이와 성장 단계(아기/청소년/성묘)는 Jev에게 함께 전달되어 행동 판단에 반영됩니다. 타입을 바꾸면 1개월로 초기화됩니다.

### 자동 저장

게임 진행 상태(고양이·집사 설정, 스탯, 하트, 기록)는 브라우저 `localStorage`에 자동 저장됩니다.
페이지를 새로고침해도 이어서 플레이할 수 있고, 고양이를 변경하면 기존 저장 상태는 초기화됩니다.

### 고양이 타입 (`features/cat/catTypes.ts`)

| id | 성격 | 가장 높은 성향 | 한 턴 평균 게이지 변화 (포만감 / 에너지 / 친밀도) | 돌봄 난이도 |
|---|---|---|---|---|
| `timid` | 겁쟁이 | 숨는다 0.25 | +0.9 / +0.1 / +1.4 | 보통 |
| `playful` | 장난꾸러기 | 장난친다 0.27 | -0.2 / -2.9 / +2.5 | 어려움 |
| `aloof` | 도도한 | 무시한다 0.25 | +0.8 / +0.3 / +0.5 | 보통 |
| `glutton` | 먹보 | 먹는다 0.27 | +6.7 / +2.6 / +2.0 | 쉬움 |
| `explorer` | 모험가 | 살펴본다 0.27 | +0.3 / -2.4 / +1.5 | 어려움 |

- 평균 변화는 `weights`(행동 성향)에 `actions.ts`의 행동별 게이지 변화를 곱해 더한 기대값입니다(본능 결정 기준). Jev의 실제 결정은 상황에 따라 달라지므로 돌봄 난이도는 참고용입니다.
- 새 타입은 `catTypes.ts`에 항목을 추가하면 UI·요청·본능 결정에 모두 반영됩니다.

## 화면·UI

### 화면과 결정 차트

시작 → 고양이 선택 → 일상(채팅형 상황 입력) → 기록 흐름의 모바일 UI입니다. 고양이 변경은 하단 네비 중앙의 프로필 버튼으로 합니다. 데스크톱(430px 이상)에서는 390×844 기기 프레임을 가운데에 고정해 보여줍니다.
고양이 답변 말풍선에 jev 응답이 차트로 표시됩니다.

- 행동별 확률 막대 (선택된 행동 강조, 이모지 없음)
- 반올림해서 0%인 행동은 막대 대신 점차 흐려지는 스켈레톤 2줄로 접음 (접근성 라벨에 행동 이름 포함)
- 놀람·확신 원형 게이지, 기분

### 기록 화면

- 상단 카드: "{이름}와 함께한 시간"(상황 2번마다 한 달) · 결정 횟수 · 나이
- 최근 결정: 행동에 따라 다른 고양이 이미지
- 통계: 행동별 횟수 세로 막대 그래프(가장 많이 한 행동 강조)

### 반응형

- 마우스가 있는 넓은 데스크톱(폭 1024px 이상)은 390×844 폰 프레임을 가운데에 고정해 보여주고, 창이 낮으면 비율대로 줄입니다.
- 그보다 좁은 화면(큰 폰·작은 태블릿·좁은 창)과 터치 기기는 프레임 없이 모바일 레이아웃입니다(폭 431px 이상이면 최대 500px 컬럼을 가운데에 둡니다). `viewport-fit=cover`와 `env(safe-area-inset-*)`로 노치·홈 인디케이터를 피하고, 키보드가 열리면 화면 높이가 함께 줄어듭니다(`interactive-widget=resizes-content`).
- 키 ≤ 740px, ≤ 700px, ≤ 520px와 폭 ≤ 360px 구간에서 여백·크기를 줄여, 320×568까지 선택 화면이 스크롤 없이 들어갑니다.

> 높이(`max-height`/`min-height`) 기준의 반응형 규칙은 실제 모바일·태블릿에만 적용합니다. 데스크톱의 폰 프레임은 항상 390×844 안쪽 크기라, 창 높이에 따라 규칙이 바뀌면 오히려 넘칠 수 있기 때문입니다(창이 낮으면 프레임 전체를 비율대로 줄입니다).

### 모바일 키보드

터치 기기(`pointer: coarse`)에서만 동작합니다(`useKeyboardOpen.ts`).

- 입력창에 포커스가 있고 보이는 영역(`visualViewport`)이 120px 이상 줄면 키보드가 열린 것으로 보고 `.phone--keyboard`를 붙입니다. 이때 상단 게이지는 한 줄로 줄고(128px → 60px), 예시 칩과 하단 메뉴는 숨겨 채팅 영역을 넓힙니다.
- 보이는 영역 높이(`--vvh`)와 위쪽 오프셋(`--vv-top`)을 `.phone`에 반영해, 레이아웃 뷰포트가 줄지 않는 iOS Safari에서도 키보드 위로 화면이 맞춰집니다.
- 모바일에서는 결정이 끝나도 자동으로 입력창에 포커스하지 않고, 전송하면 입력창 포커스를 풀어 키보드를 닫습니다. 데스크톱은 기존처럼 자동 포커스합니다.

## 에셋

### 스프라이트

`assets/sprite-sheet.webp` 원본에서 `scripts/slice-sprites.py`로 `public/sprites/*.png`(투명 배경)를 잘라냅니다.

```bash
python3 apps/cat-game/scripts/slice-sprites.py   # 저장소 루트에서 실행. Pillow, numpy, scipy 필요
```

시트에는 주황 고양이만 있어 타입별 색은 CSS 필터로 만듭니다(`CatAvatar.tsx`의 `TYPE_FILTER`).
원본 조각이 약 110px라 확대하면 흐려지므로, 이미지는 원본 크기 이하로만 표시합니다(랜딩 고양이 120px, 소품 30~70px).
랜딩(`StartScreen`)은 방 일러스트 배경 위에 뒷모습 고양이(`cat-back`)를 애니메이션 없이 정중앙에 두고, 나무 판 타이틀과 소품에만 CSS 애니메이션을 줍니다. `prefers-reduced-motion`에서는 멈춥니다.

### 집사·버튼 시트

`assets/sheet-ui.webp`(집사 캐릭터·텍스트 버튼)는 배경이 투명한 시트입니다. `scripts/sheet_utils.py`가 손실 압축으로 남은
알파 잔상을 정리한 뒤 `scripts/slice-owner-ui.py`가 집사 아바타(`owner-*.png`, `owner-*-head.png`)와 이미지 버튼(`btn-*.png`)을 잘라냅니다.

```bash
python3 apps/cat-game/scripts/slice-owner-ui.py
```

`assets/sheet-owner.webp`(집사 캐릭터 시트)는 캐릭터 대신 하단 네비 아이콘 판(`nav-plate-*.png`)을 자르는 데 씁니다.

### 배경

- 랜딩 배경: `public/backgrounds/main.webp` (방 일러스트)
- 집사 선택 배경: `public/backgrounds/owner-room.webp` (침실 일러스트, 확대 없이 카드 폭에 맞춰 아래쪽 기준으로 자름)
- 페이지 하단 잔디: `public/backgrounds/grass.webp` (투명 배경, 폭 100%로 깔고 폰 양옆에 소품 배치)

## 폴더 구조

```
apps/cat-game/
├── index.html
├── package.json              # dev(5180) · build · preview
├── vite.config.ts
├── tsconfig.json · tsconfig.node.json
├── .env.example              # VITE_PROXY_URL
│
├── src/
│   ├── main.tsx              # 진입점
│   ├── App.tsx               # 화면 전환(start → select → main), 고양이 변경 확인
│   ├── index.css             # 전체 스타일(폰 프레임·반응형·애니메이션)
│   ├── usePhoneFit.ts        # 데스크톱 폰 프레임 크기 맞춤
│   ├── useKeyboardOpen.ts    # 모바일 키보드 열림 감지
│   └── features/cat/
│       ├── actions.ts        # 8개 행동, 스탯 변화, 서술
│       ├── age.ts            # 나이(1개월 시작)와 성장 단계
│       ├── catTypes.ts       # 타입별 성격·패턴·성향 가중치
│       ├── owners.ts         # 집사 성별·이름, 아바타 매핑
│       ├── profile.ts        # 선택 화면에서 정하는 고양이·집사 설정
│       ├── types.ts          # 스탯·기분·턴 로그 타입
│       ├── turn.ts           # 한 턴 정산(스탯 변화, 하트 증감)
│       ├── session.ts        # 멀티턴 기록 반영(익숙해짐·싫증·유대·기분)
│       ├── decideApi.ts      # Jev 요청 생성 + 응답 zod 검증
│       ├── instinct.ts       # 오프라인 본능 결정
│       ├── expression.ts     # 행동 → 표정(스프라이트) 매핑
│       ├── meow.ts           # 타입 × 행동별 울음소리
│       ├── spriteSizes.ts    # 스프라이트 원본 크기 (자동 생성, 직접 수정 금지)
│       ├── useCatGame.ts     # 게임 상태 훅(저장·복원 포함)
│       └── components/
│           ├── StartScreen · SelectScreen · RecordsScreen        # 화면
│           ├── ChatThread · ChatInput · DecisionChart            # 채팅·결정 차트
│           ├── CatStatus · Hearts · GameOverBar · BottomNav      # 상태·하트·하단 메뉴
│           ├── ConfirmLeaveDialog · PatternCard                  # 고양이 변경 확인·성격 카드
│           ├── CatAvatar · OwnerAvatar · Sprite · ImageButton    # 스프라이트 기반 UI
│           └── PullCat · Copyright
│
├── public/                   # 배포에 포함되는 정적 파일
│   ├── sprites/              # 투명 PNG (scripts/slice-*.py 로 생성)
│   └── backgrounds/          # 랜딩·집사 선택·잔디 배경 (webp)
├── assets/                   # 스프라이트 시트 원본 (배포 제외)
│   ├── sprite-sheet.webp     # 고양이·소품·말풍선
│   ├── sheet-ui.webp         # 집사·텍스트 버튼
│   └── sheet-owner.webp      # 하단 네비 아이콘 판
├── scripts/                  # 에셋 가공 (Python)
│   ├── slice-sprites.py      # sprite-sheet → public/sprites
│   ├── slice-owner-ui.py     # sheet-ui/owner → 집사 아바타·버튼·네비 판
│   ├── sheet_utils.py        # 시트 알파 정리·조각 분리 공용 함수
│   ├── gen-sprite-sizes.py   # → src/features/cat/spriteSizes.ts
│   └── optimize-backgrounds.py
└── docs/promo/               # README용 홍보 이미지 (배포 제외)
```

## 라이선스

© 2026 Dusunax. All Rights Reserved.

화면의 저작권 표기(`Copyright.tsx`)는 현재 연도를 따라갑니다. 넓은 데스크톱에서는 페이지 하단(잔디 위), 좁은 화면과 모바일에서는 랜딩 하단에 한 번만 표시됩니다.
