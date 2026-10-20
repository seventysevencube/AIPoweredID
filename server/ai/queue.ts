import { randomUUID } from "node:crypto";
import { z } from "zod";
import { type AITask, aiTasks } from "../../src/workflow-model";
import type { Rpc } from "../api";
import { recordDataSchema, sections } from "../../src/model";
import { readCauses, updateCauses } from "../../src/causes";

export const moneySchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const stepSchema = z.enum(["generate", "review", "repair"]);
export type Step = z.infer<typeof stepSchema>;
const policySchema = z
  .object({
    provider: z.enum(["simulated", "openai"]),
    task: z.enum(aiTasks).optional(),
    model: z.string().optional(),
    prompt_version: z.string().min(1).max(100),
    steps: z
      .array(z.object({ key: stepSchema, max_microusd: moneySchema }).strict())
      .min(1)
      .max(3),
  })
  .strict()
  .refine((p) =>
    p.steps.every((s, i) => s.key === ["generate", "review", "repair"][i]),
  );

// Fictional simulation allowance/rates. Real provider policy is separately
// bounded in openai.ts and can never be selected or priced by a browser.
export const simulationPolicy = policySchema.parse({
  provider: "simulated",
  prompt_version: "analysis-synthesis-v0.1-simulation",
  steps: [
    { key: "generate", max_microusd: 600_000 },
    { key: "review", max_microusd: 200_000 },
    { key: "repair", max_microusd: 200_000 },
  ],
});
export type QueueAccess = {
  rpc: Rpc;
  policy: z.infer<typeof policySchema>;
};
export const enqueueSchema = z
  .object({
    request_id: z.uuid(),
    expected_revisions: z
      .object(
        Object.fromEntries(
          sections.map((key) => [key, z.number().int().positive()]),
        ) as Record<(typeof sections)[number], z.ZodNumber>,
      )
      .strict(),
    retry_of: z.uuid().optional(),
    task: z.enum(aiTasks).optional(),
  })
  .strict();

export async function enqueueAnalysis(
  access: QueueAccess,
  actor: { user_id: string; session_id: string },
  projectId: string,
  body: unknown,
  workflowInput?: unknown,
) {
  const policy = policySchema.parse(access.policy);
  return access.rpc("enqueue", {
    ...enqueueSchema.parse(body),
    ...actor,
    project_id: z.uuid().parse(projectId),
    policy,
    ...(workflowInput ? { workflow_input: workflowInput } : {}),
    allowance_microusd: policy.steps.reduce(
      (sum, s) => sum + s.max_microusd,
      0,
    ),
  });
}

export async function queueCall(
  rpc: Rpc,
  op: string,
  payload: Record<string, unknown>,
) {
  const response = await rpc(op, payload);
  if (response.error) throw Error(response.error);
  return response;
}

const snapshotSchema = z.record(
  z.string(),
  z.object({ revision: z.number().int().positive(), data: recordDataSchema }),
);
export function activeAnalysisInput(snapshot: unknown) {
  const input = snapshotSchema.parse(snapshot);
  // A retained, inactive Other note must never enter provider input.
  for (const record of Object.values(input)) {
    for (const [key, answer] of Object.entries(record.data.answers)) {
      if (key === "causes") {
        const causes = readCauses(answer);
        record.data.answers[key] = updateCauses(
          answer,
          causes.choices,
          causes.choices.includes("Other") ? causes.other : "",
        );
      }
    }
  }
  return input;
}

export interface SimulatedProvider {
  readonly kind: "simulated" | "openai";
  run(input: {
    step: Step;
    callId: string;
    input: ReturnType<typeof activeAnalysisInput>;
    artifacts: Partial<Record<Step, unknown>>;
    maxMicrousd: number;
    task?: AITask;
    workflow?: unknown;
  }): Promise<{
    state: "completed" | "failed" | "uncertain";
    actualMicrousd: number | null;
    result: unknown;
  }>;
}

