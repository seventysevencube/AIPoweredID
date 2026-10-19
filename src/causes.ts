import type { Answer } from "./model";
export const causeChoices = [
  "Knowledge or skills",
  "Unclear expectations",
  "Process or workflow",
  "Tools or access",
  "Time or resources",
  "Incentives or competing priorities",
  "Other",
] as const;
export function readCauses(answer: Answer) {
  const lines = answer.text.split("\n").filter(Boolean);
  const choices = answer.choices
    ? [...answer.choices]
    : lines.filter((line) => causeChoices.some((choice) => choice === line));
  const other =
    answer.other ??
    lines
      .filter(
        (line) =>
          ![...causeChoices, "Not sure"].some((choice) => choice === line),
      )
      .join(" ");
  // Earlier drafts allowed notes without selecting Other. Keep those notes visible.
  if (!answer.choices && other && !choices.includes("Other"))
    choices.push("Other");
  return { choices, other };
}
export function updateCauses(
  answer: Answer,
  choices: string[],
  other: string,
): Answer {
  return {
    ...answer,
    choices,
    other,
    // Inactive Other text remains recoverable in `other`, outside the active summary.
    text: choices
      .map((choice) =>
        choice === "Other" && other ? `Other: ${other}` : choice,
      )
      .join("\n"),
  };
}
