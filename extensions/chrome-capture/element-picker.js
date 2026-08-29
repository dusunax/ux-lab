// 요소 클릭 피커: 팝업 자동 닫힘 제약을 우회해 content script가 페이지에 직접
// 주입하는 피킹 모드. selector-generator.js의 generateSelector와
// content.js의 highlightHiddenElements(기존 함수)를 재사용한다.

let pickerActive = false;
let pickedItems = [];          // 이번 세션에서 새로 추가한 { selector, level, element, originalBoxShadow, originalBackground, originalBoxSizing }
let knownHiddenSelectors = []; // startElementPicker 시점에 팝업이 넘겨준 "이미 저장된" 선택자 스냅샷
let removedSelectors = [];     // knownHiddenSelectors 중 이번 세션에서 재클릭으로 취소한 것들
let pickerClickShieldEl = null; // 뷰포트 전체를 덮는 투명 클릭 차단막 (아래 설명)
let hoverOverlayEl = null;     // 호버 미리보기용 오버레이 div (position: fixed)
let levelBadgeEl = null;       // 호버 미리보기의 "↑{level}" 숫자 배지
let pickerToolbarEl = null;    // 상단 안내 툴바
let pickerToastEl = null;      // 완료 토스트
let pickerMessages = {};       // popup에서 받은 i18n 번역 문자열

let baseHoverTarget = null;    // 커서 아래 "원본" 요소 (elementFromPoint 그대로, 클라이밍 기준점)
let climbLevel = 0;            // baseHoverTarget에서 Shift+클릭으로 몇 단계 올라갔는지
let currentHoverTarget = null; // baseHoverTarget에서 climbLevel만큼 조상으로 올라간, 지금 실제로 하이라이트되는 요소

function borderWidthForLevel(level) {
  return 2 + level; // level 0 → 2px, level 1(부모) → 3px, level 2(조부모) → 4px ...
}

function isPickerOwnElement(el) {
  return !!el.closest('#ssc-picker-toolbar, #ssc-hover-overlay, #ssc-level-badge, #ssc-picker-toast');
}

