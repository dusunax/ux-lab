# Chrome Web Store 등록 정보

## 기본 정보

### 마케터 제목
Smart Screenshot Capture

### 마케터 설명
Capture screenshots with the ability to hide specific HTML elements

### 카테고리
생산성 (Productivity) / 개발자 도구 (Developer Tools)

### 언어
한국어 (ko) / English (en)

---

## 자세한 설명

### 한국어
🎯 개발 중 스크린샷을 찍을 때 디버깅 도구나 개발자 UI가 방해가 됩니까?

Smart Screenshot Capture는 지정한 HTML 요소를 숨긴 후 깔끔한 스크린샷을 캡처할 수 있는 Chrome 익스텐션입니다.

✨ **주요 기능**
• CSS 선택자로 요소 선택 (예: .navbar, #sidebar, button)
• 숨길 요소 실시간 미리보기 (빨간 테두리 표시)
• 현재 탭 스크린샷 캡처
• 선택자 자동 저장 및 복구
• 다크/라이트 모드 지원
• 한국어/영어 지원

💡 **사용 사례**
• 개발 중 콘솔, 개발자 도구 UI 숨기기
• 테스트 도구나 디버그 바 제거
• 스크린샷에 민감한 정보나 내부 UI 숨기기
• 팀 내 공유할 깔끔한 화면 캡처

🚀 **사용 방법**
1. 익스텐션 팝업 열기
2. CSS 선택자 입력 (예: button, .tag, #modal)
3. "추가" 버튼으로 등록
4. "현재 탭 캡처" 클릭
5. 다운로드

개발자, 디자이너, QA 팀이라면 필수 도구입니다!

---

### English
Are you frustrated with debugging tools and developer UI getting in the way when taking screenshots during development?

Smart Screenshot Capture is a Chrome extension that lets you hide specific HTML elements and capture clean screenshots.

✨ **Key Features**
• Select elements using CSS selectors (e.g., .navbar, #sidebar, button)
• Real-time preview of elements to hide (red border highlight)
• Capture current tab screenshots
• Auto-save and restore selected selectors
• Dark/Light mode support
• Korean/English language support

💡 **Use Cases**
• Hide console and developer tools during development
• Remove test tools or debug bars
• Hide sensitive information or internal UI in screenshots
• Capture clean screens to share with your team

🚀 **How to Use**
1. Open the extension popup
2. Enter a CSS selector (e.g., button, .tag, #modal)
3. Click "Add" to register
4. Click "Capture Current Tab"
5. Download

Essential tool for developers, designers, and QA teams!

---

## 그래픽 자산

### 아이콘 (Icon)
- 파일: `icon.png`
- 크기: 128×128 px
- 형식: PNG

### 스크린샷

#### 1️⃣ 메인 UI - 요소 선택 화면
메인 팝업 UI에서 CSS 선택자를 입력하고 추가 버튼을 클릭하여 요소를 등록합니다.
선택된 요소는 실시간으로 빨간 테두리와 배경으로 표시됩니다.

**크기**: 1280×800 px (PNG)

#### 2️⃣ 설정 페이지 - 다크모드
전용 설정 페이지에서 테마와 언어를 관리합니다.
다크모드는 기본값이며, 어두운 배경과 황금색 강조색을 사용합니다.

**크기**: 1280×800 px (PNG)

#### 3️⃣ 설정 페이지 - 라이트모드
라이트모드로 전환하면 밝은 색상 테마가 적용됩니다.
더 밝고 깨끗한 UI로 낮 시간 사용에 최적화되어 있습니다.

**크기**: 1280×800 px (PNG)

#### 4️⃣ 실제 사용 예시 - GitHub PR 페이지
실제 웹사이트에서 익스텐션이 작동하는 모습입니다.
여러 탭이 열려있는 상태에서 "button" 요소를 선택했을 때,
현재 페이지의 버튼 요소가 빨간 테두리와 배경으로 하이라이트됩니다.

**크기**: 1280×800 px (PNG)

---

## 추가 정보

### 개인정보 보호 정책
https://github.com/dusunax/ux-lab/blob/main/extensions/chrome-capture/PRIVACY_POLICY.md

### 지원 사이트
https://github.com/dusunax/ux-lab/tree/main/extensions/chrome-capture

### 개발자 이메일
dusunax@gmail.com

---

## 권한 사용 정책

### activeTab 권한
현재 활성 탭의 스크린샷을 캡처하기 위해 필요합니다.

사용자가 "현재 탭 캡처" 버튼을 클릭했을 때, 현재 보고 있는 탭의 화면을 스크린샷으로 저장합니다.

### tabs 권한
현재 활성 탭의 정보를 가져오기 위해 필요합니다.

스크린샷을 촬영할 대상 탭을 확인하고, 그 탭의 내용을 캡처하는 데 사용됩니다.

### host permissions
`http://*/*`, `https://*/*` 페이지에서 사용자가 입력한 CSS 선택자에 해당하는 요소를 숨기고 복원하기 위해 필요합니다.

### storage 권한 없음
이 확장 프로그램은 `chrome.storage` 권한을 요청하지 않습니다.
선택자, 테마, 언어 설정은 확장 프로그램의 popup/options 페이지 안에서 `localStorage`로 저장합니다. 이는 Chrome Web Store의 `storage` permission과 다릅니다.

---

## 체크리스트

- [ ] 아이콘 업로드 (128×128 px)
- [ ] 스크린샷 4개 준비 (1280×800 px)
- [ ] 마케터 제목 입력
- [ ] 마케터 설명 입력
- [ ] 자세한 설명 입력 (한국어/영어)
- [ ] 카테고리 선택
- [ ] 개인정보 보호 정책 URL 입력
- [ ] 지원 사이트 URL 입력
- [ ] 심사 요청
