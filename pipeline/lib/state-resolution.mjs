export function resolveMilestoneState(milestoneId, assessments = []) {
  const approved = assessments
    .filter((item) => item.milestone_id === milestoneId && item.review_state === "human_approved");

  if (!approved.length) {
    return { milestone_id: milestoneId, status: "unassessed", assessment_id: null, history: [] };
  }

  const superseded = new Set(
    approved.map((item) => item.supersedes_assessment_id).filter(Boolean)
  );
  const terminals = approved.filter((item) => !superseded.has(item.id));

  if (terminals.length !== 1) {
    throw new Error(`ambiguous approved assessment state for ${milestoneId}: ${terminals.map((x) => x.id).join(",")}`);
  }

  const current = terminals[0];
  const byId = new Map(approved.map((item) => [item.id, item]));
  const history = [];
  const seen = new Set();
  let cursor = current;

  while (cursor) {
    if (seen.has(cursor.id)) throw new Error(`assessment cycle while resolving ${milestoneId}`);
    seen.add(cursor.id);
    history.push(cursor);
    cursor = cursor.supersedes_assessment_id ? byId.get(cursor.supersedes_assessment_id) : null;
  }

  history.reverse();
  return {
    milestone_id: milestoneId,
    status: current.status,
    confidence: current.confidence,
    assessment_id: current.id,
    effective_at: current.effective_at,
    history: history.map((item) => item.id)
  };
}

export function resolveAllMilestoneStates(questions = [], assessments = []) {
  const states = [];
  for (const question of questions) {
    for (const milestone of question.milestones ?? []) {
      states.push(resolveMilestoneState(milestone.id, assessments));
    }
  }
  return states;
}
