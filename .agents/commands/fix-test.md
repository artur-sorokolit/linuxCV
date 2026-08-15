---
description: 'Diagnose and fix failing or flaky Playwright E2E tests. Enforces scientific debugging: Reproduce → Analyze → Fix → Verify. Includes live debugging via playwright-cli.'
mode: debug
argument-hint: <test-name-or-error-log>
---

# Fix E2E Test

Scientific debugging workflow for failing or flaky E2E tests.

```
Reproduce → Collect Evidence → Form Hypothesis → Fix → Verify → Report
```

## Invariants

1. Evidence before hypothesis. Hypothesis before fix.
2. If result gets worse after fix → REVERT immediately.
3. Minimal, surgical changes only — fix root cause, not symptoms.
4. Never: `waitForTimeout`, removing assertions, `page.locator()` in spec files.
5. Code changes follow CPOM architecture (see `docs/standards/e2e-testing.md`).

## Prerequisites

Before any filesystem exploration or test execution:

1. Load `e2e` skill
2. Load `playwright-cli` skill
3. Read `docs/standards/e2e-testing.md`
4. Read `client/packages/e2e-tests/README.md`

## Inputs

User provides one or more of:

1. **Error logs / CI output** (pasted or linked)
2. **Test name / file path** (e.g., `transport-management.spec.ts`)
3. **Requirement ID** (e.g., `FR-1398-01`)

## Phase 1: Locate & Audit

### 1.1 Parse Input

Extract from user input:

- **Requirement ID**: e.g., `FR-1435-12-01`
- **File path**: e.g., `tests/execution/transport/logistic-grid.spec.ts`

If user provides test path like `FR-1435 tests/execution/transport/logistic-grid.spec.ts > DataGrid > Copy / Paste > [FR-1435-12-01] Paste from clipboard`:

- Extract `FR-1435-12-01` as requirement ID
- Extract `tests/execution/transport/logistic-grid.spec.ts` as file path

### 1.2 Find & Audit Test File

Use search tools (`search_files` or `codebase_search`) to locate the test file. Do NOT scan entire filesystem with `list_files`.

Read the test file and verify traceability (see `e2e` skill → Traceability Chain):

- JSDoc `@req [FR-N-M]` exists
- Test title has `[FR-N-M-K]` prefix
- BDD scenario in Ukrainian (ДАНО/КОЛИ/ТОДІ)

If traceability is broken → note for fix, but don't block debugging.

## Phase 2: Reproduce

### 2.1 Environment Check

- Check containers: `docker compose -f client/packages/e2e-tests/docker-compose.yml ps`
- Check backend logs: `docker compose -f client/packages/e2e-tests/docker-compose.yml logs --tail 50 app`
- If suspecting schema issues → ask user to run `make post_migrate` in root.

### 2.2 Run Test

First, check if test title contains `@flaky` — this determines the run command.

```bash
# Normal tests (no @flaky tag)
pnpm --dir=client/packages/e2e-tests test:e2e --grep "FR-XXXX-YY-ZZ"

# Flaky tests (@flaky in title → quarantine project)
pnpm --dir=client/packages/e2e-tests test:e2e:flaky --grep "FR-XXXX-YY-ZZ"
```

Always use `--grep` with the requirement ID. Do NOT pass the entire file path without `--grep`.

### 2.3 Stress Test (if flaky)

Progressive — each step only after the previous passes fully:

```bash
# Step 1: single run (must pass before stress)
# Step 2: 5 iterations
pnpm --dir=client/packages/e2e-tests test:e2e --grep "FR-XXXX-YY-ZZ" --repeat-each 5
# Step 3: 10 iterations (only if 5/5 passed)
pnpm --dir=client/packages/e2e-tests test:e2e --grep "FR-XXXX-YY-ZZ" --repeat-each 10
# Step 4: 20 iterations (only if 10/10 passed)
pnpm --dir=client/packages/e2e-tests test:e2e --grep "FR-XXXX-YY-ZZ" --repeat-each 20
```

For `@flaky` tests — use `test:e2e:flaky` in all commands above.
Any failure at any step → proceed to Phase 3.

## Phase 3: Diagnose

### 3.1 Collect Failure Artifacts

For EACH failed run in `client/packages/e2e-tests/test-results/`:

1. **screenshot.png** — analyze visual state first (what's visible, data state, modal/dropdown)
2. **error-context.md** — stack trace, console errors. File is large — delegate to a subtask if needed.
3. **trace.zip** — last resort. `pnpm exec playwright show-trace <path>`. Check: element actionability, pending XHR, failed API calls.

Compare patterns across failures: identical errors? Same code line? Different error types?

### 3.2 Live Debugging

If artifacts are inconclusive, use `playwright-cli` skill to inspect the live app (open browser, verify selectors, check visual state).

### 3.3 Formulate Hypothesis

Before fixing, formulate a hypothesis. Write it in Ukrainian. Common failure patterns — `docs/standards/e2e-testing.md` → Діагностика типових помилок.

Hypothesis must contain:

- **Facts from artifacts** — concrete observations from screenshot, error-context, trace. Each fact must reference its source. Do not invent facts — only what was actually observed.
- **Causal chain** — logical sequence from cause to test failure. Describe the failure mechanism: what happens → why it leads to failure.
- **Proposed fix** — file, change, why exactly this addresses the root cause (not masks the symptom).
- **Validation plan** — how to verify the fix works.

Do not create artificial hypotheses to fill a template. Document only hypotheses that were actually considered and verified.

## Phase 4: Fix

Before writing code, document the fix plan:

- What will change (file, line, change)
- Why this fixes root cause (reference the causal chain from hypothesis)
- Expected result after fix

### Apply Fix

Where to change (CPOM rules — see `docs/standards/e2e-testing.md`):

- Selector issues → `*.component.ts`
- Flow issues → `*.page.ts`
- Data issues → fixtures/factories

### Quality Checklist

- [ ] Fix addresses root cause, not symptom
- [ ] Fix is minimal — only changed what's necessary
- [ ] Fix doesn't reduce test reliability
- [ ] Fix is consistent with existing code patterns

## Phase 5: Verify

Run progressive stress test using the same commands from Phase 2.3:

```
1×  → 5×  → 10×  → 20×
```

| Result                        | Action                    |
| ----------------------------- | ------------------------- |
| **All pass**                  | Proceed to next step      |
| **Some fail / flaky**         | STOP — analyze failure    |
| **More failures than before** | REVERT — fix is incorrect |

If test fails at any step:

1. Document: error message, pass/fail ratio, pattern (same or different)
2. Decide: incomplete fix → iterate; different error → new issue; worse → revert
3. Return to Phase 3 with new evidence

After all pass → run lint: `cd client && pnpm lint`

## Phase 6: Report

Final report for the user in Ukrainian. Must answer these questions:

1. **What was the root cause?** — technical explanation: what was happening, why the test failed, failure mechanism. Depth of explanation proportional to problem complexity.
2. **What hypotheses were checked?** — only those actually investigated. If the cause was obvious from first analysis — do not invent additional ones. For each rejected hypothesis — concrete evidence why it was disproven.
3. **What was changed?** — file, change, and why exactly this change removes the cause (link to root cause).
4. **Stability proof** — results of progressive stress test (1× → 5× → 10× → 20×) and lint.
5. **`@flaky` tag status** — removed (if 20/20) or kept (if unstable at higher iterations).
