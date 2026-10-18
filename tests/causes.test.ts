import { expect, test } from "vitest";
import { readCauses, updateCauses } from "../src/causes";
import { answerSchema } from "../src/model";

test("legacy cause selections and notes stay readable without changing the saved answer", () => {
  const old = {
    text: "Knowledge or skills\nOther\nUnclear handoff\nMultiple teams",
    status: "provided" as const,
  };
  expect(readCauses(old)).toEqual({
    choices: ["Knowledge or skills", "Other"],
    other: "Unclear handoff Multiple teams",
  });
  expect(old.text).toContain("\nMultiple teams");
  expect(
    readCauses({ text: "Existing free-form explanation", status: "provided" }),
  ).toEqual({ choices: ["Other"], other: "Existing free-form explanation" });
});

test("turning Other off preserves its note without including it in the active answer", () => {
  const old = {
    text: "Other\nAn additional factor",
    status: "provided" as const,
  };
  const unchecked = updateCauses(old, [], "An additional factor");
  const saved = answerSchema.parse(JSON.parse(JSON.stringify(unchecked)));
  expect(saved.text).toBe("");
  expect(readCauses(saved)).toEqual({
    choices: [],
    other: "An additional factor",
  });
  expect(updateCauses(saved, ["Other"], readCauses(saved).other).text).toBe(
    "Other: An additional factor",
  );
});

test("Other text matching a standard choice does not select that checkbox", () => {
  const saved = updateCauses(
    { text: "", status: "provided" },
    ["Other"],
    "Knowledge or skills",
  );
  expect(readCauses(saved).choices).toEqual(["Other"]);
});
