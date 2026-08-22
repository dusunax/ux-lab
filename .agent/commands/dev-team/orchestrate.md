---
description: 수평션 플릿 라우터. 사용자 요청을 분석하고 최적의 서브에이전트에게 위임한다. 어느 팀원을 써야 할지 불명확할 때 사용. /oc로도 호출 가능.
---

# /orchestrate 하네스

**인수:** $ARGUMENTS

## Step 0 — 인수 파싱

`$ARGUMENTS`가 있으면 해당 텍스트를 태스크로 사용한다.
없으면 직전 사용자 메시지를 태스크로 사용한다.

---

## Step 1 — Pilot 소환 (라우팅 분석)

`product/OC/orchestrator` 서브에이전트(Pilot)를 소환한다.

Pilot에게 전달할 프롬프트:

```
다음 태스크를 분석하고 수평션 플릿에서 가장 적합한 에이전트를 결정해줘.
라우팅 결정 형식으로만 응답해.

태스크: [인수 또는 직전 메시지]
```

Pilot의 응답에서 다음을 추출한다:
- **선택된 에이전트** (`subagent_type`)
- **이유** (한 문장)
- **컨텍스트 브리프** (수신 에이전트에게 전달할 내용)

---

## Step 2 — 라우팅 결과 보고

사용자에게 아래 형식으로 출력한다:

```
🧭 [에이전트 이름]에게 라우팅합니다.
이유: [Pilot의 한 줄 이유]
```

---

## Step 3 — 전문 에이전트 소환

### 3-1. `.active-role` 기록 (CRITICAL — 소환 직전 필수)

scope-enforcer 훅이 파일 쓰기 범위를 검사하려면 활성 역할이 기록되어 있어야 한다.
**이 스텝은 메인 세션이 수행한다** (Pilot은 텍스트 응답만 반환하므로 수행 주체가 아니다).

```bash
echo '[역할 약자]' > .claude/.active-role
```

`subagent_type` → 역할 약자 매핑:

| subagent_type | 약자 |
|---------------|------|
| `eng/FE/frontend-dev` | FE |
| `eng/BE/backend-architect` | BE |
| `eng/PERF/perf-optimizer` | PERF |
| `eng/AI/openrouter-llm-specialist` | AI |
| `product/PM/prd-product-manager` | PM |
| `product/TS/secretary` | TS |
| `design/UX/ux-design-reviewer` | UX |
| `qa/QA/code-quality-reviewer`, `qa/QA/qa-engineer` | QA |

### 3-2. 소환

Step 1에서 결정된 `subagent_type`의 에이전트를 소환한다.

소환 시 전달하는 프롬프트:
- 원본 태스크
- Pilot이 작성한 컨텍스트 브리프

### 3-3. `.active-role` 정리 (소환 완료 직후 필수)

```bash
rm -f .claude/.active-role
```

에이전트가 실패·중단으로 끝나도 반드시 실행한다. (SubagentStop 훅이 이중 안전망으로 같은 파일을 정리한다.)

---

## Step 4 — 완료 보고

에이전트의 결과를 사용자에게 전달한다.
Pilot의 라우팅 결정 요약을 접이식 블록으로 하단에 첨부한다:

```
<details>
<summary>🧭 라우팅 상세</summary>

- **담당:** [에이전트 이름] ([subagent_type])
- **이유:** [한 문장]
- **전달된 컨텍스트:**
  [브리프 내용]
</details>
```
