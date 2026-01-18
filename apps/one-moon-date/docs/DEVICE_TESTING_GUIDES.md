# 실제 기기에서 앱 테스트하기

실제 스마트폰에서 앱을 테스트하는 방법을 안내합니다.

---

## 📱 Android 기기에서 테스트하기

Android 기기에서 앱을 실행하는 방법은 두 가지가 있습니다:
1. **USB 케이블 연결** (가장 간단하고 안정적)
2. **Wi-Fi 무선 연결** (USB 없이도 가능)

---

### 방법 1: USB 케이블 연결 (권장)

#### 1단계: 개발자 옵션 활성화

1. **설정** 앱 열기
2. **휴대전화 정보** (또는 **디바이스 정보**) 찾기
3. **빌드 번호**를 7번 연속으로 탭
   - "개발자가 되었습니다!" 메시지가 표시됩니다

#### 2단계: USB 디버깅 활성화

1. **설정** → **개발자 옵션** (또는 **시스템** → **개발자 옵션**)
2. **USB 디버깅** 토글을 켜기
3. **USB를 통한 설치** 옵션도 활성화 (있는 경우)

#### 3단계: 기기 연결

1. USB 케이블로 컴퓨터와 기기 연결
2. 기기에 "USB 디버깅 허용" 팝업이 나타나면 **허용** 선택
3. **항상 이 컴퓨터에서 허용** 체크박스를 선택하면 다음부터 자동으로 허용됩니다

#### 4단계: 기기 인식 확인

터미널에서 다음 명령어 실행:

```bash
adb devices
```

기기가 인식되면 다음과 같이 표시됩니다:

```
List of devices attached
ABC123XYZ    device
```

만약 `unauthorized`로 표시되면:
- 기기에서 USB 디버깅 허용 팝업을 확인하세요
- USB 케이블을 뽑았다가 다시 연결하세요

#### 5단계: 앱 실행

```bash
# 프로젝트 디렉토리에서
pnpm run android
```

앱이 기기에 자동으로 설치되고 실행됩니다.

---

### 방법 2: Wi-Fi 무선 연결 (USB 케이블 없이)

**USB 케이블 없이도 바로 Wi-Fi로 연결할 수 있습니다!** Android 11 이상에서는 초기 USB 연결 없이도 무선 디버깅이 가능합니다.

#### 1단계: 개발자 옵션 활성화

1. **설정** 앱 열기
2. **휴대전화 정보** (또는 **디바이스 정보**) 찾기
3. **빌드 번호**를 7번 연속으로 탭
   - "개발자가 되었습니다!" 메시지가 표시됩니다

#### 2단계: Wi-Fi 디버깅 활성화

1. **설정** → **개발자 옵션**
2. **무선 디버깅** (또는 **Wi-Fi 디버깅**) 토글 켜기
   - Android 11 이상: **무선 디버깅** 옵션 사용
   - Android 10 이하: **네트워크를 통한 ADB** 옵션 사용

#### 3단계: 기기와 컴퓨터를 같은 Wi-Fi에 연결

- 컴퓨터와 기기가 **같은 Wi-Fi 네트워크**에 연결되어 있어야 합니다
- 같은 라우터에 연결되어 있으면 됩니다

#### 4단계: 무선 연결 설정

**Android 11 이상 (무선 디버깅) - USB 없이 가능:**

1. 기기에서 **무선 디버깅** 토글을 켜기
   - "사용 안 함" → "사용"으로 변경

2. **네트워크 허용 다이얼로그**가 나타나면:
   - 현재 Wi-Fi 네트워크 정보가 표시됩니다 (예: RT-AX1800S_5G)
   - **"이 네트워크에서 항상 허용"** 체크박스를 선택하는 것을 권장합니다
   - **"허용"** 버튼을 탭합니다
   - 이렇게 하면 다음번부터 자동으로 허용됩니다

3. **무선 디버깅** 화면에서 **"페어링 코드로 페어링"** 선택

4. 기기에 표시된 **IP 주소**, **포트**, **페어링 코드** 확인
   - 예: IP: `192.168.0.100`, 포트: `37095`, 코드: `123456`

5. 터미널에서 다음 명령어 실행:

```bash
# 페어링 코드로 연결 (USB 없이 가능)
adb pair <기기에 표시된 IP>:<포트>
# 예: adb pair 192.168.0.100:37095

# 페어링 코드 입력 요청이 나타나면 기기에 표시된 코드 입력
# 예: 123456
```

