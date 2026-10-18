> Planning record prepared October 18, 2026. The user subsequently authorized Milestone 1 implementation and merging ready planning changes. Earlier planning-only/local-publication statements below describe the record when drafted; use the current requirements and decision log for present authority. No service verification is implied.

# Milestone 1: private workspace and reliable saving

Prepared October 18, 2026. Status: implementation specification drafted for review. Existing product requirements remain approved; record shapes, routes, transactions, and interface copy below are proposed implementation details. No application, database, account, email delivery, deployment, DNS change, paid AI request, or PR merge has been performed. This local document has not been pushed to GitHub.

## 1. Outcome and authority

An approved designer can sign in with an emailed code, create or open their own project, enter Analysis information, and leave and resume their saved work. Saving must be truthful and protect recoverable edits during interrupted sessions.

Use the [current requirements](../requirements.md) from PR #2's documentation commit `a41764d6adc8fb61e1d8078c6b2525cd6090a644`, together with subsequent explicit user decisions. Supporting records:

- [Project setup and cards](../notes/project-home-decisions.md).
- [Saving and recovery](../notes/saving-and-recovery-decisions.md).
- [Current Analysis questions and historical context](../notes/analysis-form-decisions.md).
- [Approved independently written replacement questions/layouts](../notes/independent-review-questions.md).
- [Service/cost direction](operating-costs.md), [AI provider strategy](ai-provider-strategy.md), and [phased build plan](phased-build-plan.md).

Requirements remain the main product contract. Historical branded questions, prototype sample values, and the deferred audit are not new product rules. The fictional walkthrough and other audit findings stay deferred.

## 2. Delivery boundary

| Delivered in milestone 1 | Later milestones, retaining approved MVP scope |
|---|---|
| Approved-email designer access, code sign-in, and sign-out | Account-free guest links/comments and their lifecycle |
| Project cards, new project, owner-only open/resume | AI-generated Analysis brief and stage handoffs |
| Manual Analysis entry, including current Evaluation planning questions | Source-file transfer/extraction and permitted web research |
| Server saving, device recovery, conflicts, undo/version history | Design, Development samples/full drafts, PDF/PPTX exports |
| Separate version/review/accepted-input data contracts | Live AI queue, reservations, model testing, and spending enforcement |
| Accessibility checks for delivered screens | Full end-to-end accessibility and production assurance |

This is implementation sequencing, not removal of later MVP features. Do not show functioning generation, sharing, upload, or export actions before they exist. A missing later-stage feature must not be represented by a fabricated success or simulated save.

## 3. Technical arrangement

- **Browser:** React + TypeScript, built with Vite; standard desktop web forms and accessible navigation. The previous architecture response proposed this frontend; this specification adopts it as the implementation recommendation for review. Routing and form/state libraries are routine implementation choices; do not introduce a paid dependency.
- **Hosting/backend:** Netlify Free serves the app and TypeScript functions for protected operations. No long-running AI worker is needed for milestone 1.
- **Accounts/data:** Supabase Auth identifies designers; PostgreSQL stores the access list, projects, content revisions, and related state. Resend is the proposed sign-in-email delivery service through the validated Supabase integration.
- **Recovery:** account-scoped IndexedDB records in the browser supplement server saves. Acknowledged Supabase records remain the main saved copy; local recovery is device/browser-specific.
- **Files:** Supabase private Storage is the agreed direction for uploaded documents, implemented with imports in a later milestone. Creating storage containers now is unnecessary for the text-saving proof. Select the actual project region at service setup; no region has been selected by the planning discussion.
- **Secrets:** database administrative credentials, mail credentials, and future AI keys remain server-side. A browser-visible Supabase publishable key is not an authorization boundary; database policies and server checks enforce access.

Keep business rules and structured records separate from screen components. The AI provider is OpenAI, with Luna evaluated first and Sol used only where results justify it, but this milestone neither requires an AI key nor sends AI requests.

## 4. Screen flow

**Email → Code → Project cards → Create/open project → Analysis section → Leave/resume**

### 4.1 Email entry

