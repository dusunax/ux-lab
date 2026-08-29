# 기술 스펙: 요소 클릭 피커 (chrome-capture)

파일명(`tech-spec-v1.1.0.md`)의 버전이 목표 익스텐션 버전이다. 현재 배포 버전 `1.0.2` → 이번 기능으로 minor 버전업 `1.1.0`(구현 단계에서 `manifest.json`/`package.json`에 반영).

`plan-v1.1.0.md`에서 확정한 설계를 실제 구현 가능한 수준으로 구체화한다. 코드 스니펫은 의사코드에 가깝고, 실제 구현 시 기존 코드 스타일(함수형 구조, 세미콜론 사용)을 따른다.

## 0. 파일 구성

`content.js`가 비대해지는 걸 피하기 위해 4개 파일로 나눈다. 빌드 스텝이 없는 순수 vanilla 확장이므로 모듈 시스템 없이, `manifest.json`의 `content_scripts[0].js` 배열에 나열된 파일들이 같은 전역 스코프를 공유하는 방식으로 연결한다.

```json
"content_scripts": [{
  "matches": ["http://*/*", "https://*/*"],
  "js": ["selector-generator.js", "element-picker.js", "hover-sync.js", "content.js"],
  "run_at": "document_start",
  "all_frames": false
}]
```

| 파일 | 책임 | 상태 유무 |
|---|---|---|
| `selector-generator.js` | 요소 → CSS 선택자 문자열 변환 (순수 함수) | 없음 (stateless) |
| `element-picker.js` | 피킹 모드 On/Off, 툴바·호버오버레이 DOM, 이벤트 리스너, 피킹 세션 중 고른/취소한 항목 목록 | `pickerActive`, `pickedItems`, `removedSelectors`, `climbLevel` 등 |
| `hover-sync.js` | 팝업이 열려 있는 동안, 페이지 호버 위치와 팝업의 선택자 태그를 실시간으로 연결(섹션 12) | `hoverSyncPort`, `knownSelectorsForSync` |
| `content.js` | 기존 hide/show/highlight 로직 + `chrome.runtime.onMessage` 라우팅(신규 액션은 `element-picker.js`의 함수 호출로 위임) | 기존 `hiddenElements`, `highlightedElements` |

`content.js`에 추가되는 코드는 아래 라우팅 4줄 내외뿐이며, 나머지 로직은 전부 `element-picker.js`/`selector-generator.js`/`hover-sync.js`에 위치한다(`hover-sync.js`는 `chrome.runtime.onConnect`를 자체적으로 구독하므로 `content.js`의 `onMessage` 라우팅에 추가할 코드가 없음):

```js
// content.js의 기존 onMessage 리스너 내부, 기존 else-if 체인에 추가
} else if (request.action === 'startElementPicker') {
  startElementPicker(request.messages, request.knownHiddenSelectors);
  sendResponse({ success: true });
} else if (request.action === 'stopElementPicker') {
  stopElementPicker();
  sendResponse({ success: true });
} else if (request.action === 'getPickerChanges') {
  sendResponse({ success: true, ...getPickerChanges() });
} else if (request.action === 'clearPickerChanges') {
  clearPickerChanges();
  sendResponse({ success: true });
}
```
`startElementPicker`/`stopElementPicker`/`getPickerChanges`/`clearPickerChanges`는 `element-picker.js`에 정의된 전역 함수를 그대로 호출 — import 불필요(같은 컨텍스트 공유).

## 1. 메시지 프로토콜

기존 `chrome.runtime.onMessage` 핸들러(`content.js`)에 액션 4개를 추가한다. 응답은 전부 `sendResponse({...})`로 동기 처리(기존 패턴과 동일, 비동기 필요 없음). 별도로 팝업-호버 동기화(섹션 12)는 `chrome.tabs.connect`의 장수명 `Port`를 쓴다 — 요청/응답 한 번으로 끝나지 않고 팝업이 열려 있는 동안 계속 이벤트가 오가야 하기 때문.

| action | 방향 | payload | 응답 |
|---|---|---|---|
| `startElementPicker` | popup → content | `{ messages: {...}, knownHiddenSelectors: string[] }` (아래 설명) | `{ success: true }` |
| `stopElementPicker` | popup → content (안 쓸 수도 있음, 대비용) | 없음 | `{ success: true }` |
| `getPickerChanges` | popup → content | 없음 | `{ success: true, added: string[], removed: string[] }` |
| `clearPickerChanges` | popup → content | 없음 | `{ success: true }` |

`knownHiddenSelectors`: 팝업이 현재 갖고 있는 `hiddenSelectors`(수동 입력 + 이전에 병합된 피커 결과)의 스냅샷. **이미 저장된 요소를 피킹 중에 다시 클릭하면 취소(토글)되도록** 하려면, `element-picker.js`가 "이건 이미 숨김 목록에 있는 요소다"를 판단할 기준이 필요해서 시작 시점에 넘겨준다(아래 섹션 5).

### 사용자 메시지 다국어 처리

페이지에 주입되는 툴바(`element-picker.js`)는 팝업/옵션 페이지에서만 로드되는 `i18n.js`에 접근할 수 없다(콘텐츠 스크립트는 별도 컨텍스트). `i18n.js`를 콘텐츠 스크립트로도 중복 주입해 두 군데서 언어를 관리하기보다, **팝업이 이미 알고 있는 번역 결과 문자열을 `startElementPicker` 메시지에 실어 보낸다** — 번역 소스는 여전히 `i18n.js` 하나뿐이고, `element-picker.js`는 받은 문자열을 그대로 렌더링만 하는 순수 뷰가 된다.

