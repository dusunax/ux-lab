chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Screenshot Capture 익스텐션이 설치되었습니다');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'log') {
    console.log('[Background]', request.message);
  }
});
