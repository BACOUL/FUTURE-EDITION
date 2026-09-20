import { readFile } from "node:fs/promises";
import { buildGraph, stableStringify, validateCollections } from "./lib/graph-model.mjs";
import { resolveMilestoneState } from "./lib/state-resolution.mjs";
import { assessmentStateHash, buildMilestoneChange, classifyMilestoneChange } from "./lib/change-engine.mjs";
import { validateSchema } from "./lib/schema-validator.mjs";

const before = {
  id: "ASSESS-910001",
  milestone_id: "Q-001-M1",
  status: "not_met",
  confidence: "needs_confirmation",
  basis_claim_ids: ["CLAIM-910001"],
  basis_event_ids: ["EV-2099-910001"],
  review_state: "human_approved",
  review_id: "REVIEW-910001",
  supersedes_assessment_id: null,
  observed_at: "2099-01-01T12:00:00Z",
  effective_at: "2099-01-01T12:00:00Z",
  valid_from: "2099-01-01T12:00:00Z",
  valid_to: "2099-01-02T12:00:00Z"
};

const after = {
  id: "ASSESS-910002",
  milestone_id: "Q-001-M1",
  status: "partially_met",
  confidence: "solid_preliminary",
  basis_claim_ids: ["CLAIM-910002"],
  basis_event_ids: ["EV-2099-910002"],
  review_state: "human_approved",
  review_id: "REVIEW-910002",
  supersedes_assessment_id: "ASSESS-910001",
  observed_at: "2099-01-02T12:00:00Z",
  effective_at: "2099-01-02T12:00:00Z",
  valid_from: "2099-01-02T12:00:00Z",
  valid_to: null
};

const change = buildMilestoneChange({
  id: "CHANGE-910001",
  before,
  after,
  trigger_claim_ids: ["CLAIM-910002"],
  trigger_evidence_ids: ["EVID-910002"],
  trigger_event_ids: ["EV-2099-910002"],
  review_id: "REVIEW-910002",
  justification: "Fresh verified evidence advances the milestone from not met to partially met.",
  observed_at: "2099-01-02T12:05:00Z"
});

const base = {
  questions: [{
    id: "Q-001",
    milestones: [{ id: "Q-001-M1" }]
  }],
  technologies: [],
  organizations: [],
  people: [],
  sources: [
    { id: "SRC-910001", author_ids: [], organization_ids: [], observed_at: "2099-01-01T00:00:00Z", valid_from: "2099-01-01T00:00:00Z", valid_to: null },
    { id: "SRC-910002", author_ids: [], organization_ids: [], observed_at: "2099-01-02T00:00:00Z", valid_from: "2099-01-02T00:00:00Z", valid_to: null }
  ],
  provenance: [
    { id: "PROV-910001", source_id: "SRC-910001", derived_from_source_ids: [], independence_group: "origin-a", observed_at: "2099-01-01T00:00:00Z", valid_from: "2099-01-01T00:00:00Z", valid_to: null },
    { id: "PROV-910002", source_id: "SRC-910002", derived_from_source_ids: [], independence_group: "origin-b", observed_at: "2099-01-02T00:00:00Z", valid_from: "2099-01-02T00:00:00Z", valid_to: null }
  ],
  evidence: [
    { id: "EVID-910001", claim_id: "CLAIM-910001", source_id: "SRC-910001", provenance_id: "PROV-910001", support: "supports", observed_at: "2099-01-01T01:00:00Z", valid_from: "2099-01-01T01:00:00Z", valid_to: null },
    { id: "EVID-910002", claim_id: "CLAIM-910002", source_id: "SRC-910002", provenance_id: "PROV-910002", support: "supports", observed_at: "2099-01-02T01:00:00Z", valid_from: "2099-01-02T01:00:00Z", valid_to: null }
  ],
  claims: [
    { id: "CLAIM-910001", evidence_ids: ["EVID-910001"], observed_at: "2099-01-01T02:00:00Z", valid_from: "2099-01-01T02:00:00Z", valid_to: null },
    { id: "CLAIM-910002", evidence_ids: ["EVID-910002"], observed_at: "2099-01-02T02:00:00Z", valid_from: "2099-01-02T02:00:00Z", valid_to: null }
  ],
  events: [
    {
      id: "EV-2099-910001",
      question_ids: ["Q-001"],
      technology_ids: [],
      claim_ids: ["CLAIM-910001"],
      source_ids: ["SRC-910001"],
      milestone_ids: ["Q-001-M1"],
      change_type: "unassessed",
      observed_at: "2099-01-01T03:00:00Z",
      valid_from: "2099-01-01T03:00:00Z",
      valid_to: null
    },
    {
      id: "EV-2099-910002",
      question_ids: ["Q-001"],
      technology_ids: [],
      claim_ids: ["CLAIM-910002"],
      source_ids: ["SRC-910002"],
      milestone_ids: ["Q-001-M1"],
      change_type: "minor_progress",
      observed_at: "2099-01-02T03:00:00Z",
      valid_from: "2099-01-02T03:00:00Z",
      valid_to: null
    }
  ],
  reviews: [
    { id: "REVIEW-910001", entity_id: "ASSESS-910001", decision: "approve", reviewed_at: "2099-01-01T11:00:00Z", reviewer_role: "editorial_gate", reason: "Approve baseline state.", observed_at: "2099-01-01T11:00:00Z", valid_from: "2099-01-01T11:00:00Z", valid_to: null },
    { id: "REVIEW-910002", entity_id: "ASSESS-910002", decision: "approve", reviewed_at: "2099-01-02T11:00:00Z", reviewer_role: "editorial_gate", reason: "Approve evidence-backed state transition.", observed_at: "2099-01-02T11:00:00Z", valid_from: "2099-01-02T11:00:00Z", valid_to: null }
  ],
  assessments: [before, after],
  changes: [change]
};

