# Milestone 1 live database setup — October 19, 2026

The user supplied the [AIPoweredID Supabase project](https://supabase.com/dashboard/project/eefozbgaobaymadewdhu) and explicitly approved applying the two tested setup scripts. Initial read-only inspection showed Healthy status in East US (North Virginia), no application schema, and no public tables.

Applied once through that project's SQL Editor:

| Migration | Source SHA-256 | Result |
| --- | --- | --- |
| `202610180001_workspace.sql` | `9e8fd659e032a0df9765f3bd5445a12d9d5dd45e94f949295f20cfb2658948d8` | Success; no rows returned |
| `202610180002_version_retention.sql` | `2a756da76d0605aae21bddd764ad301b75ec6e51cd1182cbfaa568fe4fe6b02a` | Success; no rows returned |

The staged first script was copied back from the editor and hash-checked against the repository file before execution. Both staged source hashes matched the files. Supabase's static RLS warning did not detect the first script's dynamic RLS-enabling block; the original tested SQL ran unchanged, and the live table check below verified RLS was enabled.

Observed results from the [read-only configuration check](../../supabase/checks/workspace-configuration.sql):

| Check | Observed |
| --- | --- |
| Application tables | 10 |
| Tables with row-level security enabled | 10 |
| Tables granting browser roles read/write access | 0 |
| Anonymous / authenticated schema usage | false / false |
| Anonymous / authenticated backend-RPC execution | false / false |
| Backend service-role RPC execution | true |
| Version-retention trigger enabled | true |
| RPC session request with random unadmitted identifiers | `unauthorized` |

The last result was checked again in a separate single-column query to make it visible in the results grid. These checks created no designer, admitted session, email, or project. The app's local fictional workspace and saved local projects remain separate.

## Supporting local evidence and remaining checks

At code commit `4d7f1dffb0c6881fda8ec07c5d2f4872899be996`, [GitHub verification](https://github.com/seventysevencube/AIPoweredID/actions/runs/39298600043) passed formatting, 25 unit/integration/provider-contract tests, the client build, the Node 22 backend bundle/startup smoke checks, and all three browser tests. Provider-contract tests use simulated HTTP responses; database behavior tests use PGlite.

After the user privately entered the Supabase key and confirmed Done, `npm run setup:database -- .env.local` completed successfully against the live project. The installed SDK reached the application RPC using the server credential and received the expected `unauthorized` result for random unadmitted identifiers. No user, admitted session, email, or project was created, and no credential was printed. The settings file remains ignored by Git. This verifies basic backend credential/RPC connectivity; it does not switch the fictional local preview to live accounts.

Real native identity issuance/refresh, real email delivery, hosted routing/cookies/persistence, real two-account isolation, and human accessibility acceptance remain unverified. The live checks here establish installed schema/security metadata, backend reachability, and a basic admission-denial path, not end-to-end authentication or production assurance. Live pruning behavior has not been exercised with stored project data; the trigger's retention behavior is covered locally.

The ignored local settings file is prepared; actual keys must be entered privately, not in Git or chat. Resend onboarding is visible, but no sender domain or sending key is configured by this work. No Netlify deployment, DNS change, account purchase, paid AI call, or complete instructional walkthrough has been performed.

These migrations were applied directly in SQL Editor; do not infer a Supabase CLI migration-history entry. Do not rerun the initial migration against this populated schema. Apply only later, unapplied migrations after reviewing their requirements.
