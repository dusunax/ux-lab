# PRD Step 3 — 사용자 프로필 & 레시피 저장

## 목표

사용자 프로필을 생성하고, 마음에 든 레시피를 저장해 나중에 다시 볼 수 있게 한다.

---

## 사용자 흐름

### 프로필 설정
1. 하단 네비게이션 "프로필" 탭 진입
2. 닉네임, 식단 유형, 알레르기 재료, 특이사항을 입력한다.
3. 저장 버튼을 누르면 `localStorage`에 기록되고, 버튼이 "저장됨"으로 바뀐다.
4. 값이 변경되기 전까지 "저장됨" 상태가 유지된다. 페이지 이동 없음.

### 레시피 저장
1. Step 2 레시피 카드의 "저장" 버튼을 누른다.
2. 저장된 레시피 목록(북마크)에 추가된다.
3. 저장 성공 시 버튼이 "저장됨" 상태로 바뀐다.

### 저장된 레시피 조회
1. 하단 네비게이션 "저장됨" 탭 클릭
2. 저장 일시 최신순으로 카드 목록이 표시된다. 각 카드에 `#bookmark-N` 번호 표시.
3. 즐겨찾기된 레시피가 있으면 헤더 아래에 전체 / 즐겨찾기 필터 탭이 표시된다.
4. 각 카드에서 레시피 상세 (재료, 단계)를 펼쳐볼 수 있다.
5. 카드 우측 상단 별 아이콘으로 즐겨찾기 토글.
6. 하단 삭제 버튼으로 레시피를 목록에서 제거한다.

---

## 데이터 모델

모든 데이터는 `localStorage`에 JSON으로 저장한다.

```ts
// key: 'fridge_user_profile'
interface UserProfile {
  nickname: string;
  diet: 'normal' | 'vegetarian' | 'vegan' | 'low-sodium';
  allergies: string[];           // e.g. ["견과류", "갑각류"], 최대 10개
  excludeAllergies: boolean;     // 레시피 추천 시 알레르기 재료 기본 무시
  specialNote: string;           // 최대 300자, API 프롬프트 최우선 반영
  createdAt: string;             // ISO 8601
}

// key: 'fridge_saved_recipes'
interface SavedRecipe {
  id: string;                    // crypto.randomUUID()
  name: string;
  description: string;
  time: string;
  difficulty: string;
  usedIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  savedAt: string;               // ISO 8601
  favorited?: boolean;
}
```

---

## UI 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `Nav` | 하단 고정 네비게이션 (냉장고 / 저장됨 / 프로필), 활성 탭 배경 하이라이트 |
| `SavedRecipeCard` | 제목·설명·저장일시, `#bookmark-N` 번호, 우측 상단 즐겨찾기 별, 펼치면 재료·단계 표시, 알레르기 경고 배지, 하단 삭제 버튼 |
| `IngredientChip` | 재료 칩 공통 컴포넌트. `isAllergy` prop으로 경고 스타일 분기 |
| `EmptyState` | 저장된 레시피가 없을 때 안내 + Step 1으로 이동 버튼 |

---

## 프로필과 Step 1·2의 연계

- 프로필 `allergies` → Step 1 인식된 재료 칩에 경고 표시
- 프로필 `allergies` → Step 2 재료 요약 칩 경고 표시 + 조건 패널 개인설정 토글
- 프로필 `excludeAllergies` → Step 2 "알레르기 재료 무시" 토글 기본값
- 프로필 `specialNote` → `fetchRecipes` 호출 시 프롬프트 최우선 반영
- 프로필 `diet` → Step 2 조건 기본값 연동 (추후 구현)

---

## 제약 및 예외 처리

- `localStorage` 미지원 환경에서는 인메모리로 동작하고 새로고침 시 초기화됨을 안내한다.
- 닉네임은 1–20자, 알레르기 태그는 최대 10개로 제한한다.
- 저장 레시피는 최대 50개로 제한하고, 초과 시 가장 오래된 항목을 자동 삭제한다.
- 알레르기 입력 시 한국어 IME 조합 중 Enter 오발동 방지 (`isComposing` 체크).

---

## 완료 조건

- [x] 프로필 최초 설정 및 수정 동작
- [x] 저장 후 페이지 유지, 값 변경 전까지 "저장됨" 상태 유지
- [x] 식단 유형: 일반 / 채식 / 비건 / 무염식
- [x] 알레르기 태그 입력 (Enter / 추가 버튼, 중복 방지, 최대 10개)
- [x] 특이사항 textarea (300자 제한, API 프롬프트 최우선 반영)
- [x] 개인설정: 알레르기 재료 기본 무시 토글
- [x] 레시피 저장 → `localStorage` 반영, 버튼 상태 변경
- [x] 저장 목록 조회 (최신순 정렬)
- [x] `#bookmark-N` 번호 표시
- [x] 저장 일시 (월·일·시·분) 표시
- [x] 레시피 상세 펼치기 / 접기
- [x] 레시피 삭제
- [x] 알레르기 경고 배지 표시 (카드 내 경고 + 사용 재료 칩)
- [x] 즐겨찾기 토글 (카드 우측 상단 별 아이콘)
- [x] 즐겨찾기 필터 (전체 / 즐겨찾기 탭, 즐겨찾기 존재 시만 표시)
- [x] 하단 네비게이션 활성 탭 시각화 (아이콘 + 라벨 배경 하이라이트)
- [x] 프로필 식단 유형 → Step 2 기본값 자동 연동 (일반 제외한 모든 식단)