// Shared runner used by the simulation harness and private hosted worker.
// Every externally billable boundary is first
// committed as an intent, then permission is used once without automatic retry.
export async function runNextSimulation(rpc: Rpc, provider: SimulatedProvider) {
  const claimToken = randomUUID();
  const claimed = await rpc("claim", { claim_token: claimToken });
  if (!claimed.job) return claimed;
  const job = claimed.job;
  const identity = { job_id: job.id, claim_token: claimToken };
  let policy, input;
  try {
    policy = policySchema.parse(job.policy);
    if (policy.provider !== provider.kind) throw Error("ai_not_available");
    input = activeAnalysisInput(
      Object.fromEntries(
        Object.entries(job.input_snapshot).filter(([k]) => k !== "workflow"),
      ),
    );
  } catch {
    return queueCall(rpc, "finish", { ...identity, success: false });
  }
  const artifacts: Partial<Record<Step, unknown>> = {};
  try {
    for (const step of policy.steps) {
      if (
        step.key === "repair" &&
        !(artifacts.review as { needs_repair?: boolean } | undefined)
          ?.needs_repair
      )
        continue;
      await queueCall(rpc, "heartbeat", identity);
      const permit = await queueCall(rpc, "begin_call", {
        ...identity,
        step: step.key,
        call_id: randomUUID(),
      });
      if (!permit.execute) {
        if (!["completed", "reused"].includes(permit.call.state))
          return { error: "ai_cost_pending" };
        artifacts[step.key] = permit.call.result;
        continue;
      }
      const callId = permit.call.id;
      let outcome: Awaited<ReturnType<SimulatedProvider["run"]>>;
      try {
        outcome = await provider.run({
          step: step.key,
          callId,
          input,
          artifacts,
          maxMicrousd: step.max_microusd,
          task: policy.task,
          workflow: job.input_snapshot.workflow,
        });
      } catch {
        // A thrown transport failure cannot establish whether work was charged.
        outcome = { state: "uncertain", actualMicrousd: null, result: null };
      }
      if (outcome.actualMicrousd !== null)
        moneySchema.parse(outcome.actualMicrousd);
      if (outcome.state === "completed") {
        const shape =
          step.key === "review"
            ? z.object({ needs_repair: z.boolean() })
            : z.record(z.string(), z.unknown());
        if (!shape.safeParse(outcome.result).success)
          outcome = { ...outcome, state: "failed", result: null };
      }
      const recorded = await rpc("outcome", {
        call_id: callId,
        state: outcome.state,
        actual_microusd: outcome.actualMicrousd,
        result: outcome.result,
      });
      if (recorded.error) return recorded;
      if (outcome.state !== "completed")
        return queueCall(rpc, "finish", { ...identity, success: false });
      artifacts[step.key] = outcome.result;
    }
    return queueCall(rpc, "finish", { ...identity, success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "unauthorized",
        "ai_period_closed",
        "ai_budget_exceeded",
        "ai_step_blocked",
      ].includes(error.message)
    ) {
      try {
        return await queueCall(rpc, "finish", { ...identity, success: false });
      } catch {
        /* A lost acknowledgement still requires durable-state recovery. */
      }
    }
    // Do not speculate that an intent/outcome write failed to commit. A fresh
    // worker inspects durable state; an interrupted call remains reserved/paused.
    return { error: "ai_interrupted", job_id: job.id };
  }
}

// Work through the shared queue until it is empty. No new job starts after the time budget,
// so a job started at the last moment (at most three 120 s calls) still ends inside the
// hosting platform's 15-minute background limit.
export async function drainQueue(
  rpc: Rpc,
  provider: SimulatedProvider,
  { budgetMs = 8 * 60_000, clock = Date.now, maxJobs = 50 } = {},
) {
  const stopStarting = clock() + budgetMs;
  let handled = 0;
  while (handled < maxJobs && clock() < stopStarting) {
    const result = await runNextSimulation(rpc, provider);
    if (result.error || result.idle) break;
    handled++;
  }
  return handled;
}
