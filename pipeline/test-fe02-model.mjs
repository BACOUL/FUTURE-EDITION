import { validateCollections, buildGraph, stableStringify } from "./lib/graph-model.mjs";

const base = {
  questions: [{
    id: "Q-001", slug: "synthetic-question", title: "Synthetic question",
    summary: "Synthetic fixture only.", evidence_profile: "medical",
    current_state: "baseline_pending_evidence",
    milestones: [{ id: "Q-001-M1", order: 1, title: "Synthetic milestone", criterion: "Synthetic criterion.", status: "unassessed" }]
  }],
  technologies: [{
    id: "TECH-9001", canonical_name: "Synthetic technology", status: "active",
    observed_at: "2099-01-01T00:00:00Z", valid_from: "2099-01-01T00:00:00Z", valid_to: null
  }],
  sources: [
    {
      id: "SRC-900001", kind: "paper", tier: "A", title: "Synthetic source A",
      canonical_url: "https://example.invalid/a", status: "active", review_state: "human_approved",
      version: 1, supersedes_source_id: null, observed_at: "2099-01-01T00:00:00Z",
      valid_from: "2099-01-01T00:00:00Z", valid_to: null
    },
    {
      id: "SRC-900002", kind: "paper", tier: "A", title: "Synthetic source B",
      canonical_url: "https://example.invalid/b", status: "active", review_state: "human_approved",
      version: 1, supersedes_source_id: null, observed_at: "2099-01-02T00:00:00Z",
      valid_from: "2099-01-02T00:00:00Z", valid_to: null
    }
  ],
  provenance: [
    {
      id: "PROV-900001", source_id: "SRC-900001", retrieved_at: "2099-01-01T01:00:00Z",
      canonical_url: "https://example.invalid/a", independence_group: "origin-a",
      derived_from_source_ids: [], observed_at: "2099-01-01T01:00:00Z",
      valid_from: "2099-01-01T01:00:00Z", valid_to: null
    },
    {
      id: "PROV-900002", source_id: "SRC-900002", retrieved_at: "2099-01-02T01:00:00Z",
      canonical_url: "https://example.invalid/b", independence_group: "origin-b",
      derived_from_source_ids: [], observed_at: "2099-01-02T01:00:00Z",
      valid_from: "2099-01-02T01:00:00Z", valid_to: null
    }
  ],
  evidence: [
    {
      id: "EVID-900001", source_id: "SRC-900001", provenance_id: "PROV-900001",
      support: "supports", locator: "synthetic:p1", observed_at: "2099-01-01T01:00:00Z",
      valid_from: "2099-01-01T01:00:00Z", valid_to: null
    },
    {
      id: "EVID-900002", source_id: "SRC-900002", provenance_id: "PROV-900002",
      support: "contradicts", locator: "synthetic:p2", observed_at: "2099-01-02T01:00:00Z",
      valid_from: "2099-01-02T01:00:00Z", valid_to: null
    }
  ],
  claims: [{
    id: "CLAIM-900001", text: "Synthetic claim for model validation only.",
    claim_type: "result", evidence_ids: ["EVID-900001", "EVID-900002"],
    confidence: "contested", review_state: "human_approved",
    observed_at: "2099-01-02T02:00:00Z", valid_from: "2099-01-02T02:00:00Z",
    valid_to: null, supersedes_claim_id: null
  }],
  events: [{
    id: "EV-2099-900001", title: "Synthetic event", event_date: "2099-01-02",
    question_ids: ["Q-001"], technology_ids: ["TECH-9001"], claim_ids: ["CLAIM-900001"],
    source_ids: ["SRC-900001", "SRC-900002"], milestone_ids: ["Q-001-M1"],
    status: "verified", change_type: "unassessed", human_review: "approved",
    observed_at: "2099-01-02T02:00:00Z", valid_from: "2099-01-02T02:00:00Z", valid_to: null
  }],
  organizations: [],
  people: [],
  reviews: [{
    id: "REVIEW-900001", entity_id: "CLAIM-900001", decision: "approve_contested",
    reviewed_at: "2099-01-02T03:00:00Z", reviewer_role: "editorial_gate",
    reason: "Synthetic validation fixture.", observed_at: "2099-01-02T03:00:00Z",
    valid_from: "2099-01-02T03:00:00Z", valid_to: null
  }]
};

const good = validateCollections(base);
if (!good.ok) throw new Error(`valid fixture failed: ${good.errors.join(" | ")}`);

const graphA = stableStringify(buildGraph(base));
const graphB = stableStringify(buildGraph({
  ...base,
  sources: [...base.sources].reverse(),
  evidence: [...base.evidence].reverse(),
  provenance: [...base.provenance].reverse()
}));
if (graphA !== graphB) throw new Error("graph is not deterministic under collection reorder");

const orphan = structuredClone(base);
orphan.evidence[0].source_id = "SRC-999999";
const badOrphan = validateCollections(orphan);
if (badOrphan.ok || !badOrphan.errors.some((e) => e.includes("unknown source"))) {
  throw new Error("orphan source not rejected");
}

const self = structuredClone(base);
self.claims[0].supersedes_claim_id = "CLAIM-900001";
const badSelf = validateCollections(self);
if (badSelf.ok || !badSelf.errors.some((e) => e.includes("cannot supersede itself"))) {
  throw new Error("self supersede not rejected");
}

const duplicate = structuredClone(base);
duplicate.technologies.push({ ...duplicate.technologies[0] });
const badDuplicate = validateCollections(duplicate);
if (badDuplicate.ok || !badDuplicate.errors.some((e) => e.includes("duplicate global id"))) {
  throw new Error("duplicate id not rejected");
}

console.log(`FE02_MODEL_TEST_PASS|valid_objects=${good.registry.size}|negative_cases=3|deterministic=1`);