```js
// popup.js — "🎯 요소 선택" 버튼
pickBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.tabs.sendMessage(tab.id, {
    action: 'startElementPicker',
    knownHiddenSelectors: hiddenSelectors, // 지금 팝업이 들고 있는 전체 목록 스냅샷
    messages: {
      instruction: getI18nMessage('picker-instruction'),
      hint: getI18nMessage('picker-hint'),
      undo: getI18nMessage('picker-undo'),
      cancel: getI18nMessage('cancel'), // 기존 범용 'cancel' 키 재사용 — 새 키 추가 안 함
      done: getI18nMessage('picker-done'),
      toast: getI18nMessage('picker-toast'), // "{count}개 추가됨 · ..." — {count}는 element-picker.js에서 치환
    },
  });
  window.close(); // 포커스 이동으로 어차피 닫히지만 명시적으로 닫아 유령 팝업 방지
});
```
`element-picker.js`는 `startElementPicker(messages, knownHiddenSelectors)`로 받은 문자열을 `pickerMessages` 전역에 저장해두고 툴바 렌더링·토스트에서 그대로 사용한다(섹션 7 참고). `getI18nMessage`는 기존 `i18n.js`에 이미 있는 함수를 그대로 사용 — 새 함수 불필요.

```js
// 팝업 로드 시 (loadFromStorage 이후, 기존 updateAllHighlights 호출 근처)
async function mergePickerChanges() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'getPickerChanges' });
    if (!res || (!res.added.length && !res.removed.length)) return;

    hiddenSelectors = hiddenSelectors.filter((s) => !res.removed.includes(s));
    const added = res.added.filter((s) => !hiddenSelectors.includes(s));
    hiddenSelectors.push(...added);

    saveToStorage();
    renderHiddenList();
    await chrome.tabs.sendMessage(tab.id, { action: 'clearPickerChanges' });
    await updateAllHighlights(); // 기존 함수 재사용 — removed 반영된 최신 목록으로 하이라이트 갱신

    if (added.length || res.removed.length) {
      showStatus(`✓ ${added.length}개 추가, ${res.removed.length}개 취소됨`, 'success');
    }
  } catch (e) {
    console.warn('Merge picker changes failed', e);
  }
}
```
`content.js`가 로드 안 된 특수 페이지(`chrome://` 등)에서는 `sendMessage`가 reject되므로 try/catch로 무시 — 기존 `captureScreenshot()`의 패턴과 동일.

## 2. element-picker.js 상태

`content.js`의 기존 전역 변수(`hiddenElements`, `highlightedElements`)와는 별개로, `element-picker.js` 파일 안에 선언:

```js
let pickerActive = false;
let pickedItems = [];          // 이번 세션에서 새로 추가한 { selector, level, element, originalBorder } (팝업이 병합해가면 비워짐)
let knownHiddenSelectors = []; // startElementPicker 시점에 팝업이 넘겨준 "이미 저장된" 선택자 스냅샷
let removedSelectors = [];     // knownHiddenSelectors 중 이번 세션에서 재클릭으로 취소한 것들
let hoverOverlayEl = null;     // 호버 미리보기용 오버레이 div (position: fixed)
let pickerToolbarEl = null;    // 상단 안내 툴바
let levelBadgeEl = null;       // 호버 미리보기의 "↑{level}" 숫자 배지 (섹션 4)
let pickerMessages = {};       // popup에서 받은 i18n 번역 문자열 (섹션 1 참고)

let baseHoverTarget = null;    // 커서 아래 "원본" 요소 (elementFromPoint 그대로, 클라이밍 기준점)
let climbLevel = 0;            // baseHoverTarget에서 Shift+클릭으로 몇 단계 올라갔는지
let currentHoverTarget = null; // baseHoverTarget에서 climbLevel만큼 조상으로 올라간, 지금 실제로 하이라이트되는 요소
```
`pickedSelectors`(문자열 배열)가 아니라 `pickedItems`(객체 배열)로 바꾼 이유: 부모로 올라가서 고른 요소는 몇 단계 올라갔는지(`level`)에 따라 테두리 두께가 달라야 하고(아래 섹션 4/5), 팝업으로 병합할 때는 `item.selector`만 뽑아 쓰면 된다. `knownHiddenSelectors`/`removedSelectors`는 "이미 저장된 요소 재클릭 시 취소" 기능(섹션 5)을 위한 것 — 이번 세션에서 새로 추가한 게 아니라 원래 있던 걸 지우는 거라 `pickedItems`와는 별도로 관리한다.

### 상태 다이어그램

```
idle ──(startElementPicker)──▶ picking
picking ──(Shift+클릭)──▶ picking      (climbLevel += 1, 같은 요소를 계속 클릭하면 계속 더 위로)
picking ──(새 요소 일반 클릭)──▶ picking       (pickedItems에 추가, climbLevel 0으로 리셋)
picking ──(pickedItems에 이미 있는 요소 재클릭)──▶ picking (그 항목 제거 = 토글 취소)
picking ──(knownHiddenSelectors에 있는 요소 클릭)──▶ picking (removedSelectors에 추가 = 저장된 항목 취소 예약)
picking ──(removedSelectors에 있는 요소 재클릭)──▶ picking (removedSelectors에서 제거 = 취소를 다시 취소, 원상복구)
picking ──(마우스가 다른 base 요소로 이동)──▶ picking (climbLevel 0으로 리셋)
picking ──(실행 취소, 반복 가능)──▶ picking  (pickedItems.pop(), 세션 내 최소 10개까지 순서대로 되돌리기 가능)
picking ──(Enter / 완료 버튼)──▶ idle
picking ──(페이지 unload)──▶ (자동 소멸, 별도 처리 불필요)
```
네 가지 클릭 결과(새 추가/내 픽 취소/저장된 것 취소/취소의 취소)는 전부 **같은 일반 클릭 하나**에서 대상이 무엇이었는지에 따라 분기된다 — 사용자 입장에서는 그냥 "클릭하면 토글된다"는 단일 규칙이다(섹션 5).

