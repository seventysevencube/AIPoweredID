import type { Section } from "./model";

export const sectionGuidance: Record<
  Section,
  { title: string; tips: string[]; example: string }
> = {
  context: {
    title: "Describe the performance gap",
    tips: [
      "Focus on a workplace task or decision. Describe what successful performance looks like and what happens today.",
      "Use observable actions and conditions. Keep the problem separate from a proposed course or other solution.",
      "Explain why the gap matters, using a source or a concrete example where available.",
    ],
    example:
      "Staff should record all required handoff details before transferring a request. Recent reviews show that key details are often missing, causing repeat calls.",
  },
  evidence: {
    title: "Separate evidence from possible causes",
    tips: [
      "Identify observations, work samples, feedback, or performance records that support the gap. Include their source and scope.",
      "Treat the selected causes as hypotheses to investigate. Check expectations, workflow, tools, resources, and incentives alongside knowledge or skills.",
      "Record what has already been tried and what happened. This will help assess whether instruction, performance support, or another change is appropriate during Design.",
    ],
    example:
      "A review of 20 handoffs found eight missing details. Staff report that the required fields are unclear; this is a possible cause to check with the process owner.",
  },
  audience: {
    title: "Understand people and their work environment",
    tips: [
      "Describe the roles performing the task and their relevant starting knowledge and experience.",
      "Identify where people will learn or use support, including device access, connectivity, language, and accessibility needs.",
      "Note meaningful differences between audience groups that may require different examples, practice, or support. Avoid identifying individual medical information.",
    ],
    example:
      "New service staff know the ticket system but have limited routing experience. They work on desktop computers and need a keyboard-accessible reference during calls.",
  },
  stakeholders: {
    title: "Make review and delivery constraints practical",
    tips: [
      "Identify who supplies expertise, validates content, reviews drafts, and makes decisions.",
      "Record each stakeholder’s review availability, time commitment, and expected turnaround so the plan reflects actual capacity.",
      "Capture deadlines, available people and budget, technology requirements, and what is outside scope. Authoring-tool choices come during Design.",
    ],
    example:
      "The process owner validates accuracy and can review for 30 minutes each week with a three-day turnaround. The pilot needs to be ready before the next intake.",
  },
  "org-results": {
    title: "Connect the project to an organizational result",
    tips: [
      "Describe the wider result the project should contribute to and an indicator that would show progress.",
      "Include the current position and desired result where supported, the evidence source, collection method, owner, timing, and how findings will be used.",
      "Consider other changes that could influence the result. An improving metric alone does not establish that learning caused the improvement. Link related workplace-performance measures.",
    ],
    example:
      "Reduce avoidable repeat contacts. Compare the repeat-contact rate before and after the change using service reports, while recording staffing and workflow changes.",
  },
  workplace: {
    title: "Plan how to observe performance at work",
    tips: [
      "State what people should do differently and the conditions and criteria for successful performance.",
      "Choose evidence from actual work, such as observations or work samples. Identify who will collect it, when, and what decisions it will inform.",
      "Allow time and opportunity to apply the performance. Distinguish an unsuccessful attempt from having no opportunity, and link the measure to relevant organizational results.",
    ],
    example:
      "Two weeks after rollout, a supervisor samples handoffs for complete required details. Record whether each person had a relevant handoff opportunity during that period.",
  },
  learning: {
    title: "Plan evidence that knowledge or skills were learned",
    tips: [
      "Connect the knowledge or skill to a workplace task. Describe what people would demonstrate and what would count as success.",
      "Plan the evidence source, collection approach, responsibility, timing, and use of findings. Attendance and completion alone do not demonstrate learning.",
      "Learning measures may remain unresolved in Analysis. If a learning or combined route is chosen in Design, you must confirm them before instructional Design proceeds. Detailed objectives and assessment tasks, scoring, and feedback come during Design.",
    ],
    example:
      "Given a realistic request and an approved reference, the learner selects the appropriate destination and explains the decision using the relevant criteria.",
  },
};