- Explain invitation-only designer access; provide an email field and **Send code** action.
- Validate email format; check current pilot eligibility on the server. A request cannot add an email to the approved list.
- Show sending, delivered-to-email, rate-limited, and delivery-failure states truthfully. Submission success means the provider accepted sending, not proof that the email reached the inbox.
- Preserve the intended project/location for reauthentication without including private content in a URL. Validate return destinations as internal app routes.
- No public sign-up, password creation/reset, or invitation-management dashboard.

### 4.2 Code entry

- Show the destination email, one labeled code field, **Sign in**, **Resend code**, and **Use another email**.
- Support pasting/autofill in one field; preserve leading zeroes. Do not split the code into six independently focused inputs or force automatic submission.
- Server enforcement: expires 10 minutes after issuance; single-use; invalid after five incorrect attempts; resend no more than once per minute per email; replacement invalidates the prior code.
- Refreshing the page, opening another tab, or altering the client clock cannot reset the attempts, expiry, or resend limit. Serialize competing verification/replacement requests so one code cannot create multiple successful sign-ins.
- Announce errors with readable text, preserve the email, and provide the appropriate next action. Do not erase recoverable project edits when reauthentication is required.

### 4.3 Project home

- Use the approved **Project cards** layout, with **New project**, **Continue project**, and sign-out.
- Each card shows working title, current stage, last confirmed content-save time, outstanding items, and suggested next action. Use text statuses, not color alone.
- The first-use empty state explains how to create a project. Loading failure is an error state, not an empty project list.
- Only show the signed-in designer's projects. Dates come from server save acknowledgements; opening a project must not falsely update its last content-save time.
- Resume the last saved location, falling back to the first valid Analysis section if the recorded route no longer exists. Show a plain recap from saved state without an AI call.

### 4.4 New project

- Ask for a working title, using the existing project-name question. Use that same title in the Analysis form and header, rather than creating separate competing name fields.
- **Create project** writes the owner-linked project and empty Analysis structure atomically, then opens its first section. No task, audience, evidence, or measure is required to save a new draft.
- Make creation safe to repeat after a lost response: one client operation identifier produces one project. Preserve the entered title on failure and provide retry.
- Resolve a blank title with an editable temporary working title as an implementation convenience; do not call AI or block saving incomplete Analysis for title quality. Exact placeholder copy can be reviewed with the screen implementation.

### 4.5 Analysis workspace

- Top: project title, current stage, stage navigation, persistent save status, and return to projects.
- Left: Project context and performance gap; Evidence and possible causes; Audience and work environment; Stakeholders and project constraints; Evaluation planning.
- Under Evaluation planning, provide Organizational results, Workplace performance, and Evidence of learning, using normal navigation links and the approved measure-card layout. Expand one measure at a time and keep summaries for the others.
- Center: one editable section at a time. Optional contextual help can open beside it; keep essential instructions, errors, and actions in the main workspace.
- Bottom: **Back**, **Continue**, and **Save and return later**. Optional **Save now** requests synchronization; normal editing does not depend on this action.
- Use the approved question wording and unknown/not-applicable options. Include the exact optional prompt **“Add documentation of any supporting evidence if available”**. In milestone 1, support pasted text; source-file controls arrive with real upload processing.
- Stakeholders include review availability/turnaround. Do not restore the removed audience-time question.
- Learning-measure uncertainty can remain in this form while the response route is unresolved. The later learning-route confirmation gate remains in Design. Do not draft final objectives, assessment questions, or interventions in this form.
- Empty required-for-handoff fields may be indicated as **Information needed for Design**; they must not prevent saving, section navigation, or project resume. Required-for-handoff is not required-for-save.
- Brief review, stage acceptance, and AI generation are introduced when their real stage outputs exist. Do not add a new requirement to mark every raw form answer reviewed before saving.

### 4.6 History, recovery, and conflict views

- **Version history:** show available saved revisions with time and section/context. Restoring makes a new current revision; it does not erase history or mutate an older revision. Preserve undo of mistaken edits.
- **Recovery:** when unsynced local content exists, offer the recoverable draft and the confirmed server copy. Show enough section/time context to make an informed choice. Dismissing the view is not consent to delete a draft.
- **Conflict:** show the server revision and the designer's local revision. Preserve both; allow choosing one or editing a merged draft. Saving the resolution creates a new version against the latest confirmed revision. Never use last-writer-wins as a hidden conflict resolution.
- **Reauthentication/access loss:** preserve pending recovery state. Pause protected reads/writes on expired or removed access, and do not expose the previous account's drafts to a different signed-in account.

