# chrome-capture: 클릭으로 요소 선택하는 UX 추가

파일명(`plan-v1.1.0.md`)의 버전이 이 계획이 목표로 하는 실제 익스텐션 버전이다. 현재 배포 버전은 `1.0.2`(`manifest.json`/`package.json`) — 사용자가 체감하는 새 기능 추가라 semver 기준 **minor 버전업 `1.1.0`**으로 올린다(patch 아님). 실제 버전 변경은 구현 단계에서 `manifest.json`·`package.json`에 반영한다.

## Context

`extensions/chrome-capture`(Smart Screenshot Capture)는 스크린샷 촬영 전 특정 HTML 요소를 숨기는 기능이 있는데, 현재는 **CSS 선택자를 직접 타이핑**해야만 한다(`popup.html`의 `#selectorInput`, 예: `.navbar, #sidebar`). 이건 개발자에게는 익숙하지만 일반 사용자는 요소의 class/id를 알 방법이 없어 사실상 못 쓴다.

요청 목표: 사용자가 **페이지의 요소를 직접 클릭**해서 "숨길 목록"에 추가할 수 있는 피커(picker) UX를 추가한다. 기존 텍스트 입력 방식은 파워유저용으로 그대로 유지(추가이지 대체 아님).

## 현재 구조 (참고)

- `popup.js`: 숨길 선택자 목록(`hiddenSelectors`)을 **팝업 자신의 `localStorage`**에 저장. 추가/삭제/초기화 모두 팝업 안에서 처리.
- `content.js`: `chrome.runtime.onMessage`로 `hideElements`/`showElements`/`highlightElements`/`clearHighlight`/`highlightHiddenElements` 액션을 받아 처리. 이미 "빨간 테두리로 하이라이트" 로직(`highlightHiddenElements`)이 있어 재사용 가능.
- `manifest.json` 권한: `activeTab`, `tabs` + 정적 `content_scripts`(모든 http/https, `all_frames: false`)만 있음. **`storage`/`scripting` 권한 없음** — 과거 두 번의 웹스토어 재심사 대응으로 각각 제거된 이력이 있음(`git log`: "storage 권한 제거로 웹스토어 재심사 대응", "Remove unnecessary scripting permission").

## 설계: 팝업 자동 닫힘 우회

Chrome 확장 팝업(`default_popup`)은 포커스를 잃으면 강제로 닫히는 게 브라우저 자체 동작이라, "팝업 안에서 페이지를 클릭해 요소를 고른다"는 방식 자체가 불가능하다. uBlock Origin의 "요소 차단" 도구 등 실제 확장들이 쓰는 표준 패턴대로, **피커 UI 자체를 콘텐츠 스크립트가 페이지에 직접 주입**해서 동작시킨다.

## 흐름

1. 팝업에 "🎯 요소 선택" 버튼 (기존 텍스트 입력 옆)
2. 클릭 시 `startElementPicker` 메시지 전송 → 팝업은 곧 자동으로 닫힘
3. content script가 페이지 상단에 다국어 처리된 안내 툴바를 주입하고 피킹 모드 시작
   - **호버**: 마우스가 올라간 요소를 파란색 점선으로 미리보기 표시
   - **일반 클릭 = 토글**: 처음 보는 요소면 목록에 추가(빨간색으로 확정 표시). 이미 이번 세션에서 추가한 요소를 다시 클릭하면 그 추가를 취소. 원래 저장돼 있던 요소를 클릭하면 취소 예약(다시 클릭하면 예약 취소) — 팝업이 다시 열릴 때 실제로 목록에서 빠진다. "잘못 골랐다"는 항상 같은 동작(다시 클릭)으로 되돌릴 수 있다. 피킹 모드는 끝나지 않고 유지되어 한 세션에서 여러 요소를 연달아 다룰 수 있다.
   - **Shift+클릭**: 확정하지 않고 한 단계 위 부모로 미리보기만 이동. 같은 지점에서 반복하면 계속 더 올라간다(너무 안쪽 요소를 클릭했을 때 대응). 몇 단계 올라왔는지는 미리보기 테두리 두께(부모 1단계당 +1px)와 `↑{단계}` 숫자 배지로 표시된다.
   - **광고 등 실제 페이지 클릭 차단**: 피킹 중에는 뷰포트 전체를 덮는 투명 오버레이가 물리적인 클릭을 먼저 받아, 광고 iframe을 포함한 페이지 콘텐츠의 원래 클릭 동작(이동, 트래킹 등)이 절대 발생하지 않는다.
   - **Enter** 또는 "완료" 버튼: 지금까지의 추가/취소를 확정하고 종료
   - **"되돌리기"** 버튼: 이번 세션에서 다룬 항목을 최근 것부터 한 개씩 되돌림(반복 클릭 가능)
   - **"취소"** 버튼: 이번 세션에서 다룬 것을 전부 무효화하고 즉시 닫음(되돌리기와 다른 별도 동작)
