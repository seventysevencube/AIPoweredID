# Decision Log

Planning decisions through October 17, 2026. These are summarized decisions, not a verbatim transcript. Current requirements and detailed notes contain the operative wording.

| Topic | Current decision / refinement |
| --- | --- |
| Delivery stages | Analysis, Design, and partial Development now; Implementation and evaluation execution later. |
| Evaluation planning | Include full L2/L3/L4 planning questions in Analysis despite excluding an evaluation-execution module. |
| Intervention placement | Move the recommended intervention out of the Analysis brief and into Design. |
| Performance-solution review | Before specific intervention recommendations, use Six Boxes to determine learning, nonlearning, combined, or further-investigation routes. |
| L2 progression rule | Initial requirement for L2 before all Design was superseded: initial solution review can establish applicability; confirmed learning routes require L2 before instructional Design; no learning uses documented N/A. |
| E-learning options | Choose microlearning/course/mix before tools; expand tool choice from Storyline or Rise to Storyline, Rise, or both, with allocation/connection details. |
| Learning objectives | Use revised Bloom's taxonomy; show/review levels and align assessment demand. |
| Objective hierarchy | Break main objectives into meaningful enabling objectives to identify required content/support comprehensively. Keep integrated main-objective assessment. |
| Assessments | Define and identify assessments in Design; carry them into storyboards rather than inventing them in Development. |
| Source scope | Ask source questions once project-wide; map content/source relationships per enabling objective without repeating the questionnaire. |
| Uploads | Basic non-AI extraction from .docx/.pptx, including available speaker notes. Deterministic warning if no usable text; that file is not used as an AI source. No extraction summary, text preview, or import-review gate. Direct text entry and PDF/PPTX exports remain supported. Other upload exclusions are unchanged. |
| Supporting-material wording | “Add documentation of any supporting evidence if available”. |
| Stakeholders | Add review availability and expected turnaround. |
| Audience time | Remove the audience-time question from the stakeholder/constraints section. Five minutes remains a benchmark, not a universal cap. |
| Generated media | Exclude generated images, audio narration, and video; allow written scripts and media specifications. |
| Performance support | Produce complete written drafts, not only specifications. |
| Development sample | Generate the whole skeleton with a representative section populated; preserve the label “Generate Development sample”. “Preview draft section” was suggested but not adopted. |
| Exports | Readable PDF handoff documents and editable PowerPoint storyboards with continuation slides. Preserve draft/ready and version/source/issue labels; export saved content without an AI rewrite. Comments optional, off by default, in a separate version/target-labeled appendix. Exact templates remain open. |
| Collaboration | Guest review without an account; content-anchored comments; required unverified display names. Links pin a fixed draft version; sharing updates creates a new link and preserves earlier comment references. Other lifecycle/thread details remain open. |
| AI preferences | Guidance depth, contribution, output detail, and resources are separate controls; reflection is optional. |
| Breaks | Optional pause/resume and accessible break choices; reminders off by default. |
| Saving | Autosave, recovery, truthful server-confirmed status, version/undo/conflict protection, and optional Save now. Saving does not equal acceptance or progression. |
| Project management | Invitation-only pilot for designer accounts; no public registration. Designers own multiple saved projects and resume from project home. Guest link access remains account-free. Approved-email-list pilot management and one-time email-code sign-in are selected; provider/storage/lifecycle details remain open. |
| AI quality process | Agreed baseline; revisit prompts, add examples, test, and refine at each phase's AI integration. |
| Repository | User requested all planning work/notes be saved to seventysevencube/AIPoweredID. No app build has been authorized by this documentation-saving request. |

## Document precedence

1. The latest explicit user decision.
2. [Current requirements](requirements.md) and the latest approved detailed section notes.
3. [AI creation/quality process](ai/creation-and-quality.md), interpreted consistently with those requirements.
4. Archived earlier drafts, retained for history only.

When a later decision affects upstream/downstream content or the prompt plan, update the linked current records rather than leaving contradictory active requirements.