## 5. Stored records — proposed logical model

Names below describe responsibilities, not a committed SQL migration. Use stable opaque identifiers, server timestamps, and foreign-key relationships. All project-owned records resolve to one project and its owner.

| Record | Main contents | Important invariant |
|---|---|---|
| Supabase Auth identity | Provider-managed user ID and sign-in identity | Passwords/OTP secrets are not ordinary project data |
| Pilot access | Canonical email/identity mapping, active/removed state, operator change time | Operator-maintained; designers cannot approve themselves |
| Sign-in challenge/admission state, where required | Challenge identifier, email reference, issuance/expiry, failed-attempt state, replacement/consumption state, delivery reference | Server-only; no plaintext codes in database/logs; provider and app states must agree |
| Project | ID, owner ID, stage, current title reference, last content-save time, resume location | Owner supplied by authenticated server context, never trusted from the request |
| Draft record | ID, project, kind, stable field identifiers, current version reference | Kinds cover project metadata, Analysis sections, stakeholder rows, and evaluation measures |
| Record version | Version ID, record ID, monotonic revision, complete changed-record payload, actor, server time, originating operation ID | Immutable; version history cannot be edited by the client |
| Review mark | Target record/stage snapshot and exact version, reviewer identity, time | Review of version A never silently becomes review of version B |
| Stage baseline | Stage snapshot ID, selected record/version map, accepted-by/time, input reference | Acceptance pins saved versions; it is not a pointer to whatever is latest later |
| Applied operation receipt | Account/project, unique client operation ID, request fingerprint, resulting version IDs and acknowledgement | Identical retries have one logical effect; reused IDs with different payloads fail |
| Local recovery operation | Account, project/record, base revision, operation ID, pending change, local edit sequence | Device-only until acknowledged; never synced under another account |

Keep project title canonical. The Project row may cache the title for cards, but update that cache transactionally from its metadata record; the header and Analysis name must use the same value.

Evaluation measures have stable IDs and a kind of organizational result, workplace performance, or learning evidence. Store their approved descriptions, baseline/target/criteria, evidence/source references, collection method, responsibility, timing/frequency, intended use, related measures, and explicit known/proposed/unknown/not-applicable states with rationale where applicable. Preserve additional question-specific conditions and influences. Do not convert an unknown into a blank numerical zero.

Use separate records for repeatable items so adding, removing, reordering, and linking measures/stakeholders is traceable. Preserve prior versions of removed items and parent membership/order references so a historical snapshot remains reconstructable. Changing an item title never changes its stable ID.

Save changed records rather than duplicating the entire project for every keystroke. Version retention/compaction is not settled here: do not silently prune reviewed/accepted snapshots or introduce a retention duration. Later dependency detection still needs its own specification; preserve the input references now without claiming all downstream invalidation is solved.

Review and baseline primitives are part of the foundation, but their full stage-output UI/behavior is completed with later generated outputs. Verify version binding using isolated developer fixtures rather than inventing a new manual stage-approval workflow or advancing the deferred fictional walkthrough.

## 6. Protected operations — proposed interface contracts

Routes are indicative and may be implemented as Netlify endpoints plus restricted database transactions/RPCs. Business rules must not live only in browser components.

| Operation | Required behavior |
|---|---|
| Request/resend code | Check current eligibility and server resend/challenge state; deliver through the validated auth/mail flow |
| Verify code | Enforce the approved challenge limits, recheck eligibility, establish a valid application session only after successful verification |
| List/open project | Validate identity/current pilot access and ownership; return the selected current data/history/resume metadata |
| Create project | Idempotent atomic creation; authenticated identity determines owner |
| Save changes | Operation ID, base revision(s), and typed field/item changes; atomic version creation and acknowledgement |
| Update resume location | Validate an internal project location; preserve content-save time and content versions |
| Fetch history/restore | Authorize each read/restore; restore through a normal new-version write |
| Record review/pin baseline | Target explicit saved versions; preserve historical records; introduce public UI only with the relevant stage outputs |
| Remove pilot access | Operator-only transaction/state change stops new and existing project access while retaining project records |

