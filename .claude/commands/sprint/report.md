---
description: 회의록 기반 상위 보고용 HTML 프레젠테이션 자동 생성. Jordan(PM)이 스프린트 완료 후 상위 보고에 사용.
---

# /sprint:report 하네스

**인수:** $ARGUMENTS

## Step 0 — 인수 파싱

`$ARGUMENTS`에서 추출:

| 패턴 | 동작 |
|------|------|
| (없음) | 가장 최근 회의록 자동 탐지 |
| `--sprint N` | Sprint N 회의록 사용 |
| `--file path` | 특정 회의록 파일 사용 |
| `--title "제목"` | 슬라이드 제목 오버라이드 |

---

## Step 1 — 회의록 탐지 및 읽기

인수가 없으면 `docs/meetings/` 디렉터리에서 가장 최근 파일을 탐지한다.

```bash
ls -t docs/meetings/*.md | head -5
```

파일을 읽어 다음 정보를 추출한다:
- 스프린트 목표
- 안건 목록
- 결정 사항 요약 테이블
- 완료된 액션 아이템 (`[x]` 체크된 항목)
- 미완료 항목 (`[ ]`)
- Open Questions
- 비고 (기술 부채, 리스크)

---

## Step 2 — 구조 레퍼런스 읽기

HTML을 생성하기 전에 반드시 기존 sprint HTML 파일을 읽어 클래스 구조를 파악한다.

```bash
ls -t docs/presentations/sprint-*.html | head -1
```

파일이 존재하면 Read 도구로 전체를 읽는다.
파일이 없으면 아래 **필수 클래스 레퍼런스**만으로 진행한다.

### 필수 클래스 레퍼런스 (ppt-theme.css 기준)

아래 클래스는 `ppt-theme.css`에 정의된 실제 이름이다. **임의로 클래스를 발명하지 않는다.**

| 용도 | 사용법 |
|------|--------|
| 전체 슬라이드 컨테이너 | `<div class="deck">` |
| 표지 슬라이드 | `<div class="slide slide--cover">` |
| 일반 슬라이드 | `<div class="slide">` |
| Q&A 슬라이드 | `<div class="slide slide--qa-light">` |
| 슬라이드 내부 래퍼 | `<div class="slide-inner">` |
| 슬라이드 번호 | `<div class="slide-counter"></div>` ← JS가 자동으로 채움 (직접 텍스트 쓰지 않음) |
| 섹션 레이블 (작은 대문자) | `<div class="slide-label">레이블</div>` |
| 슬라이드 제목 | `<h2 class="slide-title">제목</h2>` |
| 표지 내부 래퍼 | `<div class="cover-inner">` |
| 표지 제목 | `<h1 class="cover-title">` |
| 표지 부제목 | `<p class="cover-sub">` |
| 표지 날짜/메타 | `<p class="cover-meta">` |
| 목표 블록 (인용) | `<blockquote class="goal-quote">` |
| 데이터 테이블 | `<table class="data-table">` |
| 2컬럼 레이아웃 | `<div class="two-col">` |
| 배지 (녹색) | `<span class="badge badge-green">` |
| 배지 (노란색) | `<span class="badge badge-yellow">` |
| 태그 (빨강) | `<span class="tag tag-red">` |
| 태그 (녹색) | `<span class="tag tag-green">` |
| 태그 (노랑) | `<span class="tag tag-yellow">` |
| 체크 리스트 | `<ul class="check-list">` |
| 불렛 리스트 | `<ul class="bullet-list">` |
| 일반 아이템 리스트 | `<ul class="items">` |
| Callout 블록 | `<div class="callout">` |
| 인라인 코드 | `<code>텍스트</code>` |
| Q&A 큰 아이콘 | `<div class="qa-icon">Q&A</div>` |
| Q&A 제목 | `<p class="qa-title">` |
| Q&A 링크/메타 | `<div class="qa-links">` |

### 필수 헤드 태그

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./ppt-theme.css">
```

### 필수 JS 패턴

```javascript
(function() {
  var slides = document.querySelectorAll('.slide');
  var counters = document.querySelectorAll('.slide-counter');
  var current = 0;
  var total = slides.length;

  function show(n) {
    slides[current].classList.remove('active');
    current = (n + total) % total;
    slides[current].classList.add('active');
    counters.forEach(function(c) { c.textContent = (current + 1) + ' / ' + total; });
  }

  slides[0].classList.add('active');
  counters.forEach(function(c) { c.textContent = '1 / ' + total; });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') show(current + 1);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   show(current - 1);
  });

  document.querySelector('.deck').addEventListener('click', function(e) {
    if (e.target.closest('a, button, code')) return;
    show(current + 1);
  });
})();
```

---

## Step 3 — 슬라이드 구성 설계

추출한 내용을 다음 슬라이드 구조로 매핑한다:

| 슬라이드 | 내용 | 소스 |
|---------|------|------|
| 1 | 표지 — 스프린트 번호, 날짜, 팀명 | 회의록 헤더 |
| 2 | Sprint 목표 | `## Sprint N 목표` |
| 3 | 완료 항목 요약 | `[x]` 액션 아이템 |
| 4 | 주요 결정 사항 | `## 결정 사항 요약` 테이블 |
| 5 | 기술 현황 (스택, 배포 URL 등) | 비고 섹션 |
| 6 | 미완료 / 이월 항목 | `[ ]` 액션 아이템 |
| 7 | 다음 스프린트 방향 | Open Questions + 비고의 다음 단계 |
| 8 | Q&A | 고정 슬라이드 |

