> Planning record prepared October 18, 2026. The user subsequently authorized Milestone 1 implementation and merging ready planning changes. Earlier planning-only/local-publication statements below describe the record when drafted; use the current requirements and decision log for present authority. No service verification is implied.

# Saved work and background AI jobs — technical planning proposal

Prepared October 18, 2026. Status: proposed implementation approach for the accepted low-cost planning foundation. Existing product behaviors remain approved; new technical mechanisms below are proposals, not implemented or verified. No build, deployment, service configuration, PR merge, or fictional walkthrough progression is included. This local document has not been pushed to GitHub.

## Inputs and scope

Use PR #2's approved requirements, the subsequently approved original questions/layouts, and the low-volume demo direction. Netlify's credit-based Free plan is confirmed by the user screenshot: 300 credits/month and 284.9 remaining in that snapshot. Netlify hosting/compute credits are separate from the shared $20/month AI cap and $16 warning. Infrastructure allowances are shared with other projects on the same team; do not interpret the screenshot balance as a dedicated app budget or future guarantee.

## Saving work

- Keep structured project records and versions in Supabase Postgres, with private uploaded files in Supabase Storage and access limited to the project owner or explicitly selected guest snapshot content.
- Retain approved autosave targets, server acknowledgement before showing Saved, device-recovery drafts, conflict handling, and preservation of work on reauthentication. A network error or paused service must not falsely report a successful server save.
- Saving edits, reviewing a specific version, and accepting that version for the next stage remain distinct actions. Pin accepted input versions and preserve source/record links. Earlier changes preserve downstream work, flag affected sections, and never silently rewrite accepted content.
- Saving, navigating, or exporting does not initiate paid AI work.

## Proposed job flow

1. On an explicit Generate or Revise action, authorize the designer/project, pin the selected input version, and persist the requested operation and job record. Use a stable request identifier so a repeated click or repeated network delivery cannot create duplicate operations.
2. Use a shared durable database queue and a transaction-protected global claim so only one AI job executes across the entire pilot. Before dispatching paid work, reserve that job's maximum allowance against the shared $20 ledger, including review, bounded repair, and permitted research. Queue storage and cost records must survive browser closure and runtime restart.
3. Use a Netlify background function as the candidate server-side runner. Authorize/internalize dispatch; never expose AI-provider credentials or privileged database credentials to the browser. Treat the database as the source of job status, not an in-memory timer or a browser tab.
4. Store progress, paid-call intent/attempt identifiers, provider references where available, and completed outputs as the work proceeds. Completed output remains a proposal for designer review. Never overwrite an accepted version with a worker result. Recheck access/job validity before any new paid call; handle revocation/deletion without restoring deleted content.
5. On completion, persist the full result and settle confirmed usage before releasing unused reservation. Reopening the app retrieves status/results from storage rather than regenerating content.
6. On failure or uncertain delivery/charge, preserve completed work and reservation. An uncertain charge pauses all further AI pending the pilot operator's confirmation. Failed paid jobs require an explicit, budget-checked retry. The previously agreed bounded quality repair of newly generated content is distinct and remains within the original allowance.

## Runtime behavior that affects this design

[Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/) are available on credit-based Free plans, run asynchronously for up to 15 minutes, and automatically retry certain failed invocations. Their initial 202 response means invocation acceptance, not AI completion. Results must be saved elsewhere.

Automatic invocation retries must not automatically repeat a paid AI call or override the approved explicit-retry rule. A duplicate invocation must inspect the durable job/step state and return the saved result or refrain from paid work. Claim expiration alone is not evidence that the earlier worker or provider call stopped; prevent overlapping runners and pause for uncertain outcomes rather than reissuing work. Application error handling and durable attempt records must cover runtime timeouts/crashes as well as ordinary caught errors.

Treat the 15-minute limit as a runner limit, not a required completion promise or a cap on project scope. Define bounded task units/checkpoints where needed, retaining one active logical job and the same reservation across any continuation. Continuations must never turn an uncertain paid call into a silent retry. Provider-specific result recovery, maximum call durations, continuation scheduling, and safe fencing remain to be designed before claiming feasibility.

The [Netlify scheduled-function option](https://docs.netlify.com/build/functions/scheduled-functions/) is a possible dispatch/recovery mechanism for durable queued work; no schedule or polling interval is selected here. Persisting a job and attempting dispatch are separate failure points: the final design must cover a saved job whose initial dispatch never happened and ensure progress does not depend on a designer leaving their browser open.

## Checks still needed before finalizing or implementing

- Verify server-side authorization, database access policies, exact designer-code/access and guest-link rules on the chosen service tiers. A provider capability list is not evidence that approved safeguards work.
- Specify queue claim/fencing, transactional reservations/settlement, durable paid-call state, and internal dispatch authentication; exercise duplicate delivery, process termination, timeout, uncertain provider charge, and result-save failure without duplicate paid generation or overlapping jobs.
- Measure actual representative task duration, compute credit usage, source-file extraction, and complete PDF/PPTX export behavior. Do not replace approved basic import with AI, reduce required written output, or advance the deferred fictional walkthrough to make a provider appear feasible.
- Specify how a waiting queue resumes after a runtime outage, paused Supabase project, exhausted Netlify credits, or deployment. Recheck access and budget, preserve completed results, and reconcile uncertain charges before dispatching additional paid work. Manual resume before demos is accepted; unattended uptime is not guaranteed.
- Existing detailed backup/retention and other B4 audit items keep their approved pre-production timing; they are not newly elevated to MVP blockers. Approved saving/recovery and basic safeguards still apply.

This investigation supports Netlify Background Functions as a candidate for longer tasks without a new hosting account. It does not yet prove that all workloads fit free allowances or that no additional runtime is required. File-processing/export placement and AI-provider/model selection remain open.
