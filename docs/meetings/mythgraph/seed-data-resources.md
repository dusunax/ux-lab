# Seed 데이터 참고 자료

**최종 수정:** 2026-08-07  
**상태:** 🌐 준비 완료

---

## 🌐 추천 리소스

### **1. Theoi Project (강력 추천) ⭐⭐⭐⭐⭐**

**URL:** https://www.theoi.com/

**왜 최고인가:**
- ✅ 신(Deity), 인간(Human), 괴물(Monster), 장소(Place) 모두 포함
- ✅ 계통도 및 가족 관계 완벽 정리
- ✅ 각 항목별 원전 인용 (Homer, Ovid, Hesiod 등)
- ✅ 영어 요약 + 다양한 버전의 신화 수록
- ✅ 이미지와 시각 자료 풍부

**활용 방법:**

**신(Deity) 검색:**
```
https://www.theoi.com/Ourania/Zeus.html
→ Name: Zeus
→ Aliases: Jupiter, Dias
→ Description: [영문 설명]
→ Parents: [혈연관계]
→ Children: [자식 목록]
→ Sources: [Homer Iliad, Hesiod Theogony 등]
```

**인간(Human) 검색:**
```
https://www.theoi.com/Heros/Perseus.html
→ Name: Perseus
→ Parents: Zeus + Danae
→ Description: [영문 설명]
→ Mythology: [주요 이야기]
→ Sources: [Ovid Metamorphoses 등]
```

**신화(Myth) 검색:**
```
https://www.theoi.com/Myths/
→ Trojan War
→ Heracles Labors
→ Odyssey
→ Perseus & Medusa
```

**단계별 사용법:**

1. **신(Deity) 수집 (15분)**
   ```
   홈페이지 → Olympians (12명) 선택
   각 신별 페이지 방문
   Name, Aliases, Description, Parents, Children 기록
   ```

2. **인간(Human) 수집 (20분)**
   ```
   홈페이지 → Heros 섹션
   Famous Heroes 선택 (15-20명)
   Name, Parents, Description, Mythology 기록
   ```

3. **괴물(Monster) 수집 (10분)**
   ```
   홈페이지 → Monsters 섹션
   주요 괴물 선택 (5-8개)
   Name, Description, Slayer 기록
   ```

4. **장소(Place) 수집 (10분)**
   ```
   홈페이지 → Places 섹션
   Olympus, Underworld, Troy 등
   Name, Description, Deities 기록
   ```

5. **신화(Myth) 수집 (15분)**
   ```
   홈페이지 → Myths
   Trojan War, Heracles Labors 등 선택
   Events, Participants, Timeline 기록
   ```

---

## 📋 데이터 구조화

### **Theoi 데이터 → JSON 변환**

**Deity 예시:**
```json
{
  "id": "entity_zeus_001",
  "name": "Zeus",
  "slug": "zeus",
  "type": "DEITY",
  "aliases": ["Jupiter", "Dias"],
  "description": "[Theoi에서 복사한 영문 설명]",
  "domains": ["Thunder", "Sky", "Justice"],
  "olympian": true,
  "parentageIds": ["entity_kronos_001", "entity_rhea_001"],
  "childrenIds": ["entity_athena_001", "entity_apollo_001"],
  "sourceIds": ["src:homer-iliad", "src:hesiod-theogony"],
  "theoi_url": "https://www.theoi.com/Ourania/Zeus.html"
}
```

**Human 예시:**
```json
{
  "id": "entity_perseus_001",
  "name": "Perseus",
  "slug": "perseus",
  "type": "HUMAN",
  "aliases": [],
  "description": "[Theoi에서 복사한 영문 설명]",
  "mortality": true,
  "parentageIds": ["entity_zeus_001", "entity_danae_001"],
  "sourceIds": ["src:ovid-metamorphoses"],
  "theoi_url": "https://www.theoi.com/Heros/Perseus.html",
  "notableFeat": "Slayer of Medusa"
}
```

---

## 🔗 기타 보조 자료

### **2. Myth Index (보충용)**
- URL: https://www.mythindex.com/
- 신화 타임라인, Event 구성에 유용

### **3. Greek Myths (Alexander Murray)**
- 상세한 원전 번역
- 다양한 버전의 신화 비교

---

## ✅ 데이터 수집 체크리스트

```
[ ] Theoi Project 홈페이지 방문
[ ] Deity 25-30개 수집 (Olympians 우선)
[ ] Human 20-25개 수집 (Famous Heroes 우선)
[ ] Monster 5-8개 수집
[ ] Place 8-12개 수집
[ ] Myth 10-15개 수집 (Events 구조화)
[ ] 모든 Source 참조 기록
[ ] 가족 관계 검증
```

---

## 💡 주의사항

1. **정확성 최우선**
   - Theoi에서 직접 복사
   - 여러 버전이 있으면 모두 기록

2. **Source 명확화**
   - 각 정보의 출처를 반드시 기록
   - "Homer Iliad Book 1" 형식으로

3. **관계 정보 완성**
   - Parent/Child 관계는 양방향 정확성 검증
   - 누락된 관계 있으면 Theoi에서 재확인

4. **타임라인 (Event)**
   - Myth 내 Event는 시간 순서대로 정렬
   - Timestamp 는 상대 시간 (0부터 시작)

---

**시작:** 지금 Theoi Project를 열고 데이터 수집 시작!

---

*자료 정리: TS Alex | 최종 검증: 2026-08-07*
