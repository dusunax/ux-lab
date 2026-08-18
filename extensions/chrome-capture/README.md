# Smart Screenshot Capture

Chrome 캡처 익스텐션으로, 특정 HTML 요소를 숨기고 페이지 스크린샷을 찍는 기능을 제공합니다.

<img width="1081" height="843" alt="image" src="https://github.com/user-attachments/assets/a3fe7e3b-33c6-4e1b-bfbd-b49cf432c230" />

<img width="417" height="565" alt="image" src="https://github.com/user-attachments/assets/7b2997dd-0e22-4430-b98c-e94da16ec59a" />

## 기능

✨ **주요 기능**
- 🎯 CSS selector를 입력하여 특정 요소 숨기기
- 📸 숨긴 요소 상태로 페이지 스크린샷 캡처
- 👁️ 다운로드 전 스크린샷 미리보기
- 💾 선택한 요소 목록 자동 저장 (다음 세션에서 복원)
- 🔄 한 번에 여러 요소 숨기 가능
- ♻️ 캡처 후 자동으로 요소 복원

## 설치 방법

### 1단계: 파일 준비
```bash
# 익스텐션 폴더 위치
extensions/chrome-capture/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
└── README.md
```

### 2단계: Chrome에 로드
1. Chrome 주소창에 `chrome://extensions` 입력
2. 오른쪽 상단의 **"개발자 모드"** 토글 활성화
3. **"압축되지 않은 확장 프로그램 로드"** 클릭
4. `extensions/chrome-capture` 폴더 선택

### 3단계: 확인
- 확장 프로그램 목록에 "Smart Screenshot Capture" 표시
- Chrome 주소창 오른쪽에 🔧 아이콘이 나타남

## 사용 방법

### 🎯 **사용 방법**

1. **익스텐션 아이콘 클릭** → 팝업 열기

2. **숨길 요소 입력** (선택)
   ```
   예시:
   .navbar        → navbar 클래스 숨김
   #header        → header 아이디 숨김
   button.close   → close 클래스 버튼 숨김
   ```
   - 🔄 아이콘으로 초기화 가능

3. **"⛶ 현재 탭 캡처" 클릭**
   - 숨긴 요소 적용 → 캡처 → 요소 복원

4. **미리보기 확인**
   - 해상도 & 크기 표시
   - "💾 다운로드" 또는 "취소" 선택

### 예시

#### 네비게이션 바 제외하고 캡처
```
Selector: nav
Selector: .header-ad
화면 캡처 → screenshot-2026-08-16T12-34-56.png
```

#### 여러 요소 동시에 숨기기
```
Selector: .sidebar
Selector: .chat-widget
Selector: #cookie-notice
화면 캡처 → screenshot-2026-08-16T12-35-20.png
```

## 유용한 selector 패턴

| 패턴 | 설명 | 예시 |
|------|------|------|
| `.classname` | 클래스로 선택 | `.navbar` |
| `#id` | ID로 선택 | `#header` |
| `element.class` | 요소와 클래스 조합 | `button.close` |
| `element#id` | 요소와 ID 조합 | `div#modal` |
| `[attr]` | 속성으로 선택 | `[data-testid="ads"]` |
| `parent > child` | 자식 요소 선택 | `.container > .banner` |

## 주의사항

⚠️ **알아두세요**

- **Selector 검증**: 정확한 CSS selector를 입력해야 합니다 (예: typo 주의)
- **동적 요소**: JavaScript로 동적으로 생성되는 요소는 페이지 로드 후 입력 필요
- **크기**: 캡처 이미지는 현재 보이는 뷰포트 크기로 저장됩니다
- **페이지 제한**: 일부 보안 정책으로 보호된 페이지(chrome://, 다른 보안 사이트)에서는 작동하지 않습니다
- **저장된 선택**: localStorage에 저장되므로 브라우저 데이터 삭제 시 초기화됩니다
- **미리보기**: 미리보기에서 "취소"를 클릭하면 다시 편집 화면으로 돌아갑니다

## 문제 해결

### Q: "Could not establish connection" 오류가 나요
A: 이것은 content script가 현재 페이지에 주입되지 못했다는 뜻입니다.

**해결책:**
1. **다른 페이지에서 테스트** - 일반 웹사이트 (Gmail, Wikipedia, 블로그 등)에서 테스트
2. **새로운 탭 열기** - 방금 설치했다면 새 탭에서 테스트 필요
3. **Chrome 재시작** - 익스텐션 다시 로드 필요할 수 있음 (chrome://extensions에서 새로고침)

**작동하지 않는 페이지:**
- ❌ chrome://, chrome-extension://, about:* (Chrome 내부 페이지)
- ❌ 은행, 결제 서비스 등 보안 정책이 있는 페이지
- ❌ 일부 기업 인트라넷

**작동하는 페이지:**
- ✅ Gmail, Google, Wikipedia
- ✅ GitHub, Stack Overflow
- ✅ 블로그, 뉴스 사이트
- ✅ 대부분의 일반 웹사이트

### Q: selector를 입력해도 요소가 안 숨겨져요
A: 다음을 확인하세요:
- CSS selector 문법이 정확한가 (Developer Tools의 Elements 탭에서 시험)
- element가 shadow DOM 내에 있는가 (현재 버전에서는 지원 안 함)
- selector가 존재하는 요소를 가리키는가

### Q: 스크린샷이 저장되지 않아요
A: 
- Chrome의 Downloads 폴더 권한 확인
- 브라우저 설정에서 "다운로드 전에 각 파일의 저장 위치 지정" 비활성화
- 대용량 페이지는 시간이 걸릴 수 있음

### Q: 요소 숨김이 안 되는데 스크린샷은 저장돼요
A: 이것은 정상입니다!
- 보안 정책으로 인해 요소 숨김이 불가능하지만, 스크린샷은 캡처됨
- 경고 메시지가 표시됨: "⚠️ 요소 숨김 불가 (보안 정책)"
- 이 경우 전체 페이지가 캡처됨

## 개발 정보

### 파일 구조
- `manifest.json`: 익스텐션 설정 및 권한
- `popup.html`: 
  - 편집 화면 (selector 관리, 캡처 버튼)
  - 미리보기 화면 (이미지 + 다운로드/취소 버튼)
- `popup.js`: 
  - Selector 관리 (추가/제거)
  - localStorage를 통한 자동 저장/복원
  - 캡처 로직 및 에러 처리
  - 미리보기 UI 컨트롤
  - 다운로드 처리
- `content.js`: 페이지 내 요소 숨기기/표시 로직
- `background.js`: 백그라운드 작업 (향후 확장용)

### 권한
- `activeTab`: 현재 탭 제어
- `scripting`: content script 실행
- `tabs`: 탭 정보 접근

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 피드백

기능 제안이나 버그 리포트는 환영합니다! 😊