## Desktop review checkpoint — October 17, 2026

- Project home: the user selected Project cards over rows.
- Analysis form and Analysis brief: the user approved the entry/review/handoff patterns; saved edits, section review, and accepted handoff remain distinct.
- Six Boxes: the user approved the separation of evidence review from response selection.
- Solution choice: the user required an Analysis-based, AI-supported e-learning/performance-aid/both decision before deliverable confirmation. The revised sequence supersedes the earlier deliverable-first screen.
- Output label: use “Written job aid / performance-support draft” instead of “Complete written learning-support draft”; produce complete written content.
- Checkpoint: save the seven wireframes, current notes, review statuses, and next steps. Main/enabling-objective visual treatment is a new proposal awaiting review; assessments are the next screen.

See the [checkpoint](checkpoints/2026-10-17-design-review.md) and [screen statuses](ui/screen-review-status.md). Prototype interactions do not approve sample findings or implement production behavior.


## Later screen approvals — October 17, 2026

- Development sample workspace: pattern approved for Written aid, Storyline, and Rise examples; sample-treatment acceptance is separate from factual/source verification.
- Full-draft review/readiness: pattern approved; section review does not resolve essential blockers or establish Ready for handoff.
- Guest review: designer/guest pattern approved for the MVP, including required unverified display names and fixed-version/new-link behavior. Comments retain their original version/target; selected supporting material is explicit.
- Current next decision: PDF/PPTX contents/templates and optional reviewer-comment inclusion. The proposed comment default is not yet approved.

These later approvals supersede pending statuses in the earlier checkpoint. Current per-screen status is maintained in [screen review status](ui/screen-review-status.md).

## Export refinement — approved October 17, 2026

The user approved PDF handoff-document and editable PowerPoint storyboard organization, continuation slides for long content, preserved version/draft/source/issue details, and optional reviewer comments off by default in a separate appendix. Exact visual templates remain open. The [implementation brief](implementation-brief.md) consolidates the agreed workflow and identifies proposed delivery order and remaining choices; its creation is planning work, not authorization to start building.

## Source import refinement — latest decision

The user selected basic extraction and Word/PowerPoint uploads only. This replaces the earlier proposed Word/PDF/TXT/PPTX import set: the initial accepted file extensions are .docx and .pptx. Keep direct text entry and permitted web research. Basic extraction uses conventional parsers, with available PowerPoint speaker notes and useful source references; missing text stays visible. Size/count limits and remaining processing-error details remain open; the later import-flow decision below settles summaries/previews. PDF and editable PowerPoint exports are unaffected.

## Import flow simplification — latest decision

The user required a warning when a file has no usable text, with no AI used for this check and no extraction summary or text preview. Use deterministic checks of conventional extraction results. A file with no extracted source text is excluded from AI context; the designer may continue using other sources or direct text entry. No mandatory import-review gate is introduced. This supersedes the proposed summary/preview flow and earlier notes leaving preview behavior open. Word/PowerPoint import scope and PDF/PowerPoint exports are unchanged.

## Designer access — invitation-only pilot approved

The user chose an invitation-only pilot rather than open registration for designer accounts. Restrict designer account creation/activation to invited participants while retaining one project owner and multiple saved projects. Guest reviewers still use active shared links without accounts or pilot membership. Designer sign-in method and invitation-management details remain undecided. This is a requirements decision, not authorization to send invitations, create accounts, or launch the pilot.

## Designer sign-in — one-time email code approved

The user selected one-time email codes instead of email/password sign-in for invited designers. Invited designers sign in using a one-time code sent to their invited email address. They enter their email, request the code, enter it to complete sign-in, and reach their saved projects. No password creation or password-reset flow is required for this selected method. Requesting a code does not grant pilot eligibility or open public registration; the invitation-only access rule still applies. Guest review stays account-free. Invitation administration, authentication provider, code/session parameters, and account lifecycle details remain open; no real code emails, invitations, or accounts were created by this planning update.

## Approved-email list — pilot management approved