For a successful content save, return the applied operation ID, resulting version/revision references, and server commit time. A conflict response identifies that the base changed and supports retrieving the authorized newer version. An uncertain network outcome is not proof of failure or success; retry the same operation ID and consult the operation receipt.

The server rejects attempts to change owner/project associations, write historical snapshots, forge reviewed/accepted state through ordinary autosave, or write outside the authorized project. Shared project listing, direct database requests, and helper functions must enforce equivalent boundaries. Ordinary designer endpoints must not expose or accept administrative credentials.

## 7. Autosave, acknowledgement, and recovery algorithm

### During an edit

1. Update the visible form immediately. Record the account-scoped local recovery operation promptly when browser storage is available; preserve edit order and the last server base revision.
2. Schedule a server save about one second after a typing pause, at least every five seconds during continuous connected typing, and immediately for discrete actions. These are approved targets to measure, not guarantees against arbitrary outages.
3. Serialize writes to the same record. An in-flight save captures a particular edit sequence. Later typing remains pending; an earlier acknowledgement must not clear those later edits.
4. Send the operation ID, expected base revision(s), and changes. In one database transaction, check for an existing receipt first, then verify authorization and base revisions, persist new versions/current pointers, and record the receipt. A repeated identical operation returns its prior acknowledgement rather than creating another version.
5. Mark only the acknowledged edit sequence synchronized. Clear the corresponding local pending operation only after that acknowledgement has been persisted/processed; preserve any newer local changes.
6. If the server base differs, preserve both copies and enter conflict resolution. Do not retry against a newer base by blindly changing the expected revision.

Keep operations pending across retries of transient synchronization errors with bounded backoff. Retrying a data save is distinct from retrying a paid AI job. Neither local persistence nor a browser-close event proves a server save.

### Visible states

| State | User-facing meaning |
|---|---|
| **Saving…** | Current changes are awaiting server acknowledgement |
| **All changes saved · [time]** | All current content edits are acknowledged by the server; no newer edits/conflict remain |
| **Saved on this device — waiting to sync** | Browser recovery write succeeded, but server confirmation is pending |
| **Not saved — retrying** | Current changes are not confirmed and cannot currently be claimed protected on this device |
| **Changes need review** | A newer server version conflicts with local changes; both remain available |

Show local-storage failure separately when the server is still working; a local failure must not erase a genuine server acknowledgement or claim device protection. Distinguish access loss, connectivity, quota, validation, and unexpected server failures sufficiently to offer an appropriate action. Exact copy can be refined during screen implementation.

### Navigation, reload, and identity changes

- Before normal in-app navigation, attempt to flush pending changes and update the resume location. If confirmation is unavailable, keep the recoverable draft and its visible unsynced status. Do not block all navigation indefinitely on an unavailable service.
- Browser-close warnings are supplemental and best-effort. Persist continuously during editing; unload callbacks cannot be the primary save mechanism.
- On resume, read local pending operations and fetch the authorized current server versions. If the server still matches the base, offer recovery and replay the same operation IDs after the designer chooses recovery. If the base changed, offer conflict review. Deduplicate already-applied operations by their receipts.
- If local recovery storage fails or fills, preserve in-memory edits while possible and say what remains unsaved. Server saving continues where available. If neither storage path works, offer copying the affected text without pretending a backup exists.
- Scope recovery by authenticated account and project. Signing in as designer B must not display or submit designer A's pending work. Do not silently purge unsynced edits on sign-out, expiry, or access removal; local retention/cleanup policy remains a separate decision.
- A save request that crosses access removal must recheck current eligibility at the protected transaction boundary. A denied save leaves local work unsynced; it must not restore access or mark the server state saved.

## 8. Authentication and authorization implementation check

The approved ten-minute expiry, one-use code, five incorrect attempts, one-minute per-email resend, replacement invalidation, current allowlist, and preservation of work are mandatory product behavior. A disabled button or in-memory attempt counter is insufficient.

Supabase's documented verification rate limit is IP-based, which does not establish a five-failures-per-code limit. Its documented passwordless sign-in flow also has configurable expiry and account-creation behavior. **The first implementation task must prove the exact end-to-end mapping before relying on provider defaults.**

Use this decision rule:

