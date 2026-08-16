const themeToggle = document.getElementById('themeToggle');
const statusMessage = document.getElementById('statusMessage');
const langButtons = document.querySelectorAll('.lang-btn');

// 초기화
loadTheme();
loadLanguage();
themeToggle.addEventListener('click', toggleTheme);
langButtons.forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

function loadTheme() {
  const theme = localStorage.getItem('smartScreenshot_theme') || 'dark';
  applyTheme(theme);
}

function toggleTheme() {
  const isDark = themeToggle.classList.toggle('active');
  const theme = isDark ? 'dark' : 'light';
  localStorage.setItem('smartScreenshot_theme', theme);
  applyTheme(theme);
  showStatus();
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  if (theme === 'light') {
    themeToggle.classList.remove('active');
  } else {
    themeToggle.classList.add('active');
  }
}

function loadLanguage() {
  const lang = localStorage.getItem('smartScreenshot_language') || 'ko';
  applyLanguageToPage(lang);
  updateLanguageButtons(lang);
}

function setLanguage(lang) {
  localStorage.setItem('smartScreenshot_language', lang);
  applyLanguageToPage(lang);
  updateLanguageButtons(lang);
  showStatus();
}

function updateLanguageButtons(lang) {
  langButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function showStatus() {
  statusMessage.textContent = getI18nMessage('status-save');
  statusMessage.classList.add('show');
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 2000);
}
