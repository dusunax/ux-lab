# our-claude 플러그인 도입 회의록

**날짜:** 2026-09-27
**진행:** 수평션(dev-team-v2) — Pilot (OC)
**참석:** Orca (PM), Nautilus (TS), Kraken (BE), Dolphin (AI)

---

## 안건

| # | 항목 |
|---|------|
| 1 | `our-claude` 저장소 도입 목적 및 범위 확정 |
| 2 | 설치 방식 및 적용 스코프 확정 |
| 3 | 기존 git 커맨드와의 이름·트리거 충돌 검토 |
| 4 | `pr-list` 스킬 도입 여부 |
| 5 | 거버넌스 및 `.agent/AGENT.md` 반영 방식 확정 |

---

## 회의 내용

**Pilot:** 안건 다섯 개, 순서대로 갑니다. 하나. `our-claude` 들여올지 말지, 들여오면 범위는 어디까지. `our-claude`는 팀 Skill·Plugin 원본 저장소이자 그 자체가 마켓플레이스고, 지금 `skills/`엔 `commit-and-pr`, `pr-list` 두 개 있습니다. Orca, 목적부터.

**Orca:** 관점은 하나예요 — 같은 걸 앱마다 다시 만들지 말자. ux-lab은 실험 앱을 병렬로 여러 개 굴리는 모노레포고, 팀 공통 Skill을 매번 복붙하는 비용이 이미 눈에 보여요. 플러그인 하나로 당겨쓰는 쪽이 투자 대비 명확합니다. 다만 조건이 있어요 — `.agent/`가 단일 진실 공급원이라는 원칙, 이건 이번 도입으로 흔들리면 안 됩니다.

**Dolphin:** 그 원칙이 실제로 위협받는지부터 확인해볼게요. 플러그인 설치 시 Skill은 `our-claude:<name>`으로 로드됩니다 — 네임스페이스가 프리픽스로 붙어요. `frontend-design`, `sprint-context`, `figma-harness-core`, 이 셋이랑 이름이 안 겹치는지 확인했고, 안 겹칩니다. 이름 충돌은 없어요. 좋은 신호네요.

**Nautilus:** 이름이 안 겹친다는 사실과 "왜 들여왔는가"는 별개 기록이에요. 후자가 문서에 없으면 반년 뒤엔 아무도 몰라요. 목적 문구를 지금 확정해서 박아두죠 — "팀 공통 Skill 재사용, ux-lab 자체 재구현 방지". 이걸로 기록합니다.

**Pilot:** 둘. 설치 방식이랑 스코프. Kraken.

**Kraken:** 절차 자체는 단순해요. `our-claude/README.md` 기준 두 줄.

```
/plugin marketplace add dusunax/our-claude
/plugin install our-claude@our-claude
```

문제는 절차가 아니라 스코프예요. 지금 `.claude/settings.json`, `.claude/settings.local.json` 둘 다 `enabledPlugins`도 `extraKnownMarketplaces`도 없습니다. 완전히 백지 상태에서 설계 결정을 내려야 해요.

**Nautilus:** 프로젝트(체크인) 대 로컬(gitignore), 둘 중 하나로 명확히 정합니다. 애매하게 두면 나중에 "누구는 설치돼있고 누구는 없고" 상태가 생겨요. 체크인이면 팀 전체 자동 적용, 로컬이면 각자 수동 설치 — 목적이 "재사용"이라면 답은 하나죠.

**Orca:** 프로젝트 스코프로 갑니다. 재사용이 목적인데 로컬로 넣는 건 목적 자체를 부정하는 선택이에요. `.claude/settings.json`에 커밋합니다.

**Pilot:** 결정 — 프로젝트 스코프, `.claude/settings.json` 체크인. 셋. 기존 git 커맨드 충돌. Kraken, 계속.

**Kraken:** 이건 짚고 넘어가야 해요. `commit-and-pr` 트리거 문구가 "커밋하고 PR 올려줘", "ship", "PR 만들어줘"인데, ux-lab `.agent/commands/git/ship.md`의 트리거("ship·올려줘·PR 올려줘")랑 `git/up.md`가 사실상 같은 문장을 씁니다. 두 체계가 동시에 살아있으면 어느 쪽이 반응할지는 실행해보기 전엔 아무도 모릅니다. 이게 바로 나중에 이자로 돌아오는 기술부채예요.

**Nautilus:** 사실관계만 정리하면 — `git/ship.md`·`git/up.md`는 `.agent/rules/git.md`의 브랜치·커밋 컨벤션에 맞춰 이미 검증된 흐름이에요. `commit-and-pr`은 팀 범용판이라 ux-lab 전용 규칙을 모르고요. 두 사실을 나란히 놓으면 결론은 자명해 보이는데, 그래도 이건 제가 대신 정할 사안이 아니에요.

**Dolphin:** 궁금해서 확인해봤는데, 병행 활성화 자체는 기술적으로 가능해요. 이름이 다르니 로드는 둘 다 됩니다. 근데 "가능하다"랑 "안전하다"는 다른 질문이죠. 사용자가 자연어로 요청했을 때 어느 스킬이 매칭될지는 설명 문구 유사도라는, 본질적으로 모호한 기준에 달려 있어요. 애매한 프롬프트는 버그다 — 이 경우엔 애매한 매칭 기준 자체가 잠재적 버그입니다.

