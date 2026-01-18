# 플레이스토어 배포 가이드

## 1단계: 릴리즈 키스토어 생성

먼저 릴리즈용 키스토어를 생성해야 합니다.

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias onemoondate-release -keyalg RSA -keysize 2048 -validity 10000
```

**중요 정보:**
- 키스토어 비밀번호를 입력하세요 (기억해두세요!)
- 키 비밀번호도 입력하세요 (보통 키스토어 비밀번호와 동일)
- 이름, 조직 등 정보를 입력하세요

**⚠️ 경고**: 키스토어 파일과 비밀번호를 안전하게 보관하세요. 분실하면 앱 업데이트가 불가능합니다!

## 2단계: 키스토어 정보 설정

`android/key.properties` 파일을 생성하고 다음 내용을 입력하세요:

```properties
storeFile=app/release.keystore
storePassword=여기에_키스토어_비밀번호_입력
keyAlias=onemoondate-release
keyPassword=여기에_키_비밀번호_입력
```

**보안**: 이 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

## 3단계: 앱 버전 확인

`android/app/build.gradle`에서 버전을 확인하세요:

```gradle
versionCode 1        // 플레이스토어 업로드 시마다 증가 필요
versionName "1.0.0"  // 사용자에게 표시되는 버전
```

## 4단계: AAB 빌드

플레이스토어는 AAB (Android App Bundle) 형식을 요구합니다:

```bash
npm run build:android:bundle
```

또는 직접:

```bash
cd android
./gradlew bundleRelease
```

빌드가 성공하면 다음 위치에 AAB 파일이 생성됩니다:
`android/app/build/outputs/bundle/release/app-release.aab`

## 5단계: 플레이스토어 콘솔에서 업로드

1. [Google Play Console](https://play.google.com/console) 접속
2. 새 앱 생성 또는 기존 앱 선택
3. 좌측 메뉴에서 "프로덕션" 선택
4. "새 버전 만들기" 클릭
5. AAB 파일 업로드 (`app-release.aab`)
6. 스토어 등록 정보 작성:
   - 앱 이름
   - 짧은 설명 (80자)
   - 전체 설명 (4000자)
   - 스크린샷 (최소 2장, 권장 8장)
   - 앱 아이콘
   - 기능 그래픽 (선택사항)
7. 콘텐츠 등급 설정
8. 타겟 국가 선택
9. 가격 설정 (무료/유료)
10. 검토 제출

## 6단계: 필수 체크리스트

배포 전 확인사항:

- [ ] 앱 아이콘 설정 완료
- [ ] 앱 이름 및 설명 작성
- [ ] 스크린샷 최소 2장 이상 업로드
- [ ] 개인정보처리방침 URL (필요시)
- [ ] 콘텐츠 등급 설정 완료
- [ ] 타겟 국가 선택
- [ ] 가격 설정 (무료/유료)
- [ ] 앱이 정상 작동하는지 테스트 완료

## 주의사항

- **versionCode**: 플레이스토어에 업로드할 때마다 반드시 증가시켜야 합니다
- **versionName**: 사용자에게 표시되는 버전 (예: "1.0.0", "1.1.0")
- **키스토어 보관**: 키스토어 파일과 비밀번호를 안전하게 보관하세요
- **테스트**: 내부 테스트 트랙을 먼저 사용하여 테스트하는 것을 권장합니다

## 문제 해결

### 빌드 오류 발생 시

```bash
# 클린 빌드
cd android
./gradlew clean
./gradlew bundleRelease
```

### 키스토어 관련 오류

- `key.properties` 파일 경로 확인
- 키스토어 파일 경로 확인 (`storeFile=app/release.keystore`)
- 비밀번호 확인

### 서명 오류

- 키스토어 비밀번호와 키 비밀번호 확인
- 키 별칭(alias) 확인 (`onemoondate-release`)