## 3. 피킹 모드 시작/종료 (`element-picker.js`)

```js
function startElementPicker(messages, hiddenSelectorsSnapshot) {
  if (pickerActive) return;
  pickerActive = true;
  pickerMessages = messages || {};
  knownHiddenSelectors = hiddenSelectorsSnapshot || [];
  removedSelectors = [];
  injectPickerToolbar();
  document.addEventListener('mousemove', handlePickerMouseMove, true);
  document.addEventListener('click', handlePickerClick, true);
  document.addEventListener('keydown', handlePickerKeyDown, true);
  document.body.style.cursor = 'crosshair';
}

function stopElementPicker() {
  if (!pickerActive) return;
  pickerActive = false;
  document.removeEventListener('mousemove', handlePickerMouseMove, true);
  document.removeEventListener('click', handlePickerClick, true);
  document.removeEventListener('keydown', handlePickerKeyDown, true);
  document.body.style.cursor = '';
  removeHoverOverlay();
  removePickerToolbar();
}
```

- 리스너는 전부 **capture phase(`true`)**로 등록 — 사이트 자체 클릭 핸들러(예: 링크 이동, SPA 라우팅)보다 먼저 가로채서 `preventDefault`/`stopPropagation`으로 원래 동작을 막아야 한다. 이게 없으면 요소를 "선택"하려는 클릭이 실제로 링크를 눌러버려 페이지가 이동해버린다 — 피커의 핵심 전제조건.
- `pickedItems`/`removedSelectors`는 `stopElementPicker()`에서 비우지 않는다 — 팝업이 `getPickerChanges`로 가져가서 `clearPickerChanges`를 호출할 때 비로소 비워진다(아래).

```js
function getPickerChanges() {
  return {
    added: pickedItems.map((item) => item.selector),
    removed: removedSelectors,
  };
}

function clearPickerChanges() {
  pickedItems = [];
  removedSelectors = [];
}
```

## 4. 호버 오버레이 (파란 점선, `element-picker.js`)

실제 요소에 인라인 스타일을 직접 입히지 않고, **별도의 `position: fixed` div를 하나 만들어 `getBoundingClientRect()` 좌표에 맞춰 이동**시키는 방식을 쓴다. 이유: 대상 요소의 기존 스타일(overflow, transform 등)을 건드리지 않고, 스크롤/리사이즈에도 독립적으로 재계산하기 쉬움.

**테두리 두께 규칙**: 기본(레벨 0, 클라이밍 없음) 2px에서 시작해 부모로 한 단계 올라갈 때마다 1px씩 두꺼워진다 — 호버 미리보기(파란 점선)와, 실제로 추가된 요소의 하이라이트(빨간 실선) 둘 다 같은 두께 규칙(`borderWidthForLevel`)을 쓴다. 다만 그리는 방식은 다르다: 호버 오버레이는 페이지에 속하지 않는 별도 플로팅 div라 `border`를 그대로 쓰고, 실제 페이지 요소에 적용하는 확정 하이라이트는 레이아웃이 밀리지 않도록 `box-shadow: inset`으로 그린다(섹션 5).

**레벨 숫자 배지**: 두께 차이만으로는(특히 2px vs 3px처럼 인접한 레벨) 정확히 몇 단계 올라갔는지 구분하기 어렵다는 팀 리뷰 피드백([lunch review](../../meetings/chrome-capture/2026-08-28-lunch-review-element-picker.md))을 반영해, 호버 오버레이 좌상단에 `↑{level}` 배지를 함께 띄운다. `level`이 0일 때(클라이밍 없이 바로 가리키는 상태)는 배지를 숨겨 화면이 지저분해지지 않게 한다. MVP에서는 **호버 미리보기에만** 적용하고, 이미 확정된(빨간 실선) 요소에는 배지를 붙이지 않는다 — 확정 시점엔 이미 배지로 몇 단계인지 확인하고 클릭한 뒤이고, 여러 개를 계속 추적하려면 스크롤마다 배지 여러 개를 재배치해야 해서 복잡도 대비 효용이 낮다고 판단했다(필요해지면 다음 리비전에서 확장).

