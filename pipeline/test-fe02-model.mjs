import { validateCollections, buildGraph, stableStringify } from "./lib/graph-model.mjs";

const base = {
  questions: [{
    id: "Q-001", slug: "synthetic-question", title: "Synthetic question for validation",
    summary: "Synthetic fixture only, never a scientific statement.", evidence_profile: "medical",
    milestones: [{ id: "Q-001-M1", order: 1, title: "Synthetic milestone", criterion: "Synthetic criterion for validation." }]
  }],
  technologies: [{
    id: "TECH-9001", canonical_name: "Synthetic technology", status: "active", aliases: ["b", "a"],
    observed_at: "2099-01-01T00:00:00Z", valid_from: "2099-01-01T00:00:00Z", valid_to: null
  }],
  organizations: [{ id: "ORG-900001", name: "Synthetic Institute", kind: "research_institute", ror: null, country: "ZZ", observed_at: "2099-01-01T00:00:00Z" }],
  people: [{ id: "PERSON-900001", display_name: "Synthetic Author", orcid: null, organization_ids: ["ORG-900001"], observed_at: "2099-01-01T00:00:00Z" }],
  sources: [
    { id: "SRC-900001", kind: "paper", tier: "A", title: "Synthetic source A", canonical_url: "https://example.invalid/a", external_ids: {}, author_ids: ["PERSON-900001"], organization_ids: ["ORG-900001"], published_at: "2099-01-01", status: "active", review_state: "human_approved", version: 1, supersedes_source_id: null, observed_at: "2099-01-01T00:00:00Z", valid_from: "2099-01-01T00:00:00Z", valid_to: null },
    { id: "SRC-900002", kind: "paper", tier: "A", title: "Synthetic source B", canonical_url: "https://example.invalid/b", external_ids: {}, author_ids: [], organization_ids: [], published_at: "2099-01-02", status: "active", review_state: "human_approved", version: 1, supersedes_source_id: null, observed_at: "2099-01-02T00:00:00Z", valid_from: "2099-01-02T00:00:00Z", valid_to: null }
  ],
  provenance: [
    { id: "PROV-900001", source_id: "SRC-900001", retrieved_at: "2099-01-01T01:00:00Z", canonical_url: "https://example.invalid/a", external_version: null, content_hash: null, license: null, independence_group: "origin-a", derived_from_source_ids: [], notes: null, observed_at: "2099-01-01T01:00:00Z", valid_from: "2099-01-01T01:00:00Z", valid_to: null },
    { id: "PROV-900002", source_id: "SRC-900002", retrieved_at: "2099-01-02T01:00:00Z", canonical_url: "https://example.invalid/b", external_version: null, content_hash: null, license: null, independence_group: "origin-b", derived_from_source_ids: [], notes: null, observed_at: "2099-01-02T01:00:00Z", valid_from: "2099-01-02T01:00:00Z", valid_to: null }
  ],
  evidence: [
    { id: "EVID-900001", claim_id: "CLAIM-900001", source_id: "SRC-900001", provenance_id: "PROV-900001", support: "supports", locator: "synthetic:p1", excerpt_hash: null, notes: null, observed_at: "2099-01-01T01:00:00Z", valid_from: "2099-01-01T01:00:00Z", valid_to: null },
    { id: "EVID-900002", claim_id: "CLAIM-900001", source_id: "SRC-900002", provenance_id: "PROV-900002", support: "contradicts", locator: "synthetic:p2", excerpt_hash: null, notes: null, observed_at: "2099-01-02T01:00:00Z", valid_from: "2099-01-02T01:00:00Z", valid_to: null },
    { id: "EVID-900003", claim_id: "CLAIM-900002", source_id: "SRC-900002", provenance_id: "PROV-900002", support: "supports", locator: "synthetic:p3", excerpt_hash: null, notes: null, observed_at: "2099-01-03T01:00:00Z", valid_from: "2099-01-03T01:00:00Z", valid_to: null }
  ],
  claims: [
    { id: "CLAIM-900001", text: "Initial synthetic claim for validation.", claim_type: "result", evidence_ids: ["EVID-900002", "EVID-900001"], confidence: "contested", review_state: "human_approved", observed_at: "2099-01-02T02:00:00Z", valid_from: "2099-01-02T02:00:00Z", valid_to: "2099-01-03T02:00:00Z", supersedes_claim_id: null },
    { id: "CLAIM-900002", text: "Corrected synthetic claim for validation.", claim_type: "correction", evidence_ids: ["EVID-900003"], confidence: "solid_preliminary", review_state: "human_approved", observed_at: "2099-01-03T02:00:00Z", valid_from: "2099-01-03T02:00:00Z", valid_to: null, supersedes_claim_id: "CLAIM-900001" }
  ],
  events: [{
    id: "EV-2099-900001", title: "Synthetic event", event_date: "2099-01-02",
    question_ids: ["Q-001"], technology_ids: ["TECH-9001"], claim_ids: ["CLAIM-900002", "CLAIM-900001"],
    source_ids: ["SRC-900002", "SRC-900001"], milestone_ids: ["Q-001-M1"],
    status: "verified", change_type: "unassessed", human_review: "approved",
    observed_at: "2099-01-03T02:00:00Z", valid_from: "2099-01-02T00:00:00Z", valid_to: null
  }],
  reviews: [
    { id: "REVIEW-900001", entity_id: "CLAIM-900002", decision: "approve", reviewed_at: "2099-01-03T03:00:00Z", reviewer_role: "editorial_gate", reason: "Synthetic claim review.", previous_state_hash: null, new_state_hash: null, observed_at: "2099-01-03T03:00:00Z", valid_from: "2099-01-03T03:00:00Z", valid_to: null },
    { id: "REVIEW-900002", entity_id: "ASSESS-900001", decision: "approve", reviewed_at: "2099-01-03T04:00:00Z", reviewer_role: "editorial_gate", reason: "Synthetic assessment one.", previous_state_hash: null, new_state_hash: null, observed_at: "2099-01-03T04:00:00Z", valid_from: "2099-01-03T04:00:00Z", valid_to: null },
    { id: "REVIEW-900003", entity_id: "ASSESS-900002", decision: "approve", reviewed_at: "2099-01-04T04:00:00Z", reviewer_role: "editorial_gate", reason: "Synthetic assessment two.", previous_state_hash: null, new_state_hash: null, observed_at: "2099-01-04T04:00:00Z", valid_from: "2099-01-04T04:00:00Z", valid_to: null }
  ],
  assessments: [
    { id: "ASSESS-900001", milestone_id: "Q-001-M1", status: "partially_met", confidence: "needs_confirmation", basis_claim_ids: ["CLAIM-900001"], basis_event_ids: ["EV-2099-900001"], review_state: "human_approved", review_id: "REVIEW-900002", supersedes_assessment_id: null, observed_at: "2099-01-03T04:00:00Z", effective_at: "2099-01-03T04:00:00Z", valid_from: "2099-01-03T04:00:00Z", valid_to: "2099-01-04T04:00:00Z" },
    { id: "ASSESS-900002", milestone_id: "Q-001-M1", status: "met", confidence: "solid_preliminary", basis_claim_ids: ["CLAIM-900002"], basis_event_ids: ["EV-2099-900001"], review_state: "human_approved", review_id: "REVIEW-900003", supersedes_assessment_id: "ASSESS-900001", observed_at: "2099-01-04T04:00:00Z", effective_at: "2099-01-04T04:00:00Z", valid_from: "2099-01-04T04:00:00Z", valid_to: null }
  ]
};

