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
