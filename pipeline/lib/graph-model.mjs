import { createHash } from "node:crypto";
import { assessmentStateHash, classifyMilestoneChange } from "./change-engine.mjs";

export const sortById = (items = []) => [...items].sort((a, b) => String(a.id).localeCompare(String(b.id)));

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export const sha256 = (value) => createHash("sha256")
  .update(typeof value === "string" ? value : stableStringify(value))
  .digest("hex");

const parseTime = (value) => value == null ? null : Date.parse(value);
const idPatterns = {
  Technology: /^TECH-\d{4}$/,
  Event: /^EV-\d{4}-\d{6}$/,
  Claim: /^CLAIM-\d{6}$/,
  Evidence: /^EVID-\d{6}$/,
  Source: /^SRC-\d{6}$/,
  Provenance: /^PROV-\d{6}$/,
  Organization: /^ORG-\d{6}$/,
  Person: /^PERSON-\d{6}$/,
  Review: /^REVIEW-\d{6}$/,
  Assessment: /^ASSESS-\d{6}$/
};

export function buildRegistry(collections) {
  const errors = [];
  const registry = new Map();
  const add = (obj, type) => {
    if (!obj?.id) { errors.push(`missing id in ${type}`); return; }
    if (registry.has(obj.id)) { errors.push(`duplicate global id: ${obj.id}`); return; }
    const pattern = idPatterns[type];
    if (pattern && !pattern.test(obj.id)) errors.push(`invalid ${type} id: ${obj.id}`);
    registry.set(obj.id, { type, obj });
  };

  for (const q of collections.questions ?? []) {
    add(q, "Question");
    for (const milestone of q.milestones ?? []) add(milestone, "Milestone");
  }

  for (const [key, type] of [
    ["technologies", "Technology"], ["events", "Event"], ["claims", "Claim"],
    ["evidence", "Evidence"], ["sources", "Source"], ["provenance", "Provenance"],
    ["organizations", "Organization"], ["people", "Person"], ["reviews", "Review"],
    ["assessments", "Assessment"], ["changes", "Change"]
  ]) {
    for (const obj of collections[key] ?? []) add(obj, type);
  }

  return { registry, errors };
}

function requireType(registry, errors, owner, id, type, field) {
  const hit = registry.get(id);
  if (!hit) errors.push(`${owner}: unknown ${field} ${id}`);
  else if (type && hit.type !== type) errors.push(`${owner}: ${field} ${id} is ${hit.type}, expected ${type}`);
}

function checkWindow(errors, obj) {
  const from = parseTime(obj.valid_from);
  const to = parseTime(obj.valid_to);
  if (from !== null && Number.isNaN(from)) errors.push(`${obj.id}: invalid valid_from`);
  if (to !== null && Number.isNaN(to)) errors.push(`${obj.id}: invalid valid_to`);
  if (from !== null && to !== null && from > to) errors.push(`${obj.id}: valid_from after valid_to`);
  if (obj.observed_at && Number.isNaN(Date.parse(obj.observed_at))) errors.push(`${obj.id}: invalid observed_at`);
  if (obj.effective_at && Number.isNaN(Date.parse(obj.effective_at))) errors.push(`${obj.id}: invalid effective_at`);
}

function detectSupersedesCycle(items, field, errors) {
  const next = new Map(items.filter((item) => item[field]).map((item) => [item.id, item[field]]));
  for (const start of next.keys()) {
    const seen = new Set();
    let current = start;
    while (next.has(current)) {
      if (seen.has(current)) { errors.push(`${start}: supersedes cycle detected`); break; }
      seen.add(current);
      current = next.get(current);
    }
  }
}

