> Planning record prepared October 18, 2026. The user subsequently authorized Milestone 1 implementation and merging ready planning changes. Earlier planning-only/local-publication statements below describe the record when drafted; use the current requirements and decision log for present authority. No service verification is implied.

# MVP operating-cost direction

Recorded October 18, 2026, after the planning-document push to PR #2.

## User direction

Keep hosting, storage, and sign-in-email operating costs at a minimum. Expect occasional demos and low volume. The existing shared $20/month AI cap remains separate.

The user has existing domains available; the exact domain or subdomain and DNS access remain setup details. The user explicitly accepts manually resuming an idle free service before a scheduled demo. This acceptance does not waive saving/recovery requirements or establish a permanent restoration guarantee.

The user has not set a numeric non-AI spending cap. Following the Netlify recommendation, the user said “Sounds good” and supplied their account screenshot; use Netlify Free with Supabase Free and Resend Free as the planning foundation, subject to the remaining runtime/behavior validation. This does not reduce approved saving, access, versioning, or other MVP behavior. The fictional walkthrough and other audit findings remain deferred. No application build, subscription, deployment, or PR merge is authorized by this cost direction.

## Planning recommendation, not a selected service stack

Aim for $0/month in non-AI subscriptions where free-tier capabilities fit the actual workflow. Treat $0 as a planning target, not a guaranteed total or an approved hard cap. Include domain registration/renewal separately if needed. Identify genuine runtime, storage, reliability, or email limitations before selecting services; low request volume alone does not establish suitability for AI jobs or file extraction.

Current official-source checks, October 18, 2026:

- [Cloudflare static asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/): static asset requests and asset storage are free; dynamic functions have separate usage limits. This is not proof that the complete backend can run on its free plan.
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/): free dynamic request CPU limits must be checked against actual processing tasks.
- [Supabase pricing](https://supabase.com/pricing) and [free-project pausing](https://supabase.com/docs/guides/platform/free-project-pausing): a free plan exists, but low activity over seven days can trigger pausing. The user accepts manual resumption before scheduled demos. Remaining long-idle retention/restoration limits still need consideration before relying on this setup.
- [Resend pricing](https://resend.com/pricing): a free transactional email plan is listed with 3,000 emails/month and 100/day. [Domain documentation](https://resend.com/docs/dashboard/domains/introduction) requires a verified domain the operator owns for normal sending.
- [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp): check sign-in delivery restrictions/custom SMTP requirements before selecting authentication.

These are candidates and constraints, not approved providers or a full cost/feasibility assessment. No prices from the deferred audit have been adopted.

## Service roles — planning foundation, feasibility work remains

Latest steering: the user already has Vercel and Netlify accounts. Vercel was free and has just entered a 14-day Pro trial for a different project's demo; the user may not continue Pro afterward. Do not assume a continuing paid Vercel subscription in this project's cost plan. The user-supplied Netlify screenshot confirms a credit-based Free plan, with 300 credits/month, $0.00 plan price, and 284.9 credits remaining at the time shown. The displayed billing period is September 20–October 19, with remaining credits expiring October 19, 2026; these are screenshot observations, not a live future balance. Cloudflare has not been selected; the earlier Cloudflare proposal is superseded by reusing Netlify Free.

- Netlify Free: serves the desktop browser app; background functions are a candidate for longer server-side tasks, subject to the job design in the [saved-work and AI-job proposal](saved-work-and-ai-jobs.md).
- Supabase Free: candidate for designer accounts, saved project records/versions, and private uploaded-file storage. App authorization, the pilot allowlist, and the exact approved code/link/access rules must still be implemented and verified; a provider feature listing does not establish compliance.
- Resend Free: candidate for delivering email codes using an existing verified domain, connected through custom SMTP. [Supabase documentation](https://supabase.com/docs/guides/auth/auth-smtp) lists Resend as compatible; its default mail sender is restricted to organization team addresses, which is different from the app's approved-designer list.

This grouping is the planning foundation, not a fully validated or implemented stack. $0/month for these subscriptions is a target within free quotas; existing domain renewals and the separate $20 AI cap remain distinct. Netlify credits are shared infrastructure allowances, not AI tokens or a replacement for the application's shared $20 AI ledger. The screenshot's concurrent-build count does not implement or define the application's one-job AI queue.

Before finalizing the backend, map durable queued AI work, cost reservations, result recovery, file extraction, and export generation to runtime limits. [Supabase Edge Function limits](https://supabase.com/docs/guides/functions/limits) currently list a 150-second free worker duration, 2 seconds of CPU per request, and 256 MB memory. A single long-running request must not be assumed adequate for the whole AI workflow. Do not narrow source formats, output completeness, or the approved one-job shared queue to fit a provider by implication.

Next: detail how saved projects and background AI jobs fit these service roles before selecting any additional infrastructure. Do not request credentials or DNS changes at this planning stage.

This local note has not been pushed to GitHub.

## Existing-account comparison and domain check — October 18, 2026

Read-only public checks confirmed `https://77cube.dev` returns HTTP 200 with title “77 Cube | Websites, Apps & Practical Software”. Its response Server header is `cloudflare`; public A records returned `162.159.143.30` and `172.66.3.26`. Its authoritative nameservers use `ns.porkbun.com`. This indicates Porkbun DNS and Cloudflare-facing traffic, but does not identify the underlying origin host or establish ownership of any Cloudflare account. `www.77cube.dev` did not resolve in these checks. No website, account, DNS record, or domain was modified.

Current planning foundation after the plan clarification and subsequent user acceptance: existing Netlify Free for the app's hosting, with Supabase Free and Resend Free for records/accounts/files and email delivery, subject to feasibility validation. This avoids relying on the other project's temporary Vercel Pro trial or adding a Cloudflare account. The screenshot establishes the current plan type; recheck remaining shared allowances before setup. Netlify allows free commercial projects; Vercel Hobby has a noncommercial personal-use restriction, so occasional demo volume alone does not determine its eligibility. Do not enroll, cancel, upgrade, deploy, or change any existing project on the basis of these planning notes.

Sources:

- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby): current plan restrictions and allowances.
- [Netlify pricing](https://www.netlify.com/pricing/): current Free plan lists 300 monthly credits; the user screenshot confirms this account uses that credit-based Free plan.
- [Netlify commercial-use FAQ](https://www.netlify.com/guides/netlify-vs-vercel/): free commercial use allowed.
- [Netlify credit rules](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/) and [paused-project behavior](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/): team-wide consumption and pauses matter if existing sites share the allowance. An exhausted Free allowance requires a cycle reset or upgrade, not a simple manual wake-up. Do not confuse this with the accepted Supabase inactivity-resume tradeoff.

These checks are public-site observations and planning recommendations, not an inspection of private Vercel/Netlify account settings, full backend feasibility, or approval to deploy. An app subdomain such as `id.77cube.dev` could be considered later without replacing the current root website, subject to DNS access and availability.
