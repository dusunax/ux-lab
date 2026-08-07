# MythGraph 디자인 스펙 (Design System & Experience Spec)

## 문서 정보

| 항목 | 내용 |
|---|---|
| 프로젝트 | MythGraph |
| 버전 | MVP |
| 상태 | Draft |
| 목적 | 영화 같은 지식 그래프 탐험 경험 설계 |

---

# 1. 디자인 비전

> **위키를 읽는 경험이 아니라, 신화 속 세계를 탐험하는 경험을 만든다.**

MythGraph는 단순한 정보 조회 서비스가 아니라, 사용자가 관계를 발견하고 이야기를 따라가며 탐험하는 인터랙티브 경험을 제공한다.

## 핵심 키워드

- 시네마틱(Cinematic)
- 장엄함(Monumental)
- 신비로움(Mysterious)
- 프리미엄(Premium)
- 미니멀(Minimal)
- 탐험(Exploration)

---

# 2. UX 원칙

## 2.1 그래프가 주인공이다

UI보다 그래프가 먼저 보인다.

사용자의 시선은 항상 관계 탐색에 머물러야 한다.

## 2.2 점진적 발견

처음부터 모든 노드를 보여주지 않는다.

검색 → 선택 → 확장 → 발견

이라는 흐름을 유지한다.

## 2.3 차분한 인터랙션

애니메이션은 빠르고 화려하기보다 부드럽고 묵직해야 한다.

## 2.4 이야기 중심

데이터가 아니라 이야기와 관계를 전달한다.

---

# 3. MVP 화면 구성

## Landing

목적

- 프로젝트 소개
- 검색 진입
- Explore CTA

구성

- Hero 문구
- 검색창
- Explore 버튼

---

## Graph Explorer

프로젝트의 핵심 화면

좌측

- 검색
- 필터

중앙

- React Flow 그래프

우측

- Entity 상세 패널

---

## Entity 상세

포함 정보

- 초상 이미지
- 요약
- 주요 관계
- 관련 신화
- 출처

---

## Story 상세

포함 정보

- 사건 타임라인
- 등장인물
- 관련 그래프

---

# 4. 컬러 시스템

## 배경

| 이름 | 색상 |
|---|---|
| Abyss | #0A0D11 |
| Night | #12161D |
| Slate | #1B212A |

## 포인트 컬러

| 이름 | 색상 |
|---|---|
| Bronze | #A67C52 |
| Gold | #D7B26D |
| Amber | #D39A39 |

## 텍스트

Primary : #F6F1E7

Secondary : #B5B8BE

Muted : #6D727A

## Entity 색상

- 신 : Gold
- 인간 : Stone Gray
- 괴물 : Dark Crimson
- 장소 : Blue Gray
- 신화 : Amber

---

# 5. 타이포그래피

Display

- Cinzel

Heading

- Cormorant Garamond

Body

- Inter

Code / Number

- JetBrains Mono

---

# 6. 레이아웃

12 Column Grid

Desktop 기준

- Graph 영역 : 70%
- Sidebar : 30%

---

# 7. 컴포넌트

## 검색창

큰 사이즈

Placeholder

> "누구를 찾고 있나요?"

---

## Graph Node

형태

- 원형

상태

- 기본
- Hover
- 선택
- 확장
- 비활성

Hover

- 은은한 Glow

선택

- Gold Ring

---

## Edge

- 얇은 선
- 반투명
- 선택 시만 애니메이션

---

## Detail Drawer

- 오른쪽 슬라이드
- 폭 420px
- 그래프를 완전히 가리지 않음

---

# 8. 모션

권장 시간

250~500ms

사용

- opacity
- scale
- translate

지양

- Bounce
- 과한 탄성

## 그래프 확장

노드 클릭

↓

Glow

↓

관계선 등장

↓

새 노드 Fade In

## 카메라 이동

검색

↓

Pan

↓

Zoom

↓

Highlight

---

# 9. React Flow 규칙

- 최대 100개 노드
- MiniMap 활성화
- Edge Label은 확대 시 표시
- 선택된 경로는 Gold 강조

---

# 10. 접근성

- WCAG AA 명도 대비
- 키보드 검색 지원
- Motion 감소 옵션 대응
- Screen Reader Label 제공

---

# 11. MVP 범위

포함

- Landing
- Graph Explorer
- Entity Detail
- Story Detail

제외

- 파티클 효과
- 배경 영상
- 오디오
- 과도한 영화식 연출

---

# 12. 디자인 레퍼런스

참고 방향

- 프리미엄 영화 홍보 사이트
- 박물관 전시 인터페이스
- 고급 에디토리얼 디자인
- 고대 건축과 천문도

## 주의

특정 영화 포스터나 공식 사이트를 그대로 재현하지 않는다.

대신 다음 요소만 참고한다.

- 분위기
- 조명
- 여백
- 타이포그래피
- 색감
- 화면 전환 리듬

이를 바탕으로 MythGraph만의 독창적인 디자인 시스템을 구축한다.
