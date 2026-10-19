# Demo AI vertical flow — October 19, 2026

The user prioritized a demo in approximately one hour, tabling broader queue work. This implements a bounded vertical flow rather than declaring Milestones 2–3 complete. Current requirements remain authoritative; other audit findings, the full fictional walkthrough, and the second-account live test remain deferred.

## Implemented

- Existing seven Analysis input pages feed an explicit Generate Analysis brief action. Four core provided answers are checked against the exact saved revisions on the server. The six-part brief is editable and autosaved.
- A designer reviews and accepts a specific saved brief version before Design generation. Acceptance is distinct from saving. Referenced versions are retained beyond the ordinary ten-version history.
- A separate AI performance-solution proposal considers learning and other performance responses. The designer chooses the response, deliverable, e-learning format, and Storyline/Rise/both.
- Instructional Design requires a current, provided learning indicator in the canonical Analysis record plus explicit designer confirmation tied to that record's revision. Nonlearning-only work requires a rationale.
- One Design generation produces editable objectives/enabling objectives, assessments, content mapping, sequence and detailed-plan pages. AI output cannot accept decisions or overwrite existing drafts. New results are retained separately when a destination contains work.
- The existing recovery/autosave controller is reused for all new pages. Section navigation preserves drafts. Conflicts require review; ordinary history shows the latest ten versions.
- OpenAI Responses API, GPT-6 Luna, strict structured output, server-only key, no external tools and `store:false`. Generation, focused review, and at most one repair have separately committed call intents. No transport retries or automatic model escalation.
- Shared one-job queue and integer micro-dollar ledger protect a $20 period, with $16 warning and maximum reservation of $0.15 per pipeline. Conservative booked usage includes the potential cache-write input premium. Unknown charge outcomes retain reservations and pause the affected ledger for operator reconciliation.
- Private Netlify background execution allows processing while the page stays usable. Job/result polling never calls the provider. A signed-in owner can wake the queue; worker/accounting operations are not browser routes.

## Sources checked during implementation

- [OpenAI structured output](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses): refusals/incomplete output must be handled; schema adherence does not establish factual correctness.
- [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna): Responses, structured output, low reasoning; standard input $0.10/M, cache writes $0.125/M, output $0.50/M, with higher long-context rates above 272K. The demo transport caps the serialized request at 90KB plus envelope allowance and output at 8K, comfortably below the reserved ceiling, and requests Standard/default processing.
- [Netlify background functions](https://docs.netlify.com/build/functions/background-functions/): credit-based Free supports background execution, up to 15 minutes. Platform invocation acknowledgement is not task completion; app jobs and saved results determine status.

## Verification and setup record

- Unit/integration checks cover ownership, pinned inputs, core readiness, budget reservations, concurrent workers, replay/fencing, uncertain cost handling, version retention, strict HTTP allowlists, schema/refusal handling, canonical learning confirmation and nonlearning rationale.
- Existing three browser workflows passed, including saving, offline recovery, two-tab conflicts, keyboard access and desktop reflow. The additional Design browser workflow passed: version-specific acceptance, learning gate, editable objective autosave/reload and automated accessibility checks. All four browser workflows passed.
- Real local calls generated an Analysis brief, a performance-solution proposal, and a Design skeleton; all were opened through the app. The Design output included main/enabling objectives and linked assessments. This is a connection/handoff check using isolated synthetic content, not approval of instructional quality or the deferred fictional walkthrough.
- One earlier operator connection-check call exceeded the original 45-second timeout. Its separate local test ledger remains paused with a retained reservation; it was not marked successful or silently retried. The demo worker now allows 120 seconds per call under a 180-second lease. This does not guarantee provider latency.
- Human confirmation took precedence over outdated uncertainty wording in one generated brief. The Design prompt was updated so current confirmed canonical learning measures supersede earlier brief wording, without treating confirmation as external-source verification.
- User added OPENAI_API_KEY privately to local settings and Netlify Production. No key is in source control, client code, chat output or the SQL setup artifact.
- User explicitly approved applying the AI/workflow schema to Supabase eefozbgaobaymadewdhu. Migrations 3 and 4 and the explicit October 1–November 1 UTC period were applied through SQL Editor; the result showed five AI tables with RLS. Workflow RPC denied an unadmitted identity. No prior workspace migrations were reapplied.

## Remaining after this demo slice

This is an initial complete Design skeleton generation, not yet the full reviewed per-section generation/regeneration flow. Detailed per-section acceptance and dependency impact marking, source document extraction/research, reference/alignment validation depth, sample/storyboard Development, guest review, exports, preferences and human accessibility acceptance remain unfinished. Earlier Analysis changes preserve Design but require review; section-level automatic impact marking is still limited. Existing drafts are deliberately preserved rather than replaced by regeneration.

The broad operator queue interface, robust scheduled wake-up/reconciliation tooling, final provider-retention/security audit and all remaining pre-production checks remain deferred under the approved timing. A successful demo does not establish production readiness.
