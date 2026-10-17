# Peer Review and Sharing — Decisions

Updated: October 17, 2026

Status: Guest access, anchored comments, required unverified display names, and fixed-version review links are approved for the MVP. Other lifecycle/thread details remain open. No app development has started. Synced project sources remain read-only.

## Already agreed

- Optional peer comments on shared drafts at Analysis, Design, and partial Development.
- Reviewers do not directly edit designer content or formally approve progression.
- The designer creates a share link when desired. Recommendations to request peer feedback do not send invitations automatically.
- Current source/data assumption: no confidential organizational material.
- Reviewed versions and comments must remain traceable to the content they concern.
- Confirmed MVP access: guest review without creating an account.
- Confirmed MVP commenting: comments attached to specific sections, objectives, assessments, screens, or blocks.

## Proposed access and content scope

- Project owners sign in to manage saved projects and share links; authentication method remains undecided.
- For the MVP, guest reviewers can open a link and enter a display name before commenting, without creating an account. Display names are unverified and are not proof of identity.
- Anyone possessing an active guest link can view the selected shared version. Make this access scope visible to the owner before link creation.
- Share a selected version of the Analysis brief, Design plan, or Development draft. Let the owner select any supporting source material to include; do not automatically expose all project records or raw uploads.
- Links are revocable. Optional expiry can be offered; no expiry default has been agreed.

## Proposed comment behavior

- Anchor comments to a section, objective, assessment, screen/block, or support section using stable references and the shared version ID.
- Allow comment threads and designer replies/resolution, preserving discussion history.
- The owner can use feedback to make edits or explicitly request an AI revision. Reviewer comments do not automatically alter content, become accepted instructions, or change app/project rules.
- Subsequent draft changes do not silently change the snapshot behind an existing link. The owner explicitly shares an updated version; old comments retain their original version references. Exact link-update/version-history UI remains to be specified.
- Keep review optional and progression under the designer's control. No automatic external invitations or messages are implied by these proposals.

The user explicitly selected guest review without an account and content-anchored comments for the MVP. Keep the review experience focused on these requirements. Owner authentication method, display-name requirements, comment threading/reply/resolution, expiry defaults, and detailed version/link-update interactions are not yet confirmed; they are not automatically required MVP features merely because they were proposed above.

## Guest-review screen — new proposal, awaiting review

Two connected example views show Designer sharing and Guest comments. The draft selector represents different reviewable artifacts (Analysis brief, Design plan, Storyline/Rise storyboard, and written aid); it is not a project tool-choice control. Only representative review targets are included in the wireframe.

- Share a selected artifact/version, with source references and open issues visible. Optional supporting material requires explicit selection; raw uploads and private owner notes are not automatically exposed.
- Proposed access wording: anyone with an active review link can view/comment on that shared snapshot without an account. Guests cannot directly edit content or approve stage progression.
- Proposed name behavior: a display name is required before posting; it is visible with the comment and explicitly unverified. This remains a proposal for user review, not an authentication method or a previously confirmed MVP requirement.
- Proposed version behavior: a review link stays tied to a fixed draft snapshot. Later edits do not silently replace it; sharing an updated draft creates a new link and earlier comments retain their original version references. Exact lifecycle/revocation/expiry details remain open.
- Guests choose a section, objective, enabling objective, assessment, screen, block group, or support section in the outline and comment directly on that target. Preserve stable target IDs and snapshot references behind human-readable labels.
- Unsent comment drafts stay associated with their selected review target in the preview. Posted example comments appear in both the guest item view and the designer feedback view, labeled with the original artifact/version and target.
- Designer comments view preserves original references; feedback does not rewrite content or become accepted AI instructions automatically. Replies, resolution, expiry, and notifications are not added to this screen by implication.

All link creation and posting in the wireframe are local illustrations. The reserved example address is inactive. No real reviewer is invited and no external message is sent. Default sample comments are fictional; saved prototype files do not include user-entered interaction snapshots. The preview's bounded text/comment capacity is not a product limit decision. Structural/script checks do not verify browser behavior, accessibility, server persistence, security, or actual link access controls.

The guest-review interface, required-name proposal, and fixed-version/new-link proposal await user review. Previously confirmed MVP requirements remain guest access without an account and comments anchored to specific content.


## Guest-review MVP approval — latest decision

The user accepted the guest-review approach for the MVP after reviewing both designer and guest views. This approves the screen pattern and the required, unverified display name plus fixed-version/new-link behavior presented in the proposal.

- Guests need no account. A display name is required for posting and is shown beside comments; it is not verified identity.
- Anyone with an active review link can view and comment on the selected shared snapshot. Reviewers cannot directly edit designer content or approve progression.
- Comments attach to specific items and retain stable target and shared-version references. Designers see feedback with its original draft/version and target.
- Existing links remain tied to the snapshot shared. Sharing an updated draft creates a new link; earlier comments retain their original version references.
- The designer selects any supporting source material to include; raw uploads/private notes are not automatically shared. Reviewer comments do not automatically rewrite content or become accepted AI instructions.
- Replies, resolution, expiry, revocation/lifecycle controls, and notifications are not added to the MVP by this approval. Their detailed scope remains open.

This latest approval supersedes earlier statements that display-name and version-link behavior were undecided. It approves requirements/interface patterns, not actual sharing, persistence, or access-control implementation. No real links, reviewer invitations, or messages were created by the prototype.

## Pilot access versus guest review — latest clarification

The user selected invitation-only access for designer accounts. This does not require reviewers to join the pilot or create accounts: an active review link continues to grant access to its selected fixed-version draft for viewing/comments. A guest link does not create designer access or permit project ownership/direct editing. Required unverified display names, original comment version/target references, and the approved link-snapshot behavior remain as agreed. No real invitation or account has been created.