const good = validateCollections(base);
if (!good.ok) throw new Error(`FE04 valid fixture rejected: ${good.errors.join(" | ")}`);

const schema = JSON.parse(await readFile(new URL("../schemas/change.schema.json", import.meta.url), "utf8"));
const schemaErrors = validateSchema(change, schema, "Change");
if (schemaErrors.length) throw new Error(`FE04 Change schema rejected canonical record: ${schemaErrors.join(" | ")}`);

const resolved = resolveMilestoneState("Q-001-M1", base.assessments);
if (resolved.assessment_id !== after.id || resolved.status !== "partially_met") throw new Error("FE04 terminal milestone state incorrect");

const graph = buildGraph(base);
for (const edge of [
  ["CHANGE-910001", "CHANGES", "Q-001-M1"],
  ["CHANGE-910001", "STATE_BEFORE", "ASSESS-910001"],
  ["CHANGE-910001", "STATE_AFTER", "ASSESS-910002"],
  ["CHANGE-910001", "TRIGGERED_BY_EVIDENCE", "EVID-910002"],
  ["CHANGE-910001", "REVIEWED_BY", "REVIEW-910002"]
]) {
  if (!graph.edges.some((x) => x.from === edge[0] && x.relation === edge[1] && x.to === edge[2])) {
    throw new Error(`FE04 graph edge missing: ${edge.join("|")}`);
  }
}

if (change.change_type !== "minor_progress") throw new Error("minor progress classification failed");
if (change.before_state_hash !== assessmentStateHash(before)) throw new Error("before hash unstable");
if (change.after_state_hash !== assessmentStateHash(after)) throw new Error("after hash unstable");

const classify = (fromStatus, fromConfidence, toStatus, toConfidence) => classifyMilestoneChange(
  { milestone_id: "Q-001-M1", status: fromStatus, confidence: fromConfidence },
  { milestone_id: "Q-001-M1", status: toStatus, confidence: toConfidence }
);

const expected = [
  ["not_met", "needs_confirmation", "partially_met", "needs_confirmation", "minor_progress"],
  ["partially_met", "solid_preliminary", "met", "solid_preliminary", "milestone_reached"],
  ["met", "confirmed", "partially_met", "confirmed", "setback"],
  ["partially_met", "needs_confirmation", "partially_met", "confirmed", "evidence_upgrade"],
  ["partially_met", "confirmed", "partially_met", "needs_confirmation", "setback"],
  ["partially_met", "solid_preliminary", "partially_met", "solid_preliminary", "none"],
  ["met", "confirmed", "invalidated", "contested", "invalidation"]
];
for (const row of expected) {
  const actual = classify(...row.slice(0, 4));
  if (actual !== row[4]) throw new Error(`classification ${row.slice(0,4).join("->")} = ${actual}, expected ${row[4]}`);
}

let reopenBlocked = false;
try {
  classify("invalidated", "contested", "not_met", "needs_confirmation");
} catch (error) {
  reopenBlocked = String(error?.message ?? error).includes("cannot be silently reopened");
}
if (!reopenBlocked) throw new Error("invalidated milestone reopen was not blocked");

const negatives = [];
function expectInvalid(name, mutator, fragment) {
  const fixture = structuredClone(base);
  mutator(fixture);
  const result = validateCollections(fixture);
  if (result.ok || !result.errors.some((x) => x.includes(fragment))) {
    throw new Error(`${name} not rejected as expected: ${result.errors.join(" | ")}`);
  }
  negatives.push(name);
}

expectInvalid("missing_change", (d) => { d.changes = []; }, "requires exactly one Change record");
expectInvalid("duplicate_change", (d) => { d.changes.push({ ...d.changes[0], id: "CHANGE-910002" }); }, "found 2");
expectInvalid("wrong_change_type", (d) => { d.changes[0].change_type = "milestone_reached"; }, "change_type");
expectInvalid("tampered_before_hash", (d) => { d.changes[0].before_state_hash = "0".repeat(64); }, "before_state_hash mismatch");
expectInvalid("trigger_claim_not_basis", (d) => { d.changes[0].trigger_claim_ids = ["CLAIM-910001"]; }, "not in after assessment basis");
expectInvalid("trigger_evidence_wrong_claim", (d) => { d.changes[0].trigger_evidence_ids = ["EVID-910001"]; }, "belongs to non-trigger claim");
expectInvalid("wrong_review", (d) => { d.changes[0].review_id = "REVIEW-910001"; }, "review does not match after assessment review");
expectInvalid("after_not_approved", (d) => { d.assessments[1].review_state = "machine_proposed"; }, "after assessment is not human_approved");

const reordered = structuredClone(base);
for (const key of ["sources", "provenance", "evidence", "claims", "events", "reviews", "assessments", "changes"]) reordered[key].reverse();
if (stableStringify(buildGraph(base)) !== stableStringify(buildGraph(reordered))) throw new Error("FE04 graph became order-dependent");

console.log(
  "FE04_CHANGE_ENGINE_PASS|valid_transition=1|classification_cases="+expected.length+
  "|negative_cases="+negatives.length+
  "|unique_change_required=1|evidence_required=1|human_review_required=1|hash_bound=1|deterministic=1"
);