4. 종료 시 "N개 선택 · 확장 아이콘을 다시 클릭해 캡처하세요" 토스트를 잠깐 띄움 (프로그래밍 방식으로 팝업을 다시 열 수 없음 — `chrome.action.openPopup()`은 버전/플랫폼 제약이 커서 의존하지 않음)
5. 사용자가 확장 아이콘을 다시 클릭하면 팝업이 최신 목록을 불러와 렌더링

## 다국어 처리

툴바 안내문·버튼·완료 토스트 등 사용자에게 보이는 모든 문구는 `i18n.js`(ko/en)를 거친다. content script는 `i18n.js`가 로드되지 않는 별도 컨텍스트라, 팝업이 `startElementPicker` 메시지를 보낼 때 이미 번역된 문자열을 함께 실어 보낸다(번역 소스는 여전히 `i18n.js` 하나 — 자세한 내용은 tech-spec-v1.1.0.md 참고).

## 상태 동기화 방식 — 권한 추가 없이, content script가 목록을 소유

팝업(닫혔다 다시 열림)과 content script(페이지에 계속 상주) 사이에서 "새로 추가된 선택자 목록"을 주고받아야 한다. `storage` 권한은 다시 선언하지 않는다(과거 두 차례 웹스토어 재심사에서 권한을 줄인 이력을 우선).

- 콘텐츠 스크립트 쪽(`element-picker.js`)이 "피커로 고른 선택자 목록"의 소유자가 된다. 페이지가 살아있는 동안 메모리에 들고 있다가, 요소를 클릭(확정)할 때마다 여기에 추가한다.
- 팝업이 열릴 때 `getPickerChanges`로 물어보고, 응답받은 추가/취소 내역을 기존 `localStorage` 기반 `hiddenSelectors`에 반영(추가분 병합 + 취소분 제거, 중복 제거)한 뒤 정상적으로 렌더링·저장한다.
- 반영 후에는 `clearPickerChanges` 메시지로 콘텐츠 스크립트 쪽 세션 상태를 비운다.
- **트레이드오프**: 팝업을 한 번도 열지 않은 채 페이지를 새로고침하면 아직 병합되지 않은 피킹 결과는 초기화된다. 이미 병합이 끝난(`localStorage`에 들어간) 항목은 기존 수동 입력 항목과 똑같이 영구 보존된다.

## 팝업-페이지 호버 동기화 (피커와 별개 기능)

기존 수동 입력 목록 UX도 함께 개선한다: 팝업이 열려 있는 동안 페이지에서 이미 저장된 요소 위에 마우스를 올리면, 팝업 안의 해당 선택자 태그 칩 테두리가 활성화되어 지금 마우스가 가리키는 게 어떤 선택자인지 바로 확인할 수 있다. Chrome 확장 팝업은 포커스를 잃어야 닫히고 페이지 위에서 마우스만 움직이는 걸로는 안 닫히므로, 팝업을 켜둔 채로 이 상호작용이 가능하다.

