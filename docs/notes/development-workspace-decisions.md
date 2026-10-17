# Partial Development Workspace — Decisions

Updated: October 17, 2026

Status: Workspace, sample review, full-draft review, and export-readiness approach agreed; exact document templates and optional inclusion of reviewer comments remain open. No app development has started. Synced project sources remain read-only.

## Confirmed input and scope

- The reviewed detailed Design plan seeds the full deliverable skeleton. Preserve sources, IDs, objective/enabling-objective links, Bloom levels, reviewed assessments, tool allocation, and visible unresolved issues.
- Retain the action label “Generate Development sample.” Generate one representative populated section within the full visible skeleton for review before full drafting.
- Storyline uses relevant scene/slide/build specifications; Rise uses lesson/block specifications. When both tools are selected, retain component allocation and connection requirements.
- Performance-support deliverables are complete written drafts using appropriate task/decision structures.
- Generated images, audio narration, video, and native authoring-tool projects are outside current scope. Written scripts, media descriptions, and placeholders remain allowed.
- PDF and editable PowerPoint exports are confirmed, generated from saved structured content.

## Agreed workspace

- Left: full outline of the selected deliverable, grouped by module, tool/component, or support section as appropriate. Use text statuses such as “Outline only,” “Draft,” “Needs review,” and “Reviewed.” A reviewed sample must not mark untouched sections reviewed.
- Center: selected screen, block, or support section, with editable structured fields. Show exact learner-facing text separately from build instructions. Keep applicable source, objective, enabling-objective, and assessment links available for inspection.
- Optional contextual panel: guidance, sources, coverage issues, and reviewer comments. Preserve essential errors and required actions in the main workspace; avoid opening every type of help simultaneously.
- Visible save and generation states. Ordinary navigation and saving do not call AI. Preserve prior accepted work if a generation fails or is interrupted.

## Agreed sample-review actions

1. Edit the sample directly. Autosave edits; separate saving from explicit acceptance of its structure/treatment as the basis for full drafting.
2. “Request changes”: ask what should change and show the intended revision scope (selected section, shared style/template, or affected Design records). Offer controls for writing style, detail, structure, and build-instruction depth plus free text. Only offer scopes relevant to the request.
3. “Generate full draft”: use the reviewed sample, confirmed style/structure preferences, and reviewed Design plan to fill the remaining skeleton. Do not overwrite accepted sample edits. A sample illustrates presentation/treatment; do not duplicate its factual content into unrelated sections.

A proposed sample change affecting objectives, reviewed assessment content/scoring, intervention scope, sources, or tool allocation must flag the linked Design records for explicit review. Do not silently rewrite accepted upstream decisions. General style revisions must still honor evidence, assessment, and accessibility rules.

Generation must be explicitly triggered. Generate only the requested content, show remaining gaps, and preserve accepted sections. Newly generated sections remain drafts, even when they follow a reviewed sample.

## Agreed full-draft review approach

- Review and edit one section at a time using the full outline for orientation.
- Allow targeted AI revisions and optional peer comments, preserving versions and accepted content.
- Keep source/coverage gaps visible and identify sections that were changed or not yet reviewed.
- Reuse the same reviewed structured content for PDF/PPTX export; exports do not initiate a new AI rewrite. The agreed export-readiness rules are recorded below.

The user approved the workspace, sample-review actions, full-draft generation, and section-by-section review approach, and asked to proceed with the requirements discussion.

## Full-draft review and export rules — agreed

- Review sections individually and keep accepted edits, version history, source links, and objective/assessment references intact.
- Proposed section states: draft, needs review, reviewed, and needs update. A relevant upstream change marks affected reviewed sections as needing update and preserves the previous version.
- Proposed export policy: permit PDF/PPTX exports of incomplete work, explicitly labeled “Draft,” with unresolved issues and review status visible. A draft export does not mark content reviewed or establish factual accuracy.
- Proposed “Ready for handoff” status is a designer-confirmed state supported by checks: required sections reviewed, objective/enabling-objective coverage reviewed, approved assessments preserved, and no unresolved essential content/answer/scoring/tool/source conflict preventing implementation. For a storyboard, this means ready to support authoring; for a written performance-support draft, it means ready for the next agreed production/review step. This is not a claim that a course has been built or evaluated.
- Missing final media assets with clear specifications/placeholders, permitted unknown L3/L4 details, and other acknowledged nonblocking production dependencies can remain visible in a ready handoff. The app must not decide that a critical issue is nonblocking merely because other fields are complete.
- Export the selected saved content version. Include project title, version/date, tool/component identification where relevant, and a source/open-issues appendix or equivalent accessible presentation. Preserve the hierarchy, assessment links, and build specifications; avoid squeezing detail into unreadable PPTX slides.
- A later relevant change invalidates the current ready status for the affected content until reviewed again. Earlier exports remain snapshots of their stated version.
- Exports format the saved structured content without AI rewriting. Exact templates and whether reviewer comments should be optionally included remain to be specified.

