---
name: gh-cli
description: GitHub CLI operations. Use whenever the user mentions GitHub, PRs, issues, workflow runs, CI, Actions, code review, or repository operations. Always prefer `gh` over web tools or browser automation.
---

# GitHub CLI Skill

## Vision

Enable agents to interact with GitHub programmatically through the `gh` CLI, producing deterministic, machine-readable output. Replace slow and fragile web scraping with fast, structured API calls. Every GitHub operation that can be done via CLI should be done via CLI.

## Activation Protocol

Activate this skill immediately when the user requests any of the following:
- Checking PR status, reviews, or mergeability
- Listing or viewing GitHub issues
- Monitoring workflow runs or CI checks
- Reading repository information
- Accessing GitHub API data
- Any operation where the user mentions "GitHub", "PR", "issue", "workflow", "Actions", "checks", "CI"

Do NOT use browser automation, `webfetch`, or web search for GitHub operations when `gh` CLI is available. The CLI is faster, more reliable, and returns structured data.

## Workflow

### Step 1: Identify the operation

Determine what GitHub data the user needs:
- PR details, status, or list
- Issue details or list
- Workflow run status or logs
- Repository metadata
- Custom API data

### Step 2: Select the appropriate command

Consult `@references/gh-cli-reference.md` for exact command syntax and available JSON fields.

### Step 3: Use `--json` for machine-readable output

Always specify `--json <fields>` to get structured data. Use `--jq '<filter>'` for server-side filtering.

Example:
```bash
gh pr view 123 --json number,title,state,mergeable,reviewDecision
gh issue list --json number,title,labels --jq 'map(select(.labels | length > 0))'
```

### Step 4: Handle errors gracefully

Suppress errors in shell pipelines:
```bash
gh pr checks $PR --json name,state,conclusion 2>/dev/null || echo "checks unavailable"
```

### Step 5: Validate read-only scope

Before executing, confirm the operation is READ. If the user requests a write operation (create PR, merge, close issue, trigger workflow), ask for explicit permission first.

## Quality Gates

- Every command uses `--json` output unless the user explicitly requests human-readable format
- `--jq` filtering is applied when only a subset of data is needed
- Error handling includes `2>/dev/null || fallback` for non-critical lookups
- Write operations are blocked until explicit user confirmation
- No shell escapes (`$(...)`, `eval`, backticks) are used in command construction

## Anti-Patterns

- **Using web tools for GitHub**: Fetching `github.com` pages via browser or `webfetch` when `gh` CLI can return the same data as structured JSON. The CLI is faster, avoids DOM parsing, and respects authentication.
- **Omitting `--json`**: Running `gh pr view 123` without `--json` produces human-readable text that is hard to parse reliably. Always request machine-readable output.
- **Over-fetching fields**: Requesting all JSON fields when only a few are needed. This wastes tokens and obscures the relevant data. Request only the fields you need.
- **Missing error handling**: Running `gh` commands without fallback for cases where the PR does not exist or the repository is not configured. Always handle errors gracefully.
- **Silent write operations**: Executing `gh pr create`, `gh issue close`, or `gh workflow run` without explicit user approval. These are write operations and must be gated.