**Pilot:** 그럼 여기서 결론 안 냅니다. 이건 라우팅으로 해결 안 되는 사안이에요 — ux-lab git 워크플로우 주인은 사용자입니다. 기존 유지, 대체, 병행 중에 직접 골라야 해요. ⚠️ Open. 넷. `pr-list`.

**Kraken:** 이건 짧아요. `pr-list`는 "기간 내 머지한 PR을 활동별 분류"하는 기능인데, ux-lab 기존 커맨드 어디와도 안 겹칩니다. 구조적으로 충돌 리스크가 없는 케이스예요.

**Orca:** 그리고 바로 쓸 곳이 있어요 — `/sprint:report` 작성할 때 활동 근거 수집. 도입 안 할 이유가 없습니다.

**Pilot:** 결정 — `pr-list` 즉시 도입. 다섯. 거버넌스, `.agent/AGENT.md` 반영.

**Nautilus:** 원칙을 나눠야 해요. `our-claude` 저장소 안의 변경(Skill 추가·수정)은 그 저장소 README 규칙 — PR로만, main 직접 push 금지, 관리자 1명 승인 — 그대로 따릅니다. ux-lab이 결정할 몫은 "설치 여부·버전·활성화 상태"뿐이고, 그 결정만 우리 프로세스 회의록에 남겨요. 두 저장소의 거버넌스를 섞지 않는 게 핵심입니다.

**Orca:** 그 경계선 자체를 어딘가엔 적어둬야죠. `.agent/AGENT.md`가 단일 진실 공급원인데 외부 플러그인 의존성이 생겼다는 사실이 거기 한 줄도 없으면, 다음에 합류하는 에이전트는 `our-claude`의 존재 자체를 모릅니다.

**Pilot:** 결정 — `.agent/AGENT.md`에 "외부 플러그인" 섹션 신설. 마켓플레이스 출처, 설치 스코프, 활성 Skill(`pr-list`) 기록. 다섯 안건 다 돌았습니다. Nautilus, 정리해주세요.

**Nautilus:** 기록합니다. 말해진 건 아래 표로 남기고, 말해지지 않은 결론(안건 3)은 Open으로 명시합니다.

---

## 결정 사항

| 번호 | 결정 내용 | 담당 |
|------|-----------|------|
| 1 | `our-claude`를 프로젝트 스코프 플러그인으로 도입 (목적: 팀 공통 Skill 재사용) | Nautilus |
| 2 | 설치는 `.claude/settings.json`(체크인)에 마켓플레이스 등록 + 플러그인 활성화로 반영 | Nautilus |
| 3 | `pr-list` Skill 즉시 도입 | 전원 |
| 4 | `commit-and-pr` Skill 도입 여부 — 기존 `git/ship`·`git/up`과 트리거 중복으로 보류 | ⚠️ Open (사용자 결정 필요) |
| 5 | `.agent/AGENT.md`에 "외부 플러그인" 섹션 신설, `our-claude` 출처·스코프·활성 Skill 기록 | Nautilus |
| 6 | `our-claude` 저장소 자체 변경은 그 저장소의 PR+관리자 승인 규칙을 그대로 따름 (ux-lab이 관여하지 않음) | 전원 |

---

## 액션 아이템

**Nautilus (TS)**
- [ ] 이 회의록 작성 및 저장 (`docs/meetings/2026-09-27-our-claude-adoption.md`)
- [ ] `docs/meetings/README.md` "프로세스 회의록" 표에 이 회의록 링크 추가
- [ ] `.agent/AGENT.md`에 "외부 플러그인" 섹션 추가 (`our-claude` 마켓플레이스, 프로젝트 스코프, 활성 Skill: `pr-list`)
- [ ] 사용자 확인 후 `.claude/settings.json`에 `extraKnownMarketplaces`(`dusunax/our-claude`) 및 `enabledPlugins`(`our-claude@our-claude`) 반영

**사용자**
- [ ] 안건 3 — `commit-and-pr` Skill 도입 여부 결정 (기존 유지 / 대체 / 병행)

---

## 비고

`our-claude` 마켓플레이스 추가(`/plugin marketplace add dusunax/our-claude`)는 외부 GitHub 저장소를 신뢰 소스로 등록하는 동작이라, 실제 설정 반영 전 사용자 확인을 거친다. 이번 회의록은 도입 방향과 범위를 확정하는 단계이고, 설정 파일 변경 자체는 액션 아이템 완료 시점에 별도로 진행한다.

이 회의는 수평션(dev-team-v2) 플릿이 진행했다 — Pilot(OC)이 라우팅·진행을, Orca(PM)가 목적·우선순위를, Kraken(BE)이 설치·충돌의 기술적 사실관계를, Dolphin(AI)이 플러그인/Skill 로딩 의미론을, Nautilus(TS)가 기록을 맡았다.

---

*회의록 작성: Nautilus (TS)*
