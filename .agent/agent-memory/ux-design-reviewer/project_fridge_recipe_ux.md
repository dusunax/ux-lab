---
name: fridge-recipe UX patterns and decisions
description: UX review findings and decisions for the fridge-recipe app (ingredient recognition + recipe recommendation)
type: project
---

프리지 레시피 앱(apps/fridge-recipe)에 대해 전체 UX 심층 검토를 수행하고 코드 수정을 완료했다 (2026-05-10).

**적용된 수정 목록:**
- Step1 에러: role="alert" 추가, "다시 시도" 인라인 링크 추가
- Step1 빈 상태: ingredients=0 일 때 안내 문구 + IngredientTagList 직접 노출
- Step1 접근성: 이미지 토글 버튼에 aria-expanded/aria-controls 추가
- Step2 에러: role="alert" + "다시 시도" 인라인 링크 추가
- Step2 스트리밍: "AI가 레시피를 작성하고 있어요" 진행 힌트 텍스트 추가
- Step2 프로필 연결: ingredient summary 아래 "프로필 알레르기/특이사항 반영 중" 안내
- Step2 접근성: 조리 조건 토글에 aria-expanded/aria-controls 추가
- Profile: 페이지 상단에 "레시피 추천에 자동 반영된다" 설명 문구 추가
- Profile: 저장 버튼 disabled 이유 (닉네임 미입력) 인라인 힌트 추가, "저장됨" → "저장 완료"
- Saved: 삭제 즉시 실행 → 바텀시트 스타일 확인 다이얼로그(취소/삭제) 패턴으로 교체
- Saved: 즐겨찾기 필터 빈 상태에 "전체 레시피 보기" CTA 추가
- RecipeCard: 저장 완료 시 체크 아이콘 추가, aria-label 추가
- ImageDropzone: role="button", tabIndex=0, 키보드(Enter/Space) 지원, focus-visible ring, aria-label 추가
- ImageDropzone: 파일 오류에 role="alert" 추가
- ConditionSelector: 알레르기 토글 스위치에 aria-label 추가
- Nav: /step2 경로도 냉장고 탭 active로 처리

**확립된 패턴:**
- 에러 영역: role="alert" + 인라인 "다시 시도" 버튼 (모노폰트 xs, underline)
- 삭제 확인: 바텀시트형 다이얼로그 (취소 좌 / 삭제 우, danger 컬러)
- Disabled 이유: 버튼 바로 위 font-mono text-xs 인라인 힌트 텍스트
- 빈 상태: title(font-medium) + 설명(muted mono xs) + CTA 버튼 구조

**Why:** 에러 복구 경로 없음, profile 설정 반영 여부 불투명, 삭제 실수 방지 장치 부재가 주요 UX 리스크였음.
**How to apply:** 후속 기능 추가 시 이 패턴을 일관되게 유지할 것.