```js
function borderWidthForLevel(level) {
  return 2 + level; // level 0 → 2px, level 1(부모) → 3px, level 2(조부모) → 4px ...
}

function ensureHoverOverlay() {
  if (hoverOverlayEl) return hoverOverlayEl;
  hoverOverlayEl = document.createElement('div');
  hoverOverlayEl.id = 'ssc-hover-overlay';
  hoverOverlayEl.style.cssText = `
    position: fixed; pointer-events: none; z-index: 2147483646;
    border-style: dashed; border-color: #2F86FF; background: rgba(47,134,255,0.08);
    transition: all 0.05s ease-out; display: none;
  `;
  document.documentElement.appendChild(hoverOverlayEl);
  return hoverOverlayEl;
}

function ensureLevelBadge() {
  if (levelBadgeEl) return levelBadgeEl;
  levelBadgeEl = document.createElement('div');
  levelBadgeEl.id = 'ssc-level-badge';
  levelBadgeEl.style.cssText = `
    position: fixed; z-index: 2147483647; pointer-events: none;
    background: #2F86FF; color: #FFFFFF; font: 600 11px/1.4 -apple-system, sans-serif;
    padding: 1px 6px; border-radius: 3px; display: none; white-space: nowrap;
  `;
  document.documentElement.appendChild(levelBadgeEl);
  return levelBadgeEl;
}

function updateHoverOverlay(el, level) {
  const rect = el.getBoundingClientRect();
  const overlay = ensureHoverOverlay();
  overlay.style.display = 'block';
  overlay.style.borderWidth = `${borderWidthForLevel(level)}px`;
  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;

  updateLevelBadge(rect, level);
}

function updateLevelBadge(rect, level) {
  const badge = ensureLevelBadge();
  if (level === 0) {
    badge.style.display = 'none';
    return;
  }
  badge.style.display = 'block';
  badge.textContent = `↑${level}`;
  // 오버레이 좌상단 바로 위. 뷰포트 맨 위에서 잘리지 않도록 0 아래로는 안 내려감(음수 방지)
  badge.style.top = `${Math.max(0, rect.top - 20)}px`;
  badge.style.left = `${rect.left}px`;
}

function removeHoverOverlay() {
  if (hoverOverlayEl) {
    hoverOverlayEl.remove();
    hoverOverlayEl = null;
  }
  if (levelBadgeEl) {
    levelBadgeEl.remove();
    levelBadgeEl = null;
  }
}
```

**`handlePickerMouseMove`** — Shift 여부는 더 이상 여기서 보지 않는다(클라이밍은 클릭 이벤트에서만 일어남, 아래 섹션 5). 마우스가 움직여 "원본(base) 요소"가 바뀌면 `climbLevel`을 0으로 리셋하고, 같은 base 요소 위에서 움직이는 동안에는 기존 `climbLevel`을 유지한다:

```js
function handlePickerMouseMove(e) {
  const rawTarget = document.elementFromPoint(e.clientX, e.clientY);
  if (!rawTarget || isPickerOwnElement(rawTarget)) {
    removeHoverOverlay();
    baseHoverTarget = null;
    currentHoverTarget = null;
    return;
  }

  if (rawTarget !== baseHoverTarget) {
    baseHoverTarget = rawTarget;
    climbLevel = 0; // 다른 요소로 이동하면 클라이밍 상태 초기화
  }

  currentHoverTarget = climbToLevel(baseHoverTarget, climbLevel);
  updateHoverOverlay(currentHoverTarget, climbLevel);
}

// baseEl에서 조상 방향으로 level단계 올라간 요소를 반환.
// body/html에 닿으면 더 못 올라가게 멈춘다(전체 페이지를 실수로 숨기는 사고 방지).
function climbToLevel(baseEl, level) {
  let el = baseEl;
  for (let i = 0; i < level; i++) {
    const parent = el.parentElement;
    if (!parent || parent === document.body || parent === document.documentElement) break;
    el = parent;
  }
  return el;
}

function isPickerOwnElement(el) {
  return !!el.closest('#ssc-picker-toolbar, #ssc-hover-overlay, #ssc-level-badge, #ssc-picker-toast');
}
```

## 5. 클릭 처리 — 클릭은 토글, Shift+클릭은 반복 클라이밍 (`element-picker.js`, `generateSelector`는 `selector-generator.js`)

Shift+클릭은 "부모를 골라서 바로 추가"가 아니라 **"한 단계 더 위로 올라간 상태를 미리보기"**다. 사용자가 원하는 높이까지 Shift+클릭을 반복한 뒤, Shift 없이 클릭해야 그 시점에 보이는 요소(`currentHoverTarget`)가 확정된다.

Shift 없는 일반 클릭은 **토글**이다 — 대상이 무엇이었는지에 따라 결과가 다르다:
1. 처음 보는 요소 → 새로 추가(`pickedItems`에 push)
2. 이번 세션에서 이미 추가한 요소(`pickedItems`에 있음) → 그 추가를 취소(제거) — "실행 취소" 버튼으로 마지막 걸 지우는 것과 동일한 동작을, 굳이 버튼까지 안 가고 그 요소를 다시 클릭해서도 할 수 있게 하는 것
3. 원래 저장돼 있던 요소(`knownHiddenSelectors`에 있고 아직 취소 안 함) → `removedSelectors`에 추가(취소 예약), 화면에서 하이라이트 제거
4. 취소 예약해둔 요소(`removedSelectors`에 있음)를 또 클릭 → 예약 취소(원상복구), 하이라이트 재적용

