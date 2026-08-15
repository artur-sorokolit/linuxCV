---
name: unit-testing
description: Universal unit testing principles — TDD workflow, test structure, naming conventions, test design techniques. Use when writing, reviewing, or debugging unit tests. Trigger on mentions of "unit test", "test", "testing", "tdd", "test-driven", "write tests first", or when implementing features with tests.
---

# Vision

Unit tests are **executable documentation** that describe what the system does, not how.

**Core Principles:**

1. **Consumer Perspective** — Test the value the unit provides to its consumer
2. **Test Before Change** — Never modify untested code without characterization tests first
3. **TDD Workflow** — Write failing test before implementation
4. **Domain Language** — Use consumer's vocabulary, not implementation terms
5. **Minimal Tests** — Maximum coverage through test design techniques

---

# System Under Test

## Define Before Writing Any Test

| Question                       | Answer                                      |
| ------------------------------ | ------------------------------------------- |
| **What is the unit**           | Function, class, module, API endpoint       |
| **Who is the consumer**        | Other code, business rules, end user        |
| **What value does it provide** | The contract, the behavior                  |
| **What are the boundaries**    | Inputs, outputs, side effects               |
| **What is inside SUT scope**   | Logic this unit OWNS and is responsible for |
| **What is outside SUT scope**  | Dependencies this unit USES but doesn't own |

**Rule**: If you need a real database/network/filesystem to test a unit → scope is wrong or coupling is too high.

## Test the Full Value Proposition

**Absolute Rule**: Test ALL value the unit provides to its consumer.

- Test as **black box** — verify outputs for given inputs
- Use **domain language** — consumer's vocabulary
- Cover **all scenarios** — happy path, edge cases, errors
- **Never expose internals** — test through public API only

---

# Test Before Change

**Absolute Rule**: Never modify code without tests. Tests are the safety net that proves your changes preserve behavior.

## Workflow for Existing Code

1. **Analyze** — identify consumers, use cases, value
2. **Cover** — write characterization tests for all scenarios
3. **Verify** — all tests pass (green baseline)
4. **Change** — modify code
5. **Verify** — all tests still pass (behavior preserved)

## Characterization Tests

Before touching existing untested code, capture its **current behavior** — even if behavior has bugs.

| Step | Action                        | Why                              |
| ---- | ----------------------------- | -------------------------------- |
| 1    | Identify public API           | What consumers call              |
| 2    | List use cases per consumer   | Every scenario that must work    |
| 3    | Write tests for each scenario | Captures existing behavior as-is |
| 4    | Verify all pass               | Baseline established             |
| 5    | Now safe to change            | Tests will catch regressions     |

## Coverage Approach

Don't aim for line coverage. Aim for **scenario coverage** based on value analysis:

1. **Who are the consumers?** — Identify all actors
2. **What do they need?** — List use cases per consumer
3. **What must work?** — Extract scenarios from use cases
4. **Cover all scenarios** — One test per scenario
5. **Only then modify** — With confidence that regressions are caught

---

# TDD Workflow

## RED-GREEN-REFACTOR

| Phase        | Action                                   | Proves                                 |
| ------------ | ---------------------------------------- | -------------------------------------- |
| **RED**      | Write failing test for desired behavior  | Test can fail, you know what to build  |
| **GREEN**    | Write minimal code to pass (hardcode OK) | Simplest solution works                |
| **REFACTOR** | Improve clarity, align with code style   | Design is flexible, behavior preserved |

---

# Test Structure

## AAA Pattern

Every test follows **Arrange-Act-Assert**:

```typescript
describe("Feature Name", () => {
  describe("when user has restricted access", () => {
    it("prevents access to admin panel", () => {
      const user = { role: "guest" };

      const result = canAccess(user, "admin");

      expect(result).toBe(false);
    });
  });
});
```

**Rules:**

