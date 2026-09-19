import { loadCollections } from "./lib/load-collections.mjs";
import { resolveAllMilestoneStates } from "./lib/state-resolution.mjs";

const collections = await loadCollections();
try {
  const states = resolveAllMilestoneStates(collections.questions, collections.assessments);
  const assessed = states.filter((state) => state.assessment_id !== null).length;
  console.log(`FUTURE_STATE_RESOLUTION_VALID|milestones=${states.length}|assessed=${assessed}|unassessed=${states.length-assessed}`);
} catch (error) {
  console.error("FUTURE_STATE_RESOLUTION_INVALID");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