```js
function handlePickerClick(e) {
  if (isPickerOwnElement(e.target)) return; // 툴바 자체 클릭은 무시(버튼이 자체 핸들러 처리)
  e.preventDefault();
  e.stopPropagation();
  if (!currentHoverTarget) return;

  if (e.shiftKey) {
    climbLevel += 1;
    currentHoverTarget = climbToLevel(baseHoverTarget, climbLevel);
    updateHoverOverlay(currentHoverTarget, climbLevel); // 두께만 갱신, 아직 추가 안 함
    return;
  }

  toggleClickedElement(currentHoverTarget, climbLevel);
  climbLevel = 0; // 다음 픽을 위해 리셋 — 마우스가 안 움직여도 다시 leaf부터 시작
}

function toggleClickedElement(el, level) {
  const selector = generateSelector(el); // selector-generator.js

  const pickedIndex = pickedItems.findIndex((item) => item.selector === selector);
  if (pickedIndex !== -1) {
    undoPickedItem(pickedIndex); // 케이스 2: 내가 이번 세션에 추가한 걸 취소
    return;
  }

  if (knownHiddenSelectors.includes(selector)) {
    if (removedSelectors.includes(selector)) {
      removedSelectors = removedSelectors.filter((s) => s !== selector); // 케이스 4: 취소를 다시 취소
    } else {
      removedSelectors.push(selector); // 케이스 3: 저장된 요소 취소
    }
    refreshKnownHighlights();
    return;
  }

  confirmPick(el, level); // 케이스 1: 새로 추가
}

// border는 실제 페이지 요소의 박스 크기에 더해져 주변 레이아웃을 밀어낼 수 있다
// (특히 width/height가 명시된 요소). box-shadow(inset)는 box-sizing과 무관하게
// 레이아웃에 전혀 영향을 주지 않으므로 이걸로 그린다. box-sizing도 border-box로
// 맞춰 혹시 모를 스타일 충돌 여지를 줄인다. (호버 미리보기용 `#ssc-hover-overlay`는
// 실제 페이지에 속하지 않는 별도 플로팅 div라 레이아웃 영향이 없어 border를 그대로 씀 — 섹션 4)
function confirmPick(el, level) {
  const originalBoxShadow = el.style.boxShadow;
  const originalBackground = el.style.backgroundColor;
  const originalBoxSizing = el.style.boxSizing;
  el.style.setProperty('box-sizing', 'border-box', 'important');
  el.style.setProperty('box-shadow', `inset 0 0 0 ${borderWidthForLevel(level)}px #FF4444`, 'important');
  el.style.setProperty('background-color', 'rgba(255,68,68,0.1)', 'important');
  pickedItems.push({
    selector: generateSelector(el),
    level,
    element: el,
    originalBoxShadow,
    originalBackground,
    originalBoxSizing,
  });
  updatePickerToolbarCount();
}

function undoPickedItem(index) {
  const [item] = pickedItems.splice(index, 1);
  if (item.originalBoxShadow) {
    item.element.style.boxShadow = item.originalBoxShadow;
  } else {
    item.element.style.removeProperty('box-shadow');
  }
  if (item.originalBackground) {
    item.element.style.backgroundColor = item.originalBackground;
  } else {
    item.element.style.removeProperty('background-color');
  }
  if (item.originalBoxSizing) {
    item.element.style.boxSizing = item.originalBoxSizing;
  } else {
    item.element.style.removeProperty('box-sizing');
  }
  updatePickerToolbarCount();
}

// knownHiddenSelectors 중 removedSelectors에 없는 것만 다시 하이라이트 — content.js의 기존 함수 재사용
// (highlightHiddenElements는 선택자 "배열"을 받는 함수이므로 join하지 않고 그대로 전달)
function refreshKnownHighlights() {
  const stillHidden = knownHiddenSelectors.filter((s) => !removedSelectors.includes(s));
  highlightHiddenElements(stillHidden);
}
```
- 새로 확정된 요소는 `content.js`의 `highlightHiddenElements`를 재사용하지 않고 `element-picker.js`가 직접 스타일을 입힌다 — 레벨별 두께(`borderWidthForLevel`)를 반영해야 하는데 기존 함수는 고정 2px만 지원하기 때문.
- 반대로 **원래 저장돼 있던 요소**(케이스 3/4)는 `element-picker.js`가 직접 스타일을 건드리지 않고 `content.js`의 `highlightHiddenElements`를 다시 호출해서 갱신한다 — 그 요소들의 하이라이트는 원래 `content.js`가 관리하던 것이라, 같은 함수로 "지우고 다시 그리기"를 하는 게 `originalBorder`를 이중으로 추적하지 않아도 돼서 더 안전하다.
- "실행 취소" 버튼(섹션 7)은 `undoPickedItem(pickedItems.length - 1)`을 호출하는 것과 동일 — 케이스 2와 로직을 공유한다. `pickedItems`가 비어있지 않은 한 반복 클릭 가능(세션 내 전체 히스토리를 순서대로 되돌릴 수 있어 "10개까지"라는 요구를 자연히 만족).

## 6. 선택자 생성 알고리즘 (`selector-generator.js`)

이 파일은 DOM을 읽기만 하고(querySelectorAll, classList 등) **절대 변경하지 않는 순수 함수 모음**이다 — `element-picker.js`의 상태(피킹 모드 On/Off 등)를 전혀 참조하지 않으므로 독립적으로 재사용·테스트 가능.

```js
function generateSelector(el) {
  if (el.id && isUniqueSelector(`#${CSS.escape(el.id)}`)) {
    return `#${CSS.escape(el.id)}`;
  }

  const classCandidate = buildClassSelector(el);
  if (classCandidate) {
    const count = document.querySelectorAll(classCandidate).length;
    if (count >= 1 && count <= 5) return classCandidate;
  }

  return buildUniquePath(el);
}

function buildClassSelector(el) {
  const stableClasses = Array.from(el.classList).filter(isStableClassName).slice(0, 3);
  if (stableClasses.length === 0) return null;
  return `${el.tagName.toLowerCase()}.${stableClasses.map(CSS.escape).join('.')}`;
}

// css-in-js 해시 클래스(예: css-1a2b3c4, sc-hKwDye) 배제 휴리스틱
function isStableClassName(cls) {
  if (/^(css|sc|jsx|emotion)-[a-z0-9]{5,}$/i.test(cls)) return false;
  if (/\d{4,}/.test(cls)) return false; // 4자리 이상 연속 숫자 포함 시 동적 클래스로 간주
  return true;
}

function isUniqueSelector(selector) {
  try { return document.querySelectorAll(selector).length === 1; }
  catch { return false; }
}

