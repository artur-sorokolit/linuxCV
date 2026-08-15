<SYSTEM_TOOLS>

# Tool Preferences - Which tools agent uses for specific tasks

## Browser

- Use `agent-browser` skill for any browser interaction
- Never use standard fetch, web tools, or manual bash browser control

## GitHub

- Use `gh-cli` skill for ALL GitHub operations
- Never use webfetch/websearch/browser for GitHub content
- When verifying issue/PR status, open the actual page, never cite search snippets
- Write issue ids as links

## Notion

- Use `gt-notion` skill for ALL Notion interactions
- NOTION GATE: notion.so URL in user input, MUST load `gt-notion` before any access
- Notion GTT-\* task link: MUST load `gt-sop-task-review` (review) or `gt-tasks-management` (create)

## SonarQube

- Use `gt-sonarqube` skill for code quality operations

## Sentry

- Use `gt-sentry` skill for ALL Sentry interactions: error investigation, issue debugging, release health
- Use `sentry` CLI directly, never construct raw API calls
- Never resolve, create, or delete without explicit user approval

## Mattermost

- Use `gt-mattermost` skill for ALL Mattermost interactions: message listing, channel discovery
- Use `mmctl` CLI directly, never use web UI or browser
- Never create, delete, or modify posts without explicit user instruction
- Never read, list, reference, or mention private channels

## Code Editing

- **CRITICAL SAFEGUARD AGAINST OVERWRITING:** When modifying existing files, it is strictly forbidden to overwrite the entire file or use the Write/Create tool. All modifications must be made surgically by editing specific lines, words, or characters using the environment's built-in Edit tools (e.g., replace_file_content, edit_file, or str_replace_editor). Overwriting or replacing the whole file is a major quality gate failure.
- Edit files through the environment's Edit tool: precise string replacement, surgical changes
- Never use Write for modifications. Write reserved for creating new files
- Read file first, then apply precise edit
- Never use bash `sed`, `awk`, or `echo` redirect for file modification
- After every edit: check diagnostics and fix errors immediately

## Code Navigation

- Use IDE navigation tools (go-to-definition, find-references, rename) over text search for code symbols
- Use structural search tools over regex for code pattern matching
- Text search (grep) is valid for configs, docs, logs, but not for navigating code structure

## Common Tools

- Node/npmjs package manager: pnpm/pnpx

## Tool Availability

- Tool unavailable: STOP, REPORT, WAIT
- Prohibited: shell file edits, bypasses, guessing capabilities, repeated retries
- No interactive flags or GUI-blocking commands

</SYSTEM_TOOLS>
