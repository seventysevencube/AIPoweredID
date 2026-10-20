import { api } from "./http";
import { sections } from "./model";
import { digest } from "./dependencies";
import type { AITask } from "./workflow-model";
import type { Snapshot } from "./ProjectShell";

// One AI request through the shared queue. A repeated click replays the same request id;
// a new attempt (after a failure, or an explicit new request) gets its own. An unchanged
// retry reuses completed steps; if inputs changed, a fresh job is started instead.
export async function requestJob({
  userId,
  projectId,
  task,
  current,
  previous,
  note = "",
  target,
  fresh = true,
}: {
  userId: string;
  projectId: string;
  task: AITask;
  current: Snapshot;
  previous?: { id: string; state: string };
  note?: string;
  target?: string;
  // false: an unchanged first request replays the same job instead of starting another.
  fresh?: boolean;
}): Promise<{ job_id: string; state: string }> {
  const expected_revisions = Object.fromEntries(
    sections.map((s) => [s, current.records[s].revision]),
  );
  const retrying =
    !!previous && ["failed", "cancelled"].includes(previous.state);
  const submit = (attempt: string, retry_of?: string) => {
    const key = `ai-intent:${userId}:${projectId}:${task}:${target ?? ""}:${JSON.stringify(expected_revisions)}:${current.records["design-solution"]?.revision ?? 0}:${current.accepted_revision ?? 0}:${attempt}`;
    let requestId: string = crypto.randomUUID();
    try {
      const prior = localStorage.getItem(key);
      if (prior) requestId = prior;
      else localStorage.setItem(key, requestId);
    } catch {}
    return api(`/projects/${projectId}/ai-jobs`, "POST", {
      request_id: requestId,
      expected_revisions,
      task,
      ...(retry_of ? { retry_of } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(target ? { target } : {}),
    });
  };
  if (retrying && previous?.state === "failed")
    try {
      return await submit(`retry:${previous.id}`, previous.id);
    } catch (e) {
      if ((e as { error?: string }).error !== "invalid_retry") throw e;
    }
  return submit(
    retrying
      ? `fresh:${previous!.id}`
      : fresh
        ? `after:${previous?.id ?? "none"}:${digest(note.trim())}`
        : "initial",
  );
}
