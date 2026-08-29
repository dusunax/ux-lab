let hiddenElements = [];
let highlightedElements = [];

// Content script 로드 확인
console.log('[Smart Screenshot] Content script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'hideElements') {
      const count = hideElements(request.selectors);
      sendResponse({
        success: true,
        message: `${count}개 요소 숨김 처리 완료`,
        count,
      });
    } else if (request.action === 'showElements') {
      showElements();
      sendResponse({ success: true, message: '요소 표시 완료' });
    } else if (request.action === 'highlightElements') {
      highlightElements(request.selector);
      sendResponse({ success: true });
    } else if (request.action === 'clearHighlight') {
      clearHighlight();
      sendResponse({ success: true });
    } else if (request.action === 'highlightHiddenElements') {
      highlightHiddenElements(request.selectors);
      sendResponse({ success: true });
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
  } catch (error) {
    console.error('[Smart Screenshot] Error:', error);
    sendResponse({ success: false, error: error.message });
  }
});

function hideElements(selectors) {
  showElements();
  hiddenElements = [];
  let totalCount = 0;

  selectors.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        // 이미 숨겨진 요소는 스킵
        if (el.style.visibility !== 'hidden') {
          hiddenElements.push({
            element: el,
            originalVisibility: el.style.visibility,
          });
          el.style.setProperty('visibility', 'hidden', 'important');
          totalCount++;
        }
      });
      console.log(`[Smart Screenshot] Selector "${selector}" matched ${elements.length} elements`);
    } catch (e) {
      console.warn(`[Smart Screenshot] Invalid selector: ${selector}`, e);
    }
  });

  return totalCount;
}

function showElements() {
  hiddenElements.forEach(({ element, originalVisibility }) => {
    try {
      if (originalVisibility) {
        element.style.visibility = originalVisibility;
      } else {
        element.style.removeProperty('visibility');
      }
    } catch (e) {
      console.warn('[Smart Screenshot] Error restoring element', e);
    }
  });
  hiddenElements = [];
}

// border는 요소의 박스 크기에 더해져 주변 레이아웃을 밀어낼 수 있어
// box-shadow(inset)로 그린다 — box-sizing과 무관하게 레이아웃에 영향이 없다.
function highlightElements(selector) {
  clearHighlight();

  if (!selector || selector.trim() === '') {
    return;
  }

  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      const originalBoxShadow = el.style.boxShadow;
      const originalBackground = el.style.backgroundColor;
      const originalBoxSizing = el.style.boxSizing;
      el.style.setProperty('box-sizing', 'border-box', 'important');
      el.style.boxShadow = 'inset 0 0 0 2px #FF4444';
      highlightedElements.push({
        element: el,
        originalBoxShadow: originalBoxShadow,
        originalBackground: originalBackground,
        originalBoxSizing: originalBoxSizing,
      });
    });
    console.log(`[Smart Screenshot] Highlighted ${elements.length} elements`);
  } catch (e) {
    console.warn(`[Smart Screenshot] Invalid selector: ${selector}`, e);
  }
}

function clearHighlight() {
  highlightedElements.forEach(({ element, originalBoxShadow, originalBackground, originalBoxSizing }) => {
    try {
      // 인라인 스타일 직접 제거
      if (originalBoxShadow) {
        element.style.boxShadow = originalBoxShadow;
      } else {
        element.style.removeProperty('box-shadow');
      }
      if (originalBackground) {
        element.style.backgroundColor = originalBackground;
      } else {
        element.style.backgroundColor = '';
        element.style.removeProperty('background-color');
      }
      if (originalBoxSizing) {
        element.style.boxSizing = originalBoxSizing;
      } else {
        element.style.removeProperty('box-sizing');
      }
    } catch (e) {
      console.warn('[Smart Screenshot] Error clearing highlight', e);
    }
  });
  highlightedElements = [];
}

function highlightHiddenElements(selectors) {
  clearHighlight();

  if (!selectors || selectors.length === 0) {
    return;
  }

  selectors.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const originalBoxShadow = el.style.boxShadow;
        const originalBackground = el.style.backgroundColor;
        const originalBoxSizing = el.style.boxSizing;
        el.style.setProperty('box-sizing', 'border-box', 'important');
        el.style.setProperty('box-shadow', 'inset 0 0 0 2px #FF4444', 'important');
        el.style.setProperty('background-color', 'rgba(255, 68, 68, 0.1)', 'important');
        highlightedElements.push({
          element: el,
          originalBoxShadow: originalBoxShadow,
          originalBackground: originalBackground,
          originalBoxSizing: originalBoxSizing,
        });
      });
    } catch (e) {
      console.warn(`[Smart Screenshot] Invalid selector: ${selector}`, e);
    }
  });

  console.log(`[Smart Screenshot] Highlighted ${highlightedElements.length} hidden elements`);
}