메커니즘은 피커와 다르다 — 피커는 한 번 요청·한 번 응답이면 되지만, 이건 마우스가 움직이는 동안 계속 이벤트가 필요해서 `chrome.tabs.connect`로 여는 장수명 `Port`를 쓴다. 팝업이 닫히면 Port가 자동으로 끊겨 별도 정리가 거의 필요 없다. 자세한 구현은 tech-spec-v1.1.0.md 참고.

## CSS 선택자 자동 생성 로직

클릭한 요소 `el`에 대해:
1. `el.id`가 있으면 `#id` 사용 (가장 안정적)
2. 없으면 클래스 중 "안정적으로 보이는" 것(숫자/해시가 섞인 CSS-in-JS 클래스 등은 제외)만 골라 `tag.class1.class2` 조합 시도
3. 그 선택자가 페이지에서 **1~5개** 정도만 매치되면 그대로 채택(비슷한 요소 여러 개를 한 번에 숨기고 싶은 경우가 실제로 많음 — 예: 광고 배너 3개)
4. 매치 수가 너무 많거나(범용 클래스) 후보가 없으면, 클릭한 요소 하나만 정확히 가리키는 **nth-of-type 경로**를 가까운 조상까지 거슬러 올라가며 생성(DevTools의 "Copy selector"와 같은 방식)

## 부가 개선 (피커 기능은 아니지만 같은 작업 중 함께 반영)

- **미리보기 이미지 확대**: 캡처 미리보기에 마우스를 올리면 커서를 따라다니는 원형 돋보기로 확대 표시. `object-fit: contain`으로 인한 레터박스(여백)는 확대 기준에서 제외해 비율이 깨지지 않게 함.
- **미리보기에 숨긴 요소 개수 표시**: 이미지 크기·용량 정보 옆에 "N개 요소 숨겨짐" 추가.
- **숨길 요소 목록이 비어있을 때 빈 여백 제거**: 기존 `.status:empty` 패턴과 동일하게 `.hidden-elements:empty`도 접음.
- **누락된 i18n 보완**: "유효하지 않은 선택자", "처리 중..." 등 기존 코드에 하드코딩돼 있던 문구도 함께 발견해 ko/en 키로 정리.

## 변경 파일

`content.js`가 비대해지는 걸 피하기 위해 피커·호버동기화 관련 코드는 새 파일 3개로 분리한다(빌드 스텝이 없는 순수 vanilla 확장이라 `manifest.json`의 `content_scripts.js` 배열에 파일을 나열하기만 하면 됨 — 같은 실행 컨텍스트를 공유하므로 모듈 시스템 없이 전역 함수로 바로 호출 가능).

- `extensions/chrome-capture/selector-generator.js` **(신규)** — DOM을 건드리지 않는 순수 함수만: 클릭한 요소로부터 CSS 선택자를 만드는 로직
- `extensions/chrome-capture/element-picker.js` **(신규)** — 피킹 모드 상태머신, 툴바/호버오버레이/클릭 차단막 DOM 주입, mousemove/click/keydown 리스너, 토글 클릭 로직, `startElementPicker`/`stopElementPicker`/`getPickerChanges`/`clearPickerChanges` 함수 정의(전역 함수로 노출)
- `extensions/chrome-capture/hover-sync.js` **(신규)** — 팝업이 열려 있는 동안 페이지 호버와 팝업 태그를 `chrome.tabs.connect` 포트로 실시간 연결
- `extensions/chrome-capture/content.js` — 기존 역할(hideElements/showElements/highlight 계열) 그대로 유지, `chrome.runtime.onMessage` 리스너에 새 액션 케이스만 추가하고 실제 처리는 `element-picker.js`의 함수를 호출하도록 위임(파일 크기 증가 최소화)
- `extensions/chrome-capture/manifest.json` — `content_scripts[0].js` 배열에 `selector-generator.js`, `element-picker.js`, `hover-sync.js` 추가(로드 순서: 의존 관계상 `content.js`보다 먼저), `version`을 `1.0.2` → `1.1.0`으로. **권한(`permissions`)은 변경 없음**
- `extensions/chrome-capture/package.json` — `version`을 `1.0.2` → `1.1.0`으로 동기화
- `extensions/chrome-capture/popup.js` — "🎯 요소 선택" 버튼, 팝업 로드 시 `getPickerChanges`로 content script에서 추가/취소 내역을 받아와 기존 `localStorage` 목록에 반영 후 `clearPickerChanges` 호출, `connectHoverSync`로 호버 동기화 Port 연결, 미리보기 돋보기·숨긴 요소 개수 표시
- `extensions/chrome-capture/popup.html` — 새 버튼 마크업 + 스타일(기존 `.btn-secondary` 재사용), 태그에 `data-selector` 속성과 `.tag-active` 스타일, 미리보기 돋보기 레이어, 빈 목록 여백 제거
- `extensions/chrome-capture/i18n.js` — 피커 관련 신규 문구 + 기존 코드에서 누락돼 있던 문구까지 ko/en 정리
- `docs/PRD/chrome-capture-element-picker/plan-v1.1.0.md` — 이 계획 문서
- `docs/PRD/chrome-capture-element-picker/tech-spec-v1.1.0.md` — 기술 스펙(선택자 생성 알고리즘 의사코드, 메시지 프로토콜, DOM/상태 다이어그램 등)

