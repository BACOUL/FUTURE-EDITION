import { createHash } from "node:crypto";

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
  Review: /^REVIEW-\d{6}$/
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
    ["organizations", "Organization"], ["people", "Person"], ["reviews", "Review"]
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
    collections.people, collections.reviews
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

  detectSupersedesCycle(collections.claims ?? [], "supersedes_claim_id", errors);
  detectSupersedesCycle(collections.sources ?? [], "supersedes_source_id", errors);

  return { ok: errors.length === 0, errors, registry };
}

const sortIdArray = (value) => Array.isArray(value) ? [...value].sort() : value;
function canonicalNode(obj, type) {
  const node = { ...obj, type };
  for (const key of [
    "aliases", "question_ids", "technology_ids", "claim_ids", "source_ids",
    "milestone_ids", "evidence_ids", "derived_from_source_ids", "organization_ids"
  ]) {
    if (Array.isArray(node[key])) node[key] = sortIdArray(node[key]);
  }
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
    ["organizations", "Organization"], ["people", "Person"], ["reviews", "Review"]
  ]) {
    for (const obj of sortById(collections[key])) nodes.push(canonicalNode(obj, type));
  }

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

  for (const item of collections.evidence ?? []) {
    edges.push({ from: item.id, relation: "DERIVED_FROM", to: item.source_id });
  }

  for (const item of collections.provenance ?? []) {
    edges.push({ from: item.id, relation: "PROVENANCE_OF", to: item.source_id });
    for (const id of item.derived_from_source_ids ?? []) edges.push({ from: item.id, relation: "DERIVED_FROM", to: id });
  }

  for (const person of collections.people ?? []) {
    for (const id of person.organization_ids ?? []) edges.push({ from: person.id, relation: "AFFILIATED_WITH", to: id });
  }

  for (const review of collections.reviews ?? []) {
    edges.push({ from: review.id, relation: "REVIEWS", to: review.entity_id });
  }

  nodes.sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) => `${a.from}|${a.relation}|${a.to}`.localeCompare(`${b.from}|${b.relation}|${b.to}`));

  const body = {
    schema_version: "0.3.0",
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
      reviews: (collections.reviews ?? []).length
    },
    nodes,
    edges
  };

  return { ...body, content_hash: sha256(body) };
}
