# 비공개 테스트 통과를 위한 개선 계획

Google Play 비공개 테스트 트랙 재업로드에 맞춰, 버전을 올릴 때마다 앱에 실제로 도움이 되는
작은 개선을 하나씩 묶어서 진행한다. 하루 한 개씩, 검증 가능한 단위로 나눈다.

## 배경

Play Console App Bundle 세부정보(802 / 0.8.2)에서 **앱 최적화: 낮음** 경고가 확인됐다.

| 지표 | 값 |
|---|---|
| 최적화 비율 | - |
| 난독화 비율 | 2% |
| 축소 비율 | - |
| R8 구성 | - |

원인: `android/app/build.gradle`에서 `enableProguardInReleaseBuilds = false`로 릴리즈 빌드의
R8(코드 축소·난독화)이 꺼져 있고, `shrinkResources`도 설정되어 있지 않다.

## 진행 계획

| Day | 작업 | 내용 | 검증 |
|---|---|---|---|
| Day 1 | R8 + 리소스 축소 활성화 | `enableProguardInReleaseBuilds = true`, `shrinkResources true` 추가 | 릴리즈 빌드 성공 + 에뮬레이터(Medium_Phone_API_35)에 설치해 다크모드·언어전환·날짜변환 스모크 테스트 → 완료, 문제 없어 Day 2 생략 |
| Day 2 | ~~Day 1 후속 조치~~ | ~~스모크 테스트에서 깨진 부분이 있으면 `proguard-rules.pro`에 keep 규칙 추가~~ | Day 1에서 크래시·오류 없이 통과해 불필요 |
| Day 3 | 권한 점검 | Play Console에 표시된 권한 5개 전체를 `AndroidManifest.xml`과 대조해 불필요한 권한이 있는지 확인 | 불필요 권한 제거 후 0.8.4 → 완료 |
| Day 4 | 잔여 접근성/품질 보완 | 0.8.2에서 스코프 밖으로 뒀던 부분(`LoadingScreen` 등) 재검토, 에러 바운더리/크래시 로깅 여부 점검 | lint + tsc (기존에 있던 무관한 이슈는 제외) → 완료, Day 3 변경 규모가 작아 같은 사이클에 포함 |
| Day 5 | 최종 점검 & 업로드 | 최종본 AAB 빌드 후 비공개 테스트 트랙 업로드 | 업로드 후 콘솔에서 최적화 점수 재확인 |

## 완료된 작업

### 0.8.2 — 접근성 라벨 추가 (2026-08-26)

다크모드 토글, 언어 선택, 연/월/일 피커 등 6개 컴포넌트에 `accessibilityRole`/
`accessibilityLabel`/`accessibilityState`가 없어 스크린리더 사용자가 버튼 용도를 알 수 없었다.
아이콘 전용 버튼은 신규 번역 키(ko/en/ja)로 라벨을 부여하고, 기존 텍스트가 있는 버튼은 해당
값을 재사용했다.

- `src/types/index.ts`, `src/i18n/translations.ts`: `darkModeToggleLabel`,
  `languageSelectorLabel` 키 추가
- `DarkModeToggle`, `LanguageSelector`, `PickerSelect`, `LunarDateDisplay`,
  `DateConverter` 컴포넌트에 접근성 prop 적용

### 0.8.3 — R8 + 리소스 축소 활성화 (2026-08-27)

`android/app/build.gradle`의 `enableProguardInReleaseBuilds`를 `true`로, `shrinkResources`를
추가해 릴리즈 빌드에 R8 코드 축소·난독화를 켰다. 에뮬레이터(Medium_Phone_API_35)에 릴리즈 APK를
설치해 다크모드 토글, 언어 전환(한국어/English/日本語), 연도 피커 모달을 스크린샷으로 직접
확인했고 크래시나 누락된 클래스 오류 없이 정상 동작했다. AAB 32MB로 빌드 완료.

- `android/app/build.gradle`: `enableProguardInReleaseBuilds = true`, `shrinkResources` 추가
- `package.json`: `0.8.2` → `0.8.3`

### 0.8.4 — 권한 점검 및 잔여 접근성/품질 보완 (2026-08-28)

`AndroidManifest.xml`에 선언된 권한과 릴리즈 빌드 병합 매니페스트를 함께 대조한 결과, 실제 코드(JS·네이티브)
어디에도 네트워크 호출이 없고 `usesCleartextTraffic="false"`로 평문 통신도 막혀 있어 `INTERNET` 권한이
불필요한 것으로 확인되어 제거했다. 나머지 `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`은 위젯의
`AlarmManager` 재등록 로직에서 실제로 사용 중임을 코드로 확인해 유지했다. (참고: 병합 매니페스트 기준
권한은 4개였고, 자동 생성되는 `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`까지 포함한 수치로 보인다.)

Day 3 변경 규모가 작아(1줄) 같은 사이클에서 Day 4도 함께 진행했다. `LoadingScreen`에 접근성 라벨을
추가했던 0.8.2 작업 당시 스코프 밖으로 남겨뒀던 로딩 화면에 `accessibilityLiveRegion="polite"`를 붙여
스크린리더가 로딩 상태를 자동으로 안내하도록 했다. 에러 바운더리는 전무했던 상태라 `MainScreen`을
감싸는 `ErrorBoundary`를 새로 추가해 렌더링 오류 발생 시 빈 화면 대신 안내 문구와 재시도 버튼을
보여주도록 했다. 크래시 로깅 SDK는 현재 미도입 상태를 확인만 하고, 새 외부 서비스 연동은 이번
스코프에 포함하지 않았다.

- `android/app/src/main/AndroidManifest.xml`: `INTERNET` 권한 제거
- `src/components/LoadingScreen/LoadingScreen.tsx`: `accessibilityLiveRegion`/`accessibilityRole` 추가
- `src/components/ErrorBoundary/`: 신규 — 렌더링 오류 캐치 및 재시도 UI
- `src/App.tsx`: `MainScreen`을 `ErrorBoundary`로 감쌈
- `src/types/index.ts`, `src/i18n/translations.ts`: `errorBoundaryMessage`, `errorBoundaryRetry` 키 추가 (ko/en/ja)
- `package.json`: `0.8.3` → `0.8.4`
- 검증: `eslint` 클린, `tsc`는 변경 파일 기준 오류 없음(기존 `__tests__/App.test.tsx`, `DateConverter.tsx`, `lunarCalendar.ts`의 무관한 이슈는 제외), 릴리즈 APK 빌드 성공
