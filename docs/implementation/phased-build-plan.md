> Planning record prepared October 18, 2026. The user subsequently authorized Milestone 1 implementation and merging ready planning changes. Earlier planning-only/local-publication statements below describe the record when drafted; use the current requirements and decision log for present authority. No service verification is implied.

# Phased MVP build plan — draft for review

Prepared October 18, 2026. This is a planning artifact, not authorization to start building, deploy, configure accounts, make paid AI calls, change DNS, or merge a PR. This delivery order is proposed; existing product requirements remain approved. This local document has not been pushed to GitHub.

## Planning baseline

Use PR #2, including documentation commit `a41764d6adc8fb61e1d8078c6b2525cd6090a644`, for the current repository baseline, plus later decisions in this chat. PR #1 remains audit context; its remaining recommendations and the fictional walkthrough stay deferred. Requirements remain the main product contract; the latest explicit user decision takes precedence.

Current service direction: Netlify's existing credit-based Free account, Supabase Free for accounts/records/private files, and Resend Free for email codes using an existing domain. Target minimal recurring non-AI costs; $0/month in subscriptions is a target within allowances, not an approved numeric cap or guarantee. The user accepts manually resuming an inactive free service before scheduled demos. Do not rely on the temporary Vercel Pro trial. The service/runtime fit still needs verification.

AI direction: OpenAI first; test Luna first during each phase's integration and retain Sol only where measured quality/cost benefit justifies it. Jev remains outside initial scope. Preserve stage-specific prompts and quality review, the one-job shared queue, reservations protecting the shared $20/month cap, $16 warning, uncertain-charge pause/operator check, explicit failure retries, and completed-result recovery. Models, prompt versions, and settings must be recorded per job.

## 1. Private workspace and reliable saving

First reviewable milestone: an approved designer can sign in, create a project, enter/edit Analysis responses, leave, and return to the saved work.

Scope:

- Designer sign-in using approved emails and one-time email codes; implement the exact existing code/access-removal requirements rather than assuming provider defaults match them.
- Project cards, create/open/resume, owner-only projects, and multiple saved projects per designer.
- Stable project/record identifiers, working drafts, saved versions, review of a specific version, and explicit selection of the version used for a stage handoff.
- Autosave timing/status, device recovery, navigation flush, reauthentication preservation, and conflict handling under approved requirements. Keep designer content out of privileged credentials or logs.
- A basic editable Analysis form to exercise real persistence before AI is connected. All later form content follows the approved questions, not illustrative prototype values.

Completion evidence:

- Work survives refresh, navigation, and reauthentication; reconnect/conflict cases preserve recoverable edits and show truthful save status.
- Another designer cannot access the owner's project. Access removal ends existing access under the approved rule.
- Saving does not mark reviewed, accept a stage, call AI, or publish/share content.
- Keyboard, focus, screen-reader labels/status, and zoom/reflow are checked from the start. This milestone alone does not establish full WCAG conformance.

## 2. Analysis and the first AI connection

Current preparation: [Analysis brief prompt, output structure, and small review cases](milestone-2-analysis-ai.md). This working draft does not adopt new model, spending, or runtime decisions.

Scope:

- Complete the approved Analysis form and original Evaluation planning questions/layout; preserve permitted unknowns.
- Direct text and DOCX/PPTX basic extraction, including available speaker notes. Use deterministic no-usable-text warning/exclusion, without AI import, summary, text preview, or import-review gate. Observe the permitted-material boundary.
- Establish the durable job records, internal dispatch, global claim/fencing, maximum cost reservation, paid-call state, completion storage, accounting, and explicit retry behavior before allowing paid AI generation. Netlify Background Functions remain the candidate runner; handle their duplicate invocation/retry behavior explicitly.
- Connect only Analysis synthesis initially: approved input, task-specific prompt, structured draft, checks, bounded quality review/repair, editable Analysis brief. Intervention recommendations remain in Design.
- Designer reviews a specific saved brief and explicitly selects it to seed the next stage. Inputs and source references remain traceable.

Completion evidence:

