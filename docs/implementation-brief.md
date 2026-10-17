# MVP Implementation Brief

Updated: October 17, 2026.

Status: planning consolidation for review. The product requirements summarized here are approved; the suggested delivery order is a proposal. This document does not authorize application development, deployment, or AI connections.

## Product outcome

Help workplace instructional designers move through Analysis, Design, and partial Development using an adjustable, guided desktop workflow. Each accepted stage output seeds an editable skeleton for the next stage. Support novice and experienced designers without requiring duplicate entry.

Deliver detailed Storyline/Rise storyboard specifications and complete written job-aid/performance-support drafts. Implementation and evaluation execution remain later scope. Evaluation planning is included.

Use [current requirements](requirements.md) and the [detailed notes](README.md) for exact questions, exceptions, and decision precedence. The [screen review record](ui/screen-review-status.md) distinguishes approved patterns from pending layouts.

## Approved workflow

1. **Project home:** designer-owned projects, card layout, visible save/progress information, and resume at the saved location.
2. **Analysis:** performance gap/evidence, audience/work context, stakeholders/constraints including review availability, and L4/L3/L2 planning. Review the Analysis brief. Intervention recommendations belong in Design.
3. **Performance solution:** use Six Boxes evidence/hypotheses to confirm learning, nonlearning, both, or investigation. Confirm L2 before instructional Design; documented N/A applies only to a route with no learning component.
4. **Solution and structure:** choose e-learning, performance aid, both, or investigation before deriving deliverables. For e-learning, choose microlearning/course/mix, then Storyline/Rise/both and component allocation.
5. **Instructional Design:** main and enabling objectives using reviewed Bloom alignment → assessments/practice → content and instructional support → sequence → detailed Design plan. Keep the objective step focused on objectives/alignment; project-wide source settings are not repeated per objective. Nonlearning work uses appropriate task/performance requirements.
6. **Development sample:** show the full skeleton plus a representative section. Edit directly or request scoped changes. Sample-treatment acceptance is separate from factual verification. Missing facts remain visible; structural samples are not complete factual drafts.
7. **Full draft and review:** explicitly generate remaining content using its own mapped requirements and preserve accepted sample edits. Review individual sections. Keep Design-owned assessment tasks, answers, feedback, rubrics, and retry rules linked; material changes require Design review.
8. **Optional guest review:** account-free review of a selected fixed-version snapshot, with required unverified display names and anchored comments. Sharing an updated version creates a new link; earlier comments keep their original version/target. Select supporting materials explicitly.
9. **Export:** PDF handoff document or editable PowerPoint storyboard from the selected saved structured content, without an AI rewrite. Draft exports retain visible gaps. Ready for handoff is a separate designer-confirmed state with essential issues resolved.

## Designer access — approved pilot scope

Designer access is an invitation-only pilot. Only invited participants may create or activate designer accounts; open public registration is outside the MVP. Each designer still owns their own projects and may save multiple projects. Guest reviewers do not need a pilot invitation or an account: an active shared review link grants the agreed view/comment access to its selected fixed-version snapshot, not designer account access.

Invited designers sign in using a one-time code sent to their invited email address. They enter their email, request the code, enter it to complete sign-in, and reach their saved projects. No password creation or password-reset flow is required for this selected method. Requesting a code does not grant pilot eligibility or open public registration; the invitation-only access rule still applies.

Invitation administration, the authentication provider, code/session handling, and remaining account lifecycle details are still open. These decisions do not add an admin console or authorize sending real emails, creating accounts, or deploying the app.

## Content and state contracts

Preserve stable record IDs, accepted decisions, objective/enabling-objective/Bloom relationships, defined assessments, source references, content mappings, sequence placements, tool allocation, and open issues across stages.

Keep these meanings separate:

- Saving protects edits; it does not accept an AI proposal, approve a stage, publish, or share.
- Reviewed records a designer's review of the current draft; unresolved facts remain unresolved.
- Ready for handoff requires the agreed review/coverage/source/answer/tool checks, not merely completed fields or review flags.
- Shared links and exports represent specific versions. Later relevant changes preserve older versions and flag affected downstream content for review.

Guest comments remain feedback, not direct content edits or automatic AI instructions. Source files remain evidence, not application instructions.

## Approved source imports

Support Word (.docx) and PowerPoint (.pptx) uploads using basic extraction of editable text and structure, including available speaker notes and useful source references. Direct text entry and permitted web research remain available. Use conventional parsing and deterministic checks, without AI, for imports. Show a warning when no usable text is extracted and exclude that file from AI source content. No extraction summary, text preview, or import-review confirmation is required; the designer can continue with other sources or direct text entry. Do not infer image/diagram meaning. PDF/TXT source uploads, legacy format conversion, OCR, and complex layout reconstruction are outside the initial import scope. PDF/PPTX export support is unchanged. Size/count limits and other processing-error details remain open.

## Saving and accessibility

Target device recovery capture during typing, server saves about one second after a pause, at least every five seconds of continuous typing while connected, immediate discrete saves, and navigation flushes. Only server acknowledgement permits an all-changes-saved claim. Protect unsynced work, completed AI results, undo/history, and conflict recovery. Retention and failure recovery still require decisions and testing.

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

Explicit generation/revision actions initiate AI work. Typing, autosave, navigation, and document export do not. Bound repair attempts; preserve accepted work and completed results if generation fails. Show unsupported/conflicting facts and require explicit review of material upstream changes.

Provider/model, costs, budgets, numerical quality thresholds, production prompts, and retrieval implementation remain undecided. Benchmark against the approximately five-minute, moderately interactive workplace reference; it is not a project duration limit.

## Suggested delivery order — proposal

1. Finish the representative end-to-end examples and export layout review; settle source size/count limits and other import-error handling and critical account/sharing/recovery policies.
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

See [open decisions](open-decisions.md). Priorities include upload size/count limits and other import-error handling, reviewed reference content/export layouts, sign-in implementation and invitation administration, remaining link lifecycle controls, retention/recovery policy, Storyline/Rise feasibility, AI/provider/budget choices, and production quality thresholds.

Generated images/audio/video, OCR, native course files, direct reviewer editing, team coauthoring, and evaluation execution remain outside the approved MVP. Replies, resolution, and other collaboration additions are not included by implication.