슬라이드 수는 내용에 따라 조정한다. 슬라이드 하나에 정보가 너무 많으면 분할한다.

---

## Step 4 — HTML 프레젠테이션 생성

다음 기준으로 단독 실행 가능한 HTML 파일을 생성한다.

### 디자인 기준

- **원칙**: 절제된 디자인. 화려한 효과보다 가독성과 정보 전달 우선.
- **테마**: 흰 배경, 다크 텍스트. 강조색 1개만 사용 (`#217346` — 팀 Excel 테마 녹색).
- **타이포그래피**: `Noto Sans KR` (Google Fonts, 한글 지원). 제목 24px, 본문 16px, 캡션 13px.
- **레이아웃**: 전체 화면 슬라이드 (100vw × 100vh), 키보드(← →) 또는 클릭으로 전환.
- **전환 효과**: fade-in만 사용. 슬라이드별 별도 애니메이션 없음.
- **슬라이드 수**: 최대 10장. 내용이 적으면 장표를 합친다.
- **슬라이드 번호**: `<div class="slide-counter">` 사용, JS가 자동으로 `N / 전체` 형식으로 채운다.

### 슬라이드 타입별 레이아웃

- **표지**: `slide--cover` 클래스. `cover-inner` → `slide-label` + `cover-title` + `cover-sub` + `cover-meta` 순서.
- **목록형**: `slide-label` + `slide-title` + `ul.items` 또는 `ul.check-list` / `ul.bullet-list`
- **테이블형**: `slide-label` + `slide-title` + `table.data-table`
- **2컬럼**: `slide-label` + `slide-title` + `div.two-col`
- **Q&A**: `slide--qa-light` 클래스. `qa-icon` + `qa-title` + `qa-links` 순서.

> **⚠️ 클래스 발명 금지**: Step 2에서 확인한 레퍼런스에 없는 클래스가 필요하면 `<style>` 블록에 추가 정의한다. `ppt-theme.css`를 덮어쓰지 않는다.

### 파일 저장

```
docs/presentations/
├── ppt-theme.css                      ← 공유 테마 (없으면 생성, 있으면 재사용)
├── sprint-{N}-report-{yymmdd}.html   ← HTML 본체
└── sprint-{N}/                        ← 스크린샷 폴더
    ├── shot-{desc}.png
    └── ...
```

- HTML은 Step 2의 필수 헤드 태그를 그대로 사용한다 (Google Fonts + ppt-theme.css).
- `ppt-theme.css`에 없는 스타일만 `<style>` 블록에 추가 정의한다.
- `ppt-theme.css`가 이미 존재하면 덮어쓰지 않는다.
- HTML은 스크린샷을 `./sprint-{N}/shot-{desc}.png` 상대경로로 참조한다 (base64 임베드 금지).
- 디렉터리가 없으면 생성한다.

---

## Step 5 — 생성 확인 및 파이프라인 핸드오프

생성 완료 후:

1. **state 파일 저장** — 생성된 HTML 경로를 `docs/presentations/.last-report`에 한 줄로 저장한다.

   ```
   docs/presentations/sprint-{N}-report-{yymmdd}.html
   ```

   이 파일은 `/sprint:review`가 `--report-url` 없이도 보고서 경로를 자동으로 읽는 데 사용된다.

2. **완료 메시지 출력**:

```
프레젠테이션 생성 완료
파일:     docs/presentations/sprint-{N}-report-{yymmdd}.html
슬라이드: {N}장
조작:     ← → 키 또는 클릭으로 전환

브라우저에서 열기:
open docs/presentations/sprint-{N}-report-{yymmdd}.html

다음 단계: /sprint:review 실행 시 보고서가 자동으로 첨부됩니다.
```

---

## 주의사항

- 회의록에 없는 내용은 임의로 추가하지 않는다
- 민감한 정보(개인 이름, 토큰, 키)는 슬라이드에 포함하지 않는다
- 에이전트 이름(Jordan, Riley 등)은 역할명(PM, UX, FE 등)으로 대체한다
- 한국어 텍스트가 깨지지 않도록 폰트 로딩을 확인한다