- **Arrange**: Setup data and preconditions
- **Act**: Execute the unit under test
- **Assert**: Verify outcome
- **Blank lines** separate each block (exactly 1 line)
- **No comments** — test name explains what
- Group by **business domain** (NOT function names)
- Use `describe('when ...')` for context

---

# Naming Conventions

## Domain Language

Test names describe **observable behavior**, not implementation:

| ✅ Correct                        | ❌ Wrong                        |
| --------------------------------- | ------------------------------- |
| `applies tax to taxable items`    | `should return true`            |
| `prevents unauthorized access`    | `should call saveRecord method` |
| `merges duplicate entries`        | `should update BehaviorSubject` |
| `returns empty list when no data` | `should work correctly`         |

**Pattern**: `[verb] [outcome] [context]`

**Verb forms**: `prevents`, `applies`, `returns`, `throws`, `rejects`, `merges`, `calculates`, `hides`, `shows`

**Never**: `should`, `tests`, `verifies`

---

# What to Test

## Test Value

Every test must justify its existence. Ask before writing:

| Question                                      | If NO → don't write the test             |
| --------------------------------------------- | ---------------------------------------- |
| Does this verify behavior consumer relies on? | Test that matters, not test for coverage |
| Would a bug here break consumer's workflow?   | Test risk, not lines of code             |
| Is this the most direct way to verify it?     | Eliminate roundabout assertions          |
| Does removal of this test lose real value?    | No vanity tests                          |

**Vanity test** — passes but verifies nothing meaningful:

```typescript
// ❌ Vanity: asserts mock was called — proves nothing about behavior
it("calls repository", () => {
  service.getUsers();
  expect(mockRepo.findAll).toHaveBeenCalled();
});

// ✅ Value: verifies behavior consumer depends on
it("returns only active users", () => {
  mockRepo.findAll.mockReturnValue([USER_ACTIVE, USER_INACTIVE]);

  const result = service.getUsers();

  expect(result).toEqual([USER_ACTIVE]);
});
```

## ✅ Do Test

| Category              | Examples                               |
| --------------------- | -------------------------------------- |
| **Business logic**    | Calculations, transformations, rules   |
| **Public interfaces** | API contracts, function signatures     |
| **Edge cases**        | Null, empty, boundaries, invalid input |
| **Error handling**    | Exceptions, validation failures        |
| **State transitions** | Observable state changes               |

## ❌ Don't Test

| Category                    | Why                                              |
| --------------------------- | ------------------------------------------------ |
| **Private methods**         | Implementation details — test through public API |
| **Third-party code**        | Already tested by vendor                         |
| **Framework internals**     | Not your responsibility                          |
| **Trivial getters/setters** | No logic to test                                 |
| **Configuration**           | Unless it affects behavior                       |

---

# Interface Quality

Tests evaluate API design quality. If a test is hard to write, the API is hard to use.

| Criterion            | Question                                       | Signal of problem               |
| -------------------- | ---------------------------------------------- | ------------------------------- |
| **Convenience**      | Is the API easy to call?                       | Test setup is verbose           |
| **Completeness**     | Does API cover all consumer needs?             | Consumer must access internals  |
| **Self-sufficiency** | Can consumer use it without knowing internals? | Test reaches into private state |
| **Optimality**       | Is the API minimal yet sufficient?             | Unused parameters in test calls |

---

# Design Feedback

Tests reveal architectural problems. **Test pain = design problem.**

## Architectural Smells

| Test Pain                                  | Design Problem                          | Fix                             |
| ------------------------------------------ | --------------------------------------- | ------------------------------- |
| Need real DB/API to test unit              | Tight coupling to infrastructure        | Inject dependency via interface |
| Can't mock a dependency                    | Hard-coded instantiation                | Dependency injection            |
| Test setup exceeds 10 lines                | SRP violation — unit does too much      | Split into focused units        |
| Must test private methods                  | Abstraction leak — logic in wrong place | Extract to separate unit        |
| Changing one module breaks unrelated tests | High coupling between modules           | Introduce interface boundary    |
| Mock setup mirrors implementation          | Testing implementation, not behavior    | Redesign to test via public API |
| Same mock repeated across many tests       | Shared dependency, missing abstraction  | Extract test helper or fixture  |

