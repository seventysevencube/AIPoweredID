# Instructional Design Workspace — Working Requirements

Updated: October 16, 2026

Status: Requirements discussion. App development has not started. Confirmed decisions and proposals are separated below.

## Confirmed scope

- Audience: novice and experienced instructional designers using a common workflow with adjustable guidance.
- Use cases: workplace e-learning and performance support.
- Platform: desktop web experience. Smaller-screen product layouts are outside the current scope; accessibility requirements still apply.
- MVP stages: Analysis, Design, and partial Development.
- Later roadmap: Implementation and Evaluation stages. Preserve the ability to add these later.
- Primary MVP deliverable: detailed storyboards with the information required to build in the selected authoring tool.
- Supported authoring tools: Storyline 360 and Rise 360. The instructional designer chooses during Design. Exact supported versions and maintained capability references remain to be specified.
- Reference project for cost and workflow benchmarking: approximately five minutes of learner time, moderately interactive. This is a benchmark, not an agreed maximum course length.
- Performance-support deliverable: a complete written draft, including job aids when appropriate. Final graphic production remains outside the confirmed deliverable.
- Generated images, audio narration, and video are outside MVP scope. Written narration scripts, media descriptions, and asset placeholders remain within the storyboard requirements where relevant.
- Collaboration: comments on a shared draft. Reviewer editing and formal approval workflows are outside the agreed initial collaboration scope.
- Accessibility: WCAG 2.2 AA acceptance target, with keyboard and assistive-technology verification.
- Optional pause-and-resume support, including optional break activities and a recap on return.
- Current data assumption: no confidential organizational information. Authentication, link access, retention, and deletion policies remain undecided.
- Sources: pasted/entered text and file uploads, initially Word documents and text-based PDFs. Scanned-document extraction/OCR is out of scope. Exact file extensions, size limits, and handling of embedded non-text content remain to be specified.

## Confirmed design principles

- Each stage's designer-reviewed output becomes the input for the next stage and prefills an editable skeleton of that stage's form or deliverable. Designers review, revise, and add detail before proceeding; they do not start with a blank form or manually transfer accepted information.
- Handoff preserves approved decisions, stable objective/assessment IDs, sources, constraints, and unresolved questions. AI-generated additions are marked as proposals and unsupported assumptions remain visible. A skeleton can include populated suggestions as well as clearly identified gaps.
- Human review determines what becomes the accepted basis for the next stage; AI output is a proposal.
- Designers can revisit earlier decisions. The workflow must allow iteration.
- Analysis can conclude that training alone is insufficient or that performance support or another intervention is appropriate.
- Maintain connections between objectives, assessments, activities, content sources, and development assets.
- When an upstream decision changes, flag affected downstream work and propose updates for review; preserve accepted work.
- Assessments are defined and identified during Design, linked to objectives, and carried into the storyboard. Development must not silently introduce new assessments or change approved assessment intent or criteria.
- The AI creation and quality process is an agreed starting approach. During AI integration in each phase, revisit the relevant prompts, add reviewed examples, test outputs and quality checks, and refine based on evidence. Each phase uses task-specific prompts on top of shared rules and relevant approved project context; only prompts needed for the selected action should run.

## Requested workflow

1. Collect analysis of the performance gap, audience, stakeholders, and constraints; include evidence and success measures.
2. Use reviewed analysis to propose an editable Design form: objectives, assessments, objective–assessment alignment, activities, delivery method, and a choice of Storyline 360 or Rise 360. Define and review assessments here before carrying them into Development.
3. Provide contextual guidance, checklists, linked resources, and optional breaks during review.
4. Suggest peer review when useful and allow the designer to create a share link.
5. Optionally invite reflection on AI output and preferences for AI involvement, output format/detail, and resources.
6. Create a detailed design plan and content map using designer-provided documents, selected web sources, or both, as chosen by the designer.
7. Repeat review, optional collaboration, and optional reflection.
8. Produce detailed tool-specific storyboards and written scripts, carrying forward the approved assessments; produce complete written job aid/performance-support drafts where selected.

