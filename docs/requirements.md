# Current MVP Requirements

Updated: October 17, 2026. Status: agreed product baseline; implementation choices and open details are listed separately.

## Document authority

This document is the main source of current product requirements. The linked detailed notes preserve approved exact form questions, explanations, and the reasons behind decisions; they support these requirements rather than act as a second, equal source of product rules. The [decision log](decision-log.md#document-authority--approved-october-17-2026) preserves the history of approvals and corrections.

The latest explicit user decision always takes precedence. When a new decision changes a requirement, record it in the decision log and update this document and the affected supporting notes to reflect it. Mark superseded instructions in the notes as historical. A proposal in a note is not an approved requirement, and archived documents are history only.

This document arrangement does not approve any other audit recommendation or change the product's scope. Reconciling the remaining contradictory passages is separate work requiring approval.

## 1. Purpose and scope

Support novice and experienced instructional designers through Analysis, Design, and partial Development for workplace e-learning and performance support. Use one workflow with adjustable guidance. Target desktop use, with a WCAG 2.2 AA acceptance target including keyboard use, focus, screen-reader operation, and zoom/reflow.

Primary deliverables are detailed build-ready storyboard specifications and complete written performance-support drafts. They must contain the content, behavior, assessment, accessibility, and build information appropriate to the selected tool or support format.

The reference project for testing quality and estimating cost is approximately five minutes and moderately interactive. It is not a maximum project length or a rule determining microlearning.

### In scope

- Invitation-only designer accounts, one owner per project, and multiple saved projects per designer; no open public registration.
- Analysis forms and an editable synthesized Analysis brief.
- Full evaluation-planning questions to identify Kirkpatrick L2 learning, L3 behavior, and L4 results measures.
- Six Boxes review to determine whether learning, nonlearning responses, a combination, or further investigation is appropriate.
- Microlearning, courses, or mixed e-learning; Storyline, Rise, or both selected during Design.
- Main and enabling objectives, reviewed Bloom alignment, assessments, instructional support, sequencing, and content mapping.
- Direct text entry and Word (.docx)/PowerPoint (.pptx) source uploads with basic extraction, plus permitted web research. File-size/count limits remain open.
- Tool-specific storyboard skeletons, written scripts/specifications, and complete written job-aid/performance-support drafts.
- Guest comments anchored to specific content, adjustable AI preferences, optional reflection and breaks, autosave, recovery, and version history.
- PDF and editable PowerPoint exports of saved structured content.

### Outside current scope

- Full Implementation and Evaluation modules; administering evaluation, collecting results, and analyzing results.
- Generated images, audio narration, or video. Written narration scripts, media descriptions, and placeholders are allowed.
- Scanned-document extraction/OCR.
- Native authoring-tool project files or automatically built courses.
- Direct reviewer editing, formal reviewer approval gates, and multi-author/team project ownership.
- Implementing recommended organizational or HR changes. Nonlearning recommendations can be documented and handed off.
- Smaller-screen product layouts. The desktop scope does not remove accessibility requirements.

### Permitted pilot material

Initially allow public material, fictional examples, and employer-approved material with confidential and personal details removed. Exclude identifiable employee/customer cases, passwords, and business secrets. Explain this boundary briefly before designers paste or upload material. Employer approval alone does not permit confidential or identifiable material under this pilot policy.

This clarifies the earlier no-confidential-organizational-material assumption. It is a permitted-use rule, not a claim that the app automatically detects or removes sensitive information. Remaining privacy and security policies are still to be agreed.

### Pilot privacy notice and terms

Before real pilot users sign in, provide a clear privacy notice and short pilot terms explaining:

- Who operates the app and how to contact the operator.
- What data is stored and what material is sent to AI.
- What guest-review links expose.
- How to request deletion and any retention limits.
- What material users may submit and their responsibility to review AI output.

Draft these documents once the services and remaining retention details are known. Have the final wording reviewed for the pilot's location and setup before real use. This establishes a pre-pilot requirement; it does not approve final policy wording or settle the remaining retention/service decisions.

## 2. Core stage-to-stage contract

Each stage's designer-reviewed output becomes the input for the next stage and prefills an editable skeleton. Carry accepted decisions, objective/enabling-objective/assessment IDs, sources, constraints, and permitted unresolved questions forward. Designers do not manually transfer the same information between stages.

AI output remains a proposal until accepted. Distinguish designer decisions, source-supported facts, proposed instructional treatments, and unknowns. A reviewed unknown remains unknown. Later changes flag affected downstream content for review, preserve the earlier version, and never silently overwrite accepted work.

Saving, accepting, marking reviewed, sharing, and advancing are distinct actions. AI calls occur through explicit generation/revision actions rather than typing, autosave, or ordinary navigation.

### Saved, reviewed, and accepted for the next stage

- **Saved:** the designer's edits are stored under the saving/recovery rules. Saving does not automatically mark content reviewed or accept it for the next stage.
- **Reviewed:** the designer has checked this specific version. Unresolved questions may remain visible; review does not verify unknown facts or establish Ready for handoff.
- **Accepted for the next stage:** the designer explicitly chooses a specific saved version as the starting point for the next stage. Preserve that version and its reference in the resulting stage content so the input can be identified later. The existing progression rules, including the conditional L2 gate and permitted incomplete handoffs, still apply.

### Changes to earlier work

When an earlier-stage input changes after later content has been created:

1. Preserve the existing later-stage content and the earlier version it was based on.
2. Mark affected later-stage sections **Needs update**, with a reason explaining the changed input. For example, changing the Analysis audience from experienced employees to new hires may affect objectives, explanations, and practice in Design.
3. Let the designer review those sections and choose to edit them manually or explicitly request an AI revision. Do not silently rewrite or automatically regenerate them.
4. Keep unaffected sections' review status. Earlier shared versions and exports remain as they were.

These rules apply across the Analysis → Design → partial Development workflow. Detailed dependency detection and other versioning cases remain to be specified; this approval does not settle those additional audit recommendations.

## 3. Analysis

The agreed questions are in [the Analysis notes](notes/analysis-form-decisions.md). Sections:

1. Project context and performance gap.
2. Evidence and possible causes.
3. Audience and work environment.
4. Stakeholders and project constraints, including review availability and turnaround.
5. Evaluation planning: L4 results → L3 workplace behaviors → L2 learning measures.

Use the exact supporting-material prompt: **“Add documentation of any supporting evidence if available”**. Supporting documents are optional. Do not reintroduce the audience-time question removed from the stakeholder/constraints section.

Capture evaluation measures, baseline/target where known, data source/method, responsibility, timing/frequency, and intended use of findings. Reuse prior desired-performance and source information. Evaluation planning is included even though evaluation execution is excluded.

Core information for a useful Design draft is the task, desired/current performance, and audience. A working title can be supplied or suggested. Saving incomplete work is always allowed. Permitted gaps are summarized before handoff and can remain in an explicitly incomplete draft.

### Analysis output

An editable Analysis brief synthesizes:

1. Project and performance gap.
2. Evidence and possible causes.
3. Audience and work environment.
4. Stakeholders and constraints.
5. Evaluation plan.
6. Open questions and assumptions.

**Do not include the recommended intervention here; it belongs in Design.** The designer reviews/edits the brief, can share it for optional comments, then selects **Generate Design skeleton**.

## 4. Design: performance-solution decision first

Start with a prefilled Six Boxes review using Analysis evidence:

- Expectations and Feedback.
- Tools and Resources.
- Consequences and Incentives.
- Skills and Knowledge.
- Selection and Assignment — Capacity.
- Motives and Preferences — Attitude.

Show evidence, potential issues, and unanswered questions. Treat these as interacting influences, not six mutually exclusive interventions or a diagnosis of individual motivation/capacity. Designer-reviewed routes: learning, nonlearning response, a combination, or further investigation.

After route confirmation, propose interventions and their rationale, contribution, limitations, and dependencies. Document nonlearning recommendations without forcing course production. A selected performance-support deliverable can proceed to a written draft without automatically becoming a learning intervention.

### Conditional L2 gate

Entry into the initial performance-solution review can occur while L2 applicability is unresolved. Once learning is confirmed, L2 measures must be identified and designer-confirmed before instructional Design proceeds; **Not known yet** cannot bypass this requirement. If no learning component exists, use **Not applicable — no learning intervention**, with rationale. Retain relevant L3/L4 planning. Reflect confirmed changes in the linked evaluation-plan record rather than making a separate inconsistent plan.

### E-learning format and tools

Choose microlearning, a course, or a mix; review what each unit/module addresses; then choose Storyline, Rise, or both. If both, identify tool allocation and how components connect. Verify feasibility before producing final build instructions. Do not hardwire microlearning to Rise or courses to Storyline.

### Objectives, enabling objectives, and assessments

Current form order: main/enabling objectives → assessments → content and instructional support → sequence → detailed Design plan. The objective step covers objectives/alignment only; content/support planning is a separate later step.

AI proposes editable main objectives using revised Bloom's taxonomy for cognitive outcomes: Remember, Understand, Apply, Analyze, Evaluate, Create. Show a proposed level for review, based on actual task demand rather than only the verb. Capture observable performance, conditions/resources, success criteria, L2 linkage, and unit/module placement.

Break each main objective into meaningful enabling objectives. Map each to its contribution, essential content, sources, instructional support, practice/feedback, evidence, and sequence. Preserve stable main/child IDs and reviewed Bloom levels. Avoid arbitrary counts or trivial fragmentation. Assess integrated main-objective performance as well as component coverage.

Define assessments during Design: linked objectives/L2 measures, purpose, method, actual prompt/task, options where relevant, expected response/rubric, feedback, scoring, retries/remediation, and completion rules. Not every enabling objective needs a separate scored question; evidence can be shared with explicit mapping. Confidence and commitment measures do not substitute for demonstrated cognitive/skill achievement.

Sequence explanation/examples, practice, assessment, and workplace support. Reuse existing reviewed assessment/practice records rather than duplicating or silently modifying them.

### Sources and content mapping

Ask source questions once for the entire project's content mapping: provided sources/web/both, selected materials, preferred/excluded sources, precedence, content boundaries, and gap handling. Make existing sources available early for relevant drafts; the mapping section consolidates coverage rather than postponing all source use.

AI applies these settings per enabling objective. Designers review matches, resolve specific issues, and can assign an objective-specific source without repeating the whole questionnaire or overriding the permitted source mode implicitly.

Map main objective → enabling objective → required content/source → instructional support → practice/assessment → planned location. Show supported, partially supported, missing, and conflicting statuses. References must support the claims attributed to them. Preserve gaps instead of inventing facts.

### Basic source-file import — approved MVP scope

Accept Word (.docx) and PowerPoint (.pptx) uploads only. Direct pasted/typed source text remains available; permitted web research remains governed by the project's source settings.

Use conventional parsers for basic extraction of available editable text and basic structure. Include PowerPoint speaker notes when present and retain slide references; retain Word section/heading references where available. Read straightforward table text where possible without promising complex table/layout reconstruction.

No OCR, image/diagram interpretation, or faithful layout recreation is included. Imports use conventional extraction and deterministic checks only, with no AI calls. If extraction produces no usable text, show a warning and exclude that file from AI source content. Do not show an extraction summary or extracted-text preview, and do not require an import-review confirmation. The designer can continue with other sources or direct text entry; the warning is not a project-wide progression block.

Use basic non-AI checks on the extracted text, such as checking for empty/whitespace-only content after cleanup. This does not assess meaning, completeness, factual accuracy, or source authority. Later AI tasks use available extracted source content under the agreed source/review rules.

Suggested warning wording: “No usable text could be extracted from this file. It will not be used as an AI source. Upload a Word or PowerPoint file with editable text, or paste the content.”

PDF/TXT uploads and legacy .doc/.ppt conversion are outside this initial import scope. PDF and editable PowerPoint exports remain supported. File-size/count limits and other processing-error details remain open. Extraction summaries and text previews are explicitly outside the import flow.

### Design output and handoff

The reviewed detailed Design plan includes the solution decision, structure/tools, objective hierarchy, defined assessments, learning sequence, content map, evaluation alignment, and open issues. Omit irrelevant learning sections for nonlearning-only routes.

Review solution/deliverables, relevant L2/objectives/Bloom alignment, assessments, structure/tools, and content readiness. Peer review and reflection remain optional. Select **Generate Development sample** from a reviewed version.

## 5. Partial Development

Generate the full deliverable outline/skeleton with one representative section filled in: a few Storyline screens, a Rise lesson/block section, or a written-support section. This is a preview of specifications/written content, not a built course.

Workspace: full outline on the left; selected editable section in the center; optional contextual sources/guidance/issues/comments panel. Display relevant statuses such as outline only, draft, needs review, reviewed, and needs update.

Designer actions: edit directly, **Request changes**, and **Generate full draft**. Changes can concern style/detail/structure/build-note depth. A sample establishes presentation and treatment; use each remaining section's own mapped facts and objectives rather than copying sample content. Preserve accepted sample edits and Design decisions. Upstream changes require linked record review.

The full draft retains IDs, objective/enabling-objective/source/assessment relationships, exact learner-facing content, written scripts where needed, visual/media descriptions, interaction behavior, feedback, build instructions, accessibility requirements, and open issues.

## 6. Review and exports

Export drafts at any point with clear Draft status and visible unresolved issues. **Ready for handoff** is a designer-confirmed state: required review and coverage checks complete, reviewed assessments preserved, tool instructions feasible, and essential accuracy/source/implementation issues resolved.

Clearly specified media placeholders, permitted L3/L4 unknowns, and acknowledged nonblocking dependencies may remain visible. Later relevant changes mark affected sections as needing update. Prior exports remain snapshots of their stated version.

Export PDF and editable PowerPoint from the selected saved structured version without an AI rewrite. PDF is a readable handoff document with complete content, assessment details, production/build/accessibility notes, sources, and outstanding issues. Editable PowerPoint is organized by screen, Rise block group, or written-aid section, using continuation slides as needed instead of squeezing detail into unreadable slides.

Both formats retain project/version/date/tool identification, draft/readiness and section review status, sources, and open issues. Reviewer comments are optional and off by default; when selected, place them in a separate appendix with their original version and target references. Exact page/slide templates and accessible-output verification remain open.

## 7. Guest review, preferences, and breaks

Guest reviewers need no account and can comment on specific sections, objectives, assessments, screens, or blocks. Posting requires a display name, shown with the comment and explicitly unverified. Anyone with an active review link can view/comment on its selected snapshot. Reviews are optional and comments do not directly edit content or approve stage progression.

Each review link stays tied to a fixed shared version. Sharing an updated draft creates a new link; earlier comments retain their original version and target references. Designers explicitly select supporting source material to include; raw uploads and private notes are not automatically shared. Comments do not automatically rewrite content or become accepted AI instructions. Thread/reply/resolution details remain open; see [sharing notes](notes/shared-review-decisions.md).

### Guest-link lifetime

The designer can revoke a review link at any time. Each link expires automatically 14 days after creation. Revocation or expiry ends viewing and commenting through that link while keeping the designer's project and saved comments. A designer can create a fresh link when reviewers need more time; an updated draft still requires a new fixed-version link. Turning off a link cannot recall copies already downloaded.

### Preferences and breaks

Four project-level adjustable preferences: guidance depth, AI contribution, output detail, and additional resources. Preserve essential fields, factual/source rules, reviewed decisions, and human approval at all levels. Optional **Adjust AI assistance** reflection is skippable; controls remain available independently. Changes apply to future generation; revising accepted content is explicit and scoped.

Save/pause throughout. Break reminders are off by default and adjustable/dismissible. Offer quiet pauses or optional accessible activities. Resume at the saved location with a concise recap and next step, without automatically regenerating content.

## 8. Saving, recovery, and project home

Automatically protect edits across all stages. Target online saves about one second after a typing pause, at least every five seconds of continuous typing while connected, immediately for discrete selections, and before normal navigation. Capture device recovery drafts during editing and preserve completed generation results automatically.

Show actual saving/saved/device-only/error status. **All changes saved** requires server acknowledgement. Provide reconnection recovery, version history/undo, conflict protection, and supported warnings for unsynced changes. Autosave never accepts or publishes content; reviewer comment drafts are separate from posting. Timings are implementation targets to verify, not an absolute guarantee against every device/storage failure. Retention and backup policy remain open.

The initial pilot is planned for five instructional designers; this is an expected participant count, not an enforced account limit or concurrency guarantee. Guest reviewers are separate from this count.

The MVP uses an invitation-only pilot: only invited participants may create or activate designer accounts. Public registration is outside scope. Account invitation does not replace the separate account-free guest-review link flow.

Designers sign in, own/manage their projects, and can have multiple projects. Project home shows current stage, saved time, issues, and next action. New projects start with a working title and Analysis; **Continue project** resumes saved work. Invited designers sign in using a one-time code sent to their invited email address. They enter their email, request the code, enter it to complete sign-in, and reach their saved projects. No password creation or password-reset flow is required for this selected method. Requesting a code does not grant pilot eligibility or open public registration; the invitation-only access rule still applies. Manage pilot eligibility through a simple list of approved email addresses maintained by the pilot operator. Only listed email addresses are eligible for designer sign-in, and a valid one-time email code is still required. No dedicated invitation-management dashboard is included in the MVP. Guest reviewers continue to use active shared review links without an account or membership on the pilot list. The list's implementation/storage, authentication provider, remaining code/session handling, and account lifecycle details are still to be specified, subject to the approved code rules below.

### Designer sign-in code limits

- A code expires 10 minutes after it is issued and can complete sign-in only once.
- After five incorrect attempts against a code, it can no longer be used; require a fresh code.
- Allow a resend to the same email address at most once per minute. Issuing a replacement code invalidates the previous code.
- Preserve entered work under the saving/recovery rules when a designer needs to sign in again; reauthentication must not discard recoverable edits.

These limits apply to designer sign-in, not account-free guest review. They do not replace approved-email eligibility. Provider choice, remaining session/account-lifecycle policies, and implementation/validation remain open.

### Designer access removal

Removing a designer's email from the approved list stops new designer sign-ins and ends their existing signed-in designer access. Deactivate active guest-review links belonging to that designer's projects as part of the removal. Their projects remain saved: removing access does not automatically delete their work. Deletion follows the separate owner-request process below.

### Owner-requested project deletion

For the pilot, the project owner asks the pilot operator to delete a project, and the operator verifies the request. Its review links stop working when deletion begins. Within 30 days of the verified request, remove the project, uploads, saved versions, shared snapshots, and comments from the active app.

Backup copies and AI-provider retention require separate rules once those services are chosen. The active-app deletion deadline is not a promise that those copies disappear immediately. This policy does not delete projects automatically when designer access is removed, or require a self-service deletion dashboard. Other retention policies remain open.

## 9. AI process and next work

The expected completion volume is approximately 0–1 complete project per month across the five-designer pilot, interpreting the user's answer to the question about total monthly pilot projects. This is a planning estimate, not a per-designer allowance or an enforced project limit. Ongoing drafts, revisions, AI review, and research can incur AI usage even when no project is completed. Generation frequency, source volume, concurrency, and actual cost per accepted output still require measurement.

The approved monthly AI budget is $20 total for the five-designer pilot, shared across the pilot rather than $20 per designer. This is a spending budget, not an estimate or a promise of a particular number of projects/generations. Hosting, storage, and sign-in email delivery are separate costs; no budgets for those have been approved. Provider/model selection, realistic usage benchmarking, and budget tracking/enforcement details remain open.

Approved spending-control policy: show an in-app warning when total monthly pilot AI usage reaches $16 (80% of the $20 budget). Pause new AI requests that would exceed the $20 monthly pilot budget. Preserve saved work and keep manual editing, review, and non-AI exports available. This is a shared pilot limit, not a per-designer allowance.

### Simple shared AI queue and spending protection

Keep pilot spending control simple, with one shared queue across all designers:

1. Run only one AI job at a time across the pilot; other requested jobs wait.
2. Before starting a job, reserve its maximum allowed cost against the shared $20 monthly budget. Start only when confirmed spending plus money already reserved plus the new allowance fits within $20. The allowance must cover any AI generation, review, repair, or research performed as part of that job; no additional paid call may bypass the allowance.
3. After the job's actual charge is confirmed, record that charge and release any unused reservation.
4. If a job fails or is interrupted and its charge is uncertain, keep its reservation, show **Cost confirmation pending**, and pause further AI requests until the pilot operator checks and confirms the charge. Recover any completed result without generating it again.
5. Require an explicit retry of a failed job rather than automatically retrying it. A retry goes through the same queue and budget check. The existing single targeted quality repair of newly generated content is distinct from retrying a failed job and must fit within that job's reserved allowance.
6. Keep saved work, manual editing, review, and non-AI exports available while AI requests wait or pause.

No separate designer budgets or simultaneous AI-job accounting are required for this pilot. Exact job allowances, monthly reset timing, provider selection, and queue/accounting implementation still require decisions and validation; these planning notes configure no live spending limit or provider account. No per-designer dollar allocation or generation quota is implied.

Use shared rules plus stage/task-specific prompts, approved project context, relevant source passages, examples, structured outputs, and quality checks. Only run the prompts required for the action. Use application validation, focused AI review, and designer judgment; bound repairs and never silently rewrite accepted content.

During each phase's AI integration, revisit prompts, add reviewed examples, test typical and difficult cases, and adjust the approach. Start with prompting/source grounding/evaluation rather than custom model training. Benchmark quality, unsupported claims, designer correction time, cost per accepted output, and latency. No provider/model or numerical quality threshold is selected yet.

### AI-provider use of project content

- Choose an AI service whose applicable terms and settings prevent using project content to train its models.
- Send only the material needed for each requested task.
- Before real pilot use, verify how long the selected service stores that material and explain its retention to designers.
- Do not promise immediate deletion or zero storage unless those claims have been verified for the selected service and configuration.

These are provider-selection requirements, not a provider choice or a claim about any service's current practices. The provider and its exact retention/deletion rules remain to be evaluated and agreed before real use.

Next planned work: desktop wireframes and a representative end-to-end walkthrough, example storyboard/export templates, unresolved product/operational choices, and an implementation brief. App building has not started.

## Refinement: decide the solution before confirming deliverables

After the Six Boxes response decision, use the reviewed Analysis to support a designer-confirmed choice of e-learning, a performance aid, or both, before confirming output types. AI must explain its evidence, rationale, assumptions, alternatives, and unresolved questions. Insufficient evidence may lead to further investigation rather than forced drafting. Check whether existing resources already meet the need.

Derive the output types from that choice: Detailed e-learning storyboard; **Written job aid / performance-support draft**; or both. The latter label replaces “Complete written learning-support draft” and still means complete written content for the aid. Designers refine the scope after the solution decision. Keep this distinct from the Six Boxes learning/nonlearning decision and from later e-learning format/tool choices.

A performance aid’s purpose determines its learning/nonlearning treatment. Confirm any required route/evaluation-plan change explicitly, retaining relevant L3/L4 measures and recording L2 as not applicable only for a route with no learning component. Do not force aid-only work through e-learning format or tool questions, and do not force nonlearning aid work through learning objectives/assessments. Preserve previous versions and flag affected downstream content for review.
