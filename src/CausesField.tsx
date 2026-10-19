import { useId } from "react";
import type { Answer } from "./model";
import { causeChoices, readCauses, updateCauses } from "./causes";
export function CausesField({
  label,
  answer,
  onChange,
}: {
  label: string;
  answer: Answer;
  onChange: (answer: Answer) => void;
}) {
  const id = useId();
  const { choices, other } = readCauses(answer);
  return (
    <fieldset className="field causesfield">
      <legend>{label}</legend>
      {answer.status !== "provided" && (
        <p className="answerbadge">
          {answer.status === "unknown"
            ? "Not yet known"
            : answer.status === "not_applicable"
              ? "Not applicable"
              : "Proposed — needs review"}
        </p>
      )}
      <p className="hint">Select any that may apply</p>
      <div className="causechoices">
        {causeChoices.map((choice) => (
          <label className="checklabel" key={choice}>
            <input
              type="checkbox"
              checked={choices.includes(choice)}
              onChange={(event) =>
                onChange(
                  updateCauses(
                    answer,
                    event.target.checked
                      ? [...choices, choice]
                      : choices.filter((value) => value !== choice),
                    other,
                  ),
                )
              }
            />
            {choice}
          </label>
        ))}
      </div>
      <label htmlFor={id}>Other contributing factor</label>
      <input
        id={id}
        type="text"
        disabled={!choices.includes("Other")}
        value={other}
        maxLength={149000}
        onChange={(event) =>
          onChange(updateCauses(answer, choices, event.target.value))
        }
      />
    </fieldset>
  );
}
