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

  hiddenSelectors.push(selector);
  saveToStorage();
  selectorInput.value = '';
  renderHiddenList();
  showStatus(`✓ ${selector} ${getI18nMessage('selector-added')}`, 'success');
  await updateAllHighlights();
}

async function removeSelector(selector) {
  hiddenSelectors = hiddenSelectors.filter((s) => s !== selector);
  saveToStorage();
  renderHiddenList();
  showStatus(`✓ ${selector} ${getI18nMessage('selector-removed')}`, 'success');
  await updateAllHighlights();
}

function renderHiddenList() {
  hiddenElementsList.innerHTML = hiddenSelectors
    .map(
      (selector) => `
    <div class="tag">
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
    captureBtn.innerHTML = '⛶ 현재 탭 캡처';
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
    previewSize.textContent = `${img.width}×${img.height}px • ${sizeMB}MB`;
  };
  img.src = dataUrl;

  showStatus(getI18nMessage('preview-ready-msg'), 'success');
}

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

// 팝업 로드 시 하이라이트 표시
updateAllHighlights();