1. Prefer supported provider settings/hooks if they enforce all approved challenge rules server-side.
2. If application-owned challenge/admission state is necessary, design it with atomic counters/replacement/consumption and a supported provider integration. Do not create a custom cryptographic or password scheme.
3. Prove that bypassing the application endpoint and calling public provider verification/sign-in/database endpoints cannot obtain project access contrary to those rules. A backend wrapper alone does not close a public alternate route. A protected session-admission record may be needed if native verification cannot enforce the rule; its exact design is an implementation check, not a verified capability here.
4. Keep membership/ownership checks dynamic. Do not rely only on an approved flag cached in an old JWT; removing pilot access must stop existing designer access. Disable open public account creation and prevent an alternative provider/password/recovery flow from granting pilot eligibility.
5. Configure real sign-in delivery through the selected mail integration rather than assuming Supabase's default sender supports all pilot emails. No domain configuration or actual test email is authorized by this document.

No numeric idle/session lifetime or new abuse policy is approved here. Remaining B4 audit work retains its agreed pre-production timing. This check implements already-approved basic behavior; it is not a new broad B4 blocker or a request to reopen deferred policies. If the selected free tier cannot meet a required behavior, document the concrete gap and revise the technical approach without silently weakening the rule or assuming a paid upgrade.

## 9. Authorization and accessibility boundaries

- Enforce owner-based database access and current pilot eligibility, including child records, version reads, recovery saves, and privileged helper functions. Protect policy/helper configuration from ordinary clients. Test direct access as well as screens.
- The pilot operator maintains the approved-email list through a restricted mechanism, not a new dashboard. Access removal preserves projects. Guest-link deactivation remains required when sharing is introduced; milestone 1 cannot claim that an unimplemented sharing feature has passed lifecycle testing.
- Show the brief permitted-material boundary before text entry/paste. Render designer text as data, not executable markup. No confidential/identifiable material, automatic sensitive-data detection, or broader upload scope is introduced.
- Use native labels, landmarks, headings, buttons, and validation associations. Maintain visible keyboard focus and logical reading order. Move focus meaningfully on navigation/errors and announce saving/error states without repeatedly interrupting typing.
- Do not use placeholder-only labels, color-only statuses, pointer-only controls, keyboard traps, or surprise autosubmission. Keep errors in text near fields and in an accessible summary where needed.
- Validate keyboard and screen-reader operation on actual delivered screens and zoom/reflow under the existing WCAG 2.2 AA target. Automated checks supplement manual use; component choice alone does not establish conformance.

## 10. Completion checks

Record pass/fail and evidence against an actual implementation later. No checks below have been executed against a working application.

