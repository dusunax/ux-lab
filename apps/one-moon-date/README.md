# One Moon Date (달력 한칸)

오늘 음력 달력을 표시하고, 양력과 음력을 변환할 수 있는 React Native 앱입니다.

<img width="390" height="313" alt="image" src="https://github.com/user-attachments/assets/747f9306-2c46-420f-ada2-3ce413a0a695" />


## 📱 앱 소개

"달력 한칸"은 홈 화면에서 오늘의 음력 날짜를 한눈에 확인할 수 있는 미니멀한 앱입니다. 큰 글자로 가시성을 중요시하는 인터페이스를 제공합니다.

앱 내부에서는 양력/음력 변환, 음력 날짜의 띠를 확인할 수 있습니다. 다크 모드, 다국어 설정을 지원합니다.

## ✨ 주요 기능

### 🏠 홈 화면 위젯

<img width="300" src="https://github.com/user-attachments/assets/a83aced8-e036-4fd9-9a8d-3b6f672a7ab8" />

> Android 우선으로 테스트 중입니다.

- 홈 화면에 오늘의 음력 날짜를 위젯으로 표시합니다
- 자정에 자동으로 날짜가 업데이트됩니다
- 앱의 다크 모드 및 언어 설정이 위젯에도 동기화됩니다

### 📅 음력 달력 표시
- 오늘 날짜의 음력을 계산하여 표시합니다
- 음력 날짜를 클릭하면 연도, 월, 일을 변경할 수 있습니다
- 윤달을 처리합니다

<img width="300" src="https://github.com/user-attachments/assets/3ad8bbcf-bbc2-4586-9b0d-7fb81dfe47b0" />
<img width="300" src="https://github.com/user-attachments/assets/6d1c7030-68d7-4d42-9d7e-4e243739ee14" />

### 🔄 양력/음력 변환
- 각 날짜를 변경하면 양력/음력으로 자동 변환되어 실시간으로 표시됩니다

### 🌍 다국어 지원
- 한국어, English, 日本語 다국어 지원 (간지(干支) 및 띠 표시 포함)

### 🌙 다크 모드
- 라이트/다크 모드를 전환(설정을 앱과 위젯에 동기화)


## 🛠 기술 스택

- **React Native** 0.83.1
- **React** 19.2.0
- **Android Native Modules** (위젯 및 SharedPreferences 동기화)
- **AsyncStorage** (로컬 데이터 저장)

## 🚀 시작하기

### 필요 사항

- Node.js >= 20
- React Native 개발 환경 설정
- Android Studio (Android 개발용)
- Xcode (iOS 개발용)

### 설치 방법

1. 저장소를 클론하거나 다운로드합니다

2. 의존성을 설치합니다:
```bash
npm install
```

또는

```bash
yarn install
```

### 실행 방법

1. Metro 번들러를 시작합니다:
```bash
npm start
```

2. 새 터미널 창에서 앱을 실행합니다:

**Android:**
```bash
npm run android
```

**iOS (macOS만):**
```bash
npm run ios
```

## 📦 빌드

### Android 릴리즈 빌드

플레이스토어에 배포하기 위한 AAB 파일을 빌드합니다:

```bash
npm run build:android:bundle
```

빌드된 파일 위치:
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- **APK**: `android/app/build/outputs/apk/release/app-release.apk` (APK 빌드 시)

## 📁 프로젝트 구조

```
src/
├── components/          # UI 컴포넌트
│   ├── DateConverter/   # 날짜 변환기
│   ├── LunarDateDisplay/# 음력 날짜 표시
│   ├── LanguageSelector/# 언어 선택
│   └── DarkModeToggle/  # 다크 모드 토글
├── hooks/              # 커스텀 훅
│   ├── useLunarDate.js  # 음력 날짜 관리
│   └── useDateConverter.js # 날짜 변환 로직
├── utils/              # 유틸리티 함수
│   ├── lunarCalendar.js # 음력 계산 로직
│   └── storage.js      # 로컬 저장소
├── i18n/               # 다국어 지원
└── contexts/           # React Context
    └── DarkModeContext.js

android/
├── app/src/main/java/com/onemoondate/
│   ├── widget/         # Android 위젯
│   │   ├── LunarWidgetProvider.java
│   │   └── LunarCalculator.java
│   └── LanguageStorageModule.java # 네이티브 모듈
```

## 🔍 주요 기능 상세 설명

### 음력 계산
- 1900년 ~ 2100년 범위의 음력 날짜를 계산 (율리우스 일수 기반)

### 위젯 동기화
- React Native 앱과 Android 위젯 간 설정을 동기화
- SharedPreferences를 통한 언어 및 다크 모드 동기화

## 📚 문서

- [플레이스토어 배포 가이드](./docs/PLAY_STORE_DEPLOY.md)
- [실제 기기에서 앱 테스트하기](./docs/DEVICE_TESTING_GUIDES.md)

## 📄 저작권

**© 2026 All Rights Reserved**

이 애플리케이션과 소스 코드는 저작권법에 의해 보호됩니다. 개인 사용은 허용되며, 상업적 사용은 금지되어 있습니다.
