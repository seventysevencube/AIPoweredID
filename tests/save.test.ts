import { afterEach, expect, test, vi } from "vitest";
import {
  SaveController,
  type Pending,
  type RecoveryStore,
  type Flight,
} from "../src/save";
import type { SavedRecord, SaveResult } from "../src/model";
const data = (text: string) => ({
  answers: { title: { text, status: "provided" as const } },
  items: [],
});
const record = (revision = 1, text = "Original"): SavedRecord => ({
  project_id: "p",
  section: "context",
  revision,
  data: data(text),
});
function fixture(send?: (f: Flight) => Promise<SaveResult>, pending?: Pending) {
  const key = crypto.randomUUID();
  const disk = new Map<string, Pending>();
  if (pending) disk.set(key, pending);
  const store: RecoveryStore = {
    get: async (k) => structuredClone(disk.get(k)),
    put: async (k, v) => {
      disk.set(k, structuredClone(v));
    },
    remove: async (k) => {
      disk.delete(k);
    },
  };
  const fn = vi.fn(
    send ??
      (async (f) => ({
        record: record(f.base_revision + 1, f.data.answers.title.text),
        saved_at: "2026-10-18T10:00:00Z",
        operation_id: f.operation_id,
      })),
  );
  const c = new SaveController(key, record(), store, fn, () => {});
  return { c, disk, store, fn, key };
}
afterEach(() => vi.useRealTimers());
test("autosaves after pause and at most five seconds of continuous editing", async () => {
  vi.useFakeTimers();
  const { c, fn } = fixture();
  await c.start();
  c.edit(data("One"));
  await vi.advanceTimersByTimeAsync(999);
  expect(fn).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(fn).toHaveBeenCalledOnce();
  expect(c.state.status).toBe("saved");
  for (let i = 0; i < 7; i++) {
    c.edit(data(String(i)));
    await vi.advanceTimersByTimeAsync(800);
  }
  expect(fn.mock.calls.length).toBeGreaterThanOrEqual(2);
  c.stop();
});
test("an older acknowledgement cannot clear newer typing", async () => {
  let release!: (v: SaveResult) => void;
  const { c, disk, fn, key } = fixture(
    (f) =>
      new Promise((r) => {
        release = r;
      }),
  );
  await c.start();
  c.edit(data("First"));
  const flight = c.flush();
  await new Promise((r) => setTimeout(r, 0));
  c.edit(data("Second"));
  const first = fn.mock.calls[0][0];
  release({
    record: record(2, "First"),
    saved_at: "now",
    operation_id: first.operation_id,
  });
  await new Promise((r) => setTimeout(r, 0));
  expect(c.state.data.answers.title.text).toBe("Second");
  expect(c.dirty).toBe(true);
  expect(disk.get(key)?.data.answers.title.text).toBe("Second");
  const second = fn.mock.calls[1][0];
  expect(second.base_revision).toBe(2);
  release({
    record: record(3, "Second"),
    saved_at: "now",
    operation_id: second.operation_id,
  });
  await flight;
  expect(c.dirty).toBe(false);
  expect(disk.size).toBe(0);
  c.stop();
});
test("lost acknowledgement replays the same operation across reload", async () => {
  const { c, disk, key } = fixture(async () => {
    throw Error("connection lost");
  });
  await c.start();
  c.edit(data("Recover me"));
  await c.flush();
  const pending = disk.get(key)!;
  const id = pending.flight!.operation_id;
  c.stop();
  const resumed = fixture(undefined, pending);
  await resumed.c.start();
  expect(resumed.c.state.status).toBe("recovery");
  expect(resumed.fn).not.toHaveBeenCalled();
  await resumed.c.recover();
  expect(resumed.fn.mock.calls[0][0].operation_id).toBe(id);
  expect(resumed.c.state.status).toBe("saved");
  resumed.c.stop();
});
test("conflicts preserve both copies and resolution writes against observed server revision", async () => {
  const f = fixture(async () => {
    throw { status: 409, record: record(4, "Other tab") };
  });
  await f.c.start();
  f.c.edit(data("Mine"));
  await f.c.flush();
  expect(f.c.state.status).toBe("conflict");
  expect(f.c.state.data.answers.title.text).toBe("Mine");
  expect(f.c.state.server?.data.answers.title.text).toBe("Other tab");
  f.fn.mockImplementation(async (g) => ({
    record: record(g.base_revision + 1, "Merged"),
    saved_at: "now",
    operation_id: g.operation_id,
  }));
  await f.c.resolve(record(4, "Other tab"), data("Merged"));
  expect(f.fn.mock.calls[1][0].base_revision).toBe(4);
  expect(f.c.state.revision).toBe(5);
  f.c.stop();
});
test("local storage failure never claims device protection, and sign-in loss preserves the draft", async () => {
  const f = fixture(async () => {
    throw { status: 401 };
  });
  f.store.put = async () => {
    throw Error("quota");
  };
  await f.c.start();
  f.c.edit(data("Kept in memory"));
  await f.c.flush();
  expect(f.c.state.status).toBe("signin");
  expect(f.c.state.localFailure).toBe(true);
  expect(f.c.state.localProtected).toBe(false);
  expect(f.c.dirty).toBe(true);
  f.c.stop();
});
test("a corrected edit can replace a definitely rejected oversized operation", async () => {
  const f = fixture(async () => {
    throw { status: 413, message: "Too large" };
  });
  await f.c.start();
  f.c.edit(data("Rejected"));
  await f.c.flush();
  expect(f.c.state.status).toBe("waiting");
  f.fn.mockImplementation(async (g) => ({
    record: record(2, g.data.answers.title.text),
    saved_at: "now",
    operation_id: g.operation_id,
  }));
  f.c.edit(data("Corrected"));
  await f.c.flush();
  expect(f.fn.mock.calls[1][0].data.answers.title.text).toBe("Corrected");
  expect(f.c.state.status).toBe("saved");
  f.c.stop();
});
test("returning to a section waits for its old save and keeps its confirmed revision", async () => {
  let release!: (r: SaveResult) => void;
  const f = fixture(
    () =>
      new Promise((r) => {
        release = r;
      }),
  );
  await f.c.start();
  f.c.edit(data("Navigating"));
  const saving = f.c.flush();
  await new Promise((r) => setTimeout(r, 0));
  f.c.stop();
  const next = new SaveController(
    f.key,
    record(),
    f.store,
    async (flight) => ({
      record: record(flight.base_revision + 1, "Next"),
      saved_at: "now",
      operation_id: flight.operation_id,
    }),
    () => {},
  );
  const starting = next.start();
  release({
    record: record(2, "Navigating"),
    saved_at: "now",
    operation_id: f.fn.mock.calls[0][0].operation_id,
  });
  await saving;
  await starting;
  expect(next.state.revision).toBe(2);
  expect(next.state.data.answers.title.text).toBe("Navigating");
  next.stop();
});
