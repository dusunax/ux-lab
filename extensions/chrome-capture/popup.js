let hiddenSelectors = [];
let currentScreenshot = null;

const selectorInput = document.getElementById('selectorInput');
const addBtn = document.getElementById('addBtn');
const captureBtn = document.getElementById('captureBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const cancelBtn = document.getElementById('cancelBtn');
const hiddenElementsList = document.getElementById('hiddenElementsList');
const statusDiv = document.getElementById('status');
const editorSection = document.getElementById('editorSection');
const captureSection = document.getElementById('captureSection');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const previewSize = document.getElementById('previewSize');
const optionsBtn = document.getElementById('optionsBtn');
const pickBtn = document.getElementById('pickBtn');
const previewZoomLens = document.getElementById('previewZoomLens');

const ZOOM_FACTOR = 3.5;
const ZOOM_LENS_SIZE = 220;

// 초기화
loadFromStorage();
loadTheme();
loadLanguage();
addBtn.addEventListener('click', addSelector);
selectorInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addSelector();
});
captureBtn.addEventListener('click', captureScreenshot);
resetBtn.addEventListener('click', resetAll);
downloadBtn.addEventListener('click', downloadScreenshot);
cancelBtn.addEventListener('click', cancelPreview);
optionsBtn.addEventListener('click', openOptions);
pickBtn.addEventListener('click', startPicker);

function loadFromStorage() {
  const stored = localStorage.getItem('smartScreenshot_selectors');
  if (stored) {
    try {
      hiddenSelectors = JSON.parse(stored);
      renderHiddenList();
    } catch (e) {
      console.error('Failed to load from storage', e);
    }
  }
}

function saveToStorage() {
  localStorage.setItem('smartScreenshot_selectors', JSON.stringify(hiddenSelectors));
}

async function addSelector() {
  const selector = selectorInput.value.trim();

  if (!selector) {
    showStatus(getI18nMessage('selector-required'), 'error');
    return;
  }

  if (hiddenSelectors.includes(selector)) {
    showStatus(getI18nMessage('selector-exists'), 'error');
    return;
  }

  // 선택자 유효성 검증
  try {
    document.querySelector(selector);
  } catch (e) {
    showStatus(`❌ 유효하지 않은 선택자: ${selector}`, 'error');
    return;
  }

  hiddenSelectors.push(selector);
  saveToStorage();
  selectorInput.value = '';
  renderHiddenList();
  showStatus(`✓ ${selector} ${getI18nMessage('selector-added')}`, 'success');
  await updateAllHighlights();
  syncKnownSelectorsToHoverSync();
}

async function removeSelector(selector) {
  hiddenSelectors = hiddenSelectors.filter((s) => s !== selector);
  saveToStorage();
  renderHiddenList();
  showStatus(`✓ ${selector} ${getI18nMessage('selector-removed')}`, 'success');
  await updateAllHighlights();
  syncKnownSelectorsToHoverSync();
}

function renderHiddenList() {
  hiddenElementsList.innerHTML = hiddenSelectors
    .map(
      (selector) => `
    <div class="tag" data-selector="${selector}">
      <span>${selector}</span>
      <span class="tag-remove" data-selector="${selector}">×</span>
    </div>
  `
    )
    .join('');

  document.querySelectorAll('.tag-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      removeSelector(e.target.dataset.selector);
    });
  });
}

async function captureScreenshot() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showStatus(getI18nMessage('page-unavailable'), 'error');
      return;
    }

    captureBtn.disabled = true;
    captureBtn.innerHTML = '⏳ 처리 중...';

    // Step 1: 요소 숨기기
    if (hiddenSelectors.length > 0) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'hideElements',
          selectors: hiddenSelectors,
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Content script 통신 실패', e);
        showStatus(getI18nMessage('hide-failed'), 'warning');
      }
    }

    // Step 1-1: 피커 완료 토스트 등 컨트롤 UI가 남아있다면 캡처 전 항상 제거
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'hidePickerUIForCapture' });
    } catch (e) {
      // content script 통신 실패는 무시 — 애초에 컨트롤 UI가 없는 페이지일 수 있음
    }

    // Step 2: 스크린샷 캡처
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
    });

    // Step 3: 요소 다시 표시
    if (hiddenSelectors.length > 0) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'showElements' });
      } catch (e) {
        console.warn('요소 복원 실패', e);
      }
    }

    // Step 4: 미리보기 표시
    currentScreenshot = dataUrl;
    showPreview(dataUrl);
  } catch (error) {
    console.error('Screenshot error:', error);

    if (error.message.includes('permission')) {
      showStatus(getI18nMessage('page-unavailable'), 'error');
    } else if (error.message.includes('not allowed')) {
      showStatus(getI18nMessage('page-unavailable'), 'error');
    } else {
      showStatus(`${getI18nMessage('error')}: ${error.message}`, 'error');
    }
  } finally {
    captureBtn.disabled = false;
    captureBtn.innerHTML = getI18nMessage('capture-btn');
  }
}