The user approved a simple list of allowed email addresses maintained by the pilot operator. Manage pilot eligibility through a simple list of approved email addresses maintained by the pilot operator. Only listed email addresses are eligible for designer sign-in, and a valid one-time email code is still required. No dedicated invitation-management dashboard is included in the MVP. Guest reviewers continue to use active shared review links without an account or membership on the pilot list. Technical storage/provider choices, access-removal/session behavior, and account lifecycle details remain open. No actual addresses were supplied or changed, and no emails or invitations were sent by this planning update.

## Expected pilot size — five designers

The user expects five designers in the initial pilot. Use this count for capacity and AI-usage planning without inferring a hard account cap, project quota, simultaneous generation load, or approved spending budget. Guest reviewers are separate from the designer count. The next planning decision is the monthly pilot AI budget and associated usage assumptions.

## Monthly pilot AI budget — $20 approved

The user set the monthly AI budget at $20 in response to the question about the five-designer pilot's AI budget. This is a total shared pilot budget, not a per-designer allocation or an estimate of what the workload will cost. Hosting/storage/sign-in emails are separate costs. Warning and stop behavior are the next decision; no provider, numerical generation quota, or live spending enforcement is selected or configured.

## AI spending controls — approved

The user approved an in-app warning at $16 of the shared $20 monthly pilot AI budget and pausing new AI requests that would exceed $20. Preserve saved work and continue to allow manual editing, review, and non-AI exports. This supersedes the earlier proposal status of the thresholds/stop policy. Provider selection, usage assumptions, accounting/reset behavior, and enforcement implementation remain open; no live spending controls have been configured.

## Expected monthly completion volume — 0–1 project

The user expects about zero to one complete project per month, in response to the question about total output across the five-designer pilot. Record this as the total pilot planning estimate, not a per-person allowance or a hard project cap. Drafting/revisions may consume AI in months with no completed project; the estimate does not prove that the workload fits the $20 budget. Next, select a representative source/example for an end-to-end walkthrough and subsequent quality/cost benchmarking.

## Fictional complaint-routing walkthrough selected

The user selected the fictional complaint-routing example rather than a real organizational project. A new reference packet and prefilled Analysis/brief have been prepared for designer review. Example selection does not approve the newly authored facts, evaluation measures, intervention route, or authoring tools. The next checkpoint is Analysis review followed by Six Boxes. See the [example index](examples/complaint-routing/README.md). No app/AI pipeline or actual source import has run.


## Fictional walkthrough deferred

The user requested skipping the fictional complaint-routing example for now. Retain the authored source packet and Analysis draft without approving their content or proceeding with the exercise. The next proposed planning step is a technical build plan for the approved MVP and clarification of the non-AI operating budget. The earlier requirement to revisit prompts/examples during phase-by-phase AI integration remains in place. Application implementation has not started.

## Document authority — approved October 17, 2026

Updated: October 17, 2026.

While working through planning-audit blocker B1 one fix at a time, the user approved this document arrangement:

