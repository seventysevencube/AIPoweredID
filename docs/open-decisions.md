# Open Decisions and Next Steps

Updated: October 17, 2026. Items below are unresolved details, not approved additions to MVP scope.

## Next design work

1. Draft a technical build plan for the agreed MVP: application/data structure, sign-in and approved-email access, hosting/storage, AI connection, spending controls, and delivery order. Confirm the non-AI operating budget before recommending services. The user deferred the example walkthrough for now; it is not the current prerequisite for this planning step.
2. Deferred at the user's request: the fictional complaint-routing walkthrough and its source/Analysis review. Retain the draft and revisit examples during the agreed phase-by-phase AI integration/quality work.
3. When example review resumes, create/review the Design skeleton, main/enabling-objective map, assessments, Storyline screen, Rise block sequence, and complete written job aid. No example content has been approved by the deferral.
4. Review representative PDF/PPTX page/slide templates, long build notes, source/open-issue appendices, accessible document structure, and the optional comment appendix. Contents/organization and comments optional/off by default are approved.
5. Refine the implementation brief as the representative examples, remaining policies, and export layouts are reviewed. Building requires the user's subsequent instruction.

## Product and operational choices

- Hosting, storage, and sign-in email operating budget, separate from the approved $20/month AI budget. No non-AI budget or technical service is selected yet.

- Actual generation/revision/source volume, concurrency, and budget accounting/reset/enforcement implementation; expected completed output is approximately 0–1 total project/month for the pilot, not a quota; five designers, a total monthly AI budget of $20, an in-app warning at $16, and pausing requests that would exceed $20 are approved, without a hard account cap or per-designer allocation. Approved-email-list storage/maintenance implementation, authentication provider, code/session handling, and remaining account lifecycle details (including access removal and existing sessions) remain open. A simple approved-email list, one-time email-code sign-in, invitation-only access, one project owner, and multiple projects are agreed. No dedicated invitation dashboard is included. Account-free guest review links remain separate.
- Guest link revocation/expiry and remaining lifecycle details; whether replies/resolution should be added later. Required unverified display names, fixed-version links, and new links for shared updates are now approved; do not expand collaboration scope by implication.
- Default settings for the four AI assistance controls and final reflection UI. Break reminders are already off by default.
- Upload size/count limits, straightforward table-text behavior, and remaining processing errors. The no-usable-text case is settled: deterministic warning/exclusion, with no AI, summary, text preview, or import-review gate. Source formats are settled: .docx/.pptx only, using basic extraction. No OCR, image/diagram interpretation, or complex layout reconstruction; PDF/TXT uploads and legacy conversion are outside initial scope.
- Exact supported Storyline/Rise feature/version references and feasible combined-tool handoffs. Native authoring project generation remains excluded.
- Version retention, backup/recovery objectives, local draft retention, deletion, and actual autosave/recovery failure testing.
- Handling of essential versus nonblocking open issues within agreed readiness rules; concrete validation messages and examples.
- Exact sample size/selection rules for each deliverable. Do not set a universal screen count from the five-minute benchmark.

## AI integration work, revisited for every phase

- Provider/model selection, API configuration, cost tracking, limits, and error handling.
- Production prompt templates and output structures for individual tasks, including Six Boxes routing, the conditional L2 gate, Bloom/main/enabling objectives, assessment alignment, and source mapping.
- Reviewed positive/negative examples, held-out test cases, rubrics, quality thresholds, bounded repairs, and recovery from refusal/truncation/failure.
- Source retrieval/citation support checks and treatment of conflicting evidence or instructions embedded in reference documents.
- Realistic cost benchmark covering source volume, revisions, retry/review calls, research, and full-draft size against the approved $20/month pilot AI budget. No workload cost estimate or output quota is approved.

## Scope guardrails

Implementation and evaluation execution remain later scope; evaluation planning stays included. Do not add generated media, OCR, native course files, verified reviewer accounts, or team coauthoring by implication. Unknown details do not authorize overwriting reviewed content or manufacturing missing facts.

Saving these notes to GitHub is documentation work. Application development, deployment, and AI connections have not started.





