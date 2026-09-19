import { resolveMilestoneState } from "./lib/state-resolution.mjs";

const first = {
  id: "ASSESS-900001",
  milestone_id: "Q-001-M1",
  status: "partially_met",
  confidence: "needs_confirmation",
  review_state: "human_approved",
  effective_at: "2099-01-01T00:00:00Z",
  supersedes_assessment_id: null
};
const second = {
  id: "ASSESS-900002",
  milestone_id: "Q-001-M1",
  status: "met",
  confidence: "solid_preliminary",
  review_state: "human_approved",
  effective_at: "2099-01-02T00:00:00Z",
  supersedes_assessment_id: "ASSESS-900001"
};

const current = resolveMilestoneState("Q-001-M1", [first, second]);
if (current.status !== "met") throw new Error("latest approved state not resolved");
if (current.assessment_id !== "ASSESS-900002") throw new Error("wrong terminal assessment");
if (current.history.join(",") !== "ASSESS-900001,ASSESS-900002") throw new Error("history chain not preserved");

const empty = resolveMilestoneState("Q-001-M2", []);
if (empty.status !== "unassessed" || empty.assessment_id !== null) throw new Error("unassessed state failed");

let ambiguityBlocked = false;
try {
  resolveMilestoneState("Q-001-M1", [
    first,
    { ...second, id: "ASSESS-900003", supersedes_assessment_id: null }
  ]);
} catch (error) {
  ambiguityBlocked = String(error?.message ?? error).includes("ambiguous");
}
if (!ambiguityBlocked) throw new Error("parallel approved states were not blocked");

console.log("FE02_STATE_TEST_PASS|history=2|unassessed=1|ambiguity_blocked=1");
