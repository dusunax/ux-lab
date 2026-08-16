const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EXTENSION_PATH = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

// 스크린샷 저장 폴더 생성
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function generateScreenshots() {
  console.log('🎬 스크린샷 생성 시작...\n');

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
    viewport: { width: 1280, height: 800 },
  });

  try {
    // 익스텐션 ID 찾기
    let extensionId = process.env.EXTENSION_ID;

    if (!extensionId) {
      const page = await context.newPage();
      await page.goto('chrome://extensions');
      await page.waitForTimeout(2000);

      const extensionIdMatch = await page.evaluate(() => {
        const extensions = document.querySelectorAll('div[data-id]');
        for (const ext of extensions) {
          const text = ext.textContent;
          if (
            text.includes('Smart Screenshot Capture') ||
            text.includes('screenshot') ||
            text.includes('capture')
          ) {
            const id = ext.getAttribute('data-id');
            console.log(`Found: ${id}`);
            return id;
          }
        }
        return null;
      });

      if (extensionIdMatch) {
        extensionId = extensionIdMatch;
        console.log(`✅ 익스텐션 ID 찾음: ${extensionId}\n`);
      } else {
        console.error('❌ 익스텐션을 자동으로 찾을 수 없습니다.\n');
        console.log('📍 수동으로 ID를 찾으려면:\n');
        console.log('1. npm run find-id 를 실행하세요');
        console.log('2. Chrome이 열리면 Smart Screenshot Capture의 ID를 복사하세요');
        console.log('3. 다음 명령어를 실행하세요:\n');
        console.log('   EXTENSION_ID="YOUR_ID" npm run generate-screenshots\n');
        process.exit(1);
      }

      await page.close();
    } else {
      console.log(`✅ 익스텐션 ID (환경변수): ${extensionId}\n`);
    }

    await page.close();

    // 스크린샷 1: 팝업 (메인 UI)
    console.log('📸 스크린샷 #1: 메인 UI - 요소 선택 화면');
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'networkidle',
    });
    await popupPage.setViewportSize({ width: 1280, height: 800 });

    // 선택자 미리 추가 (시뮬레이션)
    await popupPage.evaluate(() => {
      const input = document.getElementById('selectorInput');
      if (input) {
        input.value = 'button';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await popupPage.waitForTimeout(500);
    await popupPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '1-main-ui.png'),
    });
    console.log('✅ 저장: screenshots/1-main-ui.png\n');
    await popupPage.close();

    // 스크린샷 2: 설정 페이지 (다크모드)
    console.log('📸 스크린샷 #2: 설정 페이지 - 다크모드');
    const optionsPage1 = await context.newPage();

    // 다크모드 설정 저장
    await optionsPage1.evaluate(() => {
      localStorage.setItem('smartScreenshot_theme', 'dark');
      localStorage.setItem('smartScreenshot_language', 'ko');
    });

    await optionsPage1.goto(`chrome-extension://${extensionId}/options.html`, {
      waitUntil: 'networkidle',
    });
    await optionsPage1.setViewportSize({ width: 1280, height: 800 });
    await optionsPage1.waitForTimeout(500);

    await optionsPage1.screenshot({
      path: path.join(SCREENSHOTS_DIR, '2-settings-dark.png'),
    });
    console.log('✅ 저장: screenshots/2-settings-dark.png\n');
    await optionsPage1.close();

    // 스크린샷 3: 설정 페이지 (라이트모드)
    console.log('📸 스크린샷 #3: 설정 페이지 - 라이트모드');
    const optionsPage2 = await context.newPage();

    // 라이트모드 설정 저장
    await optionsPage2.evaluate(() => {
      localStorage.setItem('smartScreenshot_theme', 'light');
      localStorage.setItem('smartScreenshot_language', 'en');
    });

    await optionsPage2.goto(`chrome-extension://${extensionId}/options.html`, {
      waitUntil: 'networkidle',
    });
    await optionsPage2.setViewportSize({ width: 1280, height: 800 });
    await optionsPage2.waitForTimeout(500);

    await optionsPage2.screenshot({
      path: path.join(SCREENSHOTS_DIR, '3-settings-light.png'),
    });
    console.log('✅ 저장: screenshots/3-settings-light.png\n');
    await optionsPage2.close();

    // 스크린샷 4: GitHub 예시
    console.log('📸 스크린샷 #4: 실제 사용 예시 - GitHub PR');
    const githubPage = await context.newPage();

    // GitHub PR 페이지 열기
    await githubPage.goto('https://github.com/dusunax/ux-lab/pull/52', {
      waitUntil: 'networkidle',
    });
    await githubPage.setViewportSize({ width: 1280, height: 800 });

    // 팝업을 시뮬레이션하기 위해 개발자 콘솔에서 하이라이트 설정
    await githubPage.evaluate(() => {
      // button 요소들에 하이라이트 스타일 적용
      const buttons = document.querySelectorAll('button');
      buttons.forEach((btn) => {
        btn.style.border = '2px solid #FF4444 !important';
        btn.style.backgroundColor = 'rgba(255, 68, 68, 0.1) !important';
      });
    });

    await githubPage.waitForTimeout(500);
    await githubPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '4-github-example.png'),
    });
    console.log('✅ 저장: screenshots/4-github-example.png\n');
    await githubPage.close();

    console.log('🎉 모든 스크린샷이 생성되었습니다!\n');
    console.log('📍 저장 위치: extensions/chrome-capture/screenshots/');
    console.log('\n📤 다음 단계:');
    console.log('1. 이 스크린샷들을 Chrome Web Store에 업로드하세요');
    console.log('2. 각 스크린샷은 1280×800 PNG 형식입니다');
    console.log('3. 필요하면 이미지를 편집하여 더 개선할 수 있습니다\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await context.close();
  }
}

generateScreenshots().catch(console.error);