The user approved draft exports and the reviewed “Ready for handoff” state, including review checks, version/date/tool identification, sources/open issues, and marking affected content as needing update after relevant upstream changes. Exact PDF/PPTX templates and optional inclusion of reviewer comments remain to be specified.

## Development sample workspace — screen pattern approved

The next wireframe presents Written aid, Storyline, and Rise examples through the preview's comparison controls. These are separate example deliverables, not an in-product tool selector; project tool choice remains in Design. The aid example continues the structural sample from the prior screen. The tool examples illustrate alternative specification structures rather than changing that sample project's approved deliverables.

- Full outline on the left; one sample section in the center; Sources & links or Guidance in an optional panel.
- Written aid separates exact written content from layout/use and accessibility notes. Storyline separates on-screen text, optional written narration, interaction/state/layer/trigger requirements, and asset/accessibility specifications. Rise separates learner text, proposed block order/types, build/navigation instructions, and asset/accessibility specifications. Tool capabilities still require verification during implementation.
- All examples retain visible placeholders for missing approved procedures. Fictional sample evidence is not treated as verified organizational content. Existing assessment records are linked and are not silently rewritten.
- Direct editing preserves the local sample and clears its prior treatment acceptance. Accept sample confirms the sample's treatment as the basis for later drafting; it does not verify sources or mark other sections reviewed.
- Request changes exposes scope, writing style, content detail, structure, build-instruction depth, and free text. The preview only records an unsent request. Requests affecting upstream decisions must return to explicit Design review.
- Generate full draft opens readiness review. This illustrative dataset has essential source/answer/practice gaps, so factual generation remains on hold; sample edits are preserved. Full-draft review/export layouts remain subsequent work.

The user subsequently approved this screen pattern. It is not a production implementation. Preview state is local/illustrative. Structural and script-syntax checks do not establish browser runtime behavior, accessibility conformance, persistence, or instructional accuracy.


## Development sample workspace — approval recorded

The user approved the sample-workspace screen pattern, including the Written aid, Storyline, and Rise examples, direct edits, separate sample-treatment acceptance, revision requests, and visible source/readiness flags. This does not verify the fictional instructional content or select a different authoring tool for a live project.

## Full-draft review and readiness — new UI proposal, awaiting review

The next standalone wireframe uses the Storyline example to examine section review, linked records, and handoff checks. It illustrates the review screen with structural draft/sample data; it does not claim that the preceding source blockers were resolved or that a full factual draft was generated. The same review approach is intended for Rise blocks and written-aid sections, with output-specific content/build fields.

- Keep the full outline, stable screen IDs, objective/Bloom/assessment links, and individual Draft / Needs review / Reviewed / Needs update statuses visible. The accepted sample treatment remains identified; remaining sections are not automatically reviewed.
- Direct edits clear the affected section's review status. Show the prior edit snapshot and restore it as a new draft revision, preserving essential issue flags. The preview retains one earlier snapshot only; production history retention and recovery remain open implementation work.
- Allow the designer to mark review complete while open issues remain, using the explicit label “Mark reviewed with open issues.” This records review of the current draft, not source verification or readiness. The user has not yet approved this exact interaction.
- Show linked assessment/practice task, expected response, feedback, scoring, and retry rules as Design-owned records. Editable storyboard build notes do not alter those records. Changes to their intent or content require explicit Design review. The fictional written-response examples retain the facilitator/collection feasibility issue.
- Targeted revision requests remain tied to the selected section. The preview records unsent requests without running AI or rewriting content.
- A review summary lists sections needing attention and essential source, answer, routing-practice, and tool/process issues. These issues block Ready for handoff even if every section is marked reviewed; acknowledgement alone cannot remove the blockers. No bypass or factual source approval is simulated.
- Draft PDF/PPTX export remains permitted under the agreed policy. This preview only captures an illustrative export summary of the current structured version with its review status and open issues; it produces no document file. Actual templates and guest-comment screens are still to be reviewed.

Only the earlier sample-workspace pattern is approved at this checkpoint. The full-draft review screen and its exact controls are proposals. Static fragment/script checks do not establish browser runtime behavior, accessibility conformance, real autosave, version recovery, or instructional accuracy.