export function validateCollections(collections) {
  const { registry, errors } = buildRegistry(collections);

  for (const group of [
    collections.technologies, collections.events, collections.claims, collections.evidence,
    collections.sources, collections.provenance, collections.organizations,
    collections.people, collections.reviews, collections.assessments, collections.changes
  ]) for (const obj of group ?? []) checkWindow(errors, obj);

  for (const event of collections.events ?? []) {
    for (const id of event.question_ids ?? []) requireType(registry, errors, event.id, id, "Question", "question");
    for (const id of event.technology_ids ?? []) requireType(registry, errors, event.id, id, "Technology", "technology");
    for (const id of event.claim_ids ?? []) requireType(registry, errors, event.id, id, "Claim", "claim");
    for (const id of event.source_ids ?? []) requireType(registry, errors, event.id, id, "Source", "source");
    for (const id of event.milestone_ids ?? []) requireType(registry, errors, event.id, id, "Milestone", "milestone");
  }

  for (const claim of collections.claims ?? []) {
    for (const id of claim.evidence_ids ?? []) {
      requireType(registry, errors, claim.id, id, "Evidence", "evidence");
      const item = registry.get(id)?.obj;
      if (item && item.claim_id !== claim.id) errors.push(`${claim.id}: evidence ${id} points to claim ${item.claim_id}`);
    }
    if (claim.supersedes_claim_id) {
      requireType(registry, errors, claim.id, claim.supersedes_claim_id, "Claim", "supersedes_claim");
      if (claim.supersedes_claim_id === claim.id) errors.push(`${claim.id}: cannot supersede itself`);
    }
  }

  for (const item of collections.evidence ?? []) {
    requireType(registry, errors, item.id, item.claim_id, "Claim", "claim");
    requireType(registry, errors, item.id, item.source_id, "Source", "source");
    if (item.provenance_id) {
      requireType(registry, errors, item.id, item.provenance_id, "Provenance", "provenance");
      const provenance = registry.get(item.provenance_id)?.obj;
      if (provenance && provenance.source_id !== item.source_id) errors.push(`${item.id}: provenance source mismatch`);
    }
    const claim = registry.get(item.claim_id)?.obj;
    if (claim && !claim.evidence_ids?.includes(item.id)) errors.push(`${item.id}: not listed by claim ${item.claim_id}`);
  }

  for (const source of collections.sources ?? []) {
    for (const id of source.author_ids ?? []) requireType(registry, errors, source.id, id, "Person", "author");
    for (const id of source.organization_ids ?? []) requireType(registry, errors, source.id, id, "Organization", "organization");
    if (source.supersedes_source_id) {
      requireType(registry, errors, source.id, source.supersedes_source_id, "Source", "supersedes_source");
      if (source.supersedes_source_id === source.id) errors.push(`${source.id}: cannot supersede itself`);
    }
  }

  for (const item of collections.provenance ?? []) {
    requireType(registry, errors, item.id, item.source_id, "Source", "source");
    for (const id of item.derived_from_source_ids ?? []) requireType(registry, errors, item.id, id, "Source", "derived_source");
    if (!item.independence_group) errors.push(`${item.id}: missing independence_group`);
  }

  for (const person of collections.people ?? []) {
    for (const id of person.organization_ids ?? []) requireType(registry, errors, person.id, id, "Organization", "organization");
  }

  for (const review of collections.reviews ?? []) {
    requireType(registry, errors, review.id, review.entity_id, null, "entity");
    if (review.entity_id === review.id) errors.push(`${review.id}: cannot review itself`);
  }

  for (const assessment of collections.assessments ?? []) {
    requireType(registry, errors, assessment.id, assessment.milestone_id, "Milestone", "milestone");
    for (const id of assessment.basis_claim_ids ?? []) requireType(registry, errors, assessment.id, id, "Claim", "basis_claim");
    for (const id of assessment.basis_event_ids ?? []) requireType(registry, errors, assessment.id, id, "Event", "basis_event");
    if (assessment.review_id) {
      requireType(registry, errors, assessment.id, assessment.review_id, "Review", "review");
      const review = registry.get(assessment.review_id)?.obj;
      if (review && review.entity_id !== assessment.id) errors.push(`${assessment.id}: review ${assessment.review_id} targets ${review.entity_id}`);
    }
    if (assessment.review_state === "human_approved" && !assessment.review_id) {
      errors.push(`${assessment.id}: human_approved assessment requires review_id`);
    }
    if (assessment.supersedes_assessment_id) {
      requireType(registry, errors, assessment.id, assessment.supersedes_assessment_id, "Assessment", "supersedes_assessment");
      if (assessment.supersedes_assessment_id === assessment.id) errors.push(`${assessment.id}: cannot supersede itself`);
      const previous = registry.get(assessment.supersedes_assessment_id)?.obj;
      if (previous && previous.milestone_id !== assessment.milestone_id) errors.push(`${assessment.id}: cannot supersede assessment of another milestone`);
    }
  }

  const fe04Enabled = Object.prototype.hasOwnProperty.call(collections, "changes");
  const changes = collections.changes ?? [];

  for (const change of changes) {
    requireType(registry, errors, change.id, change.milestone_id, "Milestone", "milestone");
    requireType(registry, errors, change.id, change.before_assessment_id, "Assessment", "before_assessment");
    requireType(registry, errors, change.id, change.after_assessment_id, "Assessment", "after_assessment");
    requireType(registry, errors, change.id, change.review_id, "Review", "review");
    for (const id of change.trigger_claim_ids ?? []) requireType(registry, errors, change.id, id, "Claim", "trigger_claim");
    for (const id of change.trigger_evidence_ids ?? []) requireType(registry, errors, change.id, id, "Evidence", "trigger_evidence");
    for (const id of change.trigger_event_ids ?? []) requireType(registry, errors, change.id, id, "Event", "trigger_event");

    const before = registry.get(change.before_assessment_id)?.obj;
    const after = registry.get(change.after_assessment_id)?.obj;
    const review = registry.get(change.review_id)?.obj;

    if (before && after) {
      if (before.milestone_id !== after.milestone_id) errors.push(`${change.id}: before/after assessments target different milestones`);
      if (change.milestone_id !== after.milestone_id) errors.push(`${change.id}: milestone does not match after assessment`);
      if (after.supersedes_assessment_id !== before.id) errors.push(`${change.id}: after assessment does not directly supersede before assessment`);
      if (after.review_state !== "human_approved") errors.push(`${change.id}: after assessment is not human_approved`);
      if (after.review_id !== change.review_id) errors.push(`${change.id}: review does not match after assessment review`);

      try {
        const expectedType = classifyMilestoneChange(before, after);
        if (change.change_type !== expectedType) errors.push(`${change.id}: change_type ${change.change_type} != expected ${expectedType}`);
      } catch (error) {
        errors.push(`${change.id}: ${String(error?.message ?? error)}`);
      }

      try {
        if (change.before_state_hash !== assessmentStateHash(before)) errors.push(`${change.id}: before_state_hash mismatch`);
        if (change.after_state_hash !== assessmentStateHash(after)) errors.push(`${change.id}: after_state_hash mismatch`);
      } catch (error) {
        errors.push(`${change.id}: state hash validation failed: ${String(error?.message ?? error)}`);
      }

      for (const id of change.trigger_claim_ids ?? []) {
        if (!(after.basis_claim_ids ?? []).includes(id)) errors.push(`${change.id}: trigger claim ${id} is not in after assessment basis`);
      }
      for (const id of change.trigger_event_ids ?? []) {
        if (!(after.basis_event_ids ?? []).includes(id)) errors.push(`${change.id}: trigger event ${id} is not in after assessment basis`);
      }
      for (const id of change.trigger_evidence_ids ?? []) {
        const item = registry.get(id)?.obj;
        if (item && !(change.trigger_claim_ids ?? []).includes(item.claim_id)) {
          errors.push(`${change.id}: trigger evidence ${id} belongs to non-trigger claim ${item.claim_id}`);
        }
      }
    }

    if (review) {
      if (review.entity_id !== change.after_assessment_id) errors.push(`${change.id}: review ${change.review_id} does not target after assessment`);
      if (!["approve", "approve_contested"].includes(review.decision)) errors.push(`${change.id}: change review is not an approval`);
    }

    if (!(change.trigger_claim_ids ?? []).length) errors.push(`${change.id}: at least one trigger claim required`);
    if (!(change.trigger_evidence_ids ?? []).length) errors.push(`${change.id}: at least one trigger evidence required`);
    if (!String(change.justification ?? "").trim()) errors.push(`${change.id}: justification required`);
  }

  if (fe04Enabled) {
    for (const assessment of collections.assessments ?? []) {
      if (assessment.review_state !== "human_approved" || !assessment.supersedes_assessment_id) continue;
      const matches = changes.filter((change) => change.after_assessment_id === assessment.id);
      if (matches.length !== 1) {
        errors.push(`${assessment.id}: approved superseding assessment requires exactly one Change record; found ${matches.length}`);
      }
    }
  }

  detectSupersedesCycle(collections.claims ?? [], "supersedes_claim_id", errors);
  detectSupersedesCycle(collections.sources ?? [], "supersedes_source_id", errors);
  detectSupersedesCycle(collections.assessments ?? [], "supersedes_assessment_id", errors);

  return { ok: errors.length === 0, errors, registry };
}

