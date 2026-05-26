#!/usr/bin/env python3
"""
scope-enforcer.py — Claude Code pre-tool-use hook
레이어 소유권 강제: Edit / Write / NotebookEdit 호출 시 파일 경로를 에이전트 역할과 대조한다.

동작:
  1. .claude/.active-role 파일이 없으면 메인 세션으로 간주 → 통과
  2. deny 패턴 매치 → exit 2 (하드 차단, stdout 메시지가 Claude에게 보임)
  3. readonly 역할이 쓰기 시도 → exit 2 (하드 차단)
  4. allow 패턴 외 파일 → exit 0 (소프트 경고, stderr)
  5. 그 외 → exit 0 (통과)

참조 파일:
  .claude/rules/agent-scope.json  — 역할별 allow/deny/readonly 규칙
  .claude/.active-role            — 현재 활성 에이전트 역할 (OC가 기록/정리)
"""

import json
import sys
import os
import fnmatch


def get_repo_root():
    """CLAUDE_PROJECT_DIR 환경변수 우선, 없으면 현재 디렉터리."""
    return os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())


def to_relative(file_path: str, repo_root: str) -> str:
    """절대 경로를 리포지터리 루트 기준 상대 경로로 변환."""
    if file_path.startswith(repo_root):
        return file_path[len(repo_root):].lstrip("/")
    return file_path.lstrip("/")


def match_any(path: str, patterns: list) -> bool:
    return any(fnmatch.fnmatch(path, p) for p in patterns)


def get_owner(scope: dict, path: str) -> str:
    """경계 파일 기준 먼저, 이후 allow 패턴으로 소유 역할 추정."""
    for pattern, owner in scope.get("boundary", {}).items():
        if fnmatch.fnmatch(path, pattern):
            return owner
    for role, rules in scope["roles"].items():
        if not rules.get("readonly") and match_any(path, rules.get("allow", [])):
            return role
    return "미지정"


def main():
    # stdin에서 훅 입력 읽기
    try:
        hook_input = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = hook_input.get("tool_name", "")
    tool_input = hook_input.get("tool_input", {})

    # 파일 쓰기 툴만 검사
    if tool_name not in ("Edit", "Write", "NotebookEdit"):
        sys.exit(0)

    # 파일 경로 추출
    file_path = (
        tool_input.get("file_path")
        or tool_input.get("path")
        or ""
    )
    if not file_path:
        sys.exit(0)

    repo_root = get_repo_root()
    rel = to_relative(file_path, repo_root)

    # .active-role 확인 — 없으면 메인 세션, 제한 없음
    role_file = os.path.join(repo_root, ".claude", ".active-role")
    if not os.path.exists(role_file):
        sys.exit(0)

    try:
        with open(role_file) as f:
            role = f.read().strip().upper()
    except OSError:
        sys.exit(0)

    if not role:
        sys.exit(0)

    # 스코프 규칙 로드
    scope_file = os.path.join(repo_root, ".claude", "rules", "agent-scope.json")
    if not os.path.exists(scope_file):
        sys.exit(0)  # 규칙 파일 없으면 통과

    try:
        with open(scope_file) as f:
            scope = json.load(f)
    except (json.JSONDecodeError, OSError):
        sys.exit(0)

    rules = scope.get("roles", {}).get(role)
    if not rules:
        # 알 수 없는 역할 → 소프트 경고만
        print(
            f"⚠️  알 수 없는 역할 [{role}] — 파일 범위 검증을 건너뜁니다.",
            file=sys.stderr,
        )
        sys.exit(0)

    # ── 읽기 전용 역할 (UX, QA) ──────────────────────────────────────
    if rules.get("readonly"):
        print(
            f"⛔ 파일 수정 차단\n"
            f"   역할:  [{role}] (읽기 전용)\n"
            f"   파일:  {rel}\n"
            f"\n"
            f"   [{role}] 역할은 어떤 파일도 직접 수정할 수 없습니다.\n"
            f"   결과를 텍스트로 출력하고 오케스트레이터(OC)에게 보고하세요."
        )
        sys.exit(2)

    # ── DENY 패턴 → 하드 차단 ────────────────────────────────────────
    for pattern in rules.get("deny", []):
        if fnmatch.fnmatch(rel, pattern):
            owner = get_owner(scope, rel)
            layer = scope["roles"].get(role, {}).get("layer", role)
            owner_layer = scope["roles"].get(owner, {}).get("layer", owner)
            print(
                f"⛔ 레이어 소유권 위반\n"
                f"   역할:      [{role}] — {layer} 레이어\n"
                f"   파일:      {rel}\n"
                f"   소유 레이어: [{owner}] — {owner_layer} 레이어\n"
                f"\n"
                f"   이 파일은 [{role}] 역할의 쓰기 범위 밖입니다.\n"
                f"   → 오케스트레이터(OC)에게 재위임을 요청하거나,\n"
                f"     OC가 올바른 에이전트([{owner}])로 재라우팅하도록 보고하세요."
            )
            sys.exit(2)

    # ── ALLOW 패턴 외 파일 → 소프트 경고 ────────────────────────────
    allow_patterns = rules.get("allow", [])
    if allow_patterns and not match_any(rel, allow_patterns):
        layer = rules.get("layer", role)
        print(
            f"⚠️  파일 범위 주의 [{role}]\n"
            f"   파일 `{rel}`이(가) [{role}] 레이어({layer})의 허용 경로에 없습니다.\n"
            f"   계속 진행하려면 오케스트레이터(OC)에게 보고하세요.",
            file=sys.stderr,
        )

    sys.exit(0)


if __name__ == "__main__":
    main()
