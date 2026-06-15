---
name: ai-empathy-diary 앱 성능 컨텍스트
description: 단일 1235줄 HTML 파일 구조의 일기 앱. renderRows 핫패스의 알려진 병목과 데이터 규모 가정
type: project
---

ai-empathy-diary는 `apps/ai-empathy-diary/index.html` 단일 파일(인라인 CSS/JS)로 구현된 Excel 풍 UI 일기 앱이다. OpenRouter proxy(`http://localhost:3035/api/chat`)로 감정 분석을 받아 localStorage(`ai-diary-entries`)에 저장한다.

**Why:** 빠르게 데모하기 위한 단일 페이지 구조라 빌드 도구 없이 그대로 브라우저에서 동작. 그래서 가상 스크롤·이벤트 위임 같은 일반 최적화가 의도적으로 빠져있는 상태.

**How to apply:**
- 데이터 규모 가정: 일기 특성상 항목 수 < 365 (1년치 매일 작성 가정 최대). 이 범위에서는 가상 스크롤 도입 비용 > 효과. 200개 이하라면 보류 제안.
- 핫패스: `renderRows()`가 클릭/제출/Esc/취소 등 거의 모든 상호작용에서 호출되며 매번 `container.innerHTML` 전체 폐기 + 행마다 리스너 재부착. 위임 + 부분 업데이트 패턴이 최우선 개선점.
- `data-row`에 `animation: rowSlideIn` 무조건 적용 → 전체 재렌더 시 모든 행이 슬라이드 인 재생. 새 행에만 붙도록 `row-new` 클래스 분리 권장.
- localStorage 저장은 성공 분기 1회뿐이라 빈도는 낮지만 동기 IO + 전체 배열 직렬화. `requestIdleCallback`으로 빼면 5줄로 해결.
