// 팝업이 열려 있는 동안, 페이지 호버 위치와 팝업의 선택자 태그를 실시간으로 연결한다.
// 요소 피커(element-picker.js)와는 별개 기능 — 팝업이 열려 있을 때만 동작하고,
// 팝업이 닫히면(Port disconnect) 자동으로 정리된다.

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
  const clientX = e.clientX;
  const clientY = e.clientY;
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
  try {
    return !!el.closest(selector);
  } catch (e) {
    return false;
  }
}
