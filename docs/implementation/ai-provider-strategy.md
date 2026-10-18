> Planning record prepared October 18, 2026. The user subsequently authorized Milestone 1 implementation and merging ready planning changes. Earlier planning-only/local-publication statements below describe the record when drafted; use the current requirements and decision log for present authority. No service verification is implied.

# AI provider strategy — planning proposal

Recorded October 18, 2026. Status: OpenAI approved as the initial provider. The user also approved testing Luna first, using Sol only where quality/cost results justify it, and leaving Jev out initially. Exact task assignments, runtime escalation rules, and quality thresholds remain to be validated; no API integration is authorized. This local note has not been pushed to GitHub.

## User context

The user actively uses OpenAI and Anthropic API keys and has an older Google developer account. No key, private account setting, rate limit, credit balance, model entitlement, or provider agreement was accessed or verified. No paid API calls were made. The user accepted the preceding high-level saved-work/background-job approach; exact technical mechanisms and feasibility remain proposals.

## Recommendation

The user approved OpenAI as the initial integration provider, then asked whether a cheaper model would suffice and whether Jev could help. GPT-6.1 Sol was a candidate, not an approved model requirement. The current recommendation is to evaluate GPT-6 Luna as a lower-cost drafting candidate during each phase's AI integration, retaining Sol as a comparison or scoped option where quality testing justifies it. No runtime model-switching rule is approved by this recommendation. Anthropic Claude Sonnet 5.5 remains a comparison candidate if needed. Defer Google setup and any designer-facing provider/model picker. Keep prompts and project records separable from provider-specific API code so a later deliberate change remains manageable; do not build a full multi-provider runtime or automatic failover by implication.

The reason for the provisional OpenAI choice is the fit of structured responses and the Responses workflow with editable stage records and planned result recovery, not a demonstrated instructional-quality or price advantage over Anthropic. OpenAI's background mode is a possible mechanism, not a selected configuration; verify support and retention for the chosen model/settings before relying on it. Provider-side background processing does not replace the app's durable queue, authorization, budget ledger, or result storage.

## Current public-source comparison

| Candidate | Standard base input / million tokens | Standard base output / million tokens | Source |
|---|---:|---:|---|
| OpenAI GPT-6 Luna | $0.10 | $0.50 | [Official model documentation](https://developers.openai.com/api/docs/models/gpt-6-luna) |
| OpenAI GPT-6.1 Sol | $2 | $10 | [Official model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol) |
| Anthropic Claude Sonnet 5.5 | $2 | $10 | [Official pricing](https://platform.claude.com/docs/en/about-claude/pricing) |

These are public base rates checked October 18, 2026, not a per-project estimate. Context thresholds, cache operations, reasoning/thinking, tools/research, service tiers, regional processing, and repeated calls can affect actual charges. Equal token rates do not imply equal task costs, token counts, duration, or instructional quality. No project count or generation allowance under $20 is promised.

Both providers document structured-output support: [OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs) and [Anthropic](https://platform.claude.com/docs/en/build-with-claude/structured-outputs). Matching a schema does not establish source accuracy, alignment, completeness, or quality. Validate those separately, including refusal/truncation handling.

[OpenAI background mode](https://developers.openai.com/api/docs/guides/background) documents asynchronous execution and status/result retrieval. The [data controls](https://developers.openai.com/api/docs/guides/your-data) distinguish application storage, abuse-monitoring retention, and optional training sharing. [Anthropic API data guidance](https://privacy.claude.com/en/articles/7996875-can-you-delete-data-that-i-sent-via-api) also distinguishes API data handling and training. Public documentation does not verify this user's actual settings or agreement. Retain the approved no-training/task-needed-material rules and pre-production provider-specific retention disclosure timing; do not promise zero storage or immediate deletion.

## Quality and cost validation later

- During each phase's AI integration, revisit the stage-specific prompts, examples, output structure, source grounding, objective/assessment alignment, and complete written deliverables as already agreed.
- Evaluate the cheaper candidate against complete required outputs rather than assuming it is adequate or requiring the more expensive model in advance. Consider lower-cost models per task when measured quality and total cost justify them. Compare factual/source accuracy, objective/assessment alignment, complete written content, preserved links, and designer correction effort. Preserve existing review/repair requirements; do not make every output call both models by default.
- Review source accuracy, main/enabling objectives, assessment alignment, completeness, and usability with human judgment and deterministic checks alongside bounded AI review. A second model/provider review is not automatically required.
- Measure total cost per accepted task, including reasoning, quality review, allowed repair, and research. Preserve one shared serialized queue, maximum cost reservation, $16 warning, $20 hard app cap, operator reconciliation for uncertain charges, explicit failed-job retries, and recovery without regeneration.
- Pin the provider/model/settings/prompt version used for each job. An intentional change requires checking quality and costing assumptions rather than silently changing accepted project work.
- Keep existing examples and other audit findings deferred. No fictional walkthrough or benchmark is resumed by this proposal, and no paid comparison is authorized by the user merely having API accounts.

## Jev assessment — recommendation, not an adopted component

The user clarified that they mean [jevai.net](https://jevai.net/). Its footer identifies it as an independent, unofficial community resource, not affiliated with or endorsed by TypeSafe AI. It is not the authoritative provider documentation or pricing source. Do not treat its quoted rate, trial, or linked API service as verified official TypeSafe terms.

The [official TypeSafe introduction](https://docs.typesafe.ai/introduction), linked from [TypeSafe's own site](https://typesafe.ai/), describes Jev as answering bounded typed questions: choosing from options, scoring against a rubric, or judging a statement. It does not generate prose. Its documentation recommends decomposing questions that require extended reasoning or multiple independent factors.

Implication for this app: Jev cannot replace the generator of Analysis briefs, instructional rationales, objectives, complete assessments, storyboards, scripts, or written aids. It might later be tested for narrowly scoped review flags or source-relevance decisions, with human review and calibrated test cases; that is a possible experiment, not a demonstrated quality/cost improvement here. Typed outputs and confidence values do not prove the factual correctness of a judgment. Do not let a model's score automatically confirm a response route, accept a version, verify source truth, authorize access, or bypass the learning-measure gate.

Recommendation: leave Jev out of the initial MVP because expected volume is low and the additional provider, prompts/tests, data handling, and failure/accounting integration are not yet justified. Use ordinary application checks for required fields, valid IDs, relationships, stage gates, access, and budget arithmetic. Retain semantic review and designer decisions; deterministic checks alone do not establish instructional quality. Any future Jev calls would be subject to the same shared AI cap and reservations, not a separate unbudgeted channel.

The user approved the lower-cost-model strategy and leaving Jev out of the initial MVP. The exact model assigned to each task remains subject to quality/cost validation and actual account availability. This does not authorize automatic provider failover, a designer-facing model picker, or always running two models. No keys or paid API calls are needed for this planning discussion; the fictional walkthrough remains deferred.

Next planning item: the [phased build plan](phased-build-plan.md), beginning with the private workspace and reliable saving before adding phase-specific AI generation. Preparing that plan is not authorization to begin application work.
