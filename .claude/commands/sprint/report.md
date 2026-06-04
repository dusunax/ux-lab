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
| 3 | 주요 결정 사항 | `## 결정 사항 요약` 테이블 |
| 4 | 기술 현황 (스택, 아키텍처 흐름) | 비고 섹션 |
| 5 | 완료 항목 요약 | `[x]` 액션 아이템 |
| 6 | 미완료 / 이월 항목 | `[ ]` 액션 아이템 |
| 7 | 다음 스프린트 방향 | Open Questions + 비고의 다음 단계 |
| 8 | Q&A | 고정 슬라이드 |

슬라이드 수는 내용에 따라 조정한다. 슬라이드 하나에 정보가 너무 많으면 분할한다.

---

## Step 4 — HTML 프레젠테이션 생성 (worktree 격리)

> HTML 파일을 직접 Write하지 않는다. **`product/PM/prd-product-manager` 에이전트를 `isolation: "worktree"` 옵션으로 소환**해 아래 데이터를 전달하고 파일 생성을 위임한다.

Step 1–3에서 수집한 내용을 Jordan에게 전달할 프롬프트로 구성한다:

```
다음 정보를 바탕으로 Sprint {N} HTML 프레젠테이션을 생성해줘.

[회의록 내용: 스프린트 목표 / 완료 항목 / 결정 사항 / Open Questions / 비고]
[슬라이드 구조 설계: Step 3에서 결정한 슬라이드 매핑]
[클래스 레퍼런스: Step 2에서 파악한 기존 HTML 구조]

--- 디자인 기준 ---
- 원칙: 절제된 디자인. 화려한 효과보다 가독성과 정보 전달 우선.
- 테마: 흰 배경, 다크 텍스트. 강조색 1개만 사용 (#217346 — 팀 Excel 테마 녹색).
- 타이포그래피: Noto Sans KR (Google Fonts). 제목 24px, 본문 16px, 캡션 13px.
- 레이아웃: 전체 화면 슬라이드 (100vw × 100vh), 키보드(← →) 또는 클릭으로 전환.
- 전환 효과: fade-in만 사용.
- 슬라이드 수: 최대 10장.
- 슬라이드 번호: <div class="slide-counter"> 사용, JS가 자동으로 채운다.
- 세로 overflow 금지: 이미지/캡션/표 때문에 슬라이드가 100vh를 넘거나 화면 밖으로 잘리면 안 된다.
- 이미지 기준: 모든 이미지는 컨테이너 안에서 `max-width: 100%`, `max-height`, `object-fit: contain`을 적용해 비율을 유지한다.
- 이미지가 많은 슬라이드는 2컬럼 비율, 이미지 높이, 캡션 위치를 조정하거나 슬라이드를 분할한다.

--- 슬라이드 타입별 레이아웃 ---
- 표지: slide--cover. cover-inner → slide-label + cover-title + cover-sub + cover-meta.
- 목록형: slide-label + slide-title + ul.items / ul.check-list / ul.bullet-list
- 테이블형: slide-label + slide-title + table.data-table
- 2컬럼: slide-label + slide-title + div.two-col
- Q&A: slide--qa-light. qa-icon + qa-title + qa-links.

⚠️ 클래스 발명 금지: 레퍼런스에 없는 클래스는 <style> 블록에 추가 정의할 것. ppt-theme.css 수정 금지.

--- 파일 저장 경로 ---
docs/presentations/sprint-{N}-report-{yymmdd}.html

규칙:
- HTML은 필수 헤드 태그 사용 (Google Fonts + ppt-theme.css).
- ppt-theme.css가 이미 존재하면 덮어쓰지 않는다.
- 스크린샷은 ./sprint-{N}/shot-{desc}.png 상대경로 참조 (base64 임베드 금지).
- 디렉터리가 없으면 생성한다.
- 생성 후 모든 슬라이드에서 이미지 때문에 세로 화면을 벗어나는 요소가 없는지 검증하고, 문제가 있으면 HTML/CSS를 수정한 뒤 다시 검증한다.
```

---

## Step 4.5 — worktree 병합 및 정리

Jordan의 worktree 작업이 완료되면 변경사항을 현재 브랜치로 병합한다.

```bash
# 1. worktree 목록 확인
git worktree list

# 2. Jordan worktree 브랜치의 커밋 확인
git log --oneline <jordan-worktree-branch> ^HEAD

# 3. 현재 브랜치로 병합
git merge <jordan-worktree-branch> --no-ff -m "docs(sprint-{N}): Jordan worktree 병합 — 보고서 HTML 생성"

# 4. worktree 정리 (자동 정리되지 않은 경우)
git worktree remove <jordan-worktree-path> --force
git branch -d <jordan-worktree-branch>
```

생성 확인:
```bash
ls docs/presentations/sprint-{N}-report-*.html
```

---

## Step 4.6 — PPT 레이아웃 overflow 검증

HTML 생성 후 state 파일을 저장하기 전에 반드시 슬라이드 레이아웃을 검증한다.

검증 기준:
- 각 `.slide`는 100vw × 100vh 안에 완전히 들어와야 한다.
- 각 `.slide-inner`의 실제 높이는 viewport 높이를 넘지 않아야 한다.
- `img`, `video`, `table`, `.callout`, `.two-col` 내부 콘텐츠가 슬라이드 하단 밖으로 잘리면 실패로 본다.
- 특히 이미지가 포함된 슬라이드는 세로 스크롤이 생기거나 하단 텍스트가 화면 밖으로 밀리면 실패다.

권장 검증 방법:
1. 브라우저에서 생성된 HTML을 열고 1280×720 기준으로 전체 슬라이드를 확인한다.
2. DevTools Console에서 아래 스니펫을 실행해 overflow 슬라이드를 찾는다.

```javascript
Array.from(document.querySelectorAll('.slide')).map(function(slide, index) {
  var inner = slide.querySelector('.slide-inner') || slide;
  var slideRect = slide.getBoundingClientRect();
  var innerRect = inner.getBoundingClientRect();
  var overflowingElements = Array.from(inner.querySelectorAll('img, video, table, .callout, .two-col, ul, p')).filter(function(el) {
    var rect = el.getBoundingClientRect();
    return rect.bottom > window.innerHeight || rect.right > window.innerWidth;
  });

  return {
    slide: index + 1,
    slideOverflowY: slide.scrollHeight > slide.clientHeight,
    innerBottom: Math.round(innerRect.bottom),
    viewportHeight: window.innerHeight,
    innerOverflowY: innerRect.bottom > window.innerHeight,
    overflowingElements: overflowingElements.map(function(el) {
      return el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).replace(/\s+/g, '.') : '');
    })
  };
}).filter(function(result) {
  return result.slideOverflowY || result.innerOverflowY || result.overflowingElements.length > 0;
});
```

수정 규칙:
- overflow가 있으면 완료 처리하지 않는다.
- 이미지가 원인이면 해당 이미지 래퍼의 `max-height`를 낮추고 `object-fit: contain`을 적용한다.
- 텍스트가 원인이면 문구를 축약하거나 슬라이드를 분할한다.
- 표가 원인이면 열 문구를 줄이거나 글자 크기를 낮추되, 가독성이 깨지면 슬라이드를 분할한다.
- 검증 통과 후에만 Step 5로 진행한다.

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