## 검증

브라우저 수동 검증 완료(사용자 직접 확인). 스크린샷은 [PR #59](https://github.com/dusunax/ux-lab/pull/59) "스크린샷" 섹션 참고.

- [x] `chrome://extensions` → 압축해제 확장 프로그램으로 로드, 임의 사이트(광고 배너 있는 곳)에서 피커로 2~3개 요소 선택 → 팝업 재오픈 시 목록에 병합되는지 확인
- [x] Shift+클릭을 2~3번 연속으로 눌러 부모→조부모로 계속 올라가는지, 테두리가 매번 두꺼워지고 `↑{단계}` 배지가 함께 표시되는지 확인. Enter/완료 버튼으로 종료, 요소 4~5개 선택 후 "되돌리기"를 여러 번 눌러 순서대로 되돌아가는지, "취소"로 전체 무효화되는지 확인
- [x] 팝업 언어를 en으로 바꾼 뒤 피커를 실행해 툴바 문구가 영어로 뜨는지 확인
- [x] 새로 추가한 요소를 다시 클릭해 취소되는지, 원래 저장돼 있던(수동 입력) 요소를 클릭해 취소 예약됐다가 다시 클릭하면 복구되는지 확인
- [x] 광고 배너(iframe으로 렌더링되는 것 포함) 위에서 요소를 선택해도 광고 클릭(새 탭 이동 등)이 발생하지 않는지 확인
- [x] 캡처 실행 시 선택했던 요소들이 실제로 숨겨진 스크린샷이 나오는지, 피커 툴바/토스트가 스크린샷에 찍히지 않는지 확인
- [x] 팝업을 열지 않은 채 페이지를 새로고침하면 피킹 결과만 초기화되고, 이미 병합돼 있던 기존 목록은 영향 없는지 확인
- [x] `manifest.json`의 `permissions` 배열은 바뀌지 않았는지, `content_scripts[0].js`에는 새 파일 3개가 추가됐는지, `version`이 `1.1.0`인지 확인
- [x] `content.js`가 새 로직 유입 없이 기존 크기 수준으로 유지됐는지 확인
- [x] 팝업을 켜둔 채 저장된 요소 위로 마우스를 움직여 해당 태그 칩 테두리가 활성화되는지, 팝업을 닫아도 에러 없이 정리되는지 확인

## 결정 로그

개발 과정에서 확정한 기술적·정책적 판단들. 각 판단의 배경과 최종 결론만 기록한다.

| # | 주제 | 결정 | 배경 |
|---|---|---|---|
| D1 | 상태 동기화 | `chrome.storage.local`(권한 추가) 대신, content script가 세션 동안 메모리로 목록을 소유하고 팝업이 열릴 때 병합 | 과거 두 차례 웹스토어 재심사에서 `storage`/`scripting` 권한을 제거한 이력이 있어, 신규 기능 하나 때문에 권한을 되돌리지 않는 방향을 우선 |
| D2 | 다국어 전달 방식 | 콘텐츠 스크립트는 자체적으로 언어를 판단하지 않고, 팝업이 `i18n.js`로 번역한 문자열을 메시지 페이로드에 실어 전달 | 콘텐츠 스크립트는 `i18n.js`가 로드되는 팝업/옵션 페이지와 별도 컨텍스트라 직접 접근 불가. 번역 소스를 하나로 유지하기 위함 |
| D3 | 하이라이트 렌더링 | 실제 페이지 요소에는 `border` 대신 `box-shadow: inset` + `box-sizing: border-box` 사용 | `border`는 요소의 박스 크기에 더해져 주변 레이아웃을 밀어낼 수 있음(특히 width/height가 명시된 요소). `box-shadow`는 레이아웃에 전혀 영향을 주지 않음. 페이지에 속하지 않는 별도 플로팅 UI(호버 오버레이, 배지, 툴바)는 레이아웃 영향이 없어 `border`를 그대로 사용 |
| D4 | 광고/iframe 클릭 방지 | 피킹 중 뷰포트 전체를 덮는 투명 클릭 차단막을 두고, `elementFromPoint` 조회 시에만 순간적으로 투과 | `preventDefault`/`stopPropagation`은 클릭이 애초에 iframe 내부 문서로 직접 전달되는 경우(광고 대부분이 iframe으로 렌더링됨)에는 소용없음. 물리적인 클릭 자체가 항상 우리 쪽 오버레이에 먼저 떨어지게 해야 함 |
| D5 | 종료 단축키 | Esc가 아닌 **Enter** | 확정/완료의 의미가 더 명확함(요청에 따른 결정) |
| D6 | 되돌리기 vs 취소 | 1단계씩 되돌리는 버튼은 "되돌리기", 세션 전체를 무효화하는 버튼은 기존 범용 `cancel` i18n 키를 재사용한 "취소" | 두 버튼 이름에 모두 "취소"가 들어가면 헷갈린다는 지적으로 워딩을 분리. 새 i18n 키를 만들지 않고 기존 키를 재사용해 문자열 중복 방지 |
| D7 | 카운트 표시 | 숫자만 노출하지 않고 "{count} 선택" 라벨을 붙임 | 숫자만 있으면 무슨 뜻인지 애매함 |
| D8 | 미리보기 확대 배율 | 실제 렌더링된 이미지 영역(레터박스 제외) 기준으로 계산 | `object-fit: contain`으로 생기는 레터박스까지 확대 기준에 포함하면 가로세로 배율이 어긋나 비율이 깨짐 |
| D9 | 파일 분리 | 피커·호버동기화 로직을 `selector-generator.js`/`element-picker.js`/`hover-sync.js` 3개로 신규 분리, `content.js`는 라우팅만 추가 | 기존 `content.js`가 비대해지는 것을 방지 |

## 백로그

지금 스코프에서는 제외했지만 나중에 다시 볼 항목.

| # | 항목 | 출처 | 상태 |
|---|---|---|---|
| B1 | Shadow DOM을 쓰는 사이트(웹 컴포넌트 기반)에서 피커/호버 동기화 수동 테스트 — `elementFromPoint`는 open shadow root 안까지 보지만 `closest()`는 shadow boundary를 못 넘어서, `isPickerOwnElement`/`matchesKnownSelector` 판별이 오작동할 가능성 있음 | [lunch review](../../meetings/chrome-capture/2026-08-28-lunch-review-element-picker.md) | 미확인 |
| B2 | 레벨 숫자 배지(`↑{level}`)를 호버 미리보기뿐 아니라 확정된 픽(빨간 실선)에도 표시할지 — 여러 개를 동시에 추적하려면 스크롤마다 배지 재배치가 필요해 MVP에서는 제외 | tech-spec-v1.1.0.md 섹션 4 | 보류 |
