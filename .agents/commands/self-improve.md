---
description: Reflect on session mistakes, analyze root causes, and strengthen artifacts (rules, skills, commands) to prevent recurrence.
mode: improve
argument-hint: <none>
---

# Self-Improve

The session is over. Mistakes happened. You are now in self-improvement mode. Your task: find every moment the user corrected you, perform root cause analysis for each, propose multiple fix options, and — after user approval — apply minimal changes to the relevant artifacts.

```
Load Context → Self-Reflection → Root Cause Analysis → Propose Options → User Adjusts & Approves → Apply
```

## Invariants

1. Agent self-discovers all incidents from session history — user does NOT enumerate them.
2. Root cause must explain WHY the system allowed the mistake — not just WHAT was violated.
3. For each incident, propose 2–4 solution options — not a single prescription.

## Prerequisites

Before any analysis, load these skills immediately:

1. `skill-creator` — skill creation, auditing, and optimization workflow.
2. `opencode-config` — configuration management for OpenCode artifacts.

Then read every artifact the agent operated under during the session:

3. Read `AGENTS.md` — path: `~/Projects/graintrack/agents/AGENTS.md`. Provides project identity, knowledge architecture, artifact conventions, language policy.
4. Read all files under `rules/global/` and the current project's rules directory (e.g., `rules/graintrack/` if the session was in the graintrack project). The agent must determine which project it worked in and read that project's rules — graintrack is not the only possibility.
5. Identify every skill loaded during the session — read the full content of each.
6. Identify every command executed during the session — read the full content of each.

## Phase 1: Load Context

The agent may be invoked from any workspace and may not know about `agents`. Before any analysis:

1. Locate and read `AGENTS.md` at `~/Projects/graintrack/agents/AGENTS.md`.
2. Read every file in `rules/global/` and the current project's rules directory.
3. Review the session transcript. Identify every skill that was loaded and every command that was invoked. Read each in full.
4. Report to the user: which artifacts were loaded, how many files read.

## Phase 2: Self-Reflection

Scan the full session history. Identify every moment where:

- The user explicitly corrected the agent's action.
- The user pointed out a mistake or misunderstanding.
- The user interrupted and redirected the agent.
- The user rejected a proposal or approach.
- The user questioned the agent's reasoning ("why did you do X?").

For each incident, document:

- **What happened** — the agent's action and the user's correction.
- **Context** — what the agent was trying to accomplish, which instruction was being followed.
- **Message references** — which user messages contain the correction.

Present the full list to the user. Ask: "Did I miss any incidents? Remove any that are not actually mistakes?"

## Phase 3: Root Cause Analysis

For each confirmed incident, trace the chain from symptom to system failure:

1. **Which artifact should have prevented this?** — a specific rule (file, line), skill (section, step), command (phase, invariant), or AGENTS.md (section).
2. **Why didn't it?** — classify the failure:
   - **Loophole**: rule exists but has ambiguous wording or an implicit exception.
   - **Ignored**: rule exists but the agent misinterpreted or overlooked it.
   - **Gap**: no artifact covers this situation — uncovered territory.
   - **Workflow gap**: skill or command has a missing step or unchecked condition.
   - **Conflict**: two artifacts give conflicting instructions, agent chose wrongly.
   - **Missing prerequisite**: agent failed to load a required skill or read a referenced document.
3. **Root cause** — one sentence. What single weakness in the system of artifacts allowed this to happen?

## Phase 4: Propose Options

For each incident, propose 2–4 solution options. Each option states:

- **Target artifact** — file path and line number (or insertion point within existing section).
- **Diff** — with 3-5 lines of surrounding context:
  ```
  - old line(s)
  + new line(s)
  ```
- **Why it works** — how this closes the root cause from Phase 3.
- **Trade-off** — what risk or downside this option introduces.

When writing a proposed rule change, abstract the principle from the incident. Never hardcode the specific tool, file, or scenario that triggered the fix into a system-level artifact. Ask: "Does this sentence work for any tool, any config, any dependency?" If not — rewrite.

Selection hierarchy when choosing where to edit:

- Edit an existing line that already speaks about this topic.
- Add a new line to an existing section if no line covers it.
- Add a new section to an existing file if no section covers it.

Example of organic edit:

- Incident: agent used `Write` to restore 160 lines instead of `Edit`.
- Existing rule: "Never overwrite entire files (Write tool) when only partial changes are needed."
- Loophole: the qualifier "when only partial changes are needed" implies large restorations are allowed.
- Organic edit: remove qualifier → "Never use Write for modifications. Edit only — even for multi-line restores."

## Phase 5: User Adjusts & Approves

Two-step confirmation:

1. **Adjust** — user selects preferred options, combines them, requests modifications, or rejects them.
2. **Approve** — user explicitly says "apply" or "застосовуй". Only then does the agent proceed.

## Phase 6: Apply

1. Apply each approved edit via `Edit` tool, one at a time.
2. After all edits, run `git diff --stat` to verify:
   - Only the declared files changed.
   - Only the declared lines changed.
   - No extraneous modifications.
3. Report: files changed, lines changed, confirmation that nothing else was touched.
