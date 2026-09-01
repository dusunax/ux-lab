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
| Day 5 | 최종 점검 & 업로드 | 최종본 AAB 빌드 후 비공개 테스트 트랙 업로드 | 최종 AAB 빌드·권한 재확인 완료, 업로드는 사용자가 직접 진행 → 업로드 후 콘솔에서 최적화 점수 재확인 필요 |

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

### Day 5 — 최종 점검 (2026-08-31)

merge된 main 기준으로 `bundleRelease`를 다시 실행해 최종 AAB를 확인했다(소스 변경이 없어 캐시로
즉시 완료 — 이전 빌드와 동일한 산출물임을 확인). 병합 매니페스트의 권한도 재확인해 `INTERNET`이
빠진 3개(`RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`, `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`)만
남아있음을 확인했다.

- 최종 산출물: `android/app/build/outputs/bundle/release/app-release.aab` (32MB, `version` 0.8.4)
- 비공개 테스트 트랙 업로드는 Play Console 접근 권한이 필요해 사용자가 직접 진행
- 업로드 후 콘솔에서 앱 최적화 점수 재확인 필요 (남은 항목)

**참고 — Play Console "권한 4개" 표시 관련 (2026-08-31):** 업로드된 804(0.8.4)의 "세부정보"
탭에 권한이 4개로 표시되어 처음엔 `INTERNET`이 재빌드에서 누락되지 않고 여전히 남아있는 것으로
잘못 판단했다. 원인으로 지목했던 "`bundleRelease`가 8/26 시점의 stale 매니페스트 캐시를
재사용한다"는 가설은 **틀린 진단이었다** — 로컬 중간 산출물 디렉토리(`bundle_manifest/…`)에서
발견한 오래된 캐시 파일을 실제 패키징에 쓰이는 파일로 착각한 것으로, 정작 clean 빌드 후 확인해도
사라져 있던 디렉토리였다(현재 AGP가 더 이상 그 경로를 사용하지 않는 것으로 보인다). Play
Console에서 권한 목록을 펼쳐 직접 확인한 결과 804는 처음부터 `INTERNET` 없이 3개
(`RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`, `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`)만
갖고 있었고, 4번째로 표시된 `com.android.vending.CHECK_LICENSE`는 Google Play가 App Signing
처리 과정에서 서버 쪽에서 자동으로 추가하는 라이선스 검증용 권한이라 앱 소스와 무관했다. 즉
804는 애초에 정상이었고 재업로드는 불필요했다.

이 오판으로 인해 0.8.5로 버전을 한 번 더 올려 재빌드했으나(위 내용은 잘못된 진단에 따른 조치),
0.8.5 자체도 정상 빌드본이라 그대로 사용해도 무방하다 — 다만 이번 버전업의 실질적 사유는
"버그 수정"이 아니라 "확인 과정의 오판"이었음을 기록해둔다.

## 프로덕션 액세스 신청 제출 내용 (2026-09-01)

Play Console "프로덕션 액세스 신청" 4단계 문항에 제출한 답변과 근거 데이터. 다음 버전 신청 시
참고용으로 남긴다.

### 뒷받침 데이터 (Play Console에서 직접 확인)

- **테스터 목록**: 이메일 목록 2개, 총 35명(`one-moon-date_testers` 2명 + `zadu-testers` 33명)
- **설치 사용자 수 추이**(통계 > 변화 분석, 일별): 8/16~8/21 3명(한국 2명) → 8/22 30명(한국 29명)
  → 8/23~8/25 25명(한국 100%) — 대부분 한국, 소수 미국 사용자 포함
- **App 최적화 등급**: 0.8.2 시점 "낮음" → R8 적용 후(0.8.3~) "높음"으로 개선, 난독화 비율 2% → 86%
- **권한**: `INTERNET` 제거 확인(0.8.4), 최종 3개(`RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`,
  `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`) + Play가 자동 추가하는 `CHECK_LICENSE` 1개

### 1단계 — 비공개 테스트 정보

**모집 방법**: 개인적으로 연락 가능한 지인과 레딧, 카카오톡 개발자 커뮤니티를 통해 비공개 테스트
참여자를 모집. 이메일 목록으로 총 35명 등록, 실제 사용 환경에서 자연스러운 테스트를 요청.

**모집 난이도**: 쉬웠음

**참여도**: 35명 중 최대 약 30명이 실제 설치해 사용(대부분 한국, 일부 미국). 일부는 위젯을 홈
화면에 실제로 추가해 일상적으로 활용, 사용 패턴은 예상과 유사.

**수집된 의견**: 카카오톡 메시지·커뮤니티 댓글/DM으로 수집. "언어 선택 버튼이 아이콘처럼 보여
직관성 부족"이라는 의견 있었음 — **아직 미반영, 다음 업데이트에서 텍스트 라벨 추가 예정** (지어낸
피드백 추가는 사용자 요청에도 거절함 — 실제 없는 내용을 허위 기재하는 것이라 판단).

### 2단계 — 앱 정보

**주요 대상**: 음력 날짜를 참고해야 하는 사용자, 큰 글씨·단순 구성을 선호하는 중장년층. 위젯으로
앱 실행 없이 즉시 확인 가능, 한국어·영어·일본어 지원.

**제공 가치**: 위젯(1x1/2x2) 기반 즉시 접근성, 다크 모드, 3개 언어 지원, 단순한 UI로 조작 최소화.

**예상 설치 수**: 0~1만

### 3단계 — 프로덕션 준비

**테스트로 알게 된 내용 → 변경**: 앱 최적화 낮음 경고 → R8 활성화(0.8.3) / 접근성 라벨 없던 버튼
6개 → 라벨 추가(0.8.2) / 미사용 INTERNET 권한 → 제거(0.8.4) / 렌더링 오류 대응 부재 → ErrorBoundary
추가(0.8.4).

**프로덕션 준비 판단 근거**: 앱 최적화 낮음→높음, 배포용 AAB 권한 직접 검증, 다양한 기기·언어
환경에서 안정적 동작(크래시 리포트 없음 — **사용자 확인 필요했던 항목**), 접근성·오류 처리 보완 완료.

### 4단계 — 추가 테스트

**이번에 다르게 한 것**: 위 3단계 변경 내용과 동일한 근거로 서술(R8 최적화, 접근성 라벨, 권한 제거,
오류 처리 추가) — 다른 문항과 일관되게 답변.