- [Current requirements](requirements.md#document-authority) is the main source of current product rules.
- Detailed notes preserve approved exact form questions, explanations, and the reasons behind decisions; they support the requirements rather than act as a second, equal source of product rules.
- This decision log preserves the history of approvals and corrections. Keep earlier entries intact.
- The latest explicit user decision always takes precedence. Record a new decision here and update the current requirements and affected supporting notes to reflect it. Mark superseded note instructions as historical; proposals and archived material do not become approved requirements.

This entry supersedes the earlier Document precedence section's equal ranking of current requirements and approved detailed notes, and the opening description of both as operative wording. Those earlier statements remain as history. The current document-authority rule is also stated in the [planning index](README.md#document-authority) and current requirements so readers do not need to reconstruct it from past entries.

This approval covers the document arrangement only. Individual contradiction fixes, other B1 cleanup, and the remaining audit recommendations have not been approved by it. No technical plan or application work is included.

## Review, handoff, and earlier-work changes — approved October 17, 2026

Updated: October 17, 2026.

During the B2 discussion, the user confirmed the distinction between saved edits, review of a specific version, and explicit acceptance of that version as the next stage's starting point. Saving must not automatically mark reviewed or accept a handoff. Unresolved questions may remain after review; existing progression and readiness rules still apply.

The user approved the following behavior when earlier work changes: preserve existing later-stage content and the earlier version it was based on; mark affected sections Needs update with a reason; let the designer review and choose manual editing or an explicit AI revision; keep unaffected sections' review status; and preserve earlier shared versions and exports unchanged. The example discussed was changing the Analysis audience from experienced employees to new hires, potentially affecting Design objectives, explanations, and practice. Do not silently rewrite or automatically regenerate affected content.

The [current requirements](requirements.md#saved-reviewed-and-accepted-for-the-next-stage) contain the canonical rules, with a linked summary in the implementation brief. The user requested adding these approved fixes to the same PR as the first B1 fix, then proceeding to discuss B3. Detailed dependency detection and other unresolved versioning cases are not approved by this entry. Earlier decision-log entries remain intact; no technical plan or application work is included.

## Simple pilot AI spending protection — approved October 17, 2026

Updated: October 17, 2026.

During the B3 discussion, the user accepted reserving a request's maximum allowed cost before it starts and retaining the reservation when a failed or interrupted request's charge is uncertain. The user then requested simple logic and explicitly approved one shared AI queue: only one AI job runs at a time across the pilot; other requested jobs wait; reserve the maximum allowed job cost before starting; settle the confirmed charge and release unused money; pause further AI until the pilot operator checks an uncertain charge; and require an explicit rather than automatic retry of a failed job. Recover completed results without generating them again. Saved work, manual editing, review, and non-AI exports remain available throughout.

The [current requirements](requirements.md#simple-shared-ai-queue-and-spending-protection) contain the canonical policy. All paid AI work within a job, including quality review, the existing bounded quality repair, and research, must fit within its allowance. The quality repair of newly generated content remains distinct from retrying a failed job. This preserves the approved $20 shared monthly cap and $16 warning without separate designer budgets or simultaneous AI-job accounting.

This settles the queue, reservation, uncertain-charge, and explicit-retry behavior previously left open. Exact job allowances, monthly reset timing, provider/model selection, and implementation/validation remain open. Keep this fix in the same PR as the earlier approved blocker fixes. Prior decision-log entries remain intact; no live spending controls, technical plan, or application work are included.

## Permitted pilot material — approved October 17, 2026

Updated: October 17, 2026.

During the B4 discussion, the user accepted the initial material boundary: allow public material, fictional examples, and employer-approved material with confidential and personal details removed. Exclude identifiable employee/customer cases, passwords, and business secrets. Explain this boundary briefly before designers paste or upload material.

The [current requirements](requirements.md#permitted-pilot-material) state the canonical rule, clarifying the earlier no-confidential-organizational-material assumption. This approval does not require automatic sensitive-content detection or approve other privacy/security recommendations. Guest-link lifecycle, provider handling, retention/deletion, and other B4 details remain open. Prior decision-log entries remain intact; this is documentation work in the shared blocker-fix PR.

## Guest-link revocation and expiry — approved October 17, 2026

Updated: October 17, 2026.

During the B4 discussion, the user accepted this simple guest-link policy: designers can revoke a review link at any time; links expire automatically after 14 days; and designers can create a fresh link when reviewers need more time. Expiry/revocation ends access through the link while keeping the project and saved comments. It cannot recall copies already downloaded. The fixed-version/new-link rule remains in effect.

The [current requirements](requirements.md#guest-link-lifetime) contain the canonical policy. This approval supersedes earlier statements that revocation or expiry were undecided, including the optional-expiry proposal in the sharing notes. Other lifecycle implementation details, replies/resolution, provider handling, retention/deletion, and remaining B4 recommendations are not settled by this approval. Prior decision-log entries remain intact; record this documentation fix in the existing shared PR.
