# Saving and Recovery — Requirements and Proposed Behavior

Updated: October 17, 2026

Status: Autosave policy, target timing, visible save status, recovery protections, verification approach, and owner-requested active-app project deletion are agreed. Other retention/backup policies and implementation remain to be specified. No app development has started. Synced project sources remain read-only.

## Confirmed requirement

Designers must not depend on pressing a Save button to preserve normal work. Autosave applies across Analysis, Design, partial Development, source selections, settings, and reviewer comments. Saving remains distinct from accepting an AI suggestion, marking work reviewed, or progressing to the next stage.

For guest comments, autosave protects the private comment draft; posting/publishing it remains an explicit reviewer action. Autosave must not unintentionally submit comments or share project content.

## Proposed saving policy

- Record each text edit promptly in a persistent local draft/recovery store on the current browser/device, subject to storage availability. Maintain a durable queue of changes awaiting server acknowledgement. This fallback is not an offline AI capability and is not a substitute for a server backup.
- Synchronize to the server about one second after typing pauses. During continuous typing, synchronize at least every five seconds when the network and service are available; measure and tune these thresholds during implementation.
- Save discrete changes such as selections, ordering, preference changes, and review/acceptance actions immediately rather than waiting for a typing pause.
- Before normal in-app section/stage navigation, flush pending changes. Navigation must not discard recoverable local edits; if server confirmation is unavailable, show the unsynced state rather than claiming success or silently dropping changes.
- Persist AI-generation jobs and generated results server-side as they are durably produced. Store complete validated draft units before marking them usable. Preserve accepted input versions and prior content; do not replace reviewed content with partial or failed output. Returning to a project must recover completed generation results without rerunning AI merely because the page was closed.
- A source upload is not marked available until transfer and required processing are confirmed. Show upload/processing errors distinctly from text-save status.
- Saving, autosave, navigation, and routine resume recaps do not trigger AI generation.

## Proposed status and recovery behavior

- Show a persistent, accessible status: “Saving…”, “All changes saved” with last-confirmed time, “Saved on this device — waiting to sync”, or “Not saved — retrying”, as appropriate. “All changes saved” means all current edits have server acknowledgement, not simply that a request was sent.
- If local recovery storage is unavailable or full, retain the in-memory edits while possible, display the limitation, and do not claim the draft is protected on the device. Server saving continues where possible.
- Retry failed synchronization with bounded backoff and a visible pending state. Continue saving local drafts when available; do not require repeated manual saves.
- On reopening, offer recovery of locally pending edits. Confirmed server saves are available on another device after sign-in; unsynced local drafts are available only in the originating browser/profile unless an additional recovery feature is designed.
- Detect newer server versions from another tab/device. Preserve both versions and present a conflict for review, rather than silently overwriting either.
- When leaving with pending unconfirmed changes, persist recovery state and warn about remaining unsynced work where browser behavior permits. Closing/crash callbacks cannot be the primary saving mechanism.
- Maintain version history/undo for mistaken edits and explicit checkpoints at accepted stage handoffs. Exact retention periods, backup/recovery policies, and account lifecycle rules remain undecided.

Local storage, browser/device failure, cleared browser data, private browsing, and service outages mean “never lose content” cannot be an absolute guarantee. The product should expose actual save status and preserve recoverable work rather than promise protection it cannot establish.

## Verification to perform during implementation

1. Type continuously and verify the maximum synchronization interval and truthful save indicators.
2. Navigate immediately after editing; reopen and confirm content and selection/review state.
3. Disconnect/reconnect during editing and verify pending state, durable recovery, and synchronization.
4. Reload or close/reopen before server confirmation; confirm recoverable local edits are offered and not duplicated.
5. Edit the same section in two tabs and verify conflicts preserve both versions.
6. Complete, interrupt, or fail an AI-generation job and verify accepted work survives and completed results recover without unintended extra generation.
7. Simulate failed/full local storage and server errors; verify no false “saved” state.

The user approved autosave timing targets (about one second after a typing pause, at least every five seconds of continuous typing while connected, and immediate discrete-change saves), server-confirmed status, device recovery, version/undo and conflict protections, interrupted-session testing, and optional “Save now.” Implementation must validate these targets; they are not measured guarantees or a promise of zero data loss. Exact retention and backup policies remain to be decided.

Browser recovery limitations checked against primary documentation: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event and https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria. Saving must be continuous during use rather than depending on a browser-close event, and device-only draft status must account for local storage limitations.

## Owner-requested project deletion — approved

Follow the canonical [owner-requested project deletion](../requirements.md#owner-requested-project-deletion) policy: the owner contacts the pilot operator, who verifies the request; review links stop when deletion begins; the project, uploads, saved versions, shared snapshots, and comments are removed from the active app within 30 days of verification. This is separate from removing pilot access, which keeps projects saved. Backup copies and AI-provider retention remain to be agreed once services are chosen; no immediate erasure promise for those copies follows from the active-app deadline.
