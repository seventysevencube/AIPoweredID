# Project Setup and Project Home — Agreed

Updated: October 17, 2026

The user approved this approach before requesting that all work and notes be saved to the GitHub repository.

- Invited pilot designers sign in to access saved projects; public registration is outside the MVP. One-time email-code sign-in and a simple approved-email list are selected; storage/provider and lifecycle details remain open.
- Each project has one designer who manages content and sharing. Multiple simultaneous authoring roles or team workspaces have not been added to the MVP.
- Each designer can maintain multiple projects.
- Start a new project with a working title, then begin Analysis.
- The project home shows current stage, last saved time, outstanding issues, and the suggested next action for each project.
- “Continue project” resumes at the saved location.
- Reviewers use guest links and can comment on specific content without creating an account.

## Wireframe review

The user compared Project cards and Project rows and selected **Project cards** as clearer. Use cards for the Project Home MVP. Retain current stage, last saved time, outstanding issues, next action, New project, and Continue project in this layout. The row alternative is exploratory history, not the selected design.

Next visual review: the Analysis form, beginning with Project context and performance gap and its optional guidance panel. Wireframes use illustrative sample data, not a live AI/backend connection.

Next planned work: desktop wireframes using a representative five-minute workplace example, storyboard/export examples, and a consolidated implementation brief. Production AI prompts, examples, model choice, and quality thresholds must be reviewed during AI integration in each phase. No app development has started.

## Invitation-only pilot — approved refinement

Designer access is an invitation-only pilot. Only invited participants may create or activate designer accounts; open public registration is outside the MVP. Each designer still owns their own projects and may save multiple projects. Guest reviewers do not need a pilot invitation or an account: an active shared review link grants the agreed view/comment access to its selected fixed-version snapshot, not designer account access.

The subsequent user decision below selects the designer sign-in method. Invitation administration and account lifecycle details remain open; no admin console is added by implication. No real invitations or accounts have been created by these planning updates.

## One-time email code — approved sign-in method

Invited designers sign in using a one-time code sent to their invited email address. They enter their email, request the code, enter it to complete sign-in, and reach their saved projects. No password creation or password-reset flow is required for this selected method. Requesting a code does not grant pilot eligibility or open public registration; the invitation-only access rule still applies.

Guest review through shared links remains account-free and uses its separate unverified display-name behavior. The [designer sign-in code limits](../requirements.md#designer-sign-in-code-limits) now specify 10-minute expiry, single use, a fresh code after five incorrect attempts, and at most one resend per minute to the same email address, replacing the old code. Preserve recoverable work when sign-in is needed again. Provider selection, remaining code/session parameters, invite administration, and lifecycle details remain open. A simple approved-email list is proposed as the next pilot-management decision; no invitation-management dashboard is approved by implication. No authentication implementation or real email sending has started.

## Approved-email list — latest approved pilot-access method

Manage pilot eligibility through a simple list of approved email addresses maintained by the pilot operator. Only listed email addresses are eligible for designer sign-in, and a valid one-time email code is still required. No dedicated invitation-management dashboard is included in the MVP. Guest reviewers continue to use active shared review links without an account or membership on the pilot list.

The operator manages the pilot list; a code request does not itself add someone to it. The approved [designer access removal](../requirements.md#designer-access-removal) rule stops new sign-ins and existing signed-in designer access when the operator removes the email, and deactivates that designer's active project review links. Projects remain saved; access removal does not delete work. Exact list storage/maintenance implementation, authentication provider, remaining code/session parameters beyond the approved limits above, and other account lifecycle details remain open. This supersedes the earlier proposal status of the list. No actual list, addresses, accounts, or email service have been created or changed by the documentation work.

## Expected pilot size — approved planning assumption

Plan the initial pilot for five instructional designers. This is an expected participant count for capacity and AI-usage planning, not a hard five-account limit, a project quota, or an assumption that all five will generate content simultaneously. Guest reviewers are separate from this designer count. The monthly AI budget is now $20 total for the pilot; usage frequency remains open, while the later $16 warning/$20 pause decision is approved.

## Monthly AI budget — approved pilot constraint

The approved monthly AI budget is $20 total for the five-designer pilot, shared across the pilot rather than $20 per designer. This is a spending budget, not an estimate or a promise of a particular number of projects/generations. Hosting, storage, and sign-in email delivery are separate costs; no budgets for those have been approved. Provider/model selection, realistic usage benchmarking, and budget tracking/enforcement details remain open. Manual editing, review, and export do not initiate AI calls under the existing workflow. The later approved rule is a $16 warning and pausing new AI requests that would exceed $20; exact UI presentation and accounting implementation remain open.

## AI spending warning and pause — approved

Approved spending-control policy: show an in-app warning when total monthly pilot AI usage reaches $16 (80% of the $20 budget). Pause new AI requests that would exceed the $20 monthly pilot budget. Preserve saved work and keep manual editing, review, and non-AI exports available. This is a shared pilot limit, not a per-designer allowance.

The limit must not sign a designer out, discard edits, or block reading/exporting existing work. Follow the approved [simple shared AI queue and spending protection](../requirements.md#simple-shared-ai-queue-and-spending-protection): one AI job at a time, reserved maximum cost before starting, confirmed charges before releasing unused money, an operator check and AI pause for uncertain charges, and explicit budget-checked retries. Other requested jobs wait; manual editing, review, and non-AI exports stay available. Exact job allowances, monthly reset timing, provider selection, and implementation remain open. These planning notes configure no live spending limit or provider account.

## Expected completion volume — latest planning estimate

The expected completion volume is approximately 0–1 complete project per month across the five-designer pilot, interpreting the user's answer to the question about total monthly pilot projects. This is a planning estimate, not a per-designer allowance or an enforced project limit. Ongoing drafts, revisions, AI review, and research can incur AI usage even when no project is completed. Generation frequency, source volume, concurrency, and actual cost per accepted output still require measurement. The five-person pilot, approved-email list, email-code sign-in, and $20 shared monthly AI budget remain unchanged.
