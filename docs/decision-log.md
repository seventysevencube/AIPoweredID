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

## Designer sign-in code limits — approved October 17, 2026

Updated: October 17, 2026.

During the B4 discussion, the user approved these simple limits for designer email-code sign-in: codes expire after 10 minutes and work once; after five incorrect attempts require a fresh code; allow a resend at most once per minute, replacing the previous code; and keep entered work saved when a designer must sign in again. Apply resend limits to the same email address and preserve recoverable edits under the existing saving/recovery rules.

The [current requirements](requirements.md#designer-sign-in-code-limits) contain the canonical policy. These limits settle the corresponding previously open code parameters without changing approved-email eligibility or adding sign-in to guest review. Provider choice, remaining session/account-lifecycle policies, and implementation/validation remain open. Earlier decision-log entries remain intact; include this documentation fix in the existing shared PR. No authentication implementation or real email sending is included.

## Designer access removal — approved October 17, 2026

Updated: October 17, 2026.

During the B4 discussion, the user explicitly approved removing designer access through the approved-email list: removing an email stops new sign-ins and ends that designer's existing signed-in access; their active project guest-review links also stop working. Projects remain saved, and removing access does not automatically delete work.

The [current requirements](requirements.md#designer-access-removal) contain the canonical policy, superseding earlier statements that this access-removal behavior was undecided. Retention/deletion and other unapproved account-lifecycle details remain separate decisions. Prior decision-log entries remain intact; add this documentation fix to the existing shared PR. No real account, eligibility list, session, or review link is changed by this planning update.

## Owner-requested project deletion — approved October 17, 2026

Updated: October 17, 2026.

During the B4 discussion, the user accepted a manual project-deletion process for the pilot: the owner asks the pilot operator, who verifies the request; review links stop working when deletion begins; and the project, uploads, saved versions, shared snapshots, and comments are removed from the active app within 30 days of the verified request. Removing designer access alone still keeps projects saved.

The [current requirements](requirements.md#owner-requested-project-deletion) contain the canonical policy. Backup copies and AI-provider retention require separate rules once services are chosen; this approval does not promise their immediate deletion or settle other retention/account-data policies. Prior decision-log entries remain intact; include this documentation fix in the existing shared PR. No real project or stored data is deleted by this planning update.

## AI-provider use of project content — approved October 17, 2026

Updated: October 17, 2026.

During the B4 discussion, the user accepted these provider-selection requirements: choose a service whose applicable terms/settings prevent training on project content; send only material needed for each task; verify how long the service stores that material and explain it to designers before real pilot use; and avoid promises of immediate deletion or zero storage unless verified.

The [current requirements](requirements.md#ai-provider-use-of-project-content) contain the canonical rule. This approval selects no provider and makes no claim about a service's current terms or configuration. The provider and exact retention/deletion rules remain to be evaluated and agreed before real use. Prior decision-log entries remain intact; include this documentation fix in the existing shared PR. No project content is sent to any provider by this planning update.

## Pilot privacy notice and terms — approved October 17, 2026

Updated: October 17, 2026.

During the B4 discussion, the user explicitly approved requiring a clear privacy notice and short pilot terms before real users sign in. They must explain the operator and contact route, stored data and AI use, guest-link exposure, deletion requests and retention limits, permitted submissions, and users' responsibility to review AI output. Draft them once services and remaining retention details are known, then have final wording reviewed for the pilot's location and setup before real use.

The [current requirements](requirements.md#pilot-privacy-notice-and-terms) contain the canonical requirement. This approval does not approve final legal/policy wording, choose services, settle retention details, or authorize a pilot launch. Earlier decision-log entries remain intact; include this documentation fix in the existing shared PR.

## Pilot security safeguards — approved October 17, 2026

Updated: October 17, 2026.

During the B4 discussion, the user approved basic safeguards: designers access only their own projects; guests access only explicitly shared content; review links are difficult to guess and shared pages are excluded from search engines; comments display safely; uploaded files are processed without executing embedded code; and instructions hidden in documents, web text, or comments cannot override app rules or accepted designer decisions.

The [current requirements](requirements.md#pilot-security-safeguards) contain the canonical rules. Make these required build checks before real pilot use, with the technical plan explaining implementation and tests and no new designer settings. This approval does not establish that controls are implemented or tested, settle the remaining privacy/security policies, or authorize application work or launch. Earlier decision-log entries remain intact; include this documentation fix in the existing shared PR.

## Remaining B4 audit work deferred until production — approved October 17, 2026

Updated: October 17, 2026.

After reviewing the summary of remaining B4 items, the user stated that these findings should be addressed before production but are not required for the MVP, and asked to move to B5. Record the remaining detailed retention/deletion, backups/recovery, session/shared-device, guest-review, upload, service-assurance/security-verification, final-notice, and operating-procedure work as pre-production follow-up rather than MVP or technical-planning blockers.

The [current requirements](requirements.md#b4-mvp-and-production-timing) contain this milestone change. It supersedes earlier pre-pilot deadlines for the deferred work, including final notices and detailed provider-retention assessment/disclosure. Keep already-approved basic material, access/code/link, deletion, AI-content, and security behavior in the MVP baseline. This changes timing without settling the deferred policies or claiming verification, authorizing production, or resolving unrelated audit findings. Preserve earlier decision-log entries and use the existing shared PR. No B5 resolution is approved by this decision.

## B5 independent performance-analysis approach — approved October 17, 2026

Updated: October 17, 2026.

The user selected an independently written performance-analysis approach instead of incorporating Six Boxes and asked whether a disclaimer should say it is based on that model. Record the independent approach as approved; the disclaimer is a question, not approved product text. Develop original questions, explanations, and organization rather than copying or merely renaming the earlier branded six-category schema. Exact replacement wording and screen content remain to be drafted and reviewed.

The [current requirements](requirements.md#4-design-performance-solution-decision-first) supersede the earlier Six Boxes integration requirement. Retain reviewed Analysis evidence, explicit route confirmation, learning/nonlearning/combined/investigation routes, and the conditional L2 gate. Mark earlier branded question/wireframe content as historical; do not advance the deferred walkthrough. Kirkpatrick, final attribution wording, and any legal-clearance conclusion remain separate and unresolved. Preserve earlier decision history and record this change in the existing shared PR. No prototype or application implementation is included.

## B5 independent evaluation planning — approved October 17, 2026

Updated: October 17, 2026.

The user approved the independently written evaluation-planning approach proposed during the Kirkpatrick discussion. Keep planning for organizational results, workplace performance, and evidence of learning; write original questions and explanations; call the section Evaluation planning without presenting it as an official Kirkpatrick implementation; and preserve designer confirmation of learning measures before instructional Design proceeds on a learning route.

The [current requirements](requirements.md#independently-written-evaluation-planning) supersede the earlier branded integration requirement. Preserve per-measure details, evidence links, permitted unknowns, the no-learning not-applicable rationale, and stable references in historical records. Evaluation execution remains outside the MVP. Earlier branded question wording and prototype/example labels are historical; exact independently written replacement questions and presentation still require drafting and review. This approves the product direction, not copied materials, a disclaimer, or a legal-clearance claim. Do not advance the deferred walkthrough or change prior decision-log entries. Include this documentation change in the same shared PR; no prototype or application implementation is included.

## Other audit findings saved for later — October 17, 2026

Updated: October 17, 2026.

The user asked to save the other findings for later and asked how to send the updated information to the main agent. Preserve the full audit in PR #1 and the approved decisions in shared PR #2. Record the remaining findings as deferred, not resolved, approved, or authorization to implement them. The previously agreed B4 pre-production timing and approved MVP rules remain in effect; both independent replacement specifications still need original wording drafted and reviewed. The fictional walkthrough remains deferred.

See [audit follow-up timing](open-decisions.md#audit-follow-up--deferred-at-the-users-request). Prepare a handoff the user can send to the main agent; this request does not authorize sending a message to another chat, merging a PR, or beginning application work. Preserve all earlier decision-log entries.


## Independent replacement questions and described desktop layouts — approved October 18, 2026

After the PR handoff review, the user approved each original replacement question group in sequence: Review the performance evidence; Consider possible explanations and choose a response; Organizational results; Workplace performance; and Evidence of learning. The user then approved the two-step performance-analysis desktop layout and the Evaluation planning workspace with three left-navigation sections and editable measure cards. Preserve the exact wording and supporting behavior in the [replacement specification](notes/independent-review-questions.md), with [current requirements](requirements.md) remaining the main product contract.

Performance analysis reuses the accepted Analysis evidence, separates observations from hypotheses, shows support/conflicts/unknowns, and requires explicit route confirmation. Learning-measure confirmation follows only when applicable under the existing conditional gate. Evaluation planning retains per-measure details, links, permitted unknowns, organizational influences, opportunity to perform, and observable learning evidence. Saving/reviewing an incomplete plan does not bypass the instructional Design gate. Detailed objectives and assessments remain later Design work.

These approvals complete the pending B5 question wording and described presentation review; they do not verify independent legal rights, endorse a branded model, approve other audit recommendations, or establish prototype/accessibility/AI-quality/production readiness. Historical branded content and record references remain preserved as history; the fictional walkthrough stays deferred. Production prompts, reference outputs, technical choices, and implementation remain future work. No PR merge, application build, deployment, or AI connection is authorized by these approvals.

## Low-cost service foundation, model strategy, and Milestone 1 — October 18, 2026

The user accepted the low-cost foundation and manually resuming idle services before demos. They have existing domains, Netlify Free (credit-based, 300 monthly credits), and a temporary Vercel Pro trial for another project; ongoing Vercel Pro spending is not assumed. Netlify/Supabase/Resend are the planning foundation, with implementation feasibility still to prove. OpenAI is the first provider; evaluate Luna first and use Sol only where quality/cost results justify it. Jev is outside the initial MVP.

The user reviewed the milestone specification and then explicitly instructed: “Please also merge changes to main if we are ready. Lets start Milestone 1 implementation”. This authorizes implementation and merging reviewed ready changes. It does not adopt deferred audit recommendations, approve the fictional walkthrough, or verify service behavior. Preserve the current requirements and historical decision log. Implementation progress and outstanding live-configuration checks must be reported accurately.


## October 18, 2026 — Milestone 1 implementation authorized

The user instructed: “Please also merge changes to main if we are ready. Lets start Milestone 1 implementation.” The reviewed planning audit (PR #1) and approved baseline/implementation specification (PR #2) have been merged, without approving other audit recommendations or resuming the fictional walkthrough. Milestone 1 implementation now proceeds under the current requirements. The [implementation status](implementation/milestone-1-status.md) separates local test evidence from pending live Supabase/Resend/Netlify and human accessibility checks. No application deployment, DNS change, subscription purchase, or AI call is included in this checkpoint.


## October 18, 2026 — Analysis Continue and uncertainty controls

The designer requested disabling Continue when Needed-for-Design fields are incomplete and removing the redundant Enter an answer option. Continue checks the current page's required fields; saving and section navigation remain available. Unknown responses use a checkbox, and optional applicability controls preserve rationale/text. This is a navigation refinement, not a new stage acceptance or learning-measure confirmation action. See current requirements for the precise rule.


## October 18, 2026 — Continue navigates; core answers gate AI

The designer superseded the preceding Continue restriction: both Continue and section links allow moving through incomplete Analysis. Unknown checkboxes are directly visible, with no Answer options disclosure. Required/core answers instead gate project-content AI submission; unknown notes or empty answers cannot bypass it. This is the current rule. Milestone 1 computes readiness from saved owner-authorized records; actual AI queue/provider integration remains later work and must enforce the rule on the server.


## October 18, 2026 — Evidence form simplification and count scope

The designer requested removing the causes description and Not sure choice, enabling a one-line Other detail only with Other selected, and trimming repeated helper text about permissible unknown answers. Readiness remains project-wide: three core answers in Project context plus the audience description. The UI now states that scope and links the relevant sections; the navigation/AI-submission rules remain unchanged. Other notes are preserved when deselected without treating them as active explanations.

## October 18, 2026 — Contextual guidance and bounded draft history

The designer requested corresponding Guidance content for every section and storing only the last 10 versions. Apply the rolling limit per section, matching the existing history UI; saves and restores count toward it. Preserve exact versions referenced by reviews or accepted baselines under the existing handoff rule, separately from the latest-ten history shown to the designer. This supersedes unbounded ordinary draft-history wording. The database migration trims existing unreferenced history as well as future saves. Other deferred retention policies remain open.

## October 19, 2026 — Complete technical preparation before flow review

The user requested completing the technical side as far as possible before reviewing the full flow. Continue the current milestone’s service-adapter, configuration, deployment-build, and persistence verification first. The user confirmed Supabase is ready and supplied the AIPoweredID project dashboard; Resend is not ready. Read-only project inspection is not application setup or live verification. Preserve later-milestone boundaries, the existing human review/acceptance rules, the deferred fictional walkthrough, and the approved B4 timing. Actual sender/domain, privileged settings, live SQL application, and hosted verification remain separate concrete setup steps.
