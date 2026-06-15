#!/usr/bin/env python3
"""
sync-agent-wrappers.py

Keep Claude/Cursor wrapper frontmatter in sync with `.agent` source files.
`.agent` remains the SSOT; wrappers mirror metadata only so tool discovery and
automatic selection keep working.
"""

from pathlib import Path
import ast
import os


SYNC_ROOTS = [
    (Path(".claude/commands"), Path(".agent/commands")),
    (Path(".cursor/commands"), Path(".agent/commands")),
    (Path(".claude/agents"), Path(".agent/subagents")),
    (Path(".cursor/agents"), Path(".agent/subagents")),
]


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


def sync_wrapper(wrapper: Path, source: Path) -> None:
    source_label = source.as_posix()
    rel_link = os.path.relpath(source_label, wrapper.parent)
    body = (
        f"\n> Thin wrapper - 실제 정의는 `{source_label}`를 읽으세요.\n\n"
        f"Read [`{source_label}`]({rel_link}) and follow it.\n"
    )
    wrapper.parent.mkdir(parents=True, exist_ok=True)
    wrapper.write_text(extract_frontmatter(source) + body)


def main() -> int:
    synced = 0
    for wrapper_root, source_root in SYNC_ROOTS:
        for source in sorted(source_root.rglob("*.md")):
            wrapper = wrapper_root / source.relative_to(source_root)
            sync_wrapper(wrapper, source)
            synced += 1
    print(f"synced {synced} wrapper files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