| ID | Scenario | Expected evidence |
|---|---|---|
| AUTH-01 | Approved and unapproved emails request a code | Only eligible identities can gain designer access; requests never approve an email |
| AUTH-02 | Correct, incorrect, expired, and previously consumed codes | Correct eligible code succeeds once; expired/consumed code fails; server time controls expiry |
| AUTH-03 | Five incorrect attempts, refresh/new tab, then correct old code | Old challenge stays unusable after five failures; a fresh challenge is required |
| AUTH-04 | Resend inside/outside one minute, then use both codes | Server enforces the window; replacement invalidates the old code |
| AUTH-05 | Concurrent verification/resend and direct provider requests | No double consumption, attempt reset, or alternate-route access bypass |
| AUTH-06 | Pilot access removed with an existing session | New and existing designer project access stops; projects remain saved; no reliance on a stale eligibility claim |
| AUTH-07 | Session expires during editing | Reauthentication preserves pending recoverable edits and intended project location |
| PROJECT-01 | First-use empty state and a failed list request | Empty and error states are distinguishable; no fabricated project list |
| PROJECT-02 | Create project, lose response, retry same operation | Exactly one project with the correct owner and preserved title |
| PROJECT-03 | Designer A requests designer B's project/child/history IDs | Access denied through UI, API, and any exposed database path |
| PROJECT-04 | Change title and resume section | Cards, header, and Analysis name agree; correct location returns; open time is not mislabeled as content-save time |
| FORM-01 | Navigate/save with incomplete Analysis and unknown measures | Edits persist; no required-for-save expansion or forced learning-route determination |
| FORM-02 | Repeatable measures/stakeholders added, reordered, edited, removed | Stable IDs and links persist; earlier versions remain reconstructable |
| SAVE-01 | Pause after typing and type continuously | Instrumented online saves meet the roughly one-second pause/five-second continuous targets under stated test conditions |
| SAVE-02 | Select a discrete value and immediately navigate | Save is attempted promptly; persisted recovery and actual acknowledgement determine status |
| SAVE-03 | Type more while an earlier save is in flight | Earlier acknowledgement never clears or labels newer edits saved |
| SAVE-04 | Server commits, response is lost, client retries | Same operation ID has one effect and returns its receipt; no duplicate records or repeated restore |
| SAVE-05 | Two tabs/devices save from the same base | One conflicting update is detected; both versions survive for explicit resolution |
| SAVE-06 | Disconnect, type, reload, reconnect | Device-only state is truthful; pending draft is offered and recovered/deduplicated |
| SAVE-07 | Browser storage unavailable/full, server available/unavailable | No false device/server save claim; surviving edits remain usable and the limitation is visible |
| SAVE-08 | Supabase unavailable/paused or backend requests fail | Draft preservation/error behavior works; reconnect does not silently overwrite newer server content |
| SAVE-09 | Sign out as A, sign in as B with A's local pending work | No cross-account display, sync, or record attachment |
| VERSION-01 | Save, inspect history, and restore an earlier revision | History is immutable; restore creates a new current revision; mistaken edits can be undone |
| VERSION-02 | Change content after a review or accepted-input fixture | Old review/acceptance still targets the old version; autosave cannot forge a new review or baseline |
| NO-AI-01 | Create/edit/save/navigate/resume, including help text | Zero AI calls; no fabricated generation result or AI-generated title/recap |
| ACCESS-01 | Keyboard-only use of every delivered screen | Complete flow with visible focus, logical order, no traps, and reachable error/recovery actions |
| ACCESS-02 | Screen reader plus saving/error/recovery/conflict states | Meaningful labels, associations, announcements, and focus movement |
| ACCESS-03 | Zoom/reflow and contrast checks | Applicable WCAG target checks recorded without losing required controls or content |

Use isolated fictional developer fixtures for access/conflict tests; do not revive the deferred complaint-routing exercise or submit confidential material. Verification should test behavior and failure cases, not mirror component implementation. Baseline tests run once appropriately; repeat when changes/failures justify it.

## 11. Suggested implementation order and review checkpoint

1. Prove auth/challenge enforcement, dynamic eligibility, and ownership policies with the selected tiers; document any unresolved provider fit before relying on it.
2. Establish structured project/draft/version records and transactional operation receipts.
3. Implement project cards/create/open and the approved Analysis entry flow using real server persistence.
4. Add continuous local recovery, serial autosave/acknowledgement, conflict resolution, history/restore, and reauthentication recovery.
5. Complete the applicable checks above and review the working milestone with the designer before attaching the first phase's AI generation.

The review demonstration is: sign in → create a project → enter Analysis → observe saving → leave/reopen → recover an interrupted edit → resolve a two-tab conflict → show an earlier saved version. It uses original approved questions and empty/isolated test data, not the deferred walkthrough.

Outstanding implementation details are the verified auth enforcement mechanism, actual service/domain/region setup, final routing/form libraries, bounded data-sync retry configuration, and physical schema/migrations. No new product decision is required for routine details that preserve this contract. Detailed backup, retention, shared-device/session policy, and other deferred B4 items remain tracked for their approved timing; no silent default is presented as user approval.

## 12. Sources checked for technical fit

- [Supabase passwordless email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless): provider OTP flow/configuration. It is not proof that every custom challenge rule is enforced.
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits): documented per-user resend and IP-based verification limits; these are distinct from this product's five-failure rule.
- [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp): delivery integration and default-sender restrictions.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): authorization boundaries and stale-claim considerations.
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API): browser-side persistent structured storage; does not guarantee survival of every device/browser failure.
- [MDN beforeunload](https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload): browser-leave warning behavior is supplemental rather than a durable save mechanism.

The stored-file location explanation remains the agreed direction: private Supabase Storage in the selected project region, with access policies to implement and test. No storage, sign-in, saving, accessibility, or security capability is claimed implemented by this specification.
