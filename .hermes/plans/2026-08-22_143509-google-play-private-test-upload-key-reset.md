# Google Play 비공개 테스트 트랙 생성 Plan

**Goal:** one-moon-date 앱의 Google Play 비공개 테스트 트랙을 만들고 AAB를 업로드한다.

**핵심 특이점:** 현재 Play Console이 기대하는 기존 upload key SHA1과 로컬 AAB 서명 SHA1이 다르므로, 새 트랙/AAB 업로드 전에 upload key reset을 먼저 완료해야 한다.

---

## Current context

- Repo: `/Users/du/repository/ux-lab`
- App: `apps/one-moon-date`
- Play Console expected upload SHA1:
  - `22:D1:D8:A3:16:39:06:72:F3:78:85:5E:A9:21:07:41:59:DC:B9:4A`
- Current new upload key / AAB SHA1:
  - `36:75:14:52:68:35:75:D1:3B:68:D4:D7:66:A7:5F:F6:17:C2:DA:E5`
- Reset certificate to submit:
  - `apps/one-moon-date/android/app/upload_certificate.pem`
- Upload-ready AAB after reset is accepted:
  - `apps/one-moon-date/android/app/build/outputs/bundle/release/app-release.aab`
- Local-only signing files, ignored by git:
  - `apps/one-moon-date/android/app/upload-keystore.jks`
  - `apps/one-moon-date/android/key.properties`

---

## Plan

### Phase 1 — Upload key reset

1. Open Google Play Console → one-moon-date app.
2. Go to App signing / 앱 서명.
3. Start upload key reset flow.
4. Submit `android/app/upload_certificate.pem`.
5. Record that the requested new upload certificate SHA1 is `36:75:14:52:68:35:75:D1:3B:68:D4:D7:66:A7:5F:F6:17:C2:DA:E5`.

Validation:
- Reset request submitted successfully in Play Console.
- No keystore password or `.jks` file is uploaded; only `.pem` certificate is submitted.

### Phase 2 — Wait and verify reset

1. Wait for Google to accept/apply upload key reset.
2. Revisit App signing page.
3. Confirm the accepted upload key certificate matches SHA1 `36:75:14:52:68:35:75:D1:3B:68:D4:D7:66:A7:5F:F6:17:C2:DA:E5`.

Validation:
- Play Console no longer expects `22:D1...` for future uploads, or it explicitly accepts the reset certificate.

### Phase 3 — Re-verify or rebuild AAB

1. Verify current AAB signature:

```bash
cd /Users/du/repository/ux-lab/apps/one-moon-date
/opt/homebrew/opt/openjdk@21/bin/keytool -printcert \
  -jarfile android/app/build/outputs/bundle/release/app-release.aab | grep SHA1
```

2. If needed, rebuild:

```bash
cd /Users/du/repository/ux-lab/apps/one-moon-date/android
JAVA_HOME=/opt/homebrew/opt/openjdk@21 PATH="$JAVA_HOME/bin:$PATH" \
  ./gradlew --no-daemon bundleRelease
```

Validation:
- AAB exists.
- AAB SHA1 matches reset upload key SHA1 `36:75...`.
- AAB owner is not `CN=Android Debug`.

### Phase 4 — Create closed testing track

1. Play Console → Testing → Closed testing.
2. Create a new track.
3. Configure tester list/group as needed.
4. Create release.
5. Upload `android/app/build/outputs/bundle/release/app-release.aab`.
6. Set release name, e.g. `0.8.0`.
7. Add Korean release notes.

Suggested release notes:

```xml
<ko-KR>
비공개 테스트용 첫 번째 릴리스입니다.
앱 안정성 및 Android 릴리스 빌드 구성을 정리했습니다.
음력/양력 날짜 변환 및 설정 저장 기능을 포함합니다.
</ko-KR>
```

Validation:
- AAB upload accepted.
- No wrong-key error.
- No duplicate versionCode error.
- No debuggable build error.

### Phase 5 — Review and rollout

1. Resolve any Play Console warnings/errors.
2. Save release draft or roll out to closed testing, depending on current readiness.
3. Record final state in Jira comment.

Validation:
- Closed testing track exists.
- Release is draft/submitted/rolled out as intended.

---

## Risks

- Upload key reset may take hours or longer to apply.
- If reset is not accepted yet, uploading the current AAB will still fail with wrong-key error.
- `release.keystore` may be the original matching key, but without its password it cannot be used for signing.
- Signing secrets must remain local-only and must not be committed.

---

## Jira task breakdown

Parent task:
- Google Play 비공개 테스트 트랙 생성 및 업로드 키 재설정

Subtasks:
1. Play Console에서 upload key reset 요청 제출
2. upload key reset 반영 확인
3. AAB 서명 검증 및 필요시 재빌드
4. Google Play 비공개 테스트 트랙 생성
5. AAB 업로드 및 릴리스 정보 입력
6. 비공개 테스트 출시 검토 및 최종 상태 기록