function showPreview(dataUrl) {
  previewImage.src = dataUrl;
  previewSection.classList.add('active');
  editorSection.style.display = 'none';
  captureSection.style.display = 'none';

  // 이미지 크기 정보 표시
  const img = new Image();
  img.onload = () => {
    const sizeMB = (dataUrl.length / (1024 * 1024)).toFixed(2);
    const hiddenCountText = getI18nMessage('elements-hidden-count').replace('{count}', String(hiddenSelectors.length));
    previewSize.textContent = `${img.width}×${img.height}px • ${sizeMB}MB • ${hiddenCountText}`;
  };
  img.src = dataUrl;

  showStatus(getI18nMessage('preview-ready-msg'), 'success');
}

// previewImage는 object-fit: contain이라, 박스 크기와 실제 그려지는 이미지
// 크기가 다를 수 있다(레터박스). 레터박스 여백까지 확대 기준으로 삼으면
// 가로세로 배율이 어긋나 비율이 깨지므로, 실제 이미지가 그려지는 영역만 계산한다.
function getRenderedImageRect() {
  const box = previewImage.getBoundingClientRect();
  const naturalW = previewImage.naturalWidth;
  const naturalH = previewImage.naturalHeight;
  if (!naturalW || !naturalH) return box;

  const boxRatio = box.width / box.height;
  const imgRatio = naturalW / naturalH;

  let width = box.width;
  let height = box.height;
  if (imgRatio > boxRatio) {
    height = box.width / imgRatio;
  } else {
    width = box.height * imgRatio;
  }

  return {
    left: box.left + (box.width - width) / 2,
    top: box.top + (box.height - height) / 2,
    width,
    height,
  };
}

function handlePreviewZoomMove(e) {
  if (!previewImage.src) return;
  const box = previewImage.getBoundingClientRect();
  const content = getRenderedImageRect();

  const contentX = e.clientX - content.left;
  const contentY = e.clientY - content.top;

  if (contentX < 0 || contentY < 0 || contentX > content.width || contentY > content.height) {
    previewZoomLens.style.display = 'none';
    return;
  }

  previewZoomLens.style.display = 'block';
  previewZoomLens.style.width = `${ZOOM_LENS_SIZE}px`;
  previewZoomLens.style.height = `${ZOOM_LENS_SIZE}px`;

  // 렌즈 자체 위치는 이미지 박스(wrapper 좌표계) 기준으로 clamp
  const boxX = e.clientX - box.left;
  const boxY = e.clientY - box.top;
  const lensX = Math.max(0, Math.min(boxX - ZOOM_LENS_SIZE / 2, box.width - ZOOM_LENS_SIZE));
  const lensY = Math.max(0, Math.min(boxY - ZOOM_LENS_SIZE / 2, box.height - ZOOM_LENS_SIZE));
  previewZoomLens.style.left = `${lensX}px`;
  previewZoomLens.style.top = `${lensY}px`;

  // 확대 기준은 레터박스 뺀 실제 이미지 영역(content) — 가로세로 배율이 항상 같아 비율 유지
  previewZoomLens.style.backgroundImage = `url(${currentScreenshot})`;
  previewZoomLens.style.backgroundSize = `${content.width * ZOOM_FACTOR}px ${content.height * ZOOM_FACTOR}px`;
  previewZoomLens.style.backgroundPosition = `${-(contentX * ZOOM_FACTOR - ZOOM_LENS_SIZE / 2)}px ${-(contentY * ZOOM_FACTOR - ZOOM_LENS_SIZE / 2)}px`;
}

function hidePreviewZoomLens() {
  previewZoomLens.style.display = 'none';
}

