// Operator smoke check. Uses only synthetic data, one pipeline, and the protected local ledger.
import { randomUUID } from "node:crypto";
import { localDatabase } from "./local-db";
import { openAIProvider, livePolicy } from "../server/ai/openai";
import { enqueueAnalysis, runNextSimulation } from "../server/ai/queue";
import { workflowInput, outputRecords } from "../server/ai/workflow";
import { sections } from "../src/model";
process.loadEnvFile(".env.local");
if (!process.env.OPENAI_API_KEY) throw Error("Key missing");
const d = await localDatabase(".local-data/ai-connection-check");
const email = "synthetic-ai-check@example.test",
  actor = {
    user_id: "10000000-0000-4000-8000-000000000001",
    session_id: randomUUID(),
  };
await d.rpc("pilot_set", { email, active: true });
await d.db.exec(
  "update app.challenges set issued_at=now()-interval '61 seconds'",
);
const challenge_id = randomUUID();
await d.rpc("request_code", { email, challenge_id, digest: "synthetic" });
await d.rpc("verify_code", { challenge_id, digest: "synthetic" });
await d.rpc("admit", { ...actor, email, challenge_id });
const project_id = randomUUID();
await d.rpc("create", {
  ...actor,
  project_id,
  operation_id: randomUUID(),
  title: "Synthetic AI connection check",
});
for (const [section, answers] of Object.entries({
  context: {
    task: "Route fictional customer complaints to the correct team.",
    desired:
      "Use the fictional routing checklist to select the correct queue and explain the reason.",
    current: "New staff confuse billing questions with product issues.",
  },
  audience: {
    roles:
      "New customer service agents. All have access to the routing checklist.",
  },
}))
  await d.rpc("save", {
    ...actor,
    project_id,
    section,
    operation_id: randomUUID(),
    base_revision: 1,
    data: {
      answers: Object.fromEntries(
        Object.entries(answers).map(([k, text]) => [
          k,
          { text, status: "provided" },
        ]),
      ),
      items: [],
    },
  });
const start = new Date();
start.setUTCDate(1);
start.setUTCHours(0, 0, 0, 0);
const end = new Date(start);
end.setUTCMonth(end.getUTCMonth() + 1);
await d.aiRpc("open_period", {
  starts_at: start.toISOString(),
  ends_at: end.toISOString(),
});
const q = await enqueueAnalysis(
  { rpc: d.aiRpc, policy: livePolicy("analysis") },
  actor,
  project_id,
  {
    request_id: randomUUID(),
    expected_revisions: Object.fromEntries(
      sections.map((s) => [s, s === "context" || s === "audience" ? 2 : 1]),
    ),
    task: "analysis",
  },
);
console.log("Job reserved/queued:", !!q.job_id, q.error ?? "");
const result = await runNextSimulation(
  d.aiRpc,
  openAIProvider(process.env.OPENAI_API_KEY),
);
console.log("Worker:", result);
const job = await d.aiRpc("job", { ...actor, project_id, job_id: q.job_id });
console.log("Result:", {
  state: job.job?.state,
  sections: job.job?.result?.sections?.map((s: any) => s.key),
  failure: job.job?.failure,
});
const calls = await d.db.query(
  "select step,state,actual_microusd,result->>'error' as provider_error from app.ai_calls where job_id=$1",
  [q.job_id],
);
console.log("Calls:", calls.rows);
if (process.argv.includes("--design") && job.job?.state === "completed") {
  await d.workflowRpc("apply", {
    ...actor,
    project_id,
    job_id: q.job_id,
    task: "analysis",
    sections: outputRecords(job.job.result, "analysis"),
  });
  let w = await d.workflowRpc("open", { ...actor, project_id });
  await d.workflowRpc("accept_analysis", {
    ...actor,
    project_id,
    revision: w.records["analysis-brief"].revision,
    reviewed: true,
  });
  const expected_revisions = Object.fromEntries(
    sections.map((s) => [s, s === "context" || s === "audience" ? 2 : 1]),
  );
  for (const task of ["solution", "design"] as const) {
    if (task === "design") {
      await d.rpc("save", {
        ...actor,
        project_id,
        section: "learning",
        base_revision: 1,
        operation_id: randomUUID(),
        data: {
          answers: {},
          items: [
            {
              id: randomUUID(),
              answers: {
                description: {
                  text: "Recognize complaint categories",
                  status: "provided",
                },
                indicator: {
                  text: "Route three sample complaints using the checklist and explain each decision",
                  status: "provided",
                },
              },
            },
          ],
        },
      });
      expected_revisions.learning = 2;
      w = await d.workflowRpc("open", { ...actor, project_id });
      await d.rpc("save", {
        ...actor,
        project_id,
        section: "design-solution",
        base_revision: w.records["design-solution"].revision,
        operation_id: randomUUID(),
        data: {
          ...w.records["design-solution"].data,
          answers: {
            ...w.records["design-solution"].data.answers,
            ...Object.fromEntries(
              Object.entries({
                route: "combined",
                deliverable: "both",
                format: "microlearning",
                tools: "rise",
                measures_confirmed: "yes",
                learning_revision: "2",
              }).map(([k, text]) => [k, { text, status: "provided" }]),
            ),
          },
        },
      });
    }
    const wi = await workflowInput(d.workflowRpc, actor, project_id, task);
    const queued = await enqueueAnalysis(
      { rpc: d.aiRpc, policy: livePolicy(task) },
      actor,
      project_id,
      { task, request_id: randomUUID(), expected_revisions },
      wi,
    );
    const worked = await runNextSimulation(
      d.aiRpc,
      openAIProvider(process.env.OPENAI_API_KEY!),
    );
    const output = await d.aiRpc("job", {
      ...actor,
      project_id,
      job_id: queued.job_id,
    });
    console.log(task, {
      worked,
      state: output.job?.state,
      sections: output.job?.result?.sections?.map((s: any) => ({
        key: s.key,
        items: s.items.length,
      })),
      review: output.job?.artifacts?.review,
    });
    if (output.job?.state === "completed")
      console.log(
        "Applied:",
        !(
          await d.workflowRpc("apply", {
            ...actor,
            project_id,
            job_id: queued.job_id,
            task,
            sections: outputRecords(output.job.result, task),
          })
        ).error,
      );
  }
}
console.log("Budget:", await d.aiRpc("budget", actor));
await d.db.close();