// DevTools "Copy selector"와 유사한 nth-child 경로 생성 (최대 5단계 상위까지)
function buildUniquePath(el, maxDepth = 5) {
  const parts = [];
  let node = el;
  for (let i = 0; i < maxDepth && node && node.nodeType === 1; i++) {
    if (node.id) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const parent = node.parentElement;
    if (!parent) { parts.unshift(node.tagName.toLowerCase()); break; }
    const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
    const index = siblings.indexOf(node) + 1;
    parts.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${index})`);
    const candidate = parts.join(' > ');
    if (isUniqueSelector(candidate)) return candidate;
    node = parent;
  }
  return parts.join(' > ');
}
```
- 성능: `querySelectorAll` 호출이 클릭 1회당 최대 수 회 발생하지만, 사용자가 "클릭"하는 이벤트 빈도이므로 성능에 영향 없음(mousemove에서는 절대 호출하지 않음 — 호버 갱신은 좌표 계산만 함).

## 7. 툴바 UI (`element-picker.js`)

모든 문구는 하드코딩하지 않고 `pickerMessages`(섹션 1에서 popup이 넘겨준 번역 결과)에서 가져온다:

```js
function injectPickerToolbar() {
  pickerToolbarEl = document.createElement('div');
  pickerToolbarEl.id = 'ssc-picker-toolbar';
  pickerToolbarEl.innerHTML = `
    <span class="ssc-toolbar-text">${pickerMessages.instruction}</span>
    <span class="ssc-toolbar-hint">${pickerMessages.hint}</span>
    <span id="ssc-picker-count" class="ssc-toolbar-count">0</span>
    <button id="ssc-picker-undo">${pickerMessages.undo}</button>
    <button id="ssc-picker-cancel">${pickerMessages.cancel}</button>
    <button id="ssc-picker-done">${pickerMessages.done}</button>
  `;
  document.documentElement.appendChild(pickerToolbarEl);
  pickerToolbarEl.querySelector('#ssc-picker-undo').addEventListener('click', undoLastPick);
  pickerToolbarEl.querySelector('#ssc-picker-cancel').addEventListener('click', cancelAllPicks);
  pickerToolbarEl.querySelector('#ssc-picker-done').addEventListener('click', finishPicking);
}

function updatePickerToolbarCount() {
  const countEl = document.getElementById('ssc-picker-count');
  if (countEl) countEl.textContent = String(pickedItems.length);
}
```
- `position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 2147483647;`
- 배경은 다크/라이트 사이트 어디서든 보이도록 확장 팝업 테마와 무관한 고정 팔레트 사용: 배경 `#1F1F1F` + 텍스트 `#FFD700`(팝업의 accent-color와 통일감), 반투명 없이 불투명 배경(사이트 콘텐츠와 겹쳐 보이지 않게).
- **좁은 뷰포트에서 줄바꿈 안전장치**: 컨테이너 너비가 뷰포트보다 크면 브라우저가 shrink-to-fit으로 폭을 줄이는데, 자식 요소에 `white-space: nowrap`이 없으면 "Enter: 종료"처럼 문구 중간이 다음 줄로 끊기는 보기 안 좋은 줄바꿈이 생긴다. 컨테이너는 `flex-wrap: wrap`으로 두되, 각 span/button에 `white-space: nowrap; flex-shrink: 0;`을 줘서 "항목 단위"로만 줄바꿈되게 하고, `max-width: min(640px, calc(100vw - 24px))`로 과도하게 넓어지는 것도 막는다.
- **버튼 3개, 역할이 뚜렷이 다르다** — "되돌리기"(`picker-undo`)와 "취소"(범용 `cancel` 키)를 나란히 두면 이름이 비슷해 헷갈린다는 팀 피드백으로 `picker-undo`의 한국어 값을 "실행 취소" → "되돌리기"로 바꿨다.
  - `undoLastPick()`: 마지막 한 개만 되돌림 — `undoPickedItem(pickedItems.length - 1)` 호출.
  - `cancelAllPicks()`: 이번 세션의 추가/취소를 **전부** 무효화하고 피킹 모드를 닫는다. `pickedItems`를 전부 `undoPickedItem`으로 되돌리고, `removedSelectors`도 비운 뒤 `refreshKnownHighlights()`로 원래 하이라이트 상태를 복원, `stopElementPicker()` 호출. 완료 토스트는 띄우지 않는다(아무것도 반영 안 됐으므로).
  - `finishPicking()`: `stopElementPicker()` 호출 + 완료 토스트 표시. 토스트 문구는 `pickerMessages.toast`의 `{count}` 플레이스홀더를 치환: `pickerMessages.toast.replace('{count}', pickedItems.length)`, 2.5초 후 자동 제거(페이지에 주입되는 것이므로 팝업의 `.status`와는 별도의 최소 인라인 스타일 사용).

## 8. Enter로 종료 처리 (`element-picker.js`)

```js
function handlePickerKeyDown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    finishPicking();
  }
}
```
Esc가 아닌 Enter를 종료 키로 쓴다. capture phase 리스너라 페이지 안 폼 입력 필드에 포커스가 가 있어도(피킹 모드 진입 시 커서가 crosshair로 바뀌므로 흔치는 않음) 폼 제출보다 먼저 가로채 `finishPicking()`이 실행된다.

## 9. i18n 신규 키 (`i18n.js`)

`ko`/`en` 두 언어 객체에 아래 키 추가 (기존 `hide-elements`, `add` 등과 같은 위치):

| key | ko | en |
|---|---|---|
| `pick-element` | 🎯 요소 선택 | 🎯 Pick Element |
| `picker-instruction` | 요소를 클릭해 숨길 항목으로 추가하세요 | Click an element to add it to the hide list |
| `picker-hint` | Shift+클릭: 한 단계씩 상위 요소로 · Enter: 종료 | Shift+Click: move up one level · Enter: finish |
| `picker-undo` | 되돌리기 | Undo |
| `picker-done` | 완료 | Done |
| `picker-toast` | {count}개 추가됨 · 확장 아이콘을 다시 클릭해 캡처하세요 | {count} added · click the extension icon again to capture |
| `elements-hidden-count` | {count}개 요소 숨겨짐 | {count} element(s) hidden |

"취소" 버튼은 새 키를 만들지 않고 기존 범용 `cancel` 키(팝업 미리보기 취소 버튼과 동일)를 재사용한다 — "되돌리기"(1단계)와 "취소"(전체 취소 후 닫기)가 이름이 비슷해 헷갈린다는 팀 피드백으로, `picker-undo`의 한국어 값을 "실행 취소" → "되돌리기"로 바꿔 구분을 명확히 했다.

`popup.html`의 새 버튼에는 기존 관례대로 `data-i18n="pick-element"` 부여.

## 10. 엣지 케이스 / 리스크

| 케이스 | 처리 |
|---|---|
| 사용자가 툴바 자체를 클릭 | `isPickerOwnElement`로 필터링, 무시 |
| 클릭한 지점이 `<iframe>` 내부(교차 출처) | `elementFromPoint`가 `<iframe>` 자체를 반환 → iframe 전체가 선택자 대상이 됨(의도된 동작, plan-v1.1.0.md 참고) |
| 동일 요소 두 번 클릭 | 무시되지 않고 **토글** — 두 번째 클릭에서 첫 번째 클릭이 취소됨(섹션 5의 케이스 2/4) |
| 이미 저장돼 있던 요소를 클릭 | 즉시 삭제되는 게 아니라 `removedSelectors`에 "취소 예약"만 되고, 팝업이 다시 열려 `getPickerChanges`를 가져갈 때 실제로 `hiddenSelectors`에서 제거됨(섹션 1) |
| Shift+클릭을 계속 반복해 `<body>`/`<html>`까지 올라가려는 경우 | `climbToLevel`이 `document.body`/`document.documentElement` 직전에서 멈춤 — 전체 페이지가 통째로 선택되는 사고 방지 |
| Shift+클릭 중간에 마우스가 살짝 움직여 다른 base 요소로 바뀜 | `handlePickerMouseMove`가 `climbLevel`을 0으로 리셋하므로, 클라이밍 도중 의도치 않게 다른 요소로 이동하면 처음부터 다시 올라가야 함(현재 hover 중인 요소 기준으로만 클라이밍이 누적된다는 걸 툴바 힌트 문구로 안내) |
| 페이지가 SPA라 DOM이 자주 바뀜 | 생성된 선택자는 "지금 시점의 DOM 구조" 기준 — SPA 리렌더로 클래스가 바뀌면 선택자가 무효화될 수 있음(기존 수동 입력 방식도 동일한 한계를 가지므로 새로운 리스크 아님) |
| `document.elementFromPoint`가 `null` 반환(뷰포트 밖 좌표 등) | `handlePickerMouseMove`에서 `null` 체크 후 오버레이 제거·`baseHoverTarget` 초기화 |
| 팝업이 아예 열리지 않고 방치(피킹만 하고 안 씀) | `pickedItems`는 페이지 메모리에만 있으므로 탭을 닫거나 새로고침하면 자연 소멸 — 데이터 유출/누적 위험 없음 |
| manifest 권한 diff | `manifest.json`의 `permissions` 배열은 건드리지 않음(`content_scripts[0].js`에 파일 3개 추가되는 것만 변경) — PR에서 `git diff manifest.json`을 보면 permissions 줄은 그대로, js 배열만 바뀌어야 정상 |
| 피킹 모드 중에는 팝업이 닫혀 있어 호버 동기화 Port가 없음 | 구조적으로 문제없음 — `startElementPicker` 호출 직전에 팝업이 `window.close()`로 닫히므로 그 시점에 `hoverSyncPort`도 자연히 disconnect됨 |
| 호버 동기화 중 `hiddenSelectors`가 팝업에서 변경(추가/삭제)됨 | 매 변경마다 `setKnownSelectors`를 다시 postMessage해야 함 — 안 하면 content script가 오래된 목록으로 매칭해 엉뚱한 태그가 활성화될 수 있음 |
| 페이지에 저장된 선택자가 아주 많음(수백 개) | `matchesKnownSelector`가 mousemove당(rAF로 제한된) 최대 목록 길이만큼 `closest()` 호출 — 일반적인 사용 범위(수십 개)에서는 문제없으나 극단적으로 많으면 살짝 느려질 수 있음(스코프 밖, 실사용 빈도상 무시 가능) |

## 11. 팝업-페이지 호버 동기화 (`hover-sync.js`, 신규)

이건 피커(클릭해서 추가)와는 별개 기능이다: **팝업이 열려 있는 동안**, 페이지에서 마우스를 이미 저장된 요소 위로 움직이면 팝업 안의 해당 선택자 태그 칩의 테두리가 활성화되어 "지금 가리키는 게 어느 태그인지" 바로 알 수 있게 한다.

### 왜 `sendMessage`가 아니라 `Port`인가

지금까지 다룬 메시지들은 전부 "한 번 요청하면 한 번 응답"하는 `chrome.tabs.sendMessage`였다. 이 기능은 마우스가 움직이는 동안 계속(초당 여러 번) 이벤트가 발생해야 하므로, 매번 새 메시지를 여는 대신 **`chrome.tabs.connect`로 연결한 장수명 `Port`** 하나를 계속 재사용한다. 팝업이 닫히면 Port가 자동으로 끊기므로 별도 정리 로직도 거의 필요 없다.

Chrome 확장 팝업은 "포커스를 잃으면" 닫히지, 페이지 위에서 마우스만 움직이는 것으로는 닫히지 않는다 — 그래서 팝업이 열린 채로 페이지를 호버할 수 있다(피커처럼 클릭까지는 필요 없으므로 이 기능에서는 팝업이 안 닫힌다).

### content script 쪽 (`hover-sync.js`)

```js
let hoverSyncPort = null;
let knownSelectorsForSync = [];
let lastReportedSelector = null;
let hoverSyncScheduled = false;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'ssc-hover-sync') return;
  hoverSyncPort = port;

  port.onMessage.addListener((msg) => {
    if (msg.action === 'setKnownSelectors') knownSelectorsForSync = msg.selectors || [];
  });

  document.addEventListener('mousemove', scheduleHoverSyncCheck, true);

  port.onDisconnect.addListener(() => {
    hoverSyncPort = null;
    lastReportedSelector = null;
    document.removeEventListener('mousemove', scheduleHoverSyncCheck, true);
  });
});

// mousemove는 초당 수십~수백 번 발생할 수 있으므로 rAF로 프레임당 1회로 제한
function scheduleHoverSyncCheck(e) {
  if (hoverSyncScheduled) return;
  hoverSyncScheduled = true;
  const { clientX, clientY } = e;
  requestAnimationFrame(() => {
    hoverSyncScheduled = false;
    checkHoverSync(clientX, clientY);
  });
}

function checkHoverSync(x, y) {
  if (!hoverSyncPort || knownSelectorsForSync.length === 0) return;
  const el = document.elementFromPoint(x, y);
  const matched = el ? knownSelectorsForSync.find((sel) => matchesKnownSelector(el, sel)) : null;
  if (matched === lastReportedSelector) return; // 변화 없으면 메시지 생략
  lastReportedSelector = matched || null;
  hoverSyncPort.postMessage({ selector: matched || null });
}

// 정확히 그 요소가 아니라 그 요소의 자손이어도(예: 숨겨진 배너 안의 텍스트) 매치되도록 closest 사용
function matchesKnownSelector(el, selector) {
  try { return !!el.closest(selector); } catch { return false; }
}
```

### popup 쪽 (`popup.js`)

```js
let hoverSyncPort = null;

function connectHoverSync(tabId) {
  try {
    hoverSyncPort = chrome.tabs.connect(tabId, { name: 'ssc-hover-sync' });
    hoverSyncPort.postMessage({ action: 'setKnownSelectors', selectors: hiddenSelectors });
    hoverSyncPort.onMessage.addListener((msg) => setActiveTag(msg.selector));
  } catch (e) {
    console.warn('Hover sync connect failed', e); // chrome:// 등 특수 페이지에서는 조용히 실패
  }
}

function setActiveTag(selector) {
  document.querySelectorAll('.tag').forEach((tagEl) => {
    tagEl.classList.toggle('tag-active', selector !== null && tagEl.dataset.selector === selector);
  });
}
```
- 팝업 로드 시 `loadFromStorage()` 이후 `connectHoverSync(tab.id)` 한 번 호출.
- `hiddenSelectors`가 바뀔 때마다(추가/삭제/초기화/`mergePickerChanges` 이후) `hoverSyncPort?.postMessage({ action: 'setKnownSelectors', selectors: hiddenSelectors })`로 최신 목록을 다시 보내야 매칭이 어긋나지 않는다.
- 팝업이 닫히면(포커스 이동 등) `hoverSyncPort`는 자동으로 끊어지고, content script 쪽 `onDisconnect`가 리스너를 정리한다 — 팝업 쪽에서 별도 정리 코드 불필요.

### `popup.html`/`popup.js` 태그 변경

`renderHiddenList()`가 만드는 `.tag` div에 `data-selector` 속성이 없어서 매칭할 수 없다 — 추가 필요:
```js
// renderHiddenList() 안, 기존 템플릿 리터럴 수정
`<div class="tag" data-selector="${selector}"> ... </div>`
```
CSS(`popup.html` 내 `<style>`)에 활성 상태 추가:
```css
.tag-active {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.25);
}
body[data-theme="light"] .tag-active {
  box-shadow: 0 0 0 2px rgba(27, 78, 245, 0.2);
}
```

## 12. 구현 순서 (제안)

1. `selector-generator.js` 신규 작성: `generateSelector` 계열 순수 함수 (DOM 읽기만 하므로 독립적으로 브라우저 콘솔에서 바로 테스트 가능)
2. `element-picker.js` 신규 작성: 상태 변수, 툴바/호버오버레이 DOM 주입, 이벤트 리스너, 토글 클릭 로직(섹션 5), `startElementPicker`/`stopElementPicker`/`getPickerChanges`/`clearPickerChanges` 정의
3. `hover-sync.js` 신규 작성 (섹션 11)
4. `manifest.json`: `content_scripts[0].js`에 세 파일 추가
5. `content.js`: `onMessage` 리스너에 라우팅 4줄만 추가
6. `popup.html`/`popup.js`: 피커 버튼 + `mergePickerChanges` 병합 로직 + 호버 동기화 연결(섹션 11) + 태그에 `data-selector`/`.tag-active` 스타일 추가
7. `i18n.js`: 문자열 추가
8. 수동 QA (plan-v1.1.0.md 검증 섹션 참고)
