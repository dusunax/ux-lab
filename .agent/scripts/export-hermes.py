#!/usr/bin/env python3
"""
Export the .agent SSOT into a Hermes-readable JSON bundle.

The exporter is intentionally dependency-free so it can run in a fresh worktree.
It preserves the original markdown prompts while lifting metadata, scope,
memory paths, command invocation names, and worktree isolation hints into
structured JSON.
"""

from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
AGENT_ROOT = REPO_ROOT / ".agent"
OUTPUT_ROOT = AGENT_ROOT / "hermes"
GENERATED_ROOT = OUTPUT_ROOT / "generated"

SCHEMA = "ux-lab.hermes.agent-system.v1"
TEAM = {"id": "susan-market", "name": "수산시장"}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def split_frontmatter(path: Path) -> tuple[dict[str, Any], str]:
    text = read_text(path)
    if not text.startswith("---\n"):
        return {}, text

    end = text.find("\n---\n", 4)
    if end == -1:
        raise ValueError(f"unclosed frontmatter: {path}")

    raw = text[4:end]
    body = text[end + len("\n---\n") :]
    return parse_frontmatter(raw), body.lstrip("\n")


def parse_frontmatter(raw: str) -> dict[str, Any]:
    metadata: dict[str, Any] = {}
    lines = raw.splitlines()
    index = 0

    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        if line.startswith((" ", "\t")) or ":" not in line:
            index += 1
            continue

        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()

        if value in {"|", "|-", ">", ">-"}:
            index += 1
            block: list[str] = []
            while index < len(lines):
                next_line = lines[index]
                if next_line and not next_line.startswith((" ", "\t")):
                    break
                block.append(next_line[2:] if next_line.startswith("  ") else next_line)
                index += 1
            metadata[key] = "\n".join(block)
            continue

        metadata[key] = parse_scalar(value)
        index += 1

    return metadata


def parse_scalar(value: str) -> Any:
    if value in {"true", "false"}:
        return value == "true"
    if value.startswith('"') and value.endswith('"'):
        return value[1:-1]
    if value.startswith("'") and value.endswith("'"):
        return value[1:-1]
    if "," in value and not value.startswith(("http://", "https://")):
        return [item.strip() for item in value.split(",") if item.strip()]
    return value


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def source_ref(path: Path) -> dict[str, str]:
    return {"path": path.relative_to(REPO_ROOT).as_posix()}


def extract_persona(body: str) -> dict[str, str | None]:
    match = re.search(
        r"^You are\s+([^,]+),\s+an?\s+(.+?)\s+\(([A-Z]+)\)\.",
        body,
        re.MULTILINE,
    )
    if not match:
        return {"displayName": None, "title": None, "role": None}
    return {
        "displayName": match.group(1).strip(),
        "title": match.group(2).strip(),
        "role": match.group(3).strip(),
    }


def extract_memory_path(body: str) -> str | None:
    match = re.search(r"\.agent/agent-memory/([^`]+)", body)
    if not match:
        return None
    return f".agent/agent-memory/{match.group(1).strip().rstrip('/')}/"


def extract_tool_mentions(text: str) -> list[str]:
    patterns = [
        r"\bmcp__[A-Za-z0-9_]+",
        r"\b[A-Za-z]+Mcp[A-Za-z]+Tool\b",
        r"\bWebFetch\b",
        r"\bWebSearch\b",
        r"\bReadMcpResourceTool\b",
        r"\bListMcpResourcesTool\b",
        r"\bTaskStop\b",
    ]
    tools: set[str] = set()
    for pattern in patterns:
        tools.update(re.findall(pattern, text))
    return sorted(tools)


def load_scope() -> dict[str, Any]:
    return json.loads(read_text(AGENT_ROOT / "rules" / "agent-scope.json"))


def export_agents(scope: dict[str, Any]) -> list[dict[str, Any]]:
    agents: list[dict[str, Any]] = []
    for path in sorted((AGENT_ROOT / "subagents").rglob("*.md")):
        metadata, body = split_frontmatter(path)
        agent_id = str(metadata.get("name") or path.stem)
        persona = extract_persona(body)
        role = persona["role"] or (agent_id.split("/")[1] if "/" in agent_id else None)
        role_scope = scope.get("roles", {}).get(role, {}) if role else {}
        memory_path = extract_memory_path(body)

        agent = {
            "kind": "agent",
            "schema": SCHEMA,
            "team": TEAM,
            "id": agent_id,
            "source": source_ref(path),
            "description": metadata.get("description", ""),
            "model": metadata.get("model", "inherit"),
            "color": metadata.get("color"),
            "persona": persona,
            "tools": metadata.get("tools", []),
            "detectedToolMentions": extract_tool_mentions(body),
            "memory": {
                "mode": metadata.get("memory"),
                "path": memory_path,
                "index": f"{memory_path}MEMORY.md" if memory_path else None,
            }
            if metadata.get("memory") or memory_path
            else None,
            "scope": {
                "role": role,
                "readonly": role_scope.get("readonly", False),
                "allow": role_scope.get("allow", []),
                "deny": role_scope.get("deny", []),
                "layer": role_scope.get("layer"),
                "description": role_scope.get("description"),
            },
            "prompt": body,
        }
        agents.append(agent)
    return agents