## Diagnostic Questions

When writing a test feels difficult, stop and ask:

1. **Why is setup complex?** → Unit may have too many responsibilities
2. **Why can't I mock this?** → Dependency is hard-coded, not injected
3. **Why do I need real data?** → Unit reaches across layer boundary
4. **Why does test break on refactor?** → Test is coupled to implementation
5. **Why can't I express this in domain language?** → API doesn't match consumer's mental model

---

# Mocking Strategy

## Mock Only What You Don't Control

| Mock                           | Don't Mock                       |
| ------------------------------ | -------------------------------- |
| Network boundaries (API)       | Value objects (data structures)  |
| External systems (third-party) | Pure functions (no side effects) |
| Expensive operations (I/O)     | Internal helpers (unless heavy)  |
| Time-dependent code            | Business logic                   |

**Rule**: Test what you control. Mock what you don't.

---

# Test Design

## Equivalence Partitioning

Divide input space into classes — test one representative per class.

```typescript
// Function accepts age 1-100
// Classes: valid (1-100), too low (<1), too high (>100)

it("accepts valid age", () => expect(validateAge(50)).toBe(true));
it("rejects age below minimum", () => expect(validateAge(0)).toBe(false));
it("rejects age above maximum", () => expect(validateAge(101)).toBe(false));
```

## Boundary Value Analysis

Errors cluster at boundaries. Test at, just below, just above.

```typescript
// Boundary: 1 (min) → test 0, 1, 2
// Boundary: 100 (max) → test 99, 100, 101

it("accepts minimum boundary", () => expect(validateAge(1)).toBe(true));
it("accepts just above minimum", () => expect(validateAge(2)).toBe(true));
it("rejects just below minimum", () => expect(validateAge(0)).toBe(false));
```

## Decision Tables

Enumerate all condition combinations for complex logic.

```typescript
// Discount: customer type × order amount
// | Customer | Amount | Discount |
// | regular  | <100   | 0%       |
// | regular  | ≥100   | 5%       |
// | premium  | <100   | 10%      |
// | premium  | ≥100   | 15%      |

const REGULAR = { type: "regular" };
const PREMIUM = { type: "premium" };

it("applies 0% for regular + small", () =>
  expect(discount(REGULAR, 50)).toBe(0));
it("applies 5% for regular + large", () =>
  expect(discount(REGULAR, 150)).toBe(5));
it("applies 10% for premium + small", () =>
  expect(discount(PREMIUM, 50)).toBe(10));
it("applies 15% for premium + large", () =>
  expect(discount(PREMIUM, 150)).toBe(15));
```

## Semantic Test Data

```typescript
// ✅ Good: Semantic constants
const ADMIN_USER = { id: 1, role: "admin" };
const GUEST_USER = { id: 2, role: "guest" };
const INVALID_EMAIL = "not-an-email";

// ❌ Bad: Magic values
const user1 = { id: 1 };
const user2 = { id: 2 };
```

---

# Type Safety & Quality

## Type Discipline

| Rule                        | Practice                                         |
| --------------------------- | ------------------------------------------------ |
| **Fully typed**             | No `any`, no type assertions (`as Type`)         |
| **Import, don't duplicate** | Reuse types from source via `import type`        |
| **Type inference first**    | Let TS infer types; annotate only when necessary |
| **Typed mocks**             | Use type-safe mock libraries, not raw `vi.fn()`  |

## Code Quality Gate

| Rule                 | Practice                                           |
| -------------------- | -------------------------------------------------- |
| **Zero lint errors** | Fix all warnings before commit                     |
| **Zero type errors** | `tsc --noEmit` passes on all test files            |
| **No suppressions**  | No `@ts-ignore`, `eslint-disable` — fix root cause |

## Test Organization

