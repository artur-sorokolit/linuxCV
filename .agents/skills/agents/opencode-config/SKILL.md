---
name: opencode-config
description: Edit opencode.json, AGENTS.md, and config files. Use proactively for provider setup, permission changes, model config, formatter rules, or environment variables.

Examples:
- user: "Add Anthropic as a provider" → edit opencode.json providers, add API key baseEnv var, verify with opencode run test
- user: "Restrict this agent's permissions" → add permission block to agent config, set deny/allow for tools/fileAccess
- user: "Set GPT-5 as default model" → edit global or agent-level model preference, verify model name format
- user: "Disable gofmt formatter" → edit formatters section, set languages.gofmt.enabled = false
---

# OpenCode Configuration

Help users configure OpenCode through guided setup of config files and rules.


<question_tool>

**Batching Rule:** Use only for 2+ related questions; single questions use plain text.

**Syntax Constraints:** header max 12 chars, labels 1-5 words, mark defaults with `(Recommended)`.

**Purpose:** Clarify config scope (models/permissions/rules), validate approach, and handle multiple valid options.

</question_tool>

<reference>

## File Locations

| Type | Global | Project |
|------|--------|---------|
| **Config** | `~/.config/opencode/opencode.json` | `./opencode.jsonc` |
| **Rules** | `~/.config/opencode/AGENTS.md` | `./AGENTS.md` |

**Precedence:** Project > Global. Configs are merged, not replaced.

</reference>

<workflow>

## Question Tool

**Batching:** Use the `question` tool for 2+ related questions. Single questions → plain text.

**Syntax:** `header` ≤12 chars, `label` 1-5 words, add "(Recommended)" to default.

When to ask: Vague request ("configure opencode"), permission/security changes, or multiple valid options exist.

## Workflow

Ask the user what they want to configure:

1. **"What would you like to set up?"**
   - Config file (models, tools, permissions, theme)
   - Rules (project instructions via AGENTS.md)

Then guide them through the relevant section below.

</workflow>

<config_file>

## Config File (opencode.json)

### Basic Setup

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-20250514",
  "theme": "opencode",
  "autoupdate": true
}
```

### Key Options

| Option | Purpose | Example |
|--------|---------|---------|
| `model` | Default model | `"anthropic/claude-sonnet-4-20250514"` |
| `small_model` | Lightweight tasks | `"anthropic/claude-3-5-haiku-20241022"` |
| `theme` | UI theme | `"opencode"`, `"catppuccin"`, `"dracula"` |
| `autoupdate` | Auto-update OpenCode | `true` / `false` |
| `share` | Session sharing | `"manual"` / `"auto"` / `"disabled"` |

### Permissions

Control what requires approval using the `permission` field.

```jsonc
{
  "permission": {
    "edit": "allow",           // "allow" | "ask" | "deny"
    "bash": {
      "npm *": "allow",        // pattern matching
      "git *": "allow",
      "rm *": "ask",
      "*": "ask"               // default for this tool
    },
    "webfetch": "allow",
    "skill": {
      "*": "allow",
      "dangerous-*": "deny"
    }
  }
}
```

## Usage Patterns

- **Initialization** — Run `/init` in OpenCode to auto-generate based on project analysis.
- **Validation** — After editing opencode.json, you MUST run this validation (not just suggest it):

```bash
opencode run "test"
```

**Execute it yourself** using the Bash tool before telling the user the change is complete.

If broken, you'll see a clear error with line number:
```
Error: Config file at ~/.config/opencode/opencode.json is not valid JSON(C):
--- Errors ---
CommaExpected at line 464, column 5
   Line 464:     "explore": {
              ^
--- End ---
```

### Best Practices

- **Strict Permissions** — Always start with "ask" for bash and edit.
- **Commenting** — OpenCode supports JSONC (JSON with comments). SHOULD comment out unused configs instead of deleting:

```jsonc
{
  "plugin": [
    "opencode-openai-codex-auth@latest",
    //"@tarquinen/opencode-dcp@latest",     // disabled for now
    //"@howaboua/pickle-thinker@0.4.0",     // only for GLM-4.6
    "@ramtinj95/opencode-tokenscope@latest"
  ]
}
```

**Why:** You might want to re-enable later. Keeps a record of what you've tried.

## Validate After Major Changes

After editing opencode.json, you MUST run this validation (not just suggest it):

```bash
opencode run "test"
```

**Execute it yourself** using the Bash tool before telling the user the change is complete.

</config_file>

<examples>

## Minimal Safe Config

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-20250514",
  "permission": {
    "edit": "ask",
    "bash": "ask"
  }
}
```

## Power User Config

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-20250514",
  "autoupdate": true,
  "permission": {
    "edit": "allow",
    "bash": {
      "git *": "allow",
      "npm *": "allow",
      "*": "ask"
    }
  }
}
```

## Team Project Config

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-20250514",
  "share": "auto",
  "instructions": [
    "docs/development.md",
    "docs/api-guidelines.md"
  ]
}
```

</examples>
