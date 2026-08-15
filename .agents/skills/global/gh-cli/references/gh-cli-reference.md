# GitHub CLI Command Reference

Quick reference for `gh` commands. Read this when you need the exact syntax for a specific operation.

## Core Principle

Always use `--json <fields>` for machine-readable output. Built-in `--jq` filtering (no external jq needed).

## Pull Request Operations

### PR Status

```bash
gh pr checks $PR_NUMBER --json name,state,conclusion,detailsUrl

# Filter failed checks
gh pr checks $PR_NUMBER --json name,state,conclusion --jq '.[] | select(.conclusion == "FAILURE")'
```

### PR Details

```bash
gh pr view $PR_NUMBER --json number,title,state,mergeable,statusCheckRollup

gh pr view $PR_NUMBER --json number,title,body,state,author,labels,assignees,reviewDecision,mergeable,statusCheckRollup
```

**Key Fields**:

| Field               | Values                                             |
| ------------------- | -------------------------------------------------- |
| `mergeable`         | `MERGEABLE`, `CONFLICTING`, `UNKNOWN`              |
| `reviewDecision`    | `APPROVED`, `CHANGES_REQUESTED`, `REVIEW_REQUIRED` |
| `statusCheckRollup` | Array of check statuses                            |

### List PRs

```bash
gh pr list --json number,title,author,labels

gh pr list --author @me --json number,title,state

gh pr list --search "review-requested:@me" --json number,title
```

## Workflow Run Operations

### Run Status

```bash
gh run view $RUN_ID --json conclusion,status,jobs,createdAt,updatedAt

gh run list --json databaseId,status,conclusion,name,createdAt -L 10
```

**Status**: `queued`, `in_progress`, `completed`
**Conclusion**: `success`, `failure`, `cancelled`, `skipped`, `neutral`

### Run Logs

```bash
gh run view $RUN_ID --log-failed  # Only failed steps

gh run view $RUN_ID --log         # Full logs (verbose)
```

### Watch Run

```bash
gh run watch $RUN_ID --compact --exit-status
```

> Blocking operation — waits until completion.

## Issue Operations

### Issue Details

```bash
gh issue view $ISSUE_NUMBER --json number,title,body,state,labels,assignees,comments

gh issue view $ISSUE_NUMBER --json number,title,state,labels
```

### List Issues

```bash
gh issue list --json number,title,labels,assignees

gh issue list --label "bug" --json number,title

gh issue list --assignee @me --json number,title,state
```

## Repository Operations

```bash
gh repo view --json nameWithOwner,defaultBranchRef,description

gh repo view --json nameWithOwner --jq '.nameWithOwner'
```

## URL Resolution

| URL Pattern | Command                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| PR          | `gh pr view {n} --repo {owner}/{repo} --json number,title,body,state`    |
| Issue       | `gh issue view {n} --repo {owner}/{repo} --json number,title,body,state` |
| Commit      | `gh api repos/{owner}/{repo}/commits/{sha}`                              |
| File        | `gh api repos/{owner}/{repo}/contents/{path}?ref={ref}`                  |

## API Read Access

```bash
# Read-only endpoints
gh api repos/{owner}/{repo}/actions/runs --jq '.workflow_runs[:5]'

gh api repos/{owner}/{repo}/issues --paginate --jq '.[].number'
```

> Boundary: `gh api` can access ANY endpoint. Validate operations are read-only.

## Error Handling

Suppress errors in context expressions:

```bash
gh pr checks $PR --json name,state,conclusion 2>/dev/null || echo "checks unavailable"
```

## Field Reference

### PR Fields

`number`, `title`, `body`, `state`, `author`, `labels`, `assignees`, `reviewDecision`, `mergeable`, `statusCheckRollup`, `headRefName`, `baseRefName`, `isDraft`, `url`, `createdAt`, `updatedAt`

### Issue Fields

`number`, `title`, `body`, `state`, `author`, `labels`, `assignees`, `comments`, `milestone`, `url`, `createdAt`, `updatedAt`, `closedAt`

### Run Fields

`databaseId`, `name`, `status`, `conclusion`, `jobs`, `createdAt`, `updatedAt`, `url`, `headBranch`, `headSha`, `event`

### Job Fields

`name`, `status`, `conclusion`, `startedAt`, `completedAt`, `steps`

---

## Permission Requirements

| Operation               | Permission Level | Required Grant |
| ----------------------- | ---------------- | -------------- |
| `gh pr view/list`       | READ             | `allow`        |
| `gh issue view/list`    | READ             | `allow`        |
| `gh run view/list`      | READ             | `allow`        |
| `gh repo view`          | READ             | `allow`        |
| `gh api` (GET)          | READ             | `allow`        |
| `gh workflow run`       | WRITE            | `ask`          |
| `gh pr create/merge`    | WRITE            | `ask`          |
| `gh issue create/close` | WRITE            | `ask`          |
| `gh api` (POST/DELETE)  | WRITE            | `ask`          |

---

## Excluded Dangerous Patterns

These patterns are NOT included to prevent accidental misuse:

- `gh repo delete` — irreversible data loss
- `gh pr merge --admin` — bypasses protections
- `gh issue close --yes` — auto-confirm destructive
- `gh workflow run` with arbitrary inputs — injection risk
- Shell escapes: `$(...)`, `eval`, backticks
