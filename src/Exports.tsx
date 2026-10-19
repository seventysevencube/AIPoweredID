import React from "react";
import type { Snapshot } from "./ProjectShell";
import type { ReviewLink } from "./Sharing";

export function Exports(_: {
  id: string;
  snapshot: Snapshot;
  links: ReviewLink[];
}) {
  return null;
}
