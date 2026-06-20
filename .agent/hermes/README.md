# Hermes Export

This directory contains a generated, machine-readable export of the `.agent`
single source of truth for Hermes.

Generate or refresh the export:

```bash
python3 .agent/scripts/export-hermes.py
```

Primary bundle:

```text
.agent/hermes/generated/manifest.json
```

Split files are also generated under:

```text
.agent/hermes/generated/agents/
.agent/hermes/generated/commands/
.agent/hermes/generated/skills/
.agent/hermes/generated/rules/
.agent/hermes/generated/memory/
```

## Schema

The current schema id is:

```text
ux-lab.hermes.agent-system.v1
```

Each exported item keeps a `source.path` back to the `.agent` source file. Hermes
should treat `.agent` as authoritative and the JSON files as generated artifacts.

## Item Shapes

Agents include:

- `id`: original subagent type, such as `eng/FE/frontend-dev`
- `persona`: parsed name, title, and role from the system prompt opening
- `description`, `model`, `color`, `tools`: frontmatter metadata
- `memory`: memory mode and `.agent/agent-memory/...` path when present
- `scope`: role-based file ownership from `agent-scope.json`
- `prompt`: full original agent prompt body

Commands include:

- `id`: source command id, such as `sprint/start`
- `invocation`: slash command name, aliases, and alias target when present
- `flags` and `shortFlags`: discovered CLI-style options
- `requiresWorktreeIsolation`: true when the command delegates work through an
  isolated worktree
- `instructions`: full original command body

Skills include:

- `id`, `description`, `license`
- `instructions`: full original skill body

Rules and memory stores are exported so Hermes can understand team constraints,
file scope, and persistent memory layout without parsing markdown manually.