const good = validateCollections(base);
if (!good.ok) throw new Error(`valid fixture failed: ${good.errors.join(" | ")}`);

const graph = buildGraph(base);
for (const id of ["CLAIM-900001","CLAIM-900002","ASSESS-900001","ASSESS-900002"]) {
  if (!graph.nodes.some((node) => node.id === id)) throw new Error(`history node missing: ${id}`);
}
if (!graph.edges.some((edge) => edge.from === "CLAIM-900002" && edge.relation === "SUPERSEDES" && edge.to === "CLAIM-900001")) throw new Error("claim supersedes edge missing");
if (!graph.edges.some((edge) => edge.from === "ASSESS-900002" && edge.relation === "SUPERSEDES" && edge.to === "ASSESS-900001")) throw new Error("assessment supersedes edge missing");
if (!graph.edges.some((edge) => edge.from === "CLAIM-900001" && edge.relation === "CONTRADICTED_BY" && edge.to === "EVID-900002")) throw new Error("contradiction edge missing");

const reordered = structuredClone(base);
for (const key of ["sources","evidence","provenance","claims","reviews","assessments"]) reordered[key].reverse();
reordered.events[0].claim_ids.reverse();
reordered.events[0].source_ids.reverse();
reordered.claims[0].evidence_ids.reverse();
reordered.technologies[0].aliases.reverse();
if (stableStringify(graph) !== stableStringify(buildGraph(reordered))) throw new Error("graph non-deterministic under irrelevant reorder");

const cases = [];
const expectInvalid = (name, mutator, fragment) => {
  const data = structuredClone(base);
  mutator(data);
  const result = validateCollections(data);
  if (result.ok || !result.errors.some((error) => error.includes(fragment))) throw new Error(`${name} was not rejected as expected: ${result.errors.join(" | ")}`);
  cases.push(name);
};

expectInvalid("orphan_source", (d) => { d.evidence[0].source_id = "SRC-999999"; }, "unknown source");
expectInvalid("claim_evidence_mismatch", (d) => { d.evidence[0].claim_id = "CLAIM-900002"; }, "points to claim");
expectInvalid("provenance_source_mismatch", (d) => { d.evidence[0].provenance_id = "PROV-900002"; }, "provenance source mismatch");
expectInvalid("self_supersede_claim", (d) => { d.claims[0].supersedes_claim_id = "CLAIM-900001"; }, "cannot supersede itself");
expectInvalid("duplicate_id", (d) => { d.technologies.push({...d.technologies[0]}); }, "duplicate global id");
expectInvalid("bad_temporal_window", (d) => { d.assessments[0].valid_from = "2099-02-01T00:00:00Z"; d.assessments[0].valid_to = "2099-01-01T00:00:00Z"; }, "valid_from after valid_to");
expectInvalid("orphan_review", (d) => { d.reviews[0].entity_id = "CLAIM-999999"; }, "unknown entity");
expectInvalid("assessment_wrong_milestone", (d) => { d.assessments[1].milestone_id = "Q-001-MISSING"; }, "unknown milestone");
expectInvalid("assessment_review_mismatch", (d) => { d.assessments[1].review_id = "REVIEW-900002"; }, "targets ASSESS-900001");

console.log(`FE02_MODEL_TEST_PASS|valid_objects=${good.registry.size}|negative_cases=${cases.length}|history=1|contradiction=1|assessments=1|deterministic=1`);
