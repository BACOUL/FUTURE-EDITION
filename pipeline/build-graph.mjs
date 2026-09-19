import { readFile, mkdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const questions = JSON.parse(await readFile(new URL("data/questions/questions.json", root), "utf8"));
const technologies = JSON.parse(await readFile(new URL("data/technologies/technologies.json", root), "utf8"));
const events = JSON.parse(await readFile(new URL("data/events/events.json", root), "utf8"));
const claims = JSON.parse(await readFile(new URL("data/claims/claims.json", root), "utf8"));
const evidence = JSON.parse(await readFile(new URL("data/evidence/evidence.json", root), "utf8"));
const provenance = JSON.parse(await readFile(new URL("data/provenance/provenance.json", root), "utf8"));
const organizations = JSON.parse(await readFile(new URL("data/organizations/organizations.json", root), "utf8"));
const people = JSON.parse(await readFile(new URL("data/people/people.json", root), "utf8"));

const nodes = [];
const edges = [];

for (const q of questions) {
  nodes.push({
    id: q.id,
    type: "Question",
    slug: q.slug,
    title: q.title,
    summary: q.summary,
    evidence_profile: q.evidence_profile,
    current_state: q.current_state
  });
  for (const m of q.milestones) {
    nodes.push({ ...m, type: "Milestone" });
    edges.push({ from: q.id, relation: "HAS_MILESTONE", to: m.id });
  }
}

for (const item of technologies) nodes.push({ ...item, type: "Technology" });
for (const item of events) nodes.push({ ...item, type: "Event" });
for (const item of claims) nodes.push({ ...item, type: "Claim" });
for (const item of evidence) nodes.push({ ...item, type: "Evidence" });
for (const item of provenance) nodes.push({ ...item, type: "Provenance" });
for (const item of organizations) nodes.push({ ...item, type: "Organization" });
for (const item of people) nodes.push({ ...item, type: "Person" });

for (const event of events) {
  for (const id of event.question_ids ?? []) edges.push({ from: event.id, relation: "RELATES_TO", to: id });
  for (const id of event.technology_ids ?? []) edges.push({ from: event.id, relation: "USES_TECHNOLOGY", to: id });
  for (const id of event.claim_ids ?? []) edges.push({ from: event.id, relation: "PRODUCES_CLAIM", to: id });
}
for (const claim of claims) {
  for (const id of claim.evidence_ids ?? []) edges.push({ from: claim.id, relation: "SUPPORTED_BY", to: id });
}
for (const ev of evidence) {
  edges.push({ from: ev.id, relation: ev.support === "contradicts" ? "CONTRADICTED_BY" : ev.support === "limits" ? "LIMITED_BY" : "DERIVED_FROM", to: ev.source_id });
}

const graph = {
  schema_version: "0.2.0",
  generated_from: "repository_data",
  status: events.length ? "contains_events" : "baseline_pending_evidence",
  counts: {
    questions: questions.length,
    milestones: questions.reduce((n, q) => n + q.milestones.length, 0),
    technologies: technologies.length,
    events: events.length,
    claims: claims.length,
    evidence: evidence.length,
    provenance: provenance.length,
    organizations: organizations.length,
    people: people.length
  },
  nodes,
  edges
};

await mkdir(new URL("generated/", root), { recursive: true });
await writeFile(
  new URL("generated/future-graph.json", root),
  JSON.stringify(graph, null, 2) + "\n"
);

console.log(`FUTURE_GRAPH_BUILT|nodes=${nodes.length}|edges=${edges.length}`);
