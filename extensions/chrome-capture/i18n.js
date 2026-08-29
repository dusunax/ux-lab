// 다국어 관리 파일
const i18n = {
  ko: {
    // 공통
    'dark-mode': '🌙 다크모드',
    'dark-mode-desc': '어두운 테마로 변경',
    'language': '🌐 언어',
    'language-desc': '한국어 / English',
    'lang-ko': '한국어',
    'lang-en': 'English',
    'status-save': '✓ 설정이 저장되었습니다',
    'settings-title': '⚙️ 설정',
    'version': 'Smart Screenshot Capture v1.0.0',
    'copyright': '© 2026 All rights reserved',

    // 팝업
    'hide-elements': '숨길 요소',
    'add': '추가',
    'reset': '초기화',
    'capture-section': '캡처',
    'capture-btn': '⛶ 현재 탭 캡처',
    'shortcut': '단축키',
    'preview-section': '미리보기',
    'preview-ready': '✓ 스크린샷이 준비되었습니다',
    'download': '💾 다운로드',
    'cancel': '취소',
    'css-selector-placeholder': 'CSS selector (e.g., .navbar, #sidebar)',
    'selector-required': 'CSS selector를 입력하세요',
    'selector-exists': '이미 추가된 selector입니다',
    'selector-added': '추가됨',
    'selector-removed': '제거됨',
    'preview-ready-msg': '✓ 다운로드 준비 완료!',
    'page-unavailable': '❌ 이 페이지에서는 사용 불가능합니다',
    'hide-failed': '⚠️ 요소 숨김 불가 (보안 정책) - 전체 페이지 캡처합니다',
    'error': '❌ 오류',
    'reset-confirm': '모든 선택 요소를 삭제하시겠습니까?',
    'reset-done': '✓ 초기화됨',
    'pick-element': '🎯 요소 선택',
    'picker-instruction': '요소를 클릭해 숨길 항목으로 추가하세요',
    'picker-hint': 'Shift+클릭: 한 단계씩 상위 요소로 · Enter: 종료',
    'picker-undo': '되돌리기',
    'picker-done': '완료',
    'picker-toast': '{count}개 추가됨 · 확장 아이콘을 다시 클릭해 캡처하세요',
    'elements-hidden-count': '{count}개 요소 숨겨짐'
  },
  en: {
    // 공통
    'dark-mode': '🌙 Dark Mode',
    'dark-mode-desc': 'Switch to dark theme',
    'language': '🌐 Language',
    'language-desc': 'Korean / English',
    'lang-ko': '한국어',
    'lang-en': 'English',
    'status-save': '✓ Settings saved',
    'settings-title': '⚙️ Settings',
    'version': 'Smart Screenshot Capture v1.0.0',
    'copyright': '© 2026 All rights reserved',

    // 팝업
    'hide-elements': 'Hide Elements',
    'add': 'Add',
    'reset': 'Reset',
    'capture-section': 'Capture',
    'capture-btn': '⛶ Capture Current Tab',
    'shortcut': 'Shortcut',
    'preview-section': 'Preview',
    'preview-ready': '✓ Screenshot is ready',
    'download': '💾 Download',
    'cancel': 'Cancel',
    'css-selector-placeholder': 'CSS selector (e.g., .navbar, #sidebar)',
    'selector-required': 'Enter CSS selector',
    'selector-exists': 'Selector already added',
    'selector-added': 'added',
    'selector-removed': 'removed',
    'preview-ready-msg': '✓ Ready to download!',
    'page-unavailable': '❌ This page is not available',
    'hide-failed': '⚠️ Cannot hide elements (security policy) - capturing full page',
    'error': '❌ Error',
    'reset-confirm': 'Delete all selected elements?',
    'reset-done': '✓ Reset',
    'pick-element': '🎯 Pick Element',
    'picker-instruction': 'Click an element to add it to the hide list',
    'picker-hint': 'Shift+Click: move up one level · Enter: finish',
    'picker-undo': 'Undo',
    'picker-done': 'Done',
    'picker-toast': '{count} added · click the extension icon again to capture',
    'elements-hidden-count': '{count} element(s) hidden'
  }
};

/**
 * 현재 언어로 메시지 가져오기
 * @param {string} key - 메시지 키
 * @returns {string} 해당 언어의 메시지
 */
function getI18nMessage(key) {
  const lang = localStorage.getItem('smartScreenshot_language') || 'ko';
  return i18n[lang][key] || i18n.ko[key];
}

/**
 * 모든 data-i18n 요소의 텍스트 업데이트
 * @param {string} lang - 언어 코드 (ko, en)
 */
function applyLanguageToPage(lang) {
  // 텍스트 업데이트
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  // placeholder 업데이트
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang] && i18n[lang][key]) {
      el.placeholder = i18n[lang][key];
    }
  });

  // title 업데이트
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (i18n[lang] && i18n[lang][key]) {
      el.title = i18n[lang][key];
    }
  });
}