def command_invocation(command_id: str) -> dict[str, Any]:
    aliases: list[str] = []
    alias_of = None

    if command_id == "dev-team/orchestrate":
        invocation = "/orchestrate"
        aliases = ["/oc"]
    elif command_id == "dev-team/oc":
        invocation = "/oc"
        alias_of = "dev-team/orchestrate"
    elif command_id.startswith("sprint/"):
        invocation = f"/sprint:{command_id.split('/', 1)[1]}"
    else:
        invocation = f"/{Path(command_id).name}"

    return {"name": invocation, "aliases": aliases, "aliasOf": alias_of}


def export_commands() -> list[dict[str, Any]]:
    commands: list[dict[str, Any]] = []
    for path in sorted((AGENT_ROOT / "commands").rglob("*.md")):
        metadata, body = split_frontmatter(path)
        command_id = path.relative_to(AGENT_ROOT / "commands").with_suffix("").as_posix()
        invocation = command_invocation(command_id)
        flags = sorted(set(re.findall(r"`(--[A-Za-z0-9-]+)(?:\s+[^`]*)?`", body)))
        short_flags = sorted(set(re.findall(r"`(-[A-Za-z])(?:\s+[^`]*)?`", body)))
        needs_worktree = 'isolation: "worktree"' in body or "worktree 격리" in body

        commands.append(
            {
                "kind": "command",
                "schema": SCHEMA,
                "team": TEAM,
                "id": command_id,
                "source": source_ref(path),
                "description": metadata.get("description", ""),
                "invocation": invocation,
                "argumentsVariable": "$ARGUMENTS" if "$ARGUMENTS" in body else None,
                "flags": flags,
                "shortFlags": short_flags,
                "requiresWorktreeIsolation": needs_worktree,
                "detectedToolMentions": extract_tool_mentions(body),
                "instructions": body,
            }
        )
    return commands


def export_skills() -> list[dict[str, Any]]:
    skills: list[dict[str, Any]] = []
    for path in sorted((AGENT_ROOT / "skills").rglob("*.md")):
        metadata, body = split_frontmatter(path)
        skills.append(
            {
                "kind": "skill",
                "schema": SCHEMA,
                "team": TEAM,
                "id": str(metadata.get("name") or path.stem),
                "source": source_ref(path),
                "description": metadata.get("description", ""),
                "license": metadata.get("license"),
                "instructions": body,
            }
        )
    return skills


def export_rules(scope: dict[str, Any]) -> list[dict[str, Any]]:
    rules: list[dict[str, Any]] = []
    for path in sorted((AGENT_ROOT / "rules").glob("*.md")):
        rules.append(
            {
                "kind": "rule",
                "schema": SCHEMA,
                "id": path.stem,
                "source": source_ref(path),
                "instructions": read_text(path),
            }
        )
    rules.append(
        {
            "kind": "scope",
            "schema": SCHEMA,
            "id": "agent-scope",
            "source": source_ref(AGENT_ROOT / "rules" / "agent-scope.json"),
            "data": scope,
        }
    )
    return rules


def export_memory() -> list[dict[str, Any]]:
    memories: list[dict[str, Any]] = []
    memory_root = AGENT_ROOT / "agent-memory"
    if not memory_root.exists():
        return memories

    for directory in sorted(path for path in memory_root.iterdir() if path.is_dir()):
        entries = []
        for path in sorted(directory.glob("*.md")):
            if path.name == "MEMORY.md":
                continue
            metadata, body = split_frontmatter(path)
            entries.append(
                {
                    "source": source_ref(path),
                    "name": metadata.get("name", path.stem),
                    "description": metadata.get("description"),
                    "type": metadata.get("type"),
                    "body": body,
                }
            )

        memories.append(
            {
                "kind": "memoryStore",
                "schema": SCHEMA,
                "id": directory.name,
                "source": source_ref(directory),
                "index": source_ref(directory / "MEMORY.md")
                if (directory / "MEMORY.md").exists()
                else None,
                "entries": entries,
            }
        )
    return memories


def write_split_files(kind: str, items: list[dict[str, Any]]) -> None:
    for item in items:
        item_id = item["id"].replace("/", "__")
        write_json(GENERATED_ROOT / kind / f"{item_id}.json", item)


def main() -> int:
    scope = load_scope()
    agents = export_agents(scope)
    commands = export_commands()
    skills = export_skills()
    rules = export_rules(scope)
    memories = export_memory()

    if GENERATED_ROOT.exists():
        shutil.rmtree(GENERATED_ROOT)

    write_split_files("agents", agents)
    write_split_files("commands", commands)
    write_split_files("skills", skills)
    write_split_files("rules", rules)
    write_split_files("memory", memories)

    bundle = {
        "schema": SCHEMA,
        "team": TEAM,
        "source": {
            "root": ".agent",
            "agentConfig": ".agent/AGENT.md",
            "scope": ".agent/rules/agent-scope.json",
        },
        "counts": {
            "agents": len(agents),
            "commands": len(commands),
            "skills": len(skills),
            "rules": len(rules),
            "memoryStores": len(memories),
        },
        "agents": agents,
        "commands": commands,
        "skills": skills,
        "rules": rules,
        "memoryStores": memories,
    }
    write_json(GENERATED_ROOT / "manifest.json", bundle)

    print(
        "exported Hermes bundle: "
        f"{len(agents)} agents, {len(commands)} commands, "
        f"{len(skills)} skills, {len(memories)} memory stores"
    )
    print((GENERATED_ROOT / "manifest.json").relative_to(REPO_ROOT).as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
