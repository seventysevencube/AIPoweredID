# Remaining MVP build: status, October 19, 2026

After the demo, the user asked to "wrap the other pending things", building on one branch and merging when everything is ready. This record covers what was built, how it was verified, the database update it needed, and what remains. It merged through [PR #6](https://github.com/seventysevencube/AIPoweredID/pull/6) after the user applied migration 5. The [requirements](../requirements.md) stay authoritative. Deferred audit work, the formal fictional walkthrough and the second-user live test remain deferred, and the runtime AI provider is unchanged (OpenAI, GPT-6 Luna).

## Built

| Area | What designers get |
| --- | --- |
| AI failure recovery | Every AI step (brief, solution, Design skeleton, revisions, Development) shows plain failure reasons and **Try again**. An unchanged retry reuses completed steps; changed inputs start a fresh job. The earlier Design dead end is fixed. |
| Needs update and review status | Each workflow page shows Not started, Draft, Reviewed or Needs update (icon and word), on the page and in the side menu. Drafts record what they were built from; changed inputs flag dependent pages with reasons. **Mark as reviewed** records the exact content checked. Nothing is rewritten automatically. |
| Section revisions | **Ask AI to revise this section**, with an optional note, on every Design page (and a new brief from current Analysis). The result is a proposal: **Use this proposal** or **Keep my current draft**; history keeps the earlier version and solution choices are never replaced. |
| Sources | Word (.docx) and PowerPoint (.pptx) upload with conventional text extraction (headings, tables, slide text in order, speaker notes), pasted text, the agreed no-usable-text warning, no preview or summary, and project-wide source rules asked once. Only extracted text is stored. AI receives the rules and source text within a fixed allowance and cites sources. |
| Partial Development | **Generate Development sample** (full outline plus one written section) from a reviewed Design; accept the sample's treatment; **Generate full draft** one section at a time; add finished sections when you choose; **Request changes** as proposals; per-section review; Needs update when Design changes. Storyline, Rise and performance-aid structures. |
| Guest review | Fixed-copy links for chosen pages and sources; 14-day expiry; turn off any time; stop when access is removed; unverified display names; comments anchored to a page or a specific objective, assessment, screen, block or section; comments never change work. |
| Exports | Editable PowerPoint (one slide per page and per screen, block group or aid section, with continuation slides) and a print-ready PDF document. Both state versions, status, deliverable and date, list sources and open issues, and add reviewer comments only if chosen. **Ready for handoff** is designer-confirmed after automatic checks and lapses on any later change. |
| Preferences and breaks | Four project preferences shaping future drafts; an optional private reflection; break reminders off by default with a quiet pause; a **Next step** link on every project page. |
| Operator | `npm run project -- list <owner-email>` and `npm run project -- delete <project-id> <owner-email>` for verified owner-requested deletion (links stop first; records, versions, sources, comments and stored request copies are removed). |

## Implementation choices to confirm

These were needed to build and are recorded in the [decision log](../decision-log.md#october-19-2026--remaining-mvp-build). Each can be changed.

- **Source limits:** 10 MB per file, 20 sources per project, the first 100,000 characters of each file.
- **Web research is not connected.** The source rules can record it, but AI uses only added sources. Connecting web search would change AI behavior and cost, so it needs a separate decision.
- **PDF export uses the browser's Save as PDF** from a print-ready page. This keeps every character and produces a tagged (more accessible) PDF; the PowerPoint is a direct download.
- **Request size cap raised from 90 KB to 200 KB** so Design and Development context fit. That stays below the provider's long-context rate and inside the existing $0.05 per-call permit; the $0.15 per-job reservation and $20 cap are unchanged.
- **Break reminders and preferences are per project.**

## Verification

- 64 unit, integration and database tests pass, including: migration 5 applied on top of migrations 1–4 preserving an existing project, its drafts, acceptance and history; owner-only access and browser-role lockout for every new table and function; guest token hashing, expiry, revocation and access-removal shutdown; target checks for comments; operator deletion; extraction from Word/PowerPoint files (also checked against files written by python-docx/python-pptx and LibreOffice); Development gates; export and PowerPoint structure.
- Nine browser workflows pass, using a fictional AI stand-in (no network or charge) for AI steps: failure and retry at every stage, Needs update, revisions, Sources, Development through full draft and exports, guest review, preferences and breaks, plus the original saving, recovery and keyboard workflows. Automated accessibility scans (WCAG 2.2 AA rules) pass on each new page and dialog. A real accessibility issue found on the way (version-history touch targets) was fixed.
- The same nine workflows pass against the production build served with the live site's Content-Security-Policy.
- No paid AI calls, live database changes or deployments were made while building.

## Migration 5: applied

The new code needs `supabase/migrations/202610190005_mvp_completion.sql`. The user applied it once in the Supabase SQL Editor before the merge (confirmed October 20, 2026). Migrations 1–5 are now applied; do not re-run any of them. The migration only adds tables and functions and replaces `workflow_rpc` with the same behavior plus the new records; it fails rather than changing data if applied twice.

## Remaining and limits

- Live verification after deploy: a real Development run, a guest link opened from another device, and a PowerPoint opened in PowerPoint, plus human accessibility acceptance.
- Prompt quality for Development, revisions and preferences is untested with real AI output; the first real runs should be reviewed before relying on them.
- Queue administration, scheduled wake-up and cost reconciliation tooling remain deferred, as before. The paused local operator ledger is untouched.
- Exact export page and slide templates and accessible-output checks remain open. Guest comment threads, replies and resolution remain unspecified, as before.
- Remaining B4 policy work keeps its pre-production timing.

## Follow-up: October 20, 2026

Technical work before the live check, on the user's request:

- **Budget month:** `npm run ai -- open-month YYYY-MM` opens the next $20 month explicitly (the current month ends November 1). The app now shows the agreed warning once $16 is used, a notice while AI is paused for a charge check, and a plain notice when no month is open.
- **Operator tools:** `npm run ai -- status` and `npm run ai -- reconcile …` for the AI queue and paused charges; `npm run pilot -- list` for approved accounts, including demo sign-ups. Migration 6 adds the two read-only views these use; the app does not depend on it.
- **Worker:** drains the whole queue in one run, starting no new job after eight minutes, so Development full drafts with more than five sections finish without the page open.
- **Project home:** each card shows the actual stage, how many pages need an update and the next step; Continue returns to the last page opened on that device.
- **Tidy-ups:** one shared AI request helper; heavier pages load on demand (starting bundle 441 KB → 395 KB).
- Verification: 68 unit, integration and database tests (including migration 6 on top of 1–5, and a reconciled paused job) and 10 browser workflows pass, in development and on the production build under the live Content-Security-Policy.