previewImage.addEventListener('mousemove', handlePreviewZoomMove);
previewImage.addEventListener('mouseleave', hidePreviewZoomLens);

function downloadScreenshot() {
  if (!currentScreenshot) return;

  const link = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  link.href = currentScreenshot;
  link.download = `screenshot-${timestamp}.png`;
  link.click();

  // 다운로드 후 미리보기 닫기
  setTimeout(cancelPreview, 500);
}

async function cancelPreview() {
  currentScreenshot = null;
  previewSection.classList.remove('active');
  editorSection.style.display = 'block';
  captureSection.style.display = 'block';
  previewImage.src = '';
  statusDiv.textContent = '';
  hidePreviewZoomLens();
  await updateAllHighlights();
}

async function resetAll() {
  if (confirm(getI18nMessage('reset-confirm'))) {
    hiddenSelectors = [];
    saveToStorage();
    renderHiddenList();
    selectorInput.value = '';
    statusDiv.textContent = '';
    statusDiv.className = 'status';
    showStatus(getI18nMessage('reset-done'), 'success');
    await updateAllHighlights();
    syncKnownSelectorsToHoverSync();
  }
}

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  if (type === 'success' || type === 'error' || type === 'warning') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }
}

function loadTheme() {
  const theme = localStorage.getItem('smartScreenshot_theme') || 'dark';
  applyTheme(theme);
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
}

function loadLanguage() {
  const lang = localStorage.getItem('smartScreenshot_language') || 'ko';
  applyLanguageToPage(lang);
}

function openOptions() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('options.html')
  });
}


async function startPicker() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'startElementPicker',
      knownHiddenSelectors: hiddenSelectors,
      messages: {
        instruction: getI18nMessage('picker-instruction'),
        hint: getI18nMessage('picker-hint'),
        undo: getI18nMessage('picker-undo'),
        cancel: getI18nMessage('cancel'),
        done: getI18nMessage('picker-done'),
        count: getI18nMessage('picker-count'),
        toast: getI18nMessage('picker-toast'),
      },
    });
  } catch (e) {
    console.warn('Start picker failed', e);
    showStatus(getI18nMessage('page-unavailable'), 'error');
    return;
  }
  window.close(); // 포커스 이동으로 어차피 닫히지만 명시적으로 닫아 유령 팝업 방지
}

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
    await updateAllHighlights();
    syncKnownSelectorsToHoverSync();

    if (added.length || res.removed.length) {
      showStatus(`✓ ${added.length}개 추가, ${res.removed.length}개 취소됨`, 'success');
    }
  } catch (e) {
    console.warn('Merge picker changes failed', e);
  }
}

/* ---------- 팝업-페이지 호버 동기화 ---------- */

let hoverSyncPort = null;

async function connectHoverSync() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    hoverSyncPort = chrome.tabs.connect(tab.id, { name: 'ssc-hover-sync' });
    hoverSyncPort.postMessage({ action: 'setKnownSelectors', selectors: hiddenSelectors });
    hoverSyncPort.onMessage.addListener((msg) => setActiveTag(msg.selector));
  } catch (e) {
    console.warn('Hover sync connect failed', e); // chrome:// 등 특수 페이지에서는 조용히 실패
  }
}

function syncKnownSelectorsToHoverSync() {
  if (!hoverSyncPort) return;
  try {
    hoverSyncPort.postMessage({ action: 'setKnownSelectors', selectors: hiddenSelectors });
  } catch (e) {
    console.warn('Hover sync update failed', e);
  }
}

function setActiveTag(selector) {
  document.querySelectorAll('.tag').forEach((tagEl) => {
    tagEl.classList.toggle('tag-active', selector !== null && tagEl.dataset.selector === selector);
  });
}

async function updateAllHighlights() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    // 목록의 모든 요소 하이라이트
    if (hiddenSelectors.length > 0) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'highlightHiddenElements',
        selectors: hiddenSelectors,
      });
    } else {
      // 목록이 비어있으면 하이라이트 제거
      await chrome.tabs.sendMessage(tab.id, {
        action: 'clearHighlight',
      });
    }
  } catch (e) {
    console.warn('Update highlights failed', e);
  }
}

// 초기 렌더링
renderHiddenList();

// 팝업 로드 시 하이라이트 표시 + 피커에서 대기 중인 변경사항 병합 + 호버 동기화 연결
updateAllHighlights();
mergePickerChanges();
connectHoverSync();
