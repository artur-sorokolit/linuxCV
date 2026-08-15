# Agent Instructions

## Mandatory First Step

Before doing ANY work in this repository, read and internalize ALL rule files:

1. `.agents/rules/global/00_CORE.md` - behavioral guardrails, cognitive protocols, autonomy rules
2. `.agents/rules/global/01_STYLE.md` - output language (Ukrainian), formatting, communication style
3. `.agents/rules/global/02_CODING.md` - engineering standards, git safety, TDD, verification
4. `.agents/rules/global/03_TOOLS.md` - tool preferences, code editing discipline, navigation

These rules override any conflicting default behavior. Non-compliance is a critical failure.

## Skills

Before starting any task, check `.agents/skills/` for relevant skills and load them.
Greedy loading: load even if uncertain. Over-triggering is acceptable, under-triggering is not.

## Commands

Check `.agents/commands/` for available project-specific commands.