// iframe으로 렌더링되는 광고 등을 클릭하면, 브라우저가 클릭 좌표를 애초에
// iframe 내부 문서로 직접 전달해버려 우리 스크립트가 가로챌 기회 자체가
// 없다(광고 클릭/이동이 그대로 실행됨). 뷰포트 전체를 덮는 투명 오버레이를
// 두면 물리적인 클릭이 항상 이 오버레이(우리 쪽 문서)로 먼저 떨어지므로
// iframe에는 아예 도달하지 않는다.
function ensureClickShield() {
  if (pickerClickShieldEl) return pickerClickShieldEl;
  pickerClickShieldEl = document.createElement('div');
  pickerClickShieldEl.id = 'ssc-picker-click-shield';
  pickerClickShieldEl.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483645;
    background: transparent; cursor: crosshair;
  `;
  document.documentElement.appendChild(pickerClickShieldEl);
  return pickerClickShieldEl;
}

function removeClickShield() {
  if (pickerClickShieldEl) {
    pickerClickShieldEl.remove();
    pickerClickShieldEl = null;
  }
}

// 차단막이 항상 elementFromPoint에 잡히면 그 아래 실제 요소(광고 iframe 포함)를
// 확인할 수 없으므로, 조회하는 순간만 pointer-events를 껐다 켠다. 실제 클릭
// 이벤트는 이미 차단막이 받은 뒤이므로 이 토글은 elementFromPoint 결과에만
// 영향을 주고, iframe으로의 클릭 전달은 막힌 상태 그대로 유지된다.
function elementBeneathShield(x, y) {
  if (pickerClickShieldEl) pickerClickShieldEl.style.pointerEvents = 'none';
  const el = document.elementFromPoint(x, y);
  if (pickerClickShieldEl) pickerClickShieldEl.style.pointerEvents = 'auto';
  return el;
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

/* ---------- 호버 오버레이 + 레벨 배지 ---------- */

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

/* ---------- 마우스 이동 / 클릭 처리 ---------- */

function handlePickerMouseMove(e) {
  const rawTarget = elementBeneathShield(e.clientX, e.clientY);
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

function handlePickerClick(e) {
  if (isPickerOwnElement(e.target)) return; // 툴바 자체 클릭은 무시(버튼이 자체 핸들러 처리)
  e.preventDefault();
  e.stopPropagation();
  if (!currentHoverTarget) return;

  if (e.shiftKey) {
    climbLevel += 1;
    currentHoverTarget = climbToLevel(baseHoverTarget, climbLevel);
    updateHoverOverlay(currentHoverTarget, climbLevel); // 두께/배지만 갱신, 아직 추가 안 함
    return;
  }

  toggleClickedElement(currentHoverTarget, climbLevel);
  climbLevel = 0; // 다음 픽을 위해 리셋 — 마우스가 안 움직여도 다시 leaf부터 시작
}

function handlePickerKeyDown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    finishPicking();
  }
}

/* ---------- 클릭 토글: 새로 추가 / 내 픽 취소 / 저장된 항목 취소 / 취소의 취소 ---------- */

function toggleClickedElement(el, level) {
  const selector = generateSelector(el); // selector-generator.js

  const pickedIndex = pickedItems.findIndex((item) => item.selector === selector);
  if (pickedIndex !== -1) {
    undoPickedItem(pickedIndex);
    return;
  }

  if (knownHiddenSelectors.includes(selector)) {
    if (removedSelectors.includes(selector)) {
      removedSelectors = removedSelectors.filter((s) => s !== selector); // 취소를 다시 취소
    } else {
      removedSelectors.push(selector); // 저장된 요소 취소 예약
    }
    refreshKnownHighlights();
    return;
  }

  confirmPick(el, level);
}

// border는 요소의 박스 크기에 더해져 주변 레이아웃을 밀어낼 수 있어(특히
// width/height가 명시된 요소) box-shadow(inset)로 그린다 — box-shadow는
// box-sizing과 무관하게 레이아웃에 전혀 영향을 주지 않는다. box-sizing도
// border-box로 맞춰 혹시 다른 스타일과 충돌할 여지를 줄인다.
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

function undoLastPick() {
  if (pickedItems.length === 0) return;
  undoPickedItem(pickedItems.length - 1);
}

// "되돌리기"(한 단계씩)와 달리, 이번 세션의 추가/취소를 전부 무효화하고 피킹 모드를 닫는다.
function cancelAllPicks() {
  while (pickedItems.length > 0) {
    undoPickedItem(pickedItems.length - 1);
  }
  removedSelectors = [];
  refreshKnownHighlights();
  stopElementPicker();
}

// knownHiddenSelectors 중 removedSelectors에 없는 것만 다시 하이라이트 — content.js의 기존 함수 재사용
function refreshKnownHighlights() {
  const stillHidden = knownHiddenSelectors.filter((s) => !removedSelectors.includes(s));
  highlightHiddenElements(stillHidden);
}

/* ---------- 툴바 UI ---------- */

function injectPickerToolbar() {
  pickerToolbarEl = document.createElement('div');
  pickerToolbarEl.id = 'ssc-picker-toolbar';
  // 설명 텍스트(1행)와 힌트 텍스트(2행)는 각각 항상 자기 줄을 혼자 차지하고,
  // 카운트+버튼은 그 아래 별도 행(3행)에 둔다 — column 방향 3행 구조라
  // 좁은 뷰포트에서도 텍스트 다음에 항상 줄바꿈되는 구조 자체는 유지된다.
  // 3행 내부는 flex-wrap: wrap + 각 항목 white-space:nowrap/flex-shrink:0으로,
  // 정말 좁을 때도 버튼 단위로만 줄바꿈되고 문구 중간이 끊기지 않는다.
  // 배경은 사이트 위에 겹쳐도 위화감이 적도록 옅은 유리질감(그래스모피즘) 사용.
  pickerToolbarEl.style.cssText = `
    position: fixed; top: 0; left: 50%; transform: translateX(-50%);
    z-index: 2147483647; background: rgba(31,31,31,0.8);
    backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
    color: #FFD700; font: 500 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 10px 16px; border-radius: 0 0 10px 10px; display: flex;
    flex-direction: column; align-items: center; gap: 6px;
    max-width: min(640px, calc(100vw - 24px)); box-shadow: 0 2px 12px rgba(0,0,0,0.25);
  `;
  pickerToolbarEl.innerHTML = `
    <span class="ssc-toolbar-text" style="text-align:center;">${pickerMessages.instruction || ''}</span>
    <span class="ssc-toolbar-hint" style="color:#A8A8A8;font-size:11px;text-align:center;">${pickerMessages.hint || ''}</span>
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 6px;">
      <span id="ssc-picker-count" style="background:rgba(58,58,58,0.8);color:#FFD700;padding:2px 8px;border-radius:10px;font-size:11px;white-space:nowrap;flex-shrink:0;">${(pickerMessages.count || '{count}').replace('{count}', '0')}</span>
      <button id="ssc-picker-undo" style="background:rgba(45,45,45,0.8);color:#E8E8E8;border:1px solid #4A4A4A;border-radius:4px;padding:5px 10px;font-size:11px;white-space:nowrap;flex-shrink:0;cursor:pointer;">${pickerMessages.undo || ''}</button>
      <button id="ssc-picker-cancel" style="background:rgba(45,45,45,0.8);color:#D99595;border:1px solid #4A4A4A;border-radius:4px;padding:5px 10px;font-size:11px;white-space:nowrap;flex-shrink:0;cursor:pointer;">${pickerMessages.cancel || ''}</button>
      <button id="ssc-picker-done" style="background:#FFD700;color:#1F1F1F;border:none;border-radius:4px;padding:5px 10px;font-size:11px;font-weight:600;white-space:nowrap;flex-shrink:0;cursor:pointer;">${pickerMessages.done || ''}</button>
    </div>
  `;
  document.documentElement.appendChild(pickerToolbarEl);
  pickerToolbarEl.querySelector('#ssc-picker-undo').addEventListener('click', undoLastPick);
  pickerToolbarEl.querySelector('#ssc-picker-cancel').addEventListener('click', cancelAllPicks);
  pickerToolbarEl.querySelector('#ssc-picker-done').addEventListener('click', finishPicking);
}

function updatePickerToolbarCount() {
  const countEl = document.getElementById('ssc-picker-count');
  if (countEl) countEl.textContent = (pickerMessages.count || '{count}').replace('{count}', String(pickedItems.length));
}

function removePickerToolbar() {
  if (pickerToolbarEl) {
    pickerToolbarEl.remove();
    pickerToolbarEl = null;
  }
}

function showPickerToast(message) {
  if (pickerToastEl) pickerToastEl.remove();
  pickerToastEl = document.createElement('div');
  pickerToastEl.id = 'ssc-picker-toast';
  pickerToastEl.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    z-index: 2147483647; background: #1F1F1F; color: #FFD700;
    font: 500 13px/1.5 -apple-system, sans-serif; padding: 10px 16px;
    border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  pickerToastEl.textContent = message;
  document.documentElement.appendChild(pickerToastEl);
  setTimeout(() => {
    if (pickerToastEl) {
      pickerToastEl.remove();
      pickerToastEl = null;
    }
  }, 2500);
}

function finishPicking() {
  const addedCount = pickedItems.length;
  stopElementPicker();
  if (pickerMessages.toast) {
    showPickerToast(pickerMessages.toast.replace('{count}', String(addedCount)));
  }
}

/* ---------- 시작/종료 + 메시지 핸들러 ---------- */

function startElementPicker(messages, hiddenSelectorsSnapshot) {
  if (pickerActive) return;
  pickerActive = true;
  pickerMessages = messages || {};
  knownHiddenSelectors = hiddenSelectorsSnapshot || [];
  removedSelectors = [];
  ensureClickShield();
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
  removeClickShield();
  removeHoverOverlay();
  removePickerToolbar();
}

// 캡처 직전 항상 호출 — 완료 토스트가 아직 떠 있거나(2.5초 타이머 중 바로 재캡처한
// 경우) 피킹 모드가 어떤 이유로든 여전히 켜져 있으면 컨트롤 UI가 스크린샷에
// 찍히지 않도록 정리한다.
function hidePickerUIForCapture() {
  if (pickerToastEl) {
    pickerToastEl.remove();
    pickerToastEl = null;
  }
  if (pickerActive) {
    stopElementPicker();
  }
}

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
