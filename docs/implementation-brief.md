# MVP Implementation Brief

Updated: October 18, 2026.

Status: planning consolidation for review. The product requirements summarized here are approved; the suggested delivery order is a proposal. This document does not authorize application development, deployment, or AI connections.

## Product outcome

Help workplace instructional designers move through Analysis, Design, and partial Development using an adjustable, guided desktop workflow. Each accepted stage output seeds an editable skeleton for the next stage. Support novice and experienced designers without requiring duplicate entry.

Deliver detailed Storyline/Rise storyboard specifications and complete written job-aid/performance-support drafts. Implementation and evaluation execution remain later scope. Evaluation planning is included.

Use [current requirements](requirements.md) and the [detailed notes](README.md) for exact questions, exceptions, and decision precedence. The [screen review record](ui/screen-review-status.md) distinguishes approved patterns from pending layouts. The independently written [performance-analysis and Evaluation planning questions and described desktop layouts](notes/independent-review-questions.md) were approved on October 18, 2026. These replace the historical branded content; replacement prototypes and application functionality have not been implemented or verified.

## Approved workflow

1. **Project home:** designer-owned projects, card layout, visible save/progress information, and resume at the saved location.
2. **Analysis:** performance gap/evidence, audience/work context, stakeholders/constraints including review availability, and planning for organizational results, workplace performance, and evidence of learning. Review the Analysis brief. Intervention recommendations belong in Design.
3. **Performance solution:** use an independently written performance-analysis review of evidence/hypotheses to confirm learning, nonlearning, both, or investigation. Confirm learning measures before instructional Design; documented N/A applies only to a route with no learning component.
4. **Solution and structure:** choose e-learning, performance aid, both, or investigation before deriving deliverables. For e-learning, choose microlearning/course/mix, then Storyline/Rise/both and component allocation.
5. **Instructional Design:** main and enabling objectives using reviewed Bloom alignment → assessments/practice → content and instructional support → sequence → detailed Design plan. Keep the objective step focused on objectives/alignment; project-wide source settings are not repeated per objective. Nonlearning work uses appropriate task/performance requirements.
6. **Development sample:** show the full skeleton plus a representative section. Edit directly or request scoped changes. Sample-treatment acceptance is separate from factual verification. Missing facts remain visible; structural samples are not complete factual drafts.
7. **Full draft and review:** explicitly generate remaining content using its own mapped requirements and preserve accepted sample edits. Review individual sections. Keep Design-owned assessment tasks, answers, feedback, rubrics, and retry rules linked; material changes require Design review.
8. **Optional guest review:** account-free review of a selected fixed-version snapshot, with required unverified display names and anchored comments. Sharing an updated version creates a new link; earlier comments keep their original version/target. Select supporting materials explicitly. Under the approved [guest-link lifetime](requirements.md#guest-link-lifetime), designers can revoke links at any time and links expire automatically after 14 days; a fresh link provides more time. Ending link access keeps the project/comments but cannot recall downloaded copies.
9. **Export:** PDF handoff document or editable PowerPoint storyboard from the selected saved structured content, without an AI rewrite. Draft exports retain visible gaps. Ready for handoff is a separate designer-confirmed state with essential issues resolved.

## Designer access — approved pilot scope

Plan the initial pilot for five instructional designers. This is an expected participant count for capacity and AI-usage planning, not a hard five-account limit, a project quota, or an assumption that all five will generate content simultaneously. Guest reviewers are separate from this designer count. The monthly AI budget is $20 total for the pilot, with a $16 warning and a pause on new AI requests that would exceed $20; usage frequency remains to be established.

Designer access is an invitation-only pilot. Only invited participants may create or activate designer accounts; open public registration is outside the MVP. Each designer still owns their own projects and may save multiple projects. Guest reviewers do not need a pilot invitation or an account: an active shared review link grants the agreed view/comment access to its selected fixed-version snapshot, not designer account access.

Invited designers sign in using a one-time code sent to their invited email address. They enter their email, request the code, enter it to complete sign-in, and reach their saved projects. No password creation or password-reset flow is required for this selected method. Requesting a code does not grant pilot eligibility or open public registration; the invitation-only access rule still applies.

Manage pilot eligibility through a simple list of approved email addresses maintained by the pilot operator. Only listed email addresses are eligible for designer sign-in, and a valid one-time email code is still required. No dedicated invitation-management dashboard is included in the MVP. Guest reviewers continue to use active shared review links without an account or membership on the pilot list.

Apply the approved [designer sign-in code limits](requirements.md#designer-sign-in-code-limits): 10-minute expiry, single use, a fresh code after five incorrect attempts, and at most one resend per minute to the same email address, replacing the old code. Preserve recoverable work when sign-in is required again. These limits do not change approved-email eligibility or guest access.

Under the approved [designer access removal](requirements.md#designer-access-removal) rule, removing an email from the pilot list stops new sign-ins and existing signed-in designer access, and deactivates that designer's project review links. Projects remain saved; deletion is a separate decision.

The list's implementation/storage, authentication provider, remaining code/session handling, and account lifecycle details remain open. These planning decisions do not authorize sending real emails, creating accounts, or deploying the app.

Under the approved [B4 MVP and production timing](requirements.md#b4-mvp-and-production-timing), remaining B4 audit details are required before production and do not block the MVP or technical planning. Previously approved basic behaviors remain MVP requirements. Finalize the [privacy notice and terms](requirements.md#pilot-privacy-notice-and-terms) before production: operator/contact, stored data and AI use, guest-link exposure, deletion/retention limits, permitted material, and responsibility to review AI output. Draft after service/retention details are known and review for the operating location/setup.

Apply the required [pilot security safeguards](requirements.md#pilot-security-safeguards): owner-only project access, guest access limited to explicitly shared content, difficult-to-guess review links, search exclusion, safe comment display, upload processing without embedded-code execution, and protection against instructions hidden in reference material or comments. The technical plan must explain MVP implementation and tests; these safeguards add no designer settings. Additional B4 audit assurance follows the approved pre-production timing.

## Content and state contracts

Preserve stable record IDs, accepted decisions, objective/enabling-objective/Bloom relationships, defined assessments, source references, content mappings, sequence placements, tool allocation, and open issues across stages.

Keep these meanings separate:

- Saving protects edits; it does not accept an AI proposal, approve a stage, publish, or share.
- Reviewed records a designer's review of a specific version; unresolved questions may remain.
- Accepted for the next stage means the designer explicitly selects a specific saved version as the next stage's starting point. Preserve the input version and its reference; saving does not automatically mark reviewed or accept the handoff.
- Ready for handoff requires the agreed review/coverage/source/answer/tool checks, not merely completed fields or review flags.
- After an earlier input changes, preserve the existing later-stage content and its original input version. Mark affected sections Needs update with the reason; let the designer review them and edit manually or explicitly request an AI revision. Keep unaffected sections' review status and earlier shared/exported versions unchanged.

The canonical [review and handoff rules](requirements.md#saved-reviewed-and-accepted-for-the-next-stage) and [earlier-work change rules](requirements.md#changes-to-earlier-work) define this behavior. Detailed dependency detection and other versioning cases remain to be specified; no automatic rewriting or regeneration is implied.

Guest comments remain feedback, not direct content edits or automatic AI instructions. Source files remain evidence, not application instructions.

## Approved source imports

Support Word (.docx) and PowerPoint (.pptx) uploads using basic extraction of editable text and structure, including available speaker notes and useful source references. Direct text entry and permitted web research remain available. Use conventional parsing and deterministic checks, without AI, for imports. Show a warning when no usable text is extracted and exclude that file from AI source content. No extraction summary, text preview, or import-review confirmation is required; the designer can continue with other sources or direct text entry. Do not infer image/diagram meaning. PDF/TXT source uploads, legacy format conversion, OCR, and complex layout reconstruction are outside the initial import scope. PDF/PPTX export support is unchanged. Size/count limits and other processing-error details remain open.

## Saving and accessibility

Target device recovery capture during typing, server saves about one second after a pause, at least every five seconds of continuous typing while connected, immediate discrete saves, and navigation flushes. Only server acknowledgement permits an all-changes-saved claim. Protect unsynced work, completed AI results, undo/history, and conflict recovery. Retention and failure recovery still require decisions and testing.

Use the approved [owner-requested project deletion](requirements.md#owner-requested-project-deletion) process: the owner contacts the pilot operator, who verifies the request; review links stop when deletion begins; project content, uploads, saved versions, shared snapshots, and comments are removed from the active app within 30 days of verification. Backup copies and AI-provider retention remain separate open policies. Removing designer access alone does not delete projects.

Desktop scope retains the WCAG 2.2 AA target. Validate keyboard access, focus, screen-reader operation, contrast, and zoom/reflow. Breaks and reflection remain optional; break reminders default off.

## Export requirements approved at this checkpoint

- **PDF:** readable handoff document including complete learner-facing/written content, assessment details, build/production/accessibility notes, source references, and open issues.
- **PowerPoint:** editable content organized by screen, Rise block group, or written-aid section, with continuation slides as needed rather than cramped text.
- **Both:** retain project/version/date/tool identification, draft/readiness and section review status, relevant record links, sources, and unresolved issues.
- **Reviewer comments:** optional and off by default. When selected, place them in a separate appendix with their original draft/version and target references.
- Export formatting reuses saved content and must not silently change assessment wording, scoring, or other approved decisions.

Exact PDF/PPTX page/slide layouts, long-content examples, accessibility verification, and comment-appendix treatment still need a representative sample review. A PowerPoint storyboard is not a native authoring-tool project.

## AI integration requirements

Use shared guardrails plus focused stage/task prompts, the accepted context, permitted source passages, structured outputs, reviewed examples, and quality checks. Revisit and refine prompts/examples at each phase's AI connection.

Apply the approved [AI-provider project-content rules](requirements.md#ai-provider-use-of-project-content): select applicable terms/settings that prevent training on project content; send only task-needed material; complete retention verification/disclosure before production under the approved B4 timing. Make no unverified immediate-deletion or zero-storage promise. Provider selection and exact retention rules remain open.

Explicit generation/revision actions initiate AI work. Typing, autosave, navigation, and document export do not. Bound repair attempts; preserve accepted work and completed results if generation fails. Show unsupported/conflicting facts and require explicit review of material upstream changes.

The monthly pilot AI budget is approved at $20 total. Provider/model, actual usage/cost estimates, enforcement implementation, numerical quality thresholds, production prompts, and retrieval implementation remain undecided. The $16 warning/$20 pause policy is approved. Benchmark against the approximately five-minute, moderately interactive workplace reference; it is not a project duration limit.

### Pilot AI spending budget

The expected completion volume is approximately 0–1 complete project per month across the five-designer pilot, interpreting the user's answer to the question about total monthly pilot projects. This is a planning estimate, not a per-designer allowance or an enforced project limit. Ongoing drafts, revisions, AI review, and research can incur AI usage even when no project is completed. Generation frequency, source volume, concurrency, and actual cost per accepted output still require measurement.

The approved monthly AI budget is $20 total for the five-designer pilot, shared across the pilot rather than $20 per designer. This is a spending budget, not an estimate or a promise of a particular number of projects/generations. Hosting, storage, and sign-in email delivery are separate costs; no budgets for those have been approved. Provider/model selection, realistic usage benchmarking, and budget tracking/enforcement details remain open.

Approved spending-control policy: show an in-app warning when total monthly pilot AI usage reaches $16 (80% of the $20 budget). Pause new AI requests that would exceed the $20 monthly pilot budget. Preserve saved work and keep manual editing, review, and non-AI exports available. This is a shared pilot limit, not a per-designer allowance.

Use the approved [simple shared AI queue and spending protection](requirements.md#simple-shared-ai-queue-and-spending-protection): one AI job at a time across the pilot, with other requested jobs waiting. Reserve a job's maximum allowed cost before it starts, including its AI review/repair/research; record the confirmed actual charge and release any unused reservation. Keep an uncertain charge reserved, show Cost confirmation pending, and pause further AI requests until the pilot operator checks it. Recover completed results without regeneration and require an explicit, budget-checked retry for failed jobs. Manual editing, review, and non-AI exports stay available. No separate designer budgets are required.

Exact job allowances, monthly reset timing, provider selection, and queue/accounting implementation remain open. The bounded quality repair of newly generated content is not a failed-job retry and must fit within the job allowance. No live controls are configured by these notes.

## Suggested delivery order — proposal

1. Prepare a technical build plan and confirm the non-AI operating budget. The user deferred the representative example walkthrough for now; retain it for later phase-by-phase AI quality work. Settle practical source limits, remaining operating policies, and export layouts as the plan is refined.
2. Establish the structured records, versioning, designer projects, and reliable autosave before integrating AI.
3. Implement and check the Analysis → Design → Development workflow incrementally, retaining deterministic validation and review gates.
4. Connect one phase's AI tasks at a time, adding positive/negative examples and measuring quality, correction effort, latency, and cost.
5. Complete real guest-link access controls and document exports, and validate the complete desktop workflow including recovery and accessibility.

Choose the technical stack and deployment only after reviewing the remaining choices. No technology or hosting provider is selected by the prototypes.

## Acceptance evidence required before claiming completion

Demonstrate a learning branch and a nonlearning/performance-support branch; both authoring-tool structures; source gaps/conflicts; main/enabling-objective and integrated-assessment coverage; accepted sample preservation; targeted revisions; downstream update flags; guest comments pinned to versions; and readable draft/ready exports.

Exercise actual save/reconnect/conflict/recovery behavior and accessible operation. During AI integration, use reviewed source-grounded examples and mismatch cases, not only happy-path sample prompts.

Existing wireframes are independent, local design examples with fictional content. Structural/script checks do not demonstrate a working application, actual persistence/sharing, full AI quality, or accessibility conformance.

## Decisions still needed

See [open decisions](open-decisions.md). Priorities include upload size/count limits and other import-error handling, reviewed reference content/export layouts, sign-in and approved-list implementation, remaining link lifecycle controls, retention/recovery policy, Storyline/Rise feasibility, AI/provider choices and budget enforcement, and production quality thresholds.

Generated images/audio/video, OCR, native course files, direct reviewer editing, team coauthoring, and evaluation execution remain outside the approved MVP. Replies, resolution, and other collaboration additions are not included by implication.

## Representative walkthrough checkpoint

The user selected the [fictional complaint-routing example](examples/complaint-routing/README.md). Its authored source packet and proposed prefilled Analysis/brief are prepared for review; the content remains fictional and unapproved as an exercise baseline until reviewed. Use the accepted Analysis to seed the independently written performance-analysis review before choosing interventions, then work through the remaining Design/Development/export examples. This is planning content, not a live pipeline test or proof of cost/accessibility/readiness.


## Walkthrough deferred — latest steering

The user asked to skip the fictional example for now and move to the next step. Preserve its source packet and Analysis draft as unreviewed planning content; do not progress its performance-analysis/Design stages or treat its assumptions as accepted. The next proposed work is the technical build plan, including hosting/storage/sign-in/AI choices and a phased implementation approach. Confirm the hosting/storage/sign-in-email budget separately from the $20 AI budget before recommending services. No actual app build, deployment, or AI connection is authorized by documenting this next step. Revisit instructional examples during each phase's AI integration as previously agreed.