## Proposed desktop experience — pending confirmation

- Left navigation for stages, sections, and review status.
- Central work area for logically grouped form questions and focused review tasks.
- Optional contextual guidance panel that can be collapsed.
- Separate form-entry and AI-review views; avoid displaying every tool at once.
- Autosave, save-and-resume, version history, and undo.
- Keep guidance preferences independent from AI contribution preferences.
- Review storyboards one screen/interaction or support section at a time, with an outline for navigation and an accessible linear view.

## Confirmed storyboard contents

- Project and module outline, audience, objectives, delivery assumptions, and source references.
- Stable screen/section IDs and linked objective IDs.
- On-screen text; written narration/script where needed. No generated audio.
- Visual and media descriptions, asset references, and production status.
- Interaction behavior: actions, states, branching, feedback, and navigation.
- Assessment IDs, linked objectives, prompts, response options, correct responses or scoring rules, feedback, and completion criteria as applicable, defined during Design and carried forward with references to the reviewed version.
- Accessibility requirements such as text alternatives, caption/transcript needs, focus order, and keyboard behavior, as applicable.
- Tool-specific build instructions tied to a selected authoring tool and supported version.
- Clearly flagged assumptions, missing assets, and unresolved decisions. These must remain visible in exports.
- Performance-support documents use an appropriate task/decision structure rather than forcing a slide sequence.

## Confirmed exports

- Store one approved structured storyboard and format it into PDF and editable PPTX using templates.
- Re-exporting unchanged content should require no AI generation. Export processing, storage, and hosting still have costs.
- Treat PDF/PPTX as handoff documents. Native authoring-tool files and automatic course construction are separate potential future scope.

## Confirmed AI cost controls

- Use text, media specifications, and placeholders. Generated images, audio narration, and video are out of scope.
- Trigger AI generation on explicit user actions, not every keystroke.
- Support regenerating selected sections using relevant approved context; check downstream alignment after changes.
- Generate an outline or sample screen before a full storyboard, so designers can resolve major direction changes earlier.
- Reuse processed sources and use selected relevant material for generation, preserving references.
- Track project usage, including retries and research calls. Budget controls and user-facing usage presentation remain undecided.
- Set a monetary estimate only after choosing a provider/model and testing a representative project, source set, and revision cycle.

Cost guidance reviewed: https://developers.openai.com/api/docs/guides/cost-optimization and https://developers.openai.com/api/docs/pricing. These inform proposals; they do not select an AI provider.

## Open decisions

1. Precise reference scenario for the agreed five-minute, moderately interactive benchmark, including source volume and revision frequency. Proposed starting point: one brief workplace scenario, two practice decisions with feedback, and one short assessment, with the final assessment count determined during Design.
2. Tool-specific storyboard templates and supported capability/version references. Proposed Storyline structure: scenes, slides, layers, states, and triggers as applicable. Proposed Rise structure: lessons, ordered blocks, interactions, and knowledge checks/quiz settings as applicable. A change of tool should prompt a compatibility review of the approved design.
3. Upload size limits and handling of tables, embedded images, and files with little or no extractable text; no OCR.
4. Owner sign-in, reviewer identity, and share-link access/revocation behavior.
5. Confirm the proposed desktop review layout.
6. Review the proposed Analysis and Design questions in `proposed-form-structure.md`, including required/optional behavior, assessment identification, item drafting, scoring, and review behavior during Design.
7. Refine the agreed AI creation and quality approach in `proposed-ai-quality-process.md` during each phase's AI integration: stage/task prompts, reference examples, source rules, output structure, quality criteria, validation, bounded revision, and benchmark testing. Exact prompts, examples, model choices, and thresholds remain open.

Authoring references reviewed: https://www.articulate.com/360/rise/all/ and https://community.articulate.com/kb/storyline-360-onboarding/getting-started-with-storyline-360/1217306. These support tool-specific template proposals; exact feature support still needs checking when the templates are specified.

