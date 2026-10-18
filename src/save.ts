import type { RecordData, SavedRecord, SaveResult } from "./model";
export type Flight = {
  operation_id: string;
  base_revision: number;
  data: RecordData;
  seq: number;
};
export type Pending = {
  base: number;
  data: RecordData;
  seq: number;
  flight?: Flight;
  updated: string;
};
export interface RecoveryStore {
  get(key: string): Promise<Pending | undefined>;
  put(key: string, value: Pending): Promise<void>;
  remove(key: string): Promise<void>;
}
export type SaveState = {
  data: RecordData;
  revision: number;
  status: "saved" | "saving" | "waiting" | "conflict" | "recovery" | "signin";
  localFailure: boolean;
  localProtected: boolean;
  error: string;
  time: string;
  server?: SavedRecord;
};
const controllers = new Map<string, SaveController>();
export class SaveController {
  state: SaveState;
  pending?: Pending;
  private confirmed: SavedRecord;
  private running = false;
  private task?: Promise<void>;
  private stopped = false;
  private timer?: ReturnType<typeof setTimeout>;
  private maxTimer?: ReturnType<typeof setTimeout>;
  private writes: Promise<unknown> = Promise.resolve();
  private retry = 0;
  constructor(
    private key: string,
    record: SavedRecord,
    private store: RecoveryStore,
    private send: (f: Flight) => Promise<SaveResult>,
    private notify: () => void,
  ) {
    this.confirmed = record;
    this.state = {
      data: record.data,
      revision: record.revision,
      status: "saved",
      localFailure: false,
      localProtected: false,
      error: "",
      time: "",
    };
  }
  async start() {
    const previous = controllers.get(this.key);
    if (previous && previous !== this) {
      previous.stop();
      await previous.task;
      await previous.writes;
    }
    controllers.set(this.key, this);
    if (previous && previous.confirmed.revision > this.confirmed.revision) {
      this.confirmed = previous.confirmed;
      this.state.revision = previous.confirmed.revision;
      this.state.data = previous.confirmed.data;
    }
    try {
      this.pending = previous?.pending
        ? structuredClone(previous.pending)
        : await this.store.get(this.key);
      if (this.pending) {
        this.state.data = this.pending.data;
        this.state.status = "recovery";
        this.state.localProtected = previous?.pending
          ? previous.state.localProtected
          : true;
        this.state.localFailure = previous?.pending
          ? previous.state.localFailure
          : false;
      }
    } catch {
      this.state.localFailure = true;
    }
    this.emit();
  }
  private emit() {
    if (!this.stopped) this.notify();
  }
  private persist() {
    const value = this.pending ? structuredClone(this.pending) : undefined;
    this.writes = this.writes
      .catch(() => {})
      .then(async () => {
        try {
          if (value) await this.store.put(this.key, value);
          else await this.store.remove(this.key);
          this.state.localFailure = false;
          this.state.localProtected =
            !!this.pending && !!value && value.seq >= this.pending.seq;
        } catch {
          this.state.localFailure = true;
          this.state.localProtected = false;
        }
        this.emit();
      });
    return this.writes;
  }
  edit(data: RecordData, immediate = false) {
    if (["recovery", "conflict"].includes(this.state.status)) return;
    this.pending = {
      ...this.pending,
      base: this.pending?.base ?? this.state.revision,
      data,
      seq: (this.pending?.seq ?? 0) + 1,
      updated: new Date().toISOString(),
    };
    this.state.data = data;
    this.state.error = "";
    this.retry = 0;
    if (this.state.status !== "signin") this.state.status = "saving";
    void this.persist();
    this.emit();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), immediate ? 0 : 1000);
    this.maxTimer ??= setTimeout(() => {
      this.maxTimer = undefined;
      void this.flush();
    }, 5000);
  }
  async recover() {
    if (!this.pending) return;
    this.state.status = "saving";
    this.emit();
    await this.flush();
  }
  async chooseServer(record: SavedRecord) {
    this.confirmed = record;
    this.pending = undefined;
    this.state = {
      ...this.state,
      data: record.data,
      revision: record.revision,
      status: "saved",
      server: undefined,
      error: "",
      localProtected: false,
      time: "",
    };
    await this.persist();
    this.emit();
  }
  async resolve(record: SavedRecord, data: RecordData) {
    this.confirmed = record;
    this.pending = {
      base: record.revision,
      data,
      seq: (this.pending?.seq ?? 0) + 1,
      updated: new Date().toISOString(),
    };
    this.state = {
      ...this.state,
      data,
      revision: record.revision,
      status: "saving",
      server: undefined,
      error: "",
    };
    this.retry = 0;
    await this.persist();
    this.emit();
    await this.flush();
  }
  observe(record: SavedRecord) {
    if (record.revision === this.state.revision) return;
    if (["recovery", "signin"].includes(this.state.status)) return;
    // An in-flight acknowledgement must settle before interpreting a newer revision.
    if (this.running || this.pending?.flight) return;
    if (this.pending) {
      this.state.status = "conflict";
      this.state.server = record;
      this.emit();
    } else {
      this.confirmed = record;
      this.state.revision = record.revision;
      this.state.data = record.data;
      this.state.time = "";
      this.emit();
    }
  }
  flush(): Promise<void> {
    if (this.task) return this.task;
    const task = this.performFlush();
    this.task = task;
    return task.finally(() => {
      if (this.task === task) this.task = undefined;
    });
  }
  private async performFlush() {
    clearTimeout(this.timer);
    clearTimeout(this.maxTimer);
    this.maxTimer = undefined;
    if (
      this.running ||
      !this.pending ||
      ["conflict", "recovery", "signin"].includes(this.state.status) ||
      this.stopped
    )
      return;
    this.running = true;
    this.state.status = "saving";
    const flight = this.pending.flight ?? {
      operation_id: crypto.randomUUID(),
      base_revision: this.pending.base,
      data: structuredClone(this.pending.data),
      seq: this.pending.seq,
    };
    this.pending.flight = flight;
    await this.persist();
    this.emit();
    try {
      const ack = await this.send(flight);
      this.confirmed = ack.record;
      this.state.revision = ack.record.revision;
      this.state.time = ack.saved_at;
      this.retry = 0;
      if (this.pending.seq === flight.seq) {
        this.pending = undefined;
        this.state.data = ack.record.data;
        this.state.status = "saved";
      } else {
        this.pending.base = ack.record.revision;
        delete this.pending.flight;
      }
      await this.persist();
    } catch (e) {
      const error = e as {
        status?: number;
        record?: SavedRecord;
        message?: string;
      };
      if (error.status === 409 && error.record) {
        this.state.status = "conflict";
        this.state.server = error.record;
      } else if (error.status === 401) {
        this.state.status = "signin";
        this.state.error =
          "Please sign in again. Your recoverable edits remain on this device.";
      } else {
        this.state.status = "waiting";
        this.state.error = error.message ?? "The save could not be confirmed.";
        if (
          error.status &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 429
        ) {
          // A definite rejection cannot have applied. Let a corrected edit form a new operation.
          if (this.pending) delete this.pending.flight;
          await this.persist();
        } else if (++this.retry <= 3)
          this.timer = setTimeout(
            () => void this.flush(),
            Math.min(1000 * 2 ** this.retry, 10000),
          );
      }
    } finally {
      this.running = false;
      this.emit();
    }
    if (this.pending && this.state.status === "saving")
      await this.performFlush();
  }
  resume() {
    if (this.state.status === "signin") this.state.status = "waiting";
    this.retry = 0;
    void this.flush();
  }
  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
    clearTimeout(this.maxTimer);
  }
  get dirty() {
    return !!this.pending;
  }
}
