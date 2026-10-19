# Milestone 1 service setup and live verification

Status: the live Supabase migrations, private backend settings, verified Resend sender, and Netlify deployment from main are configured. Real email sign-in, autosave/reload, version restoration, and offline conflict recovery passed. Remaining multi-user/session edge cases and human accessibility acceptance are recorded in the [deployment verification](netlify-deployment-2026-10-19.md). The local preview remains a separate fictional workspace.

October 19 update: the user supplied the [AIPoweredID Supabase project](https://supabase.com/dashboard/project/eefozbgaobaymadewdhu) in East US (North Virginia) and explicitly approved applying the two application migrations. Both completed successfully. Live checks found ten tables with RLS enabled, no direct browser-role access, backend-only RPC permission, an enabled retention trigger, and denial of an unadmitted session. See the [verification record](live-verification-2026-10-19.md) for exact evidence and limits. Resend has verified the selected sending domain; the user saved the sending key privately and the approved sender is configured. The approved test origin is `https://aipoweredid-demo.netlify.app`; hosting and live acceptance remain pending. Do not rerun the initial migration on this project.

## Configuration

1. Select/create the app's Supabase project and region. Apply the SQL files in `supabase/migrations/` in filename order using the operator's SQL editor or a migration connection. Apply each once; the initial workspace migration requires an empty application schema. For an existing workspace, apply only migrations not yet applied, including `202610180002_version_retention.sql` for the 10-version limit.
2. Use the Supabase project URL and server-side secret/service-role key. Store these only in the backend environment as `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Application tables are in an unexposed `app` schema, have RLS enabled, and have no anonymous/authenticated grants or policies. Only the service role can execute `public.app_rpc`.
3. Configure Resend and a verified sender from a domain the user chooses. Store `RESEND_API_KEY` and `EMAIL_FROM` as server-only environment values. App codes are sent directly through Resend; Supabase's default email sender is not the app-code delivery mechanism. This is a concrete implementation refinement from the planning document's proposed SMTP integration.
4. Generate an independent cryptographically random `AUTH_CODE_SECRET` of at least 32 characters, and store it only server-side. It protects stored code digests. Rotating it invalidates outstanding challenges; it does not delete saved projects.
5. Set `APP_ORIGIN` to the exact trusted app origin (scheme, hostname, optional port). Preview environments need their own explicit origin and separate test service configuration; no wildcard origin is permitted. Keep privileged production settings out of untrusted fork previews.
6. Approve pilot emails through the operator script, with server variables loaded securely into the operator's terminal:

   ```sh
   npm run pilot -- add designer@example.com
   npm run pilot -- remove designer@example.com
   ```

   Removal revokes application admissions immediately and blocks subsequent protected requests, retaining project content. It also turns off that designer's guest review links (migration 5).

   For a verified owner request to delete a project:

   ```sh
   npm run project -- list designer@example.com
   npm run project -- delete <project-id> designer@example.com
   ```

   Its review links stop first; the project, records, versions, sources, comments and stored request copies are removed from the active app. Backups and AI-provider retention follow their own rules.
7. Build using `npm ci` and `npm run build`. Netlify configuration serves the client and a standard Request/Response function. Deploy only to an agreed test site when hosting setup is authorized; no DNS change is necessary for that test. The development inbox and identity adapter are excluded from deployed functions.

Never put secrets in a `VITE_` variable, a repository file, a PR, or a chat message. `.env.example` contains names only. Netlify environment scopes must include function runtime settings, not merely build settings.

## Local connection preparation

The user selected `77cube.dev` with Porkbun DNS. The Resend entry for `auth.77cube.dev` is created, with sending enabled and receiving off. The user added all three generated records; Porkbun and public-DNS checks confirmed their values and preserved existing Zoho records. Resend now shows Verified for the domain and all three required records. See the [email-domain setup record](email-domain-setup.md). The sender is planned as `AIPoweredID <signin@auth.77cube.dev>`. The Resend key and approved sender are now saved privately; the approved test origin is configured locally, and actual email delivery remains untested.

An ignored `.env.local` can hold server settings for operator checks. Enter real keys there privately rather than in chat. The prepared local file uses the supplied Supabase URL and an independently generated server secret; the Supabase key has passed its read-only connection check, the user has privately saved the Resend key, and the approved sender is configured. All six settings are prepared locally for the approved test origin; format checks do not validate the Resend credential against the provider or prove delivery. Never commit this file, and do not assume operator commands automatically load it.

```sh
npm run setup:check -- .env.local
npm run setup:database -- .env.local
```

The first command checks all six setting formats without contacting services or printing values. It requires HTTPS origin/project URLs without paths, query strings, credentials, or fragments; a 32-character minimum server secret; nonempty keys; and a valid sender address (with optional display name). It does not prove keys are privileged/valid or a domain is verified.

The second requires only the two Supabase settings, so it can run before Resend is ready. It makes a bounded, read-only application-RPC request using random unadmitted identifiers and expects an authorization denial. It creates no user, email, project, or admitted session. Passing establishes reachability of the initial RPC and its admission check, not the full migration state, real authentication, ownership isolation, or deployed routing. Provider failure details and credentials are not printed. Apply both migrations and retain the live verification steps below.

The local fictional preview continues to use `npm run dev:local`; adding server settings does not silently connect it to real accounts. `npm run build:function` bundles and smoke-checks the real backend entry for Node 22, without a deployment or live network calls. It is included in `npm run check` and therefore CI.

## Authentication mechanism to verify

The product requires a code to expire in 10 minutes, lock after five wrong attempts, be usable once, and be replaced no more than once a minute per approved email. Supabase's generic rate limits alone do not establish all of those rules.

- The server creates a random six-digit code. PostgreSQL serializes challenges, tracks expiry/attempts/replacement, and stores only an HMAC digest. Error outcomes commit their attempt counters.
- Only after the app code verifies does the backend use Supabase Admin `generateLink` and `verifyOtp` to establish a native provider identity. Its generated native link/token is never emailed or exposed in the browser.
- PostgreSQL admits that exact provider `session_id` after rechecking pilot eligibility and identity binding. A native provider token obtained through another flow has no app admission and cannot access app records.
- Browser cookies are HttpOnly, SameSite=Strict, and Secure in the deployed adapter. The backend verifies provider tokens and refreshes through Supabase; every protected RPC also checks the admission and current approved-email list. Client input never supplies the actor or owner.
- Native logout/token expiry and application revocation are different. App sign-out revokes its admission, so a still-valid provider token cannot access the app. The present browser cookies are session cookies; detailed remaining session/shared-device policy is still B4 follow-up.

Supabase failure after the app challenge is consumed requires a fresh app code. The UI must not claim a successful sign-in. Native Auth remains the identity provider; the application is not signing its own JWTs.

## Live verification still required

Use isolated test accounts and fictional information:

- Real email delivery; correct six-digit code and leading zeros; wrong-code lockout; server expiry; single use; replacement/resend enforcement across reloads/tabs; concurrent verification and replacement.
- Native identity creation, token verification/refresh, cookie handling through Netlify, sign-out, and reauthentication into the same recoverable project.
- Attempt native provider sign-in without an app-code admission; direct anonymous/authenticated table and RPC requests must remain denied.
- Two admitted users: project listing, opening, saving, history, and restore stay owner-only. Remove a user and verify existing sessions fail on their next protected operation.
- Hosted saves/reloads, uncertain acknowledgements, two-tab conflicts, local recovery across tabs, expired sessions, paused/unavailable Supabase, and browser-storage failure.
- Function routing/build and security headers in the hosted environment. Confirm secrets are not in client assets, logs, or returned errors.
- Human keyboard and assistive-technology review of every delivered flow, plus zoom/reflow. Automated accessibility checks are supporting evidence only.

No live check above is marked passed by local PGlite or fictional-identity tests. Existing B4 production assurance remains separate; it does not create a new MVP scope restriction.

## Technical references

- [Supabase Admin link generation](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) and [OTP verification](https://supabase.com/docs/reference/javascript/auth-verifyotp).
- [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits) and [session identifiers](https://supabase.com/docs/guides/auth/sessions).
- [Netlify Request/Response functions](https://docs.netlify.com/build/functions/get-started/).

## Hosting readiness — October 19

Read-only inspection confirmed access to the existing Seventy Seven Cube Netlify team. Its project list does not include AIPoweredID, and the checkout has no linked Netlify site. The repository already specifies Node 22, the Vite build/publish settings, API function routing, and response security headers. No site was created or deployed. Agree on a temporary test site, configure its exact HTTPS origin and server-only settings, and then perform the hosted verification above. Email-domain verification does not establish hosted app or email-delivery acceptance.

The user completed GitHub verification and saved the selected-repository permission update. Netlify now lists AIPoweredID, and its import screen confirms the test site name is available. The user explicitly authorized merging the implementation branch and deploying `main`, rather than hosting the feature branch, and approved storing the existing Supabase/Resend keys and sign-in protection secret as private backend settings in this Netlify project. No deployment is claimed complete by this preparation.

## Current hosted verification status

The [deployment record](netlify-deployment-2026-10-19.md) supersedes earlier pending-setup observations in this guide. The live app is connected at `https://aipoweredid-demo.netlify.app`, deployed automatically from `main`. One approved pilot completed real email sign-in. Initial authenticated saving, reload, version restoration, and offline conflict recovery checks passed. Remaining multi-user ownership/access-removal, native refresh/sign-out, other live edge cases, and human accessibility acceptance still require verification. No AI integration or additional pilot invitations are implied.
