<SYSTEM_CODING>

# Engineering Standards - Standards for writing and modifying code

## Code Quality

- No comments. Not explanatory, not section headers, not TODO, not "why" notes. If code needs a comment, rewrite it until it does not: rename, extract, restructure
- "This part is genuinely non-obvious" is not an exemption. It is the signal that the code is wrong. The reasoning belongs in the naming and the shape of the code, or in the chat reply, never in the file
- Python docstrings stay: they are the project's test and API descriptions, not commentary
- No ignores: never use @ts-ignore, eslint-disable, # noqa. Fix the root cause
- SOLID/KISS/YAGNI
- Single responsibility above all. One file, one job. A component owns its own concern and nothing else - never leave an unrelated component, hook or helper sitting beside it because that was convenient. A Sidebar file contains the Sidebar
- Declarative, never imperative. Describe the outcome, not the steps to reach it. Prefer data, composition and pure transformations over manual sequencing and step-by-step mutation. Cover every state by construction, not by branching after the fact
- Project conventions trump generic best practices
- Strict types safety, no any, proper inference everywhere

## Consistency

- Always look wider than the change in front of you. Before writing anything, read the neighbouring code and ask what already exists to reuse and what this change makes possible to simplify
- Reuse over reinvention: a second implementation of something the project already has is a defect, even when it works
- Never sacrifice functionality for consistency or elegance. If a pattern does not fit the case, say so and deliver the working thing
- Leave the surrounding code no less consistent than you found it: same naming, same layering, same shape as its neighbours

## Error Handling

- Fail fast: detect errors at the source, not downstream
- Explicit errors: result types or exceptions, never silent failures
- Validate inputs: guard at boundaries, assume nothing about external data

## Git Safety

- Never perform git write operations (commit, stage/add, unstage, revert, reset, merge, rebase, stash, push, force-push, amend, branch create/delete/switch, checkout)
- Repository is read-only. All git state changes require explicit user permission

## Simplicity

- Write the least code to solve the problem completely
- No over-engineering for hypothetical future needs
- Remove unused code, dead branches, obsolete abstractions
- Functions: one thing, one level of abstraction
- If it needs scrolling, it needs splitting

## Surgical Changes

- Change the fewest lines possible. Before reporting completion, run `git diff` and verify each changed line is part of the task
- One logical change per edit, one concern per commit
- Every edit must trace to an explicit user request. Every removal needs explicit reasoning
- Don't mix formatting fixes with logic changes
- Every external dependency reference (API, library method, CLI flag, env var, config value) requires documentation verification. Use Context7, official docs, or GitHub source
- Before answering a question that depends on project state, read the relevant files

## Read Before You Touch

- Read the documentation for an area before changing anything in it. Touching the frontend means reading every frontend doc first, not the one page that looked relevant
- Project docs come first: `docs/standarts/` for how this codebase is written, `docs/feature/` for what a feature is meant to do, `client/AGENTS.md` for framework specifics. Then the library's own docs
- Never skim to save tokens. Reading the full doc costs one agent's time; guessing costs the developer's, and they pay it while reviewing
- Quality is measured by how little the developer has to check after you. Optimise for that, never for a shorter transcript

## Verification

- After code change: run tests and linter/typecheck, show output
- After config/infra change: validate syntax, dry-run, show result
- Prohibited: "tests not affected", "no errors expected". Run the tool, show the output

## Testing

- TDD mandate: use `unit-testing` for ALL application code changes
- Build test harness first: define system under test, formulate expectations
- RED is MANDATORY: test must fail on business logic gap, not test syntax error
- RED-GREEN-REFACTOR: failing test, minimal implementation, refactor
- Bug fix: reproduce as failing test, fix, show test passes
- Critical paths must have tests

## Style

- Match existing patterns in the file/project
- Variables, functions, classes in English
- Descriptive names: reveal intent, not implementation
- Verb for functions, noun for classes
- Use project's linter/formatter settings
- Commits: English, imperative mood ("Add feature", not "Added feature")

## Project Files

- Do not copy behavioral rules from `agents/rules/*` into project files
- No hardcoded user paths (`/Users/...`, `/home/...`). Use relative paths or runtime commands
- Secret retrieval: never read `.env` files directly. Use `docker exec <container> printenv <VAR>`. If not containerized, ask user

</SYSTEM_CODING>
