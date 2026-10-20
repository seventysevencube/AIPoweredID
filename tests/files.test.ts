import { expect, test } from "vitest";
import { readdirSync } from "node:fs";

// Names differing only by letter case break bundling on Linux and checkouts on macOS/Windows.
test("source files have case-insensitively unique names", () => {
  for (const dir of ["src", "server", "server/ai", "scripts", "tests"]) {
    const names = readdirSync(dir).map((n) =>
      n.replace(/\.(tsx?|mts)$/, "").toLowerCase(),
    );
    expect(
      names.filter((n, i) => names.indexOf(n) !== i),
      dir,
    ).toEqual([]);
  }
});