- The chosen model creates a useful editable brief without manufacturing missing evidence, facts, or measures.
- Duplicate clicks, runtime termination, lost responses, and uncertain charges do not silently repeat paid work; budget/reservation and one-job rules hold across designers.
- Leaving the screen does not make the browser the only holder of a job or completed result. Queued/dispatch failures have a defined recovery path.
- Measure actual quality, correction effort, duration, and total cost. Structured formatting alone is insufficient. Revisit prompt examples during integration; do not resume the deferred fictional walkthrough by implication.

## 3. Design workflow

Scope:

- Seed an editable Design skeleton from the selected Analysis version, carrying sources, accepted decisions, constraints, record references, and permitted gaps.
- Original two-step performance-analysis review, evidence/hypothesis distinction, and explicit learning/nonlearning/both/investigation decision.
- Conditional learning-measure confirmation: require defined and designer-confirmed measures before instructional Design on a learning route. Nonlearning records a not-applicable rationale; investigation holds instructional drafting.
- Confirm e-learning/performance-aid/both before deriving outputs; apply format and Storyline/Rise/both choices only to relevant e-learning work.
- Main/enabling objectives with reviewed Bloom alignment → defined assessments → content and instructional support → sequencing → detailed Design plan. Keep source settings project-wide, and preserve assessment and source links.
- Add AI tasks in that same controlled sequence, testing prompts/model suitability per task. Later changes preserve draft work and flag affected sections rather than rewriting them automatically.

Completion evidence: review learning and nonlearning paths; verify the gate and integrated objective/assessment coverage; demonstrate source gaps/conflicts and downstream Needs update reasons while preserving unaffected review status. No sample project or instructional answer becomes approved merely because the screens work.

## 4. Partial Development

Scope:

- Generate Development sample from the selected Design version: full skeleton plus representative populated section under the approved sample scope.
- Preserve sample edits and separate treatment acceptance from factual/source verification.
- Explicitly generate remaining complete written draft: Storyline scenes/screens, Rise lessons/blocks, and/or performance-support sections as applicable. Retain linked Design-owned assessments, scripts, build/accessibility notes, and visible missing-content dependencies.
- Review/revise sections and apply the approved Ready for handoff rules. No generated media or native authoring project files.

Completion evidence: preserve accepted sample changes, show appropriate Storyline and Rise structures, produce complete written aid content, and flag unresolved essentials without fabricating them. Validate longer tasks and full output against runtime limits; partial content must not be presented as a completed draft.

## 5. Guest review, exports, and demo completion

Scope:

- Account-free fixed-version guest links, required unverified display name, anchored comments, selected source exposure, 14-day expiry, and owner revocation. No direct guest editing or formal reviewer approval gate.
- PDF and editable PPTX from saved structured content without AI rewriting, continuation pages/slides as needed, draft/readiness labels, source/open-issue information, and comments optional/off by default in a separate appendix. Review exact export layouts as this milestone is specified.
- Complete project preferences, optional reflection, quiet pause/resume, and reminders off by default under the existing baseline; do not leave these approved behaviors out of the MVP.
- Operator support for approved access removal and verified owner-requested project deletion, including link shutdown and existing active-app deletion deadline. Final policy/retention detail retains its approved timing.
- A concise pre-demo operating check for service availability/resumption, sign-in delivery, saving, shared-link access, and remaining infrastructure/AI allowances. No automation/reminder is created by this checklist proposal.

Completion evidence: verify guest access boundaries and version anchors, revocation/expiry, readable usable exports, complete stage handoffs, recovery/failure paths, cost handling, and accessible desktop operation. Rendering wireframes or passing schema checks alone does not establish completion. Remaining B4 audit detail remains required before production, not a new blocker for the MVP or technical plan.

## Immediate next specification

The user requested this next deliverable, and the [milestone 1 specification](milestone-1.md) is now drafted. It covers the screen flow, logical saved records/version references, sign-in enforcement contract, autosave/recovery transactions, and observable completion checks. It recommends the React + TypeScript + Vite frontend discussed in the architecture explanation. The exact provider-to-app enforcement of the approved code limits still needs an implementation proof; it is explicitly the first task, not a claim that Supabase defaults meet every rule. Resolve routine implementation choices against the approved behavior; ask the user only where a meaningful preference, cost, or product tradeoff remains. Preparing this specification does not start the application build.

Keep runtime feasibility, actual service/account configuration, phase-specific AI examples/quality thresholds, and other unresolved details visible. No implementation timetable or guaranteed dollar cost is established by this plan.
