# Netlify deployment — October 19, 2026

The user explicitly approved merging the implementation branch and deploying `main`, plus storing the existing Supabase/Resend credentials and sign-in protection secret privately in this Netlify project. No paid plan or subscription upgrade was selected.

- [PR #3](https://github.com/seventysevencube/AIPoweredID/pull/3) merged successfully at `9f2743b911fc7e24ff2c9933d36b87ab57695375`.
- PR head `aaec19dd9bff32d7006a98c22b4058560c31f718` passed [GitHub verification run 15](https://github.com/seventysevencube/AIPoweredID/actions/runs/39311459709): formatting, 25 tests, client build, backend bundle/startup smoke checks, and three Chromium browser workflows.
- The local checkout is on `main`, synchronized with that merge.
- The existing Seventy Seven Cube Netlify team can now access AIPoweredID through its selected-repository GitHub installation.
- The [Netlify project](https://app.netlify.com/projects/aipoweredid-demo/overview) was created from `main`, using `npm run build`, `dist`, `netlify/functions`, and the repository configuration.
- The public site is [aipoweredid-demo.netlify.app](https://aipoweredid-demo.netlify.app). The initial [deploy detail](https://app.netlify.com/projects/aipoweredid-demo/deploys/6ad670df40a40786c5d34261) was created on October 19.

## Public verification

Read-only HTTPS checks returned:

| Check | Result |
| --- | --- |
| Root page | HTTP 200, HTML with the app mount |
| Content Security Policy | Present |
| Frame protection | DENY |
| Search indexing policy | noindex, nofollow |
| Referenced JS/CSS assets checked | 2 |
| Actual local service credential values present in those assets | None |
| `/api/setup` before configuration | HTTP 503, setup_required |
| `/api/projects` before configuration | HTTP 503 |
| Development inbox path before configuration | HTTP 503 |

No service credential values were sent in these checks or printed. The credential comparison was performed locally against the fetched public files. This checks those referenced assets only, not every possible provider log or stored artifact.

## Backend settings imported; hosted checks pending

All six local server settings pass format checks. The Netlify import form is prepared with **Contains secret values** checked and **Production** as its only deploy context. Deploy Previews, branch deploys, Preview Server/Agent Runners, local development, and custom branches are excluded. Free-plan scope controls are unavailable; secret mode excludes post processing while including Builds, Functions, and Runtime. Do not claim a Functions-only scope.

The automatic approval review rejected copying the complete private settings file to the system clipboard because it would unnecessarily expose credentials. The private document was closed without proceeding with that transfer. The user then completed the direct private import and confirmed Done. Read-only inspection found all six expected settings marked Secret values, each with one value in one deploy context; the expanded origin entry showed Production as the populated context. Values were not revealed. Values must never be stored in Git or chat.

Settings are saved. Redeploy and check `/api/setup` reports connected. Obtain explicit approval for the first pilot email and any real sign-in message, then verify delivery, native identity/cookies, saving/reload, sign-out, and later live isolation/recovery checks. Hosted authentication/persistence and human accessibility acceptance remain pending. This deployment does not declare Milestone 1 complete or implement AI generation.

## Connected deployment and first sign-in request

The first configured build (`6ad67344ec1b50267dff0665`) failed because the import classified public `APP_ORIGIN` and `EMAIL_FROM` values as secrets, and those public values occur in repository setup documentation. The scanner reported no actual credential match. Netlify does not permit removing a secret flag in place. A production-only `SECRETS_SCAN_OMIT_KEYS=APP_ORIGIN,EMAIL_FROM` setting handles exactly these public values; credential scanning remains enabled, with no credential-key or path exclusions. See [Netlify’s documented scanning configuration](https://docs.netlify.com/build/environment-variables/secrets-controller/#configure-secret-scanning).

A retry of `main @ cd4a410` published successfully as [deploy 6ad6764e5ef26afdf445bdc4](https://app.netlify.com/projects/aipoweredid-demo/deploys/6ad6764e5ef26afdf445bdc4). Post-deployment checks returned `/api/setup` HTTP 200 with ready=true and mode=connected; unsigned-in session, project, and local-inbox requests returned 401; a mutation with an untrusted origin returned 403. A unique unapproved address at the reserved example.invalid domain exercised the backend RPC and returned the normal non-enumerating response. SQL returns not_eligible before creating a challenge or attempting email for that case. No actual local service credentials were present in the two referenced public client assets.

The user approved their chosen email as the first pilot account and authorized one sign-in code for the live test. The operator script confirmed pilot access approved. The live app’s Send code action completed and displayed Check your email with the six-digit input; the Resend adapter returned success. Actual inbox delivery and native sign-in remain user-confirmation steps. No authentication code was retrieved or recorded. Live authenticated saving, refresh, isolation, and human accessibility acceptance remain pending.

## Initial authenticated workspace verification

The user entered the received code in the live app and confirmed Done. The app showed the authenticated pilot workspace. A project named **Technical connection check (fictional)** was created solely for technical checks; this does not resume the deferred instructional walkthrough. A task-field edit was acknowledged as All changes saved. After a full browser reload, the native session remained admitted and the saved project/answer reloaded. History showed revisions 1 and 2. A distinct edit was saved as revision 3; restoring revision 2 saved the earlier answer as revision 4 while retaining both prior versions. A clean second tab also observed the newer saved record without a manual reload. No AI call, review acceptance, or downstream instructional handoff was performed.

A separate app tab was put offline through its own DevTools network emulation. Editing showed **Saved on this device — waiting to sync**, retaining the draft without claiming a server save. The online tab then saved a different answer. After restoring No throttling on the test tab, the app showed **Changes need review** and both the recoverable draft and confirmed server copy. Choosing the test draft as the starting point saved a new version, and the resolved answer survived a full reload. Normal network access was restored, DevTools closed, and the extra test tab closed. The original app was returned to project cards. The clearly labeled fictional test project remains available for inspection.

Still pending: real two-pilot ownership/isolation and access-removal checks; native token refresh and sign-out/reauthentication acceptance; code-error/expiry/concurrency live edge cases; browser-storage/provider-outage scenarios beyond the exercised offline case; human keyboard/assistive-technology acceptance. Local tests remain supporting evidence for unexercised cases. These gaps are not a claim of failure, and this record does not redefine the approved B4 timing.

The user subsequently deferred the second-pilot live isolation test and requested moving to the next step. No additional pilot was added or emailed. The remaining acceptance items above are retained as unverified; this deferral is not a successful test result.
