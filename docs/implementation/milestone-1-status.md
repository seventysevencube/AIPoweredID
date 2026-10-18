# Milestone 1 implementation status

October 18, 2026. **Foundation implemented and tested locally; full milestone completion awaits live-service verification and human interaction review.** The user authorized starting Milestone 1 and merging ready changes. Planning PRs #1 and #2 are merged into `main`; the audit remains reference material, without blanket approval of its recommendations.

## Implemented

- React/TypeScript/Vite desktop workspace: invitation-only email/code screens, owner project cards, atomic project creation, section resume, canonical title, and all seven Analysis/evaluation navigation sections.
- Current approved questions, optional pasted evidence, stakeholder review availability, unknown/proposed/not-applicable states, stable repeatable stakeholder/measure identifiers, related evaluation-measure links, and optional guidance. No final assessment or intervention drafting in Analysis.
- Netlify backend with server-side Supabase identity verification, protected RPCs, explicit native-session admission, current approved-email checks, and Resend code delivery adapter. Production adapter fails closed when settings are missing.
- PostgreSQL migration: projects, section records, immutable-by-public-interface versions, receipts, approved-email/challenge/admission state, and separate version-bound review/baseline primitives. Database browser roles cannot read application tables or execute the privileged RPC.
- Autosave after roughly a one-second pause and within five seconds of continuous connected editing, serial same-section writes, operation receipt replay, persistent device recovery, explicit conflict choices, new-version restoration, and recoverable reauthentication behavior.
- Live tabs use separate recovery entries. Web Locks prevent duplicated session-storage IDs from sharing a recovery entry. Closed-page drafts can be claimed atomically by a later page for the same account/project/section. Current UI offers one recoverable draft at a time; other entries remain stored for subsequent recovery. Browser storage failure is visible and never claimed protected.
- No AI calls, public guest links, imports, exports, or later-stage generation actions. These remain later milestones, not scope removals.

## Evidence

- Unit/integration tests execute the actual migration in PostgreSQL-compatible PGlite, including code expiry, five-attempt lockout, single-use/replacement/resend, access removal, ownership, idempotency, conflicts, history, exact-version review binding, privileged-RPC denial, origin checks, cookies, and strict payload validation.
- Save-controller tests inject lost acknowledgements, later typing during an earlier save, reload recovery, storage failure, access loss, conflicts, and corrected rejected writes.
- Chromium browser tests exercise the real local HTTP handler and browser IndexedDB: create/edit/save/reload, offline recovery, conflict resolution, independent two-tab recovery, version restoration, linked measures, and a second account's denied access.
- Automated axe checks cover the rendered sign-in, context, evaluation-card, and conflict states. A keyboard entry check and a 720-CSS-pixel reflow check provide limited additional evidence; they are not full keyboard, zoom, or assistive-technology acceptance.
- TypeScript and the production Vite build pass. The Netlify function is also bundled locally as an ES module. CI repeats code and browser checks without cloud credentials or AI requests.

The local service explicitly uses fictional identities and an inbox stub. Tests isolate their database from the persistent local demo database. Neither the tests nor function bundling prove real provider behavior, actual email delivery, hosted routing, deployment, or production accessibility.

## Before declaring Milestone 1 complete

Follow the [service setup and live verification guide](service-setup.md): choose the Supabase project/region, verified email sender, and test hosting origin; securely configure settings; apply the migration; and run the actual auth/refresh/removal/ownership/save/recovery checks on those services. Complete human keyboard and assistive-technology review for delivered flows.

Detailed B4 policies/assurance keep their approved pre-production timing. Remaining AI integration, file imports, stage review/acceptance UI, dependency flags, guest comments, exports, and later-stage screens remain in the phased plan. The fictional complaint-routing walkthrough and other audit findings stay deferred.

## Implementation refinements

- The backend sends the application code directly through Resend, then establishes a Supabase native identity after verification. It does not rely on a generic provider attempt limit or expose a browser-readable native session. The live flow still needs verification.
- Repeatable entries retain stable IDs and full membership/order in immutable section versions. This first migration versions the changed section as a unit rather than storing each item in its own table. It preserves reconstructable deletion/reordering history; separate item records and more granular dependency handling can be introduced with later stages.
- Restore uses the normal receipt-protected save pipeline with the selected historical content, preserving recovery if its acknowledgement is lost. The protected restore endpoint additionally supports version-ID-based restoration.
- Resend throttling intentionally still applies if delivery fails; a fresh request after the minute replaces the prior challenge. A provider-identity error after code consumption also requires a fresh code. The interface reports failure instead of presenting a fabricated sign-in.
- Local browser recovery currently requires IndexedDB, session storage, and Web Locks. If they are blocked or unavailable, server saving remains usable and the recovery limitation is visible. No zero-loss guarantee or retention period has been added.

## Local UI refinement — answer options

The designer requested removing unnecessary four-option status menus across the forms. Direct-entry fields (project title, pasted evidence, possible-causes selection, stakeholder name/assignment, and scope exclusions) now use plain inputs. Relevant questions offer a collapsed **Answer options** control for explicit unknown or not-applicable responses, with applicability choices limited by question. Default draft labels are omitted. Existing unknown, not-applicable, and proposed values remain visible and are preserved until explicitly changed; this cleanup does not review or accept any content. Local browser checks cover keyboard operation, saved uncertainty/rationale responses after reload, and automated accessibility checks. Live Supabase/Resend setup remains deferred while local UI review continues.