5. 페어링 성공 후, 기기에서 **무선 디버깅** 화면으로 돌아가면
   - **IP 주소 및 포트** 섹션에 새로운 IP와 포트가 표시됩니다
   - 예: `192.168.0.100:XXXXX` (포트 번호는 기기마다 다름)

6. 이 IP와 포트로 연결:

```bash
adb connect <IP>:<포트>
# 예: adb connect 192.168.0.100:XXXXX
```

**Android 10 이하 (네트워크를 통한 ADB):**

1. 기기에서 **네트워크를 통한 ADB** 옵션 켜기
2. 표시된 IP 주소와 포트 확인 (예: `192.168.0.100:5555`)
3. 터미널에서:

```bash
adb connect <IP>:<포트>
# 예: adb connect 192.168.0.100:5555
```

#### 5단계: 연결 확인

```bash
adb devices
```

다음과 같이 표시되면 성공:

```
List of devices attached
192.168.0.100:XXXXX    device
```

#### 6단계: 앱 실행

```bash
pnpm run android
```

앱이 무선으로 설치되고 실행됩니다!

#### ⚠️ 주의사항

- 컴퓨터와 기기가 **같은 Wi-Fi**에 있어야 합니다
- Wi-Fi 연결이 끊기면 다시 연결해야 합니다
- 기기를 재시작하면 무선 디버깅이 꺼질 수 있습니다 (다시 켜야 함)
- 보안상 공용 Wi-Fi에서는 사용하지 않는 것을 권장합니다
- Android 10 이하는 일부 기기에서 USB로 한 번 연결해야 할 수도 있습니다

#### 무선 연결 해제

```bash
adb disconnect <IP>:<포트>
# 예: adb disconnect 192.168.0.100:XXXXX

# 또는 모든 무선 연결 해제
adb disconnect
```

#### 다음번 사용 시

한 번 페어링하면 다음번에는:
1. 기기에서 **무선 디버깅** 켜기
2. **IP 주소 및 포트** 확인
3. `adb connect <IP>:<포트>` 실행

페어링은 저장되므로 매번 페어링 코드를 입력할 필요가 없습니다.

---

## 🍎 iOS 기기에서 테스트하기 (macOS만 가능)

### 1단계: Apple Developer 계정 필요

- 무료 Apple ID로도 가능하지만, 일부 제한이 있습니다
- 유료 개발자 계정($99/년)이 있으면 더 많은 기능 사용 가능

### 2단계: Xcode에서 서명 설정

1. Xcode에서 `ios/OneMoonDate.xcworkspace` 열기
2. 프로젝트 네비게이터에서 **OneMoonDate** 선택
3. **Signing & Capabilities** 탭 선택
4. **Team** 드롭다운에서 Apple ID 선택
5. **Automatically manage signing** 체크

### 3단계: 기기 연결

1. USB 케이블로 iPhone/iPad 연결
2. 기기에서 **신뢰** 선택 (처음 연결 시)
3. Xcode 상단에서 연결된 기기 선택

### 4단계: 앱 실행

```bash
# 프로젝트 디렉토리에서
pnpm run ios
```

또는 Xcode에서 직접 실행:
- 상단의 실행 버튼 클릭
- 또는 `Cmd + R`

### 5단계: 기기에서 신뢰 설정 (처음만)

앱이 설치되면:
1. **설정** → **일반** → **VPN 및 기기 관리** (또는 **기기 관리**)
2. 개발자 앱 인증서 선택
3. **신뢰** 버튼 탭
4. 앱을 다시 실행

---

## 🔧 문제 해결

### Android: "adb: command not found"

ADB가 설치되지 않은 경우:

**macOS:**
```bash
# Android Studio를 설치하면 자동으로 포함됩니다
# 또는 Homebrew로 설치:
brew install android-platform-tools
```

**Linux:**
```bash
sudo apt-get install android-tools-adb
```

**Windows:**
- Android Studio를 설치하면 자동으로 포함됩니다
- 또는 [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools)를 직접 다운로드

### Android: 기기가 인식되지 않음

1. **USB 드라이버 확인** (Windows)
   - 제조사 USB 드라이버 설치 필요
   - Samsung: Samsung USB Driver
   - Google: Google USB Driver

