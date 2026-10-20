// Pilot-operator helpers. Budget months are opened explicitly; nothing resets automatically.
export function monthPeriod(month: string) {
  const m = month.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!m) throw Error("Use the month as YYYY-MM, for example 2026-11.");
  const start = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  const end = new Date(Date.UTC(Number(m[1]), Number(m[2]), 1));
  return { starts_at: start.toISOString(), ends_at: end.toISOString() };
}
// Dollars as typed by the operator, to integer micro-dollars without floating-point drift.
export function microusd(usd: string) {
  const m = usd.trim().match(/^\$?(\d{1,3})(?:\.(\d{1,6}))?$/);
  if (!m)
    throw Error("Give the confirmed charge in dollars, for example 0.0123.");
  return Number(m[1]) * 1_000_000 + Number((m[2] ?? "").padEnd(6, "0"));
}
const dollars = (micro: number) => `$${(micro / 1_000_000).toFixed(4)}`;
export function describeStatus(s: any) {
  const lines = [
    s.period
      ? `Budget month ${s.period.starts_at.slice(0, 10)} to ${s.period.ends_at.slice(0, 10)}: ${dollars(s.period.spent_microusd)} spent, ${dollars(s.reserved_microusd)} reserved of $20.00.`
      : "No budget month is open now: AI requests are refused until one is opened.",
    s.pause_reason
      ? `AI is PAUSED (${s.pause_reason}). Confirm the charge for the job below, then AI resumes.`
      : "AI is not paused.",
  ];
  for (const j of s.jobs)
    lines.push(
      `${j.state.padEnd(12)} ${j.id}  ${j.task ?? "analysis"}  ${j.created_at.slice(0, 16)}` +
        j.calls
          .map(
            (c: any) =>
              `\n    ${c.step}: ${c.state}, limit ${dollars(c.max_microusd)}${c.observed_microusd != null ? `, provider reported ${dollars(c.observed_microusd)}` : ""}`,
          )
          .join(""),
    );
  if (!s.jobs.length) lines.push("No queued, running or paused jobs.");
  return lines.join("\n");
}
