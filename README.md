# AIPoweredID

An instructional-design workspace for workplace e-learning and performance support.

**October 18, 2026:** planning PRs #1 and #2 are merged. Milestone 1 implementation includes project cards, manual Analysis, private backend operations, version history, and browser recovery. Local integration/browser checks pass. **Live Supabase authentication, Resend delivery, and hosted persistence have not yet been verified.** See the [implementation status](docs/implementation/milestone-1-status.md).

The full MVP covers Analysis, Design, and partial Development. Explicitly accepted output versions seed the next stage's editable skeleton; saving, review, and acceptance are separate. Later AI, imports, sharing, and exports are not functioning actions in this first milestone.

## Run the local development workspace

Use Node.js 22 or newer (tested locally on Node 26; CI targets Node 22).

```sh
npm ci
npm run dev:local
```

Open `http://127.0.0.1:5173`. This is a **local development service**, with a PostgreSQL-compatible PGlite database in ignored `.local-data/`, fictional identities, and a local inbox instead of real email. Use `designer@example.test` or `peer@example.test`, request a code, then choose **Show local development code**. `tabs@example.test` is an additional isolated browser-test fixture. The development service binds only to loopback; it is never imported by the Netlify function.

Restarting the local API expires its fictional sessions; signing in again preserves the database. Only use fictional content here. Browser recovery uses IndexedDB and Web Locks, keeping live tabs' recovery entries separate and offering drafts from closed tabs. Recovery is scoped to the account, project, section, and live page; it is not a backup guarantee.

## Checks

```sh
npm run check
npx playwright install chromium
npm run test:browser
npm run format:check
```

The unit/integration suite runs the actual SQL migration in PGlite. Browser tests use the local HTTP backend and durable browser storage. These tests do **not** establish live Supabase/Resend/Netlify behavior or complete WCAG conformance. GitHub Actions runs the same suites without cloud credentials or AI requests.

## Connect real services

See the [service setup and verification guide](docs/implementation/service-setup.md). Server settings are listed in `.env.example`; keep actual values out of Git and chat. With settings missing, the deployed API returns a setup error and never substitutes fictional authentication or local storage.

No AI key is needed in Milestone 1. There are no AI calls during editing, saving, navigation, or recovery. No subscription purchase, deployment, domain change, source upload, or real invitation has been performed by implementing this foundation.

## Planning baseline

- [Requirements](docs/requirements.md) — main source of current product rules.
- [Decision log](docs/decision-log.md) — approvals and superseded decisions.
- [Notes index](docs/README.md) — exact questions and interaction decisions.
- [Milestone 1 specification](docs/implementation/milestone-1.md) and [phased build plan](docs/implementation/phased-build-plan.md).
- [AI creation and quality](docs/ai/creation-and-quality.md) — revisit prompts, examples, model quality, and cost at each phase's AI connection.
- [Open decisions](docs/open-decisions.md) — deferred work and pending operational choices.

Five designers and approximately 0–1 completed project per month in total are pilot planning assumptions, not quotas. The shared AI budget is $20/month, with a $16 warning; implementation arrives with the AI queue. Netlify Free, Supabase, and Resend are the selected infrastructure direction, targeting no initial subscription cost within allowances. Other audit findings and the fictional complaint-routing walkthrough remain deferred. Remaining B4 work keeps its agreed pre-production timing.