2. **USB 모드 확인**
   - 기기에서 USB 연결 모드를 **파일 전송** 또는 **MTP**로 설정

3. **USB 케이블 확인**
   - 데이터 전송이 가능한 케이블인지 확인 (충전 전용 케이블은 작동하지 않음)

### iOS: "No devices found"

1. **Xcode가 최신 버전인지 확인**
2. **기기가 잠금 해제되어 있는지 확인**
3. **신뢰 설정 확인** (위의 5단계 참조)
4. **USB 케이블 확인** (원본 케이블 권장)

### Metro 번들러 연결 문제

기기에서 앱이 실행되지만 "Unable to connect to Metro" 오류가 발생하는 경우:

1. **같은 Wi-Fi 네트워크 확인**
   - 컴퓨터와 기기가 같은 Wi-Fi에 연결되어 있어야 합니다
   - **중요**: USB로 연결해도 Metro 번들러는 Wi-Fi를 통해 연결됩니다

2. **컴퓨터 IP 주소 확인**

   **macOS/Linux:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

   **Windows:**
   ```bash
   ipconfig
   ```
   
   보통 `192.168.x.x` 형태의 IP 주소를 찾으세요.

3. **수동으로 Metro 서버 주소 설정** (Android)
   
   ```bash
   # 기기를 흔들어서 개발자 메뉴 열기
   # 또는: adb shell input keyevent 82
   ```
   
   개발자 메뉴에서:
   - **Settings** → **Debug server host & port for device**
   - 컴퓨터의 IP 주소와 포트 입력: `192.168.x.x:8081`
   - 예: `192.168.0.10:8081`

4. **방화벽 확인**
   - 포트 8081이 차단되지 않았는지 확인
   - macOS: 시스템 설정 → 네트워크 → 방화벽
   - Windows: Windows Defender 방화벽 설정

5. **Shake 제스처로 개발자 메뉴 열기**
   - Android: 기기를 흔들거나 `adb shell input keyevent 82`
   - iOS: 기기를 흔들거나 `Cmd + D` (시뮬레이터)

---

## 🚀 빠른 시작 체크리스트

### Android (USB 연결)
- [ ] 개발자 옵션 활성화
- [ ] USB 디버깅 활성화
- [ ] USB로 기기 연결
- [ ] `adb devices`로 기기 인식 확인
- [ ] `pnpm run android` 실행

### Android (Wi-Fi 무선 연결)
- [ ] 개발자 옵션 활성화
- [ ] 무선 디버깅 활성화 (Android 11+)
- [ ] 컴퓨터와 기기를 같은 Wi-Fi에 연결
- [ ] 초기 USB 연결로 `adb pair` 또는 `adb connect` 설정
- [ ] USB 케이블 제거 후 `pnpm run android` 실행
- [ ] Metro 서버 주소 수동 설정 (필요시)

### iOS
- [ ] Apple ID로 Xcode 서명 설정
- [ ] USB로 기기 연결
- [ ] 기기 신뢰 설정
- [ ] `pnpm run ios` 실행
- [ ] 기기에서 개발자 앱 신뢰

---

## 💡 유용한 팁

### Hot Reload 활성화

기기에서도 코드 변경 시 자동으로 새로고침됩니다:
- **Android**: 기기를 흔들어 개발자 메뉴 → **Enable Hot Reloading**
- **iOS**: `Cmd + D` → **Enable Hot Reloading**

### 로그 확인

**Android:**
```bash
# 모든 로그 보기
adb logcat

# React Native 로그만 보기
adb logcat *:S ReactNative:V ReactNativeJS:V
```

**iOS:**
- Xcode의 콘솔 창에서 확인
- 또는 `pnpm run ios` 실행 시 터미널에서 확인

### 앱 제거

**Android:**
```bash
adb uninstall com.onemoondate
```

**iOS:**
- 기기에서 직접 삭제하거나
- Xcode의 **Window** → **Devices and Simulators**에서 삭제

---

## 📚 추가 자료

- [React Native 공식 문서 - Running on Device](https://reactnative.dev/docs/running-on-device)
- [Android 개발자 가이드 - Run apps on a hardware device](https://developer.android.com/studio/run/device)
- [Apple 개발자 가이드 - Running Your App on Devices](https://developer.apple.com/documentation/xcode/running-your-app-on-devices)
