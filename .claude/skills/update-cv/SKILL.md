---
name: update-cv
description: Update Artur's CV data in shared/data after a promotion, a job change, a new project, or a tech stack change. Takes pasted LinkedIn text, a CV bullet list, or a plain description of what changed, writes it into the right files in the house style, and verifies the build. Use whenever asked to update the CV, the portfolio data, the experience table, the tech stack, or the assistant's knowledge about Artur.
---

# Updating the CV data

`shared/data/` is the single source of truth. The client renders it and
`server/src/services/prompt.service.ts` builds the assistant's system prompt from
the same files, so one edit changes both the desktop windows and what the chat
says. There is no database involved and no admin UI: this is a code change that
ships on the next deploy.

## Files, and what each one feeds

| File | Holds | Shows up in |
|---|---|---|
| `profile.ts` | name, `role`, location, short and extended bio | header, About window, first line of the system prompt |
| `experience.ts` | the position list | Experience window, `[PROFESSIONAL JOURNEY (EXPERIENCE)]` block of the prompt |
| `education.ts` | degree, courses | Education window, prompt |
| `techStack.ts` | categorised tag lists | Tech Stack window, prompt |
| `projects.ts` | portfolio projects | Projects window, prompt |
| `contacts.ts` | email, GitHub, LinkedIn | Contact window, prompt |

## A role change lands in two places

A promotion is never one edit. Check both:

1. `experience.ts`, the `title` of the current position, and its `period`.
2. `profile.ts`, the `role` field, which is the headline and the opening sentence
   of the system prompt.

If the new role is at the same company, ask whether it should be one entry with an
updated title or two entries showing the progression. Graintrack is the existing
example of a closed period, UITOP of an open one. Do not decide this alone.

Ending a position means closing its `period` (`Aug 2025 - Jul 2026`) and adding the
new one at the top with `- Present`. `id` values run top to bottom starting at 1,
so renumber the whole array rather than leaving a gap.

## How the descriptions are written

Match what is already there, do not invent a new register.

- Achievement density. Every sentence carries a system, a technology and where
  possible a number: `4,000+ concurrent dynamic data points at sub-16ms render
  times`, `reducing query overhead 35%`, `500+ E2E (Playwright) and unit (Vitest)
  tests, reducing flakiness 90%`.
- Past tense, active verbs, first word is a verb: Engineered, Built, Led, Developed.
- One paragraph per position, no bullet lists, no line breaks inside `description`.
- No marketing adjectives. No `robust`, `seamless`, `cutting-edge`, `passionate`.
- `tags` are technologies and disciplines, not achievements, and stay short enough
  to render as chips.

LinkedIn text pasted in is raw material, not the final text. LinkedIn descriptions
are usually shorter, weaker and have no metrics. Rewrite them into the house style
and keep any number the existing entry already had unless the user says it changed.

## Never overwrite what LinkedIn does not know

`tags` do not exist on LinkedIn. Metrics usually do not either. When updating an
existing position, change only what the user actually told you changed and leave
the rest of the paragraph alone. Losing a metric is a real regression in a CV.

## Steps

1. Read the current values of every field you are about to touch. Quote them back
   to the user before editing if anything is ambiguous.
2. Make the edit in `shared/data/`. Nothing else needs to change: no component, no
   prompt template, no migration.
3. Verify:
   ```
   cd client && npx tsc --noEmit
   cd ../server && npx vitest run && npx tsc --noEmit -p tsconfig.test.json
   ```
   `prompt.service.ts` interpolates these fields directly, so a shape change breaks
   the server build, which is why the server checks matter for a data-only edit.
4. Show the diff and say plainly what the assistant will now claim about Artur.

## After the edit

The system prompt is memoised in `prompt.service.ts` (`cachedPrompt ??= ...`) and
the data is compiled in, so the running instance keeps the old answers until it is
redeployed. Say so rather than letting the user check the live chat and conclude
that nothing happened.
