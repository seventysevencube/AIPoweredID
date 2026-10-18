import type { Section } from "./model";
const unknown = ["unknown"] as const;
const optional = ["unknown", "not_applicable"] as const;
export type Question = {
  id: string;
  label: string;
  help?: string;
  short?: boolean;
  needed?: boolean;
  answerOptions?: readonly ("unknown" | "not_applicable")[];
};
export const labels: Record<Section, string> = {
  context: "Project context and performance gap",
  evidence: "Evidence and possible causes",
  audience: "Audience and work environment",
  stakeholders: "Stakeholders and project constraints",
  "org-results": "Organizational results",
  workplace: "Workplace performance",
  learning: "Evidence of learning",
};
export const questions: Partial<Record<Section, Question[]>> = {
  context: [
    {
      id: "title",
      label:
        "What would you like to call this project? A working title is fine.",
      short: true,
    },
    {
      id: "task",
      answerOptions: unknown,
      label: "What workplace task or responsibility does this project address?",
      needed: true,
    },
    {
      id: "desired",
      answerOptions: unknown,
      label:
        "What should people be able to do, and what does successful performance look like?",
      needed: true,
    },
    {
      id: "current",
      answerOptions: unknown,
      label:
        "What is happening now, and how does it differ from the desired performance?",
      needed: true,
    },
    {
      id: "reason",
      answerOptions: unknown,
      label: "What prompted this project, and why does addressing it matter?",
    },
  ],
  evidence: [
    {
      id: "evidence",
      answerOptions: unknown,
      label:
        "What information supports your description of the performance gap?",
      help: "Examples: observations, work samples, stakeholder feedback, errors, or performance measures. Evidence can remain not yet available.",
    },
    {
      id: "documentation",
      label: "Add documentation of any supporting evidence if available",
      help: "Optional. Paste supporting text and identify its source. Word and PowerPoint uploads arrive in a later milestone.",
    },
    {
      id: "causes",
      label: "What might be contributing to the gap?",
      help: "Possible explanations may include knowledge or skills; unclear expectations; process or workflow; tools or access; time or resources; incentives or competing priorities; other; or not sure. These are hypotheses, not established causes.",
    },
    {
      id: "tried",
      answerOptions: unknown,
      label: "What has already been tried, and what happened?",
      help: "“Nothing yet” and “Not known” are valid answers.",
    },
  ],
  audience: [
    {
      id: "roles",
      answerOptions: unknown,
      label:
        "Who needs to perform this task? Describe their roles or responsibilities.",
      needed: true,
    },
    {
      id: "experience",
      answerOptions: unknown,
      label:
        "What relevant knowledge, skills, or experience do they already have?",
    },
    {
      id: "environment",
      answerOptions: unknown,
      label: "When and where will they learn or use the performance support?",
    },
    {
      id: "technology",
      answerOptions: unknown,
      label:
        "What devices, technology access, or connectivity conditions should we consider?",
    },
    {
      id: "access",
      answerOptions: optional,
      label:
        "What language, accessibility, or other access needs should the design accommodate?",
      help: "Describe access needs without identifying individual medical information.",
    },
    {
      id: "differences",
      answerOptions: optional,
      label:
        "Are there differences between audience groups that may require different content or support?",
      help: "Optional. Not known yet is available.",
    },
  ],
  stakeholders: [
    {
      id: "deadlines",
      answerOptions: optional,
      label: "What deadlines or milestones does this project need to meet?",
    },
    {
      id: "resources",
      answerOptions: optional,
      label: "What budget, people, or production resources are available?",
      help: "Approximate descriptions and “Not known yet” are welcome.",
    },
    {
      id: "constraints",
      answerOptions: optional,
      label:
        "What organizational, delivery, or technology requirements must the solution follow?",
      help: "Record known constraints. Storyline/Rise is selected during Design.",
    },
    { id: "outside", label: "What is outside the scope of this project?" },
  ],
};
export const stakeholderQuestions: Question[] = [
  { id: "role", label: "Name or role", short: true },
  {
    id: "responsibility",
    label: "What input, review, or decisions will they provide?",
  },
  {
    id: "availability",
    answerOptions: unknown,
    label:
      "What is their availability for reviews, including how much time they can commit and their expected turnaround time?",
  },
];
export const measureQuestions: Record<string, Question[]> = {
  "org-results": [
    {
      id: "description",
      answerOptions: unknown,
      label:
        "What organizational result should improved performance contribute to?",
    },
    {
      id: "indicator",
      answerOptions: unknown,
      label:
        "What information would help you judge whether that result is improving?",
    },
    {
      id: "baseline",
      answerOptions: optional,
      label: "Current position (baseline)",
      help: "Record the baseline where known, including its source.",
    },
    {
      id: "target",
      answerOptions: optional,
      label: "Desired result (target)",
      help: "Unknown values can carry forward. Do not invent figures.",
    },
    {
      id: "influences",
      answerOptions: optional,
      label: "What else could influence this result?",
      help: "Improvement alone does not show that learning or support caused it.",
    },
  ],
  workplace: [
    {
      id: "description",
      answerOptions: unknown,
      label:
        "What should people do differently or more consistently during their work?",
    },
    {
      id: "indicator",
      answerOptions: unknown,
      label: "What would show that they are performing successfully?",
      help: "Include the conditions and success criteria where known.",
    },
    {
      id: "baseline",
      answerOptions: optional,
      label: "What is happening now?",
      help: "Record the baseline and supporting source.",
    },
    {
      id: "target",
      answerOptions: optional,
      label: "What improvement is expected?",
    },
    {
      id: "opportunity",
      answerOptions: optional,
      label:
        "What could affect people’s opportunity to demonstrate this performance?",
      help: "Distinguish unsuccessful performance from not having an opportunity to perform.",
    },
  ],
  learning: [
    {
      id: "description",
      answerOptions: unknown,
      label:
        "What knowledge or skills would people need to develop to perform the work successfully?",
      help: "Link each need to the relevant workplace task or decision.",
    },
    {
      id: "indicator",
      answerOptions: unknown,
      label:
        "What would people need to demonstrate to show they have learned it?",
      help: "Attendance or course completion alone does not demonstrate learning.",
    },
    {
      id: "criteria",
      answerOptions: unknown,
      label: "What would count as a successful demonstration?",
      help: "Include accuracy, quality, independence, conditions, and any resources people may use.",
    },
    {
      id: "baseline",
      answerOptions: optional,
      label: "Current capability, where known",
    },
    {
      id: "target",
      answerOptions: optional,
      label: "Desired improvement, where known",
    },
  ],
};
export const collectionQuestions: Question[] = [
  {
    id: "source",
    answerOptions: unknown,
    label: "Evidence source",
    help: "Identify the source and any limitations on access. Reuse existing documentation.",
  },
  {
    id: "method",
    answerOptions: unknown,
    label: "Collection method",
    help: "Describe the approach. Exact assessment tasks, answers, scoring, and feedback come later in Design.",
  },
  {
    id: "responsibility",
    answerOptions: unknown,
    label: "Who would collect the evidence and review the findings?",
  },
  {
    id: "timing",
    answerOptions: unknown,
    label: "When and how often would this be checked?",
    help: "Include baseline and follow-up timing where relevant, allowing an opportunity to apply the performance at work.",
  },
  {
    id: "use",
    answerOptions: unknown,
    label:
      "How would findings inform decisions, feedback, or additional support?",
  },
];
