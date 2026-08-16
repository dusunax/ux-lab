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
        if (el.style.display !== 'none') {
          hiddenElements.push({
            element: el,
            originalDisplay: el.style.display,
          });
          el.style.setProperty('display', 'none', 'important');
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
  hiddenElements.forEach(({ element, originalDisplay }) => {
    try {
      element.style.display = originalDisplay || '';
    } catch (e) {
      console.warn('[Smart Screenshot] Error restoring element', e);
    }
  });
  hiddenElements = [];
}

function highlightElements(selector) {
  clearHighlight();

  if (!selector || selector.trim() === '') {
    return;
  }

  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      const originalBorder = el.style.border;
      const originalBackground = el.style.backgroundColor;
      el.style.border = '2px solid #FF4444';
      highlightedElements.push({
        element: el,
        originalBorder: originalBorder,
        originalBackground: originalBackground,
      });
    });
    console.log(`[Smart Screenshot] Highlighted ${elements.length} elements`);
  } catch (e) {
    console.warn(`[Smart Screenshot] Invalid selector: ${selector}`, e);
  }
}

function clearHighlight() {
  highlightedElements.forEach(({ element, originalBorder, originalBackground }) => {
    try {
      if (originalBorder) {
        element.style.border = originalBorder;
      } else {
        element.style.removeProperty('border');
      }
      if (originalBackground) {
        element.style.backgroundColor = originalBackground;
      } else {
        element.style.removeProperty('background-color');
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
        const originalBorder = el.style.border;
        const originalBackground = el.style.backgroundColor;
        el.style.setProperty('border', '2px solid #FF4444', 'important');
        el.style.setProperty('background-color', 'rgba(255, 68, 68, 0.1)', 'important');
        highlightedElements.push({
          element: el,
          originalBorder: originalBorder,
          originalBackground: originalBackground,
        });
      });
    } catch (e) {
      console.warn(`[Smart Screenshot] Invalid selector: ${selector}`, e);
    }
  });

  console.log(`[Smart Screenshot] Highlighted ${highlightedElements.length} hidden elements`);
}