Tests read top-down as documentation — from general to specific:

```typescript
describe('UserService', () => {
  // High-level: what this service does
  describe('createUser', () => {
    // Context: different scenarios
    describe('when email is invalid', () => {
      // Specific: individual cases
      it('rejects malformed email', () => { ... });
      it('rejects empty email', () => { ... });
    });
  });
});
```

**Structure principle**: New developer reads `describe` blocks top-down and understands the full contract.

---

# FIRST Properties

| Property            | Description                          |
| ------------------- | ------------------------------------ |
| **Fast**            | Milliseconds. Mock I/O, network, DB  |
| **Independent**     | No execution order dependency        |
| **Repeatable**      | Same input → same output, always     |
| **Self-validating** | Automated pass/fail, no manual check |
| **Timely**          | Written before code (TDD)            |

---

# Tools

| Tool                      | Purpose                            |
| ------------------------- | ---------------------------------- |
| **Vitest**                | Test runner, assertions, vi.fn()   |
| **pytest**                | Test runner, fixtures, parametrize |
| **vitest-mock-extended**  | Type-safe mocks (`mock<T>()`)      |
| **React Testing Library** | Component testing: render, screen  |
| **faker**                 | Realistic test data generation     |

**Typed mock example**:

```typescript
import type { UserService } from "./user.service";
import { mock } from "vitest-mock-extended";

const userService = mock<UserService>();
// All methods typed, autocomplete works, refactoring safe
```

---

# Review Checklist

Use for self-check before commit and during code review.

## Scope & Architecture

- [ ] **SUT scope defined** — clear what is inside/outside the unit
- [ ] **Consumer identified** — who uses this unit and why
- [ ] **No layer leaks** — unit doesn't reach across architecture boundaries
- [ ] **No real infrastructure** — DB, network, filesystem are mocked
- [ ] **Dependencies injectable** — all external deps passed via constructor/interface
- [ ] **Characterization tests first** — existing code covered before any modification

## API Quality

- [ ] **Convenient** — test setup is concise, not verbose
- [ ] **Complete** — all consumer needs covered via public API, no reaching into internals
- [ ] **Self-sufficient** — consumer doesn't need to know internals to use the unit
- [ ] **Optimal** — no unused parameters or redundant method calls in tests

## Test Quality

- [ ] **AAA pattern** — three blocks separated by blank lines
- [ ] **Domain language** — test names use consumer vocabulary, verb form (no "should")
- [ ] **Black box** — tests public interface only, no private method access
- [ ] **Single behavior** — one concept per test
- [ ] **Independent** — each test creates its own state, no shared mutable data
- [ ] **Deterministic** — no random values, no time dependency, no race conditions
- [ ] **Semantic data** — named constants (`ADMIN_USER`), not magic values (`user1`)
- [ ] **Fully typed** — no `any`, typed mocks, types imported not duplicated

## Coverage

- [ ] **Happy path** — main success scenario covered
- [ ] **Edge cases** — null, empty, boundary values
- [ ] **Error handling** — invalid input, exceptions, validation failures
- [ ] **No redundancy** — one test per equivalence class, no overlapping coverage
- [ ] **No vanity tests** — every test verifies behavior consumers depend on, not coverage numbers

## Design Feedback

- [ ] **Setup < 10 lines** — if more, unit may have too many responsibilities
- [ ] **Mocks at boundaries only** — domain logic is tested, not mocked
- [ ] **No implementation coupling** — test won't break if internals change
- [ ] **Expressible in domain language** — if not, API doesn't match consumer mental model

## Anti-Patterns (none present)

- [ ] No test comments (refactor name instead)
- [ ] No `if`/`for` in tests (pure AAA)
- [ ] No `sleep`/`waitForTimeout` (use proper waits or mocks)
- [ ] No multiple asserts testing different concepts
- [ ] No `eslint-disable` / `@ts-ignore` (fix root cause)
- [ ] No `any` types or type assertions (fix the types)
