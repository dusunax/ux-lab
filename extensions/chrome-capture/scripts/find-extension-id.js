const { chromium } = require('playwright');
const path = require('path');

async function findExtensionId() {
  const extensionPath = path.resolve(__dirname, '..');

  console.log('🌐 Chrome 실행 중...\n');

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  const page = await context.newPage();
  await page.goto('chrome://extensions');
  await page.waitForTimeout(1000);

  console.log('✅ Chrome이 열렸습니다.');
  console.log('');
  console.log('📍 다음 단계:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1️⃣  Smart Screenshot Capture 익스텐션을 찾으세요');
  console.log('');
  console.log('2️⃣  익스텐션 ID를 복사하세요');
  console.log('    (16자 영문자 문자열, 예: abcdefghijklmnop)');
  console.log('');
  console.log('3️⃣  터미널에서 이 명령어를 실행하세요:');
  console.log('');
  console.log('    EXTENSION_ID="YOUR_ID_HERE" npm run generate-screenshots');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('⏳ 30초 후 브라우저가 닫힙니다...');
  console.log('');

  await page.waitForTimeout(30000);
  await context.close();

  console.log('🔚 종료되었습니다.');
}

findExtensionId().catch(console.error);
