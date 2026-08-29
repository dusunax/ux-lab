# chrome-capture 요소 피커 — 백로그

결정된 스코프는 아니고, 지금 당장 처리하지 않기로 한 아이디어·확인 필요 항목을 모아둔다. 처리되면 상태를 갱신하고, 실제로 작업하게 되면 별도 PR/커밋으로 진행한다.

| # | 항목 | 출처 | 상태 |
|---|---|---|---|
| 1 | Shadow DOM을 쓰는 사이트(웹 컴포넌트 기반)에서 피커/호버 동기화 수동 테스트 — `elementFromPoint`는 open shadow root 안까지 보지만 `closest()`는 shadow boundary를 못 넘어서, `isPickerOwnElement`/`matchesKnownSelector` 판별이 오작동할 가능성 있음 | [lunch review](../../meetings/chrome-capture/2026-08-28-lunch-review-element-picker.md) | 미확인 |
| 2 | 레벨 숫자 배지(`↑{level}`)를 호버 미리보기뿐 아니라 확정된 픽(빨간 실선)에도 표시할지 — 여러 개를 동시에 추적하려면 스크롤마다 배지 재배치가 필요해 MVP에서는 제외 | tech-spec-v1.1.0.md 섹션 4 | 보류 |