const sortIdArray = (value) => Array.isArray(value) ? [...value].sort() : value;
function canonicalNode(obj, type) {
  const node = { ...obj, type };
  for (const key of [
    "aliases", "question_ids", "technology_ids", "claim_ids", "source_ids",
    "milestone_ids", "evidence_ids", "derived_from_source_ids", "organization_ids",
    "author_ids", "basis_claim_ids", "basis_event_ids", "trigger_claim_ids",
    "trigger_evidence_ids", "trigger_event_ids"
  ]) if (Array.isArray(node[key])) node[key] = sortIdArray(node[key]);
  return node;
}

export function buildGraph(collections) {
  const validation = validateCollections(collections);
  if (!validation.ok) throw new Error(`invalid collections: ${validation.errors.join(" | ")}`);

  const nodes = [];
  const edges = [];

  for (const q of sortById(collections.questions)) {
    const { milestones, ...question } = q;
    nodes.push(canonicalNode(question, "Question"));
    for (const milestone of sortById(milestones)) {
      nodes.push(canonicalNode(milestone, "Milestone"));
      edges.push({ from: q.id, relation: "HAS_MILESTONE", to: milestone.id });
    }
  }

  for (const [key, type] of [
    ["technologies", "Technology"], ["events", "Event"], ["claims", "Claim"],
    ["evidence", "Evidence"], ["sources", "Source"], ["provenance", "Provenance"],
    ["organizations", "Organization"], ["people", "Person"], ["reviews", "Review"],
    ["assessments", "Assessment"], ["changes", "Change"]
  ]) for (const obj of sortById(collections[key])) nodes.push(canonicalNode(obj, type));

  for (const event of collections.events ?? []) {
    for (const id of event.question_ids ?? []) edges.push({ from: event.id, relation: "RELATES_TO", to: id });
    for (const id of event.technology_ids ?? []) edges.push({ from: event.id, relation: "USES_TECHNOLOGY", to: id });
    for (const id of event.claim_ids ?? []) edges.push({ from: event.id, relation: "PRODUCES_CLAIM", to: id });
    for (const id of event.source_ids ?? []) edges.push({ from: event.id, relation: "DERIVED_FROM", to: id });
    for (const id of event.milestone_ids ?? []) edges.push({ from: event.id, relation: "MAY_CHANGE", to: id });
  }

  const evidenceById = new Map((collections.evidence ?? []).map((item) => [item.id, item]));
  for (const claim of collections.claims ?? []) {
    for (const id of claim.evidence_ids ?? []) {
      const item = evidenceById.get(id);
      const relation = item?.support === "contradicts" ? "CONTRADICTED_BY"
        : item?.support === "limits" ? "LIMITED_BY"
        : item?.support === "context" ? "CONTEXTUALIZED_BY"
        : "SUPPORTED_BY";
      edges.push({ from: claim.id, relation, to: id });
    }
    if (claim.supersedes_claim_id) edges.push({ from: claim.id, relation: "SUPERSEDES", to: claim.supersedes_claim_id });
  }

  for (const item of collections.evidence ?? []) edges.push({ from: item.id, relation: "DERIVED_FROM", to: item.source_id });

  for (const source of collections.sources ?? []) {
    for (const id of source.author_ids ?? []) edges.push({ from: source.id, relation: "AUTHORED_BY", to: id });
    for (const id of source.organization_ids ?? []) edges.push({ from: source.id, relation: "PUBLISHED_BY", to: id });
    if (source.supersedes_source_id) edges.push({ from: source.id, relation: "SUPERSEDES", to: source.supersedes_source_id });
  }

  for (const item of collections.provenance ?? []) {
    edges.push({ from: item.id, relation: "PROVENANCE_OF", to: item.source_id });
    for (const id of item.derived_from_source_ids ?? []) edges.push({ from: item.id, relation: "DERIVED_FROM", to: id });
  }

  for (const person of collections.people ?? []) {
    for (const id of person.organization_ids ?? []) edges.push({ from: person.id, relation: "AFFILIATED_WITH", to: id });
  }

  for (const review of collections.reviews ?? []) edges.push({ from: review.id, relation: "REVIEWS", to: review.entity_id });

  for (const assessment of collections.assessments ?? []) {
    edges.push({ from: assessment.id, relation: "ASSESSES", to: assessment.milestone_id });
    for (const id of assessment.basis_claim_ids ?? []) edges.push({ from: assessment.id, relation: "JUSTIFIED_BY", to: id });
    for (const id of assessment.basis_event_ids ?? []) edges.push({ from: assessment.id, relation: "BASED_ON_EVENT", to: id });
    if (assessment.supersedes_assessment_id) edges.push({ from: assessment.id, relation: "SUPERSEDES", to: assessment.supersedes_assessment_id });
  }

  for (const change of collections.changes ?? []) {
    edges.push({ from: change.id, relation: "CHANGES", to: change.milestone_id });
    edges.push({ from: change.id, relation: "STATE_BEFORE", to: change.before_assessment_id });
    edges.push({ from: change.id, relation: "STATE_AFTER", to: change.after_assessment_id });
    edges.push({ from: change.id, relation: "REVIEWED_BY", to: change.review_id });
    for (const id of change.trigger_claim_ids ?? []) edges.push({ from: change.id, relation: "TRIGGERED_BY_CLAIM", to: id });
    for (const id of change.trigger_evidence_ids ?? []) edges.push({ from: change.id, relation: "TRIGGERED_BY_EVIDENCE", to: id });
    for (const id of change.trigger_event_ids ?? []) edges.push({ from: change.id, relation: "TRIGGERED_BY_EVENT", to: id });
  }

  nodes.sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) => `${a.from}|${a.relation}|${a.to}`.localeCompare(`${b.from}|${b.relation}|${b.to}`));

  const body = {
    schema_version: "0.4.0",
    status: (collections.events ?? []).length ? "contains_events" : "baseline_pending_evidence",
    counts: {
      questions: (collections.questions ?? []).length,
      milestones: (collections.questions ?? []).reduce((n, q) => n + (q.milestones ?? []).length, 0),
      technologies: (collections.technologies ?? []).length,
      events: (collections.events ?? []).length,
      claims: (collections.claims ?? []).length,
      evidence: (collections.evidence ?? []).length,
      sources: (collections.sources ?? []).length,
      provenance: (collections.provenance ?? []).length,
      organizations: (collections.organizations ?? []).length,
      people: (collections.people ?? []).length,
      reviews: (collections.reviews ?? []).length,
      assessments: (collections.assessments ?? []).length,
      changes: (collections.changes ?? []).length
    },
    nodes,
    edges
  };

  return { ...body, content_hash: sha256(body) };
}
