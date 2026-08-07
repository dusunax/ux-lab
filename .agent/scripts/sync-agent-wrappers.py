#!/usr/bin/env python3
"""
sync-agent-wrappers.py

Keep Claude/Cursor wrapper frontmatter in sync with `.agent` source files.
`.agent` remains the SSOT; wrappers mirror metadata only so tool discovery and
automatic selection keep working.

Usage:
  python3 .agent/scripts/sync-agent-wrappers.py            # write mode
  python3 .agent/scripts/sync-agent-wrappers.py --check    # drift check only (CI/hook)

Cursor 규칙 (OQ-D, 2026-07-12 결정):
  - `.cursor/` wrapper는 중첩 디렉터리 대신 평탄 파일명으로 생성한다
    (예: sprint/eval.md → sprint-eval.md). Cursor의 하위 디렉터리 스캔이
    버전 의존적이므로 어느 환경에서도 인식되는 형태를 기본값으로 한다.
  - `model:` 별칭(sonnet/opus/haiku)은 Cursor 모델 체계와 불일치할 수 있어
    `inherit`로 치환한다.
  - 관리 대상 루트의 기대 목록 밖 .md 파일(구 중첩 wrapper 등)은 제거한다.
"""

from pathlib import Path
import ast
import os
import sys


SYNC_ROOTS = [
    # (wrapper_root, source_root, flatten)
    (Path(".claude/commands"), Path(".agent/commands"), False),
    (Path(".cursor/commands"), Path(".agent/commands"), True),
    (Path(".claude/agents"), Path(".agent/subagents"), False),
    (Path(".cursor/agents"), Path(".agent/subagents"), True),
]

MODEL_ALIASES = ("sonnet", "opus", "haiku")


def extract_frontmatter(path: Path) -> str:
    text = path.read_text()
    if not text.startswith("---\n"):
        raise ValueError(f"missing frontmatter: {path}")
    end = text.find("\n---\n", 4)
    if end == -1:
        raise ValueError(f"unclosed frontmatter: {path}")
    return normalize_frontmatter(text[: end + len("\n---\n")])


def normalize_frontmatter(frontmatter: str) -> str:
    lines = []
    name_prefix = 'name: "'
    description_prefix = 'description: "'
    source_lines = frontmatter.splitlines()
    index = 0
    while index < len(source_lines):
        line = source_lines[index]
        if line.startswith(name_prefix) and line.endswith('"'):
            lines.append(f"name: {line[len(name_prefix):-1]}")
            index += 1
            continue
        if line.startswith(description_prefix) and line.endswith('"'):
            value = line[len(description_prefix):-1]
            if '\\"' not in value and "\\n" not in value and ":" not in value:
                lines.append(f"description: {value}")
                index += 1
                continue
            decoded = ast.literal_eval(f'"{value}"')
            decoded = decoded.replace("\\n", "\n").replace('\\"', '"')
            lines.append("description: |-")
            lines.extend(f"  {description_line}" for description_line in decoded.splitlines())
            index += 1
            continue
        if line == "description: |-":
            index += 1
            description_lines = []
            while index < len(source_lines):
                description_line = source_lines[index]
                if description_line and not description_line.startswith(" "):
                    break
                description_lines.append(description_line[2:] if description_line.startswith("  ") else "")
                index += 1
            decoded = "\n".join(description_lines).replace("\\n", "\n").replace('\\"', '"')
            lines.append("description: |-")
            lines.extend(f"  {description_line}" for description_line in decoded.splitlines())
            continue
        if line.startswith("description: "):
            value = line[len("description: "):]
            if ": " in value or value.startswith(("{", "[", "&", "*", "?", "|", ">", "@", "`")):
                lines.append("description: |-")
                lines.append(f"  {value}")
                index += 1
                continue
        lines.append(line)
        index += 1
    return "\n".join(lines) + "\n"


def adapt_for_cursor(frontmatter: str) -> str:
    """Cursor wrapper용 frontmatter 변환 — model 별칭을 inherit로 치환."""
    lines = []
    for line in frontmatter.splitlines():
        if line.strip() in (f"model: {alias}" for alias in MODEL_ALIASES):
            indent = line[: len(line) - len(line.lstrip())]
            lines.append(f"{indent}model: inherit")
        else:
            lines.append(line)
    return "\n".join(lines) + "\n"


def expected_wrapper(wrapper_root: Path, source: Path, source_root: Path, flatten: bool) -> Path:
    rel = source.relative_to(source_root)
    if flatten:
        return wrapper_root / ("-".join(rel.with_suffix("").parts) + ".md")
    return wrapper_root / rel


def render_wrapper(source: Path, wrapper: Path, flatten: bool) -> str:
    source_label = source.as_posix()
    rel_link = os.path.relpath(source_label, wrapper.parent.as_posix())
    frontmatter = extract_frontmatter(source)
    if flatten:
        frontmatter = adapt_for_cursor(frontmatter)
    body = (
        f"\n> Thin wrapper - 실제 정의는 `{source_label}`를 읽으세요.\n\n"
        f"Read [`{source_label}`]({rel_link}) and follow it.\n"
    )
    return frontmatter + body


def main() -> int:
    check_mode = "--check" in sys.argv[1:]
    missing, stale, ok, extra = [], [], [], []
    writes = []  # (wrapper_path, content)

    for wrapper_root, source_root, flatten in SYNC_ROOTS:
        expected = {}
        for source in sorted(source_root.rglob("*.md")):
            wrapper = expected_wrapper(wrapper_root, source, source_root, flatten)
            content = render_wrapper(source, wrapper, flatten)
            expected[wrapper] = content
            if not wrapper.exists():
                missing.append(wrapper)
                writes.append((wrapper, content))
            elif wrapper.read_text() != content:
                stale.append(wrapper)
                writes.append((wrapper, content))
            else:
                ok.append(wrapper)
        # 기대 목록 밖 .md — 구형 중첩 wrapper 등
        if wrapper_root.exists():
            for existing in sorted(wrapper_root.rglob("*.md")):
                if existing not in expected:
                    extra.append(existing)

    for label, items in (("MISSING", missing), ("STALE", stale), ("EXTRA", extra)):
        for item in items:
            print(f"{label}: {item.as_posix()}")
    print(f"ok={len(ok)} missing={len(missing)} stale={len(stale)} extra={len(extra)}")

    if check_mode:
        return 1 if (missing or stale or extra) else 0

    for wrapper, content in writes:
        wrapper.parent.mkdir(parents=True, exist_ok=True)
        wrapper.write_text(content)
    for existing in extra:
        existing.unlink()
    # 빈 디렉터리 정리
    for wrapper_root, _, _ in SYNC_ROOTS:
        if not wrapper_root.exists():
            continue
        for directory in sorted((p for p in wrapper_root.rglob("*") if p.is_dir()), reverse=True):
            if not any(directory.iterdir()):
                directory.rmdir()
    print(f"synced: wrote {len(writes)}, removed {len(extra)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
