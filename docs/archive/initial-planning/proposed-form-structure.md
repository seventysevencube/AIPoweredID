# Proposed Analysis and Design Forms

Status: Discussion draft, not yet approved. Builds on the confirmed working requirements. No app development has started.

Confirmed handoff requirement: each stage's designer-reviewed output becomes the input for the next stage and prefills an editable skeleton. Analysis seeds Design; reviewed Design, including defined assessments and the content map, seeds the storyboard or performance-support draft. Designers review, revise, and expand each skeleton before proceeding. Preserve sources, IDs, constraints, and unresolved questions, and distinguish carried-forward decisions from new AI proposals.

## Shared form behavior

- Group related questions into short sections. Use the same workflow for novice and experienced designers, with optional explanations and examples.
- Keep guidance depth separate from AI contribution preferences. Designers can write directly, ask for suggestions, or request a draft.
- Autosave without triggering AI generation. Provide a visible save state, manual save, and resume recap.
- Allow “Not known yet” and “Not applicable” where meaningful. Missing evidence must remain an unresolved question, not an invented fact.
- Save incomplete work. Before generating the next stage, summarize missing information and assumptions and let the designer resolve them or explicitly proceed with an incomplete draft.
- Required to start a useful Design draft: a project name, a description of desired versus current performance, and an initial audience description. These are proposed generation prerequisites, not prerequisites to saving.
- Cite source passages when suggesting project-specific facts. Distinguish designer input, source-supported content, and AI assumptions.
- Provide section-level review, optional comments on a shared version, and optional reflection before moving forward.

## Analysis

### A1. Project context

- What is the working project title?
- What prompted this request?
- What workplace task or performance problem are we addressing?
- What outcome would make this project worthwhile?

### A2. Performance gap and evidence

- What should people be able to do?
- What are they doing now, and where does performance differ?
- What evidence supports this gap? Enter a description and optionally attach a source.
- What might explain the gap? Offer knowledge/skill, process, tools/access, expectations, incentives, other, and unknown as editable possibilities.
- What has already been tried, and what happened? Optional.

AI review proposal: summarize the gap, identify missing evidence, and suggest training, performance support, a combination, further investigation, or another intervention for designer review. Do not assume a course is always needed.

### A3. Audience and work environment

- Who performs the task? Allow more than one audience group.
- What do they already know, and where do they need support?
- When and where will they learn or use the support?
- What devices, connectivity, languages, and accessibility needs should shape the solution?
- Are there differences between audience groups that require separate paths? Optional.

### A4. Stakeholders and constraints

- Who can validate subject-matter accuracy, and who makes project decisions? Names or roles can be recorded without sending invitations.
- What deadlines, learner-time limits, budget, technology, or production constraints apply?
- What existing material can be reused?
- What is explicitly outside this project?

### A5. Evidence of success

- What observable change would indicate success?
- Is there a current baseline or target? Allow unknown.
- What evidence could realistically demonstrate improvement?

These are planning inputs, not an Implementation or Evaluation module. Those stages remain on the later roadmap.

### Analysis review and handoff

Show an editable analysis brief containing the performance gap, evidence, audience, constraints, success indicators, recommended response, and unresolved questions. The designer reviews it before requesting a Design draft. Source statements that are uncertain must remain visibly uncertain.

## Design

Prefill suggestions from the reviewed Analysis brief, with explanations on request. Do not ask designers to re-enter unchanged information.

### D1. Solution and authoring approach

- Are we designing e-learning, performance support, or both?
- For e-learning, which authoring tool will be used: Storyline 360 or Rise 360? The designer chooses; AI may explain options.
- What is the target learner time? Carry forward Analysis constraints; five minutes is the reference benchmark, not a fixed limit.
- What style, tone, and organizational requirements should the draft follow?

For performance-support-only projects, omit the authoring-tool question and irrelevant course settings. Ask instead about the support format, such as checklist, task guide, decision guide, or troubleshooting aid.

### D2. Learning or performance objectives

- What must the learner or user be able to do?
- Under what conditions will they perform it?
- What level of performance is acceptable?

Give each objective a stable ID and map it to the relevant performance need. AI can suggest measurable wording, but the designer approves the intended outcome.

### D3. Assessments and practice

- For each objective, what task or response would demonstrate achievement?
- Is this practice with feedback, a scored assessment, or another form of evidence?
- What are the question/task, response options where applicable, expected response, and feedback?
- What scoring rubric, pass criterion, retry rule, or completion condition is needed? Show only relevant settings.
- Is this feasible in the selected authoring tool and within the project constraints?

Define and identify assessments here. Assign stable assessment IDs, link them to objectives, and include item/task text, answers or rubrics, and feedback in the Design review. Allow an explicitly marked draft when information is unresolved. Any new assessment or change proposed later must return to this record for review.

For a job-aid-only project, ask how the aid's usefulness and task accuracy will be checked; do not require a scored quiz by default. Mark course assessment fields as not applicable with a rationale where appropriate.

### D4. Learning activities and sequence

- What explanation, example, practice, and feedback does each objective need?
- What workplace scenario would make the content meaningful?
- What order supports task performance?
- What interactions are appropriate to the selected tool, accessibility needs, and learner-time target?

Show an alignment matrix: objective → activity → assessment/evidence → content/source. Flag gaps for review rather than quietly filling them with unsupported material.

### D5. Sources and content map

- Should the draft use provided sources, selected web research, or both?
- Which pasted text or uploaded files should be used?
- Which sources take precedence if they disagree?
- What content is essential, optional, or excluded?

Preview extracted text and identify sources with little or no usable text. Explain that scanned text cannot be extracted and offer text entry or another file. Do not imply that embedded figures were understood if only text was extracted.

Proposed content-map fields: objective ID, topic/task, source reference, activity, assessment ID where applicable, planned screen/block/support section, and unresolved content needs.

### D6. Design review and handoff

Show the design brief, selected tool or support format, objectives, assessments, alignment matrix, sequence, content map, accessibility requirements, and unresolved decisions. Offer optional peer review, optional reflection, and a sample storyboard screen/block or job-aid section before full drafting.

The storyboard carries forward the approved assessments and adds placement and build instructions. If an objective, assessment, source, or tool changes, flag affected work and ask the designer to review proposed revisions without overwriting accepted content.

## Remaining product decisions

- Confirm the proposed form sections and minimum information needed for generation.
- Define sharing access and reviewer identity; recommending a peer review must not send an invitation automatically.
- Define document size limits, table extraction expectations, and treatment of embedded non-text content.
- Select a reference project/source pack and a revision allowance to measure cost. Do not invent a dollar estimate before these and an AI provider/model are selected.
