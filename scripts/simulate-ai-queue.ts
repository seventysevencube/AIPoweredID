// Isolated demonstration: in-memory PostgreSQL, fictional identity and output,
// fictional charges. No environment files, live account, email, or AI API.
import { randomUUID } from "node:crypto";
import { localDatabase } from "./local-db";
import { sections } from "../src/model";
import {
  enqueueAnalysis,
  runNextSimulation,
  simulationPolicy,
  type SimulatedProvider,
} from "../server/ai/queue";

const store = await localDatabase();
try {
  const actor = { user_id: randomUUID(), session_id: randomUUID() };
  const email = "queue-demo@example.test",
    challenge_id = randomUUID();
  await store.rpc("pilot_set", { email, active: true });
  await store.rpc("request_code", { email, challenge_id, digest: "fictional" });
  await store.rpc("verify_code", { challenge_id, digest: "fictional" });
  await store.rpc("admit", { ...actor, email, challenge_id });
  const project_id = randomUUID();
  await store.rpc("create", {
    ...actor,
    project_id,
    operation_id: randomUUID(),
    title: "Isolated queue simulation",
  });
  for (const [section, keys] of [
    ["context", ["task", "desired", "current"]],
    ["audience", ["roles"]],
  ] as const)
    await store.rpc("save", {
      ...actor,
      project_id,
      section,
      operation_id: randomUUID(),
      base_revision: 1,
      data: {
        answers: Object.fromEntries(
          keys.map((k) => [k, { text: `Fictional ${k}`, status: "provided" }]),
        ),
        items: [],
      },
    });
  await store.aiRpc("open_period", {
    starts_at: new Date(Date.now() - 60_000).toISOString(),
    ends_at: new Date(Date.now() + 86_400_000).toISOString(),
  });
  const access = { rpc: store.aiRpc, policy: simulationPolicy };
  const request = {
    request_id: randomUUID(),
    expected_revisions: Object.fromEntries(
      sections.map((s) => [s, ["context", "audience"].includes(s) ? 2 : 1]),
    ),
  };
  const first = await enqueueAnalysis(access, actor, project_id, request);
  const duplicate = await enqueueAnalysis(access, actor, project_id, request);
  let calls = 0;
  const provider: SimulatedProvider = {
    kind: "simulated",
    run: async ({ step }) => {
      calls++;
      return {
        state: "completed",
        actualMicrousd: 10_000,
        result:
          step === "review"
            ? { needs_repair: true }
            : {
                simulated: true,
                text: `${step} fixture; not an AI-created brief`,
              },
      };
    },
  };
  const workers = await Promise.all([
    runNextSimulation(store.aiRpc, provider),
    runNextSimulation(store.aiRpc, provider),
  ]);
  console.log(
    "SIMULATION ONLY — no live provider, no real charges, no live workspace changes.",
  );
  console.log(
    JSON.stringify(
      {
        duplicateRequestsShareJob: first.job_id === duplicate.job_id,
        workers: workers.map((w) => w.state ?? w.error),
        simulatedProviderCalls: calls,
        budget: await store.aiRpc("budget", actor),
      },
      null,
      2,
    ),
  );
} finally {
  await store.db.close();
}
