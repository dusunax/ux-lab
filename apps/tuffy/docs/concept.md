# Tuffy 컨셉

[← README](../README.md) · [동작](behavior.md) · [결정 기록](decisions.md)

## 한 줄

**말을 걸면 스스로 생각하고, 감정과 몸짓으로 대답하는 원형 데스크탑 친구.**

입력을 받으면 '뇌'가 판단하고, 그 결과는 감정·움직임 같은 **상태값 변경**으로 나타난다. 몸(화면)은 상태값만 받아 그린다. 그래서 같은 화면을 데스크탑 창에도, 원형 AMOLED 기기에도 그대로 띄울 수 있다.

## 캐릭터

리시언(Lithian) 외계 과학자 **터피(Tuffy)**.

- 바위 등딱지, 다리 다섯 개, **눈이 없다**
- **화음으로 말한다** — 감정마다 정해진 화음이 울린다
- 과학과 친구를 좋아하고, 친구가 힘들면 걱정하며 같이 고치자고 한다
- 말투: 아주 짧고 단순하게, 조사를 자주 생략한다. 강조는 세 번 반복("좋아 좋아 좋아!"), 질문은 끝에 ", 질문?"

> 『프로젝트 헤일메리』에 대한 오마주. 캐릭터·종족 고유명사만 바꾸고(Rocky → Tuffy, Eridian → Lithian), 말버릇과 라벨(`AMAZE`, `~, 질문?`)은 아는 사람은 알아보도록 남겨 두었다.

## 표현

눈이 없으니 얼굴 대신 몸 전체로 표현한다.

| 수단 | 무엇을 보여 주나 |
|---|---|
| 다리 다섯 개 | 동작 8가지 — 가만히 숨쉬기(idle), 쫙 펴기(perk), 두드리며 생각(think), 통통(bounce), 서성임(scuttle), 손 흔들기(wave), 움츠려 떨기(shiver), 몸 말고 잠(curl) |
| 숨구멍(vent) | 감정 색으로 발광, 흥분할수록 빠르게 깜빡 |
| 바깥 호 | 각성도만큼 차오르는 감정 색 링 |
| 화음 | 감정별 화음과 흩날리는 음표 |
| 아래 호 글자 | 한 줄 대답, 생각할 때는 "생각 중 · · ·" |

<table>
  <tr>
    <td align="center"><img src="https://github.com/user-attachments/assets/e3ff6f41-77e7-486a-afcc-ed1bb5208a03" width="180" alt="평온" /><br /><sub>CALM · IDLE</sub></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/5fa25f14-f183-4f12-9e47-e6cf1e25a925" width="180" alt="신남" /><br /><sub>AMAZE · BOUNCE</sub></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/aa3a8767-4927-4b2e-9930-1b37dfd66e24" width="180" alt="졸림" /><br /><sub>SLEEPY · CURL</sub></td>
  </tr>
</table>

### 감정·색·화음

| 감정 | 색 | 화음 |
|---|---|---|
| calm 평온 | ![](https://img.shields.io/badge/-%236fe7ff-6fe7ff) | Cmaj7 |
| curious 궁금 | ![](https://img.shields.io/badge/-%23ffc857-ffc857) | Dsus4↑ |
| amaze 신남 | ![](https://img.shields.io/badge/-%23ff6fb5-ff6fb5) | C↑↑ |
| worried 걱정 | ![](https://img.shields.io/badge/-%23ff8a5b-ff8a5b) | Am |
| sleepy 졸림 | ![](https://img.shields.io/badge/-%238c9bff-8c9bff) | G5↓ |
| focus 집중 | ![](https://img.shields.io/badge/-%237cffb2-7cffb2) | F5 |

## 디자인 원칙

- **원형 466×466 AMOLED 우선** — 순흑 배경, 점등 픽셀 최소화, 2px/분 픽셀 시프트(번인 방지). 데스크탑 창(300px)도 같은 화면을 축소해 띄운다.
- **눈 없음, 화음만** — 탑뷰 5족 대칭 몸체, 다리 포즈, 숨구멍 발광, 화음 음표로 감정을 표현한다. 얼굴을 덧붙이지 않는다.
- **개발자스러운 키치** — Silkscreen + Nanum Gothic Coding(@fontsource 번들, 오프라인 동작), 스티커 라벨, 터미널 같은 사고 로그.
- **생각이 보이게** — 뇌 콘솔에서 무엇을 듣고, 어떻게 평가하고, 왜 그렇게 움직였는지 그대로 보여 준다.

[`prototype/index.html`](../prototype/index.html)은 빌드 없이 여는 비주얼 레퍼런스(v0)다.
