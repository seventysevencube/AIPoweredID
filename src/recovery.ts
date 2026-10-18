import { openDB } from "idb";
import type { RecoveryStore, Pending } from "./save";
const db = () =>
  openDB("aipoweredid-recovery", 1, {
    upgrade(database) {
      database.createObjectStore("pending");
    },
  });
let page: Promise<string> | undefined;
function pageId() {
  return (page ??= new Promise<string>(async (resolve, reject) => {
    try {
      if (!navigator.locks)
        throw Error("Safe browser recovery requires Web Locks.");
      // A duplicate tab may inherit sessionStorage. Only one live page may own an ID.
      async function reserve(id: string): Promise<string | null> {
        return new Promise((ready, failed) => {
          void navigator.locks
            .request("aid-tab:" + id, { ifAvailable: true }, (lock) => {
              if (!lock) {
                ready(null);
                return;
              }
              ready(id);
              return new Promise<void>(() => {}); // Released automatically when the page closes.
            })
            .catch(failed);
        });
      }
      let id = await reserve(
        sessionStorage.getItem("aid-tab") ?? crypto.randomUUID(),
      );
      if (!id) id = await reserve(crypto.randomUUID());
      if (!id) throw Error("Could not reserve a recovery identity.");
      sessionStorage.setItem("aid-tab", id);
      resolve(id);
    } catch (e) {
      reject(e);
    }
  }));
}
export const recovery: RecoveryStore = {
  async get(base) {
    const id = await pageId(),
      database = await db();
    const held = new Set(
      (await navigator.locks.query()).held?.map((lock) => lock.name),
    );
    // Claim a closed page's draft atomically. Never move a live page's recovery copy.
    const tx = database.transaction("pending", "readwrite");
    const keys = await tx.store.getAllKeys();
    let value = (await tx.store.get(base + ":" + id)) as Pending | undefined;
    if (!value) {
      for (const key of keys) {
        if (typeof key !== "string" || !key.startsWith(base + ":")) continue;
        const other = key.slice(base.length + 1);
        if (held.has("aid-tab:" + other)) continue;
        value = await tx.store.get(key);
        if (value) {
          await tx.store.put(value, base + ":" + id);
          await tx.store.delete(key);
          break;
        }
      }
    }
    await tx.done;
    return value;
  },
  async put(base, value) {
    await (await db()).put("pending", value, base + ":" + (await pageId()));
  },
  async remove(base) {
    await (await db()).delete("pending", base + ":" + (await pageId()));
  },
};
