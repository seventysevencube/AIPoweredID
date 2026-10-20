# AIPoweredID — coding assistant handoff

Updated October 20, 2026 (America/Chicago). Read this before continuing work.

## Current state

**October 19, 2026, later:** the remaining MVP items were built and merged through [PR #6](https://github.com/seventysevencube/AIPoweredID/pull/6) (main `9d00603`); see the [MVP completion status](docs/implementation/mvp-completion-2026-10-19.md). The user applied migration 5 to the live Supabase project before the merge (confirmed October 20, 2026); migrations 1–5 are now applied, and none should be re-run. Live checks of the new features are still pending. The notes below describe the earlier demo release and remain accurate for it.

**October 20, 2026:** operator tools and reliability fixes followed (see the [status record](docs/implementation/mvp-completion-2026-10-19.md#follow-up-october-20-2026)). Migration 6 (`202610200006_operator_tools.sql`) adds read-only operator views used by `npm run pilot -- list` and `npm run ai -- status`; the app itself does not depend on it. The user applied it once in the SQL Editor on October 20, 2026 (after PR #8 merged, main `ff3026b`); migrations 1–6 are now applied, and none should be re-run. **The production budget month ends November 1, 2026 UTC; open November with `npm run ai -- open-month 2026-11` (an explicit operator step).**

The demo implementation is merged to `main` through [PR #4](https://github.com/seventysevencube/AIPoweredID/pull/4), application release commit `55447cbc7cbf2fd01d2283ab4e14d9ecfc56d598`.

- Live app: https://aipoweredid-demo.netlify.app/
- Repository: https://github.com/seventysevencube/AIPoweredID
- Netlify production tracks `main`; do not switch its branch for routine development.
- The user requested saving all changes so another AI coding assistant can continue. This handoff does not select a replacement runtime AI provider or authorize paid service upgrades.
- Existing code is a demo vertical slice, not a completed MVP. Start with the [implementation status](docs/implementation/demo-ai-status-2026-10-19.md) and [verified release evidence](docs/implementation/demo-release-proof-2026-10-19.md).

## Product authority and user preferences

1. [Requirements](docs/requirements.md) are the primary current product rules; [decision log](docs/decision-log.md) records approved refinements. Explicit later user decisions take precedence.
2. Planning PR #1 was audit context, not blanket approval. PR #2 established the approved baseline. Other audit findings, the formal fictional complaint-routing walkthrough, and the second-user live test remain deferred.
3. Desktop-only invitation pilot, five designers, expected zero to one project monthly. Keep hosting costs minimal and the shared monthly AI cap at $20, with a $16 warning.
4. Analysis → Design → partial Development. Use independently written performance and evaluation questions; do not reintroduce branded Six Boxes/Kirkpatrick implementations from older prototypes. Bloom objectives are explicitly approved.
5. Continue/navigation is allowed with incomplete answers. AI submission requires actual provided answers for task, desired performance, current performance, and audience roles. Unknown is not a bypass.
6. Recommended interventions belong in Design. Decide whether learning is appropriate before instructional design. Learning routes require canonical, designer-confirmed learning measures. Nonlearning routes require rationale and skip irrelevant objectives/assessments.
7. Objectives include smaller enabling objectives. Assessments precede content mapping. Support Storyline, Rise, or both. Sources are chosen project-wide, not repeatedly per objective.
8. Saving, reviewing, and accepting are separate. Preserve downstream work when earlier inputs change; flag affected work rather than silently replacing it. Autosave and recovery are essential. Ordinary history shows ten versions; referenced versions may be retained longer.
9. Later MVP scope includes basic text/DOCX/PPTX extraction (no PDF/OCR, AI extraction summaries or text previews), guest comments anchored to specific records, written storyboards/performance aids and PDF/PPTX exports. Generated images, narration and video remain out of scope.
10. The user favors action, concise nontechnical updates, and avoiding repeated approval requests. Existing authorizations persist. Keep credentials out of chat and Git.

## Implemented flow and important limits

Existing seven Analysis input pages → real AI six-part editable brief → human review/acceptance of an exact saved version → separate performance-solution proposal and human choices → canonical learning-measure confirmation where applicable → one AI Design skeleton spanning objectives, assessments, content mapping, sequence, and plan.

All new pages reuse the autosave/recovery controller. AI generation/review/one optional repair use the shared durable queue and protected ledger. Applying a result populates empty drafts only. Existing edited drafts are preserved; retained AI results can be inspected separately.

Per-section generation/regeneration, complete acceptance/impact marking, source extraction/research, deeper reference/alignment validation, Development, guest review, exports and remaining preferences are unfinished. Review failed Design-job retry/recovery UX before expanding generation. Do not describe the initial all-at-once skeleton as the full approved per-section workflow.

A separate local operator smoke-test ledger at `.local-data/ai-connection-check` remains paused after an uncertain 45-second timeout. Do not reset it or claim the cost was reconciled. The production flow subsequently passed using the longer processing window. Current calls allow 120 seconds under a 180-second lease; unknown costs retain reservations and pause paid work. Broad queue administration/reconciliation and reliable scheduled wake-up remain deferred.

## Architecture and key files

Added with the MVP completion work: shared page frame and autosave hook `src/ProjectShell.tsx`; Needs update rules `src/dependencies.ts`; AI request helper `src/ai-requests.ts`; Sources `src/Sources.tsx` and extraction `src/extract.ts`; Development `src/Development.tsx` and rules `src/development-model.ts`; guest review `src/Sharing.tsx` (owner) and `src/Review.tsx` (guest); exports `src/Exports.tsx`, `src/export-model.ts`, `src/pptx.ts`, `src/PrintView.tsx`; preferences and breaks `src/Preferences.tsx`, `src/Breaks.tsx`, `src/preferences-model.ts`; migration `supabase/migrations/202610190005_mvp_completion.sql`; operator script `scripts/project.ts`; local fictional AI stand-in for browser tests `scripts/local-fixture-ai.ts`. File names must stay unique ignoring letter case (a test enforces it).

- React + TypeScript + Vite UI: `src/main.tsx`, `src/Workflow.tsx`, templates/contracts in `src/workflow-model.ts`.
- Autosave/recovery: `src/save.ts`, `src/recovery.ts`; preserve conflict and device-recovery behavior.
- Authenticated backend: `server/api.ts`, `server/providers.ts`, `netlify/functions/api.mts`.
- Identity: one-time email code through Resend, native Supabase identity verification and private app admissions. No browser access to private application tables.
- Server-selected AI transport/prompts/cost bounds: `server/ai/openai.ts`. Currently OpenAI Responses, GPT-6 Luna, low reasoning, strict structured output, `store:false`, no external tools, no automatic model escalation or transport retry.
- Queue runner: `server/ai/queue.ts`; private deployed worker: `netlify/functions/ai-worker-background.mts`. Despite its historical simulation-oriented runner/interface names, the shared runner also executes the real adapter.
- Handoff/gate/output mapping: `server/ai/workflow.ts`.
- Database: `supabase/migrations/202610180001_workspace.sql`, `202610180002_version_retention.sql`, `202610190003_ai_queue.sql`, `202610190004_workflow.sql`.

If changing the app's AI provider, inspect all of the transport, policy schema, SQL provider constraints, worker wiring, input/output contracts and tests. Provider/model prices and limits must be verified before paid execution; preserve one shared logical job, bounded reservations and conservative cost accounting. Another coding assistant can work on this repository without changing the app's runtime provider.

## Existing service setup

- Supabase project: https://supabase.com/dashboard/project/eefozbgaobaymadewdhu
- Netlify dashboard: https://app.netlify.com/projects/aipoweredid-demo/overview
- Resend sending domain: `auth.77cube.dev`; sender `AIPoweredID <signin@auth.77cube.dev>`. Domain verification completed. Porkbun DNS was configured by the user; preserve existing Zoho email DNS.
- First approved live pilot email: `seventysevencube@gmail.com`. No additional pilot account or test email is authorized by this handoff alone.
- Open demo sign-up (user request, October 19, 2026): setting the Netlify environment variable `OPEN_SIGNUP=on` lets any email self-register with a one-time code. It is off unless that exact value is set. Do not mark it as a secret value, or Netlify's secret scan will flag the word "on". Registrations add emails to the approved list, and they stay after the setting is turned off. See [requirements](docs/requirements.md#open-demo-sign-up--october-19-2026).
- Migrations 1–4 were applied through Supabase SQL Editor, migration 5 was applied the same way by the user before PR #6 merged, and migration 6 after PR #8 merged. Do not reapply them or assume a Supabase CLI migration-history ledger exists. Any further schema change needs a deliberate incremental migration and appropriate approval.
- Production AI budget period was explicitly opened for October 1–November 1, 2026 UTC. It does not automatically reset. Do not silently open a new period or release uncertain reservations.

Private local `.env.local` is ignored and mode 600. Expected names: APP_ORIGIN, SUPABASE_URL, SUPABASE_SECRET_KEY, AUTH_CODE_SECRET, RESEND_API_KEY, EMAIL_FROM, OPENAI_API_KEY. Values are not in the repository. Existing Netlify secrets are Production-only. Never expose a server credential through VITE variables, logs, chat, test output, or commits. Do not copy the credential file through the system clipboard; an earlier automatic approval review rejected that unnecessary exposure. The user entered hosted secrets privately.

Netlify scanning remains enabled. Existing `SECRETS_SCAN_OMIT_KEYS=APP_ORIGIN,EMAIL_FROM` handles two intentionally public values incorrectly marked secret by the importer; do not extend this to actual keys or disable scanning.

## Running and verification

Use Node 22 for hosted/CI parity; supported engines are >=22 and <27.

```sh
npm ci
npm run dev:local
npm run check
npm run test:browser
npm run format:check
```

`dev:local` starts UI 127.0.0.1:5173 and a fictional-account backend with persistent local data. Local login uses designer@example.test or peer@example.test and the on-page local-code control. If a private OPENAI_API_KEY is present, explicit local generation actions make real paid calls through the local ledger. Automated browser tests use an isolated database and skip the private settings file; never turn them into paid tests.

`npm run check` runs unit/integration checks, TypeScript/client build and deployed API/worker bundle verification. Four browser workflows verify Analysis saving/recovery/conflicts, desktop/keyboard behavior, and Design acceptance/learning gate/autosave. Last release passed 43 unit/integration checks and all four browser workflows locally and in GitHub Actions on Node 22. Repeat checks only as warranted by subsequent changes.

`npm run setup:check -- .env.local` validates configuration without printing values. `npm run setup:database -- .env.local` is a read-only connectivity/admission check. `npm run ai:simulate` uses fictional accounting without an AI account. `scripts/verify-live-ai.ts` is an operator-only paid smoke test with synthetic data and a persistent ledger; it is not part of automated checks. Do not rerun it casually or clear its paused ledger.

The signed-in live synthetic project **Demo readiness check (fictional)** (`2d471413-65d7-446b-ae9f-5789b809a58a`) contains saved AI outputs for the demo. The earlier **Technical connection check (fictional)** project is separate. Treat both as test records, not approved examples or real organizational evidence.

## Suggested continuation

As of October 20, 2026, all work is merged to main (latest: PRs #8–#10) with CI green; nothing is pending on a branch or pull request. Migrations 1–6 are applied. The technical backlog that needs no user input is done.

Next, in order:

1. **Live check (user, then assistant).** On the live site, using the fictional **Demo readiness check** project: mark each Design page reviewed, generate the Development sample and full draft, try **Ask AI to revise this section** once, export the PowerPoint and open it in PowerPoint, and open a guest review link in a private window and comment. Real AI output for Development, revisions and preferences has never been reviewed; tune the instructions in `server/ai/openai.ts` from the user's screenshots, through a pull request.
2. **Turn off open demo sign-up** when the demo ends (user: remove `OPEN_SIGNUP` in Netlify and redeploy). `npm run pilot -- list` shows who registered.
3. **Open the November AI budget month** on or after November 1, 2026 UTC: `npm run ai -- open-month 2026-11` (needs the private `.env.local`; never open a month silently).
4. Then pre-production work: the implementation choices awaiting confirmation and remaining limits in the [status record](docs/implementation/mvp-completion-2026-10-19.md), and B4 policy work at its pre-production timing.

Deferred audit work, the formal fictional walkthrough and the second-user live test stay deferred unless the user requests them. The full milestone plan is in `docs/implementation/phased-build-plan.md`; historical planning-only statements are superseded by later implementation authorization and the status records above. Keep incomplete production/security/human-accessibility checks visible without making deferred audit work a new MVP blocker.
