import { readFile } from "node:fs/promises";
import { loadCollections } from "./lib/load-collections.mjs";
import { validateCollections } from "./lib/graph-model.mjs";

const root = new URL("../", import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const observatories = await read("data/observatories/observatories.json");
const manifest = await read("benchmarks/fe05/foundational-baseline.v1.json");
const collections = await loadCollections(root);

const errors = [];
const questionById = new Map(collections.questions.map((q) => [q.id, q]));
const techById = new Map(collections.technologies.map((x) => [x.id, x]));
const claimById = new Map(collections.claims.map((x) => [x.id, x]));
const evidenceById = new Map(collections.evidence.map((x) => [x.id, x]));
const sourceById = new Map(collections.sources.map((x) => [x.id, x]));
const provById = new Map(collections.provenance.map((x) => [x.id, x]));
const changeByEvent = new Map();

for (const change of collections.changes ?? []) {
  for (const eventId of change.trigger_event_ids ?? []) {
    if (!changeByEvent.has(eventId)) changeByEvent.set(eventId, []);
    changeByEvent.get(eventId).push(change);
  }
}

if (observatories.length !== 10) errors.push(`expected 10 observatories, got ${observatories.length}`);
const obsQuestions = new Set(observatories.map((x) => x.question_id));
if (obsQuestions.size !== 10) errors.push("observatory question mapping must be one-to-one");
for (const q of collections.questions) if (!obsQuestions.has(q.id)) errors.push(`missing observatory for ${q.id}`);

let verifiedTotal = 0;
for (const obs of observatories) {
  const q = questionById.get(obs.question_id);
  if (!q) { errors.push(`${obs.id}: unknown question ${obs.question_id}`); continue; }
  if (obs.slug !== q.slug) errors.push(`${obs.id}: slug mismatch`);
  if (obs.title !== q.title) errors.push(`${obs.id}: title mismatch`);
  if (obs.evidence_profile !== q.evidence_profile) errors.push(`${obs.id}: evidence profile mismatch`);

  const qEvents = collections.events.filter((e) => e.question_ids.includes(q.id) && e.status === "verified");
  verifiedTotal += qEvents.length;
  if (qEvents.length < 5) errors.push(`${obs.id}: only ${qEvents.length} verified events`);
  if (obs.foundational_event_ids.length < 5) errors.push(`${obs.id}: fewer than 5 foundational event ids`);

  const expected = qEvents.map((e) => e.id).sort();
  const declared = [...obs.foundational_event_ids].sort();
  if (JSON.stringify(expected) !== JSON.stringify(declared)) errors.push(`${obs.id}: foundational event list does not match verified baseline`);

  const milestoneIds = new Set((q.milestones ?? []).map((m) => m.id));
  for (const event of qEvents) {
    if (event.question_ids.length !== 1) errors.push(`${event.id}: FE-05 baseline event must belong to exactly one observatory`);
    if (!event.technology_ids?.length) errors.push(`${event.id}: missing technology`);
    if (!event.claim_ids?.length) errors.push(`${event.id}: missing claim`);
    if (!event.source_ids?.length) errors.push(`${event.id}: missing source`);
    if (!event.milestone_ids?.length) errors.push(`${event.id}: missing milestone relevance`);
    if (event.change_type !== "unassessed") errors.push(`${event.id}: baseline must remain unassessed until Change Engine approval`);
    if (event.human_review !== "required") errors.push(`${event.id}: human review must remain required`);

    for (const id of event.technology_ids ?? []) if (!techById.has(id)) errors.push(`${event.id}: unknown technology ${id}`);
    for (const id of event.milestone_ids ?? []) if (!milestoneIds.has(id)) errors.push(`${event.id}: milestone ${id} not owned by ${q.id}`);

    for (const claimId of event.claim_ids ?? []) {
      const claim = claimById.get(claimId);
      if (!claim) { errors.push(`${event.id}: unknown claim ${claimId}`); continue; }
      if (claim.review_state !== "machine_proposed") errors.push(`${claimId}: FE-05 baseline must not fabricate human approval`);
      if (!claim.evidence_ids?.length) errors.push(`${claimId}: no evidence`);
      for (const evidenceId of claim.evidence_ids ?? []) {
        const evidence = evidenceById.get(evidenceId);
        if (!evidence) { errors.push(`${claimId}: unknown evidence ${evidenceId}`); continue; }
        if (evidence.claim_id !== claimId) errors.push(`${evidenceId}: claim mismatch`);
        if (!event.source_ids.includes(evidence.source_id)) errors.push(`${evidenceId}: source not carried by event ${event.id}`);
        const source = sourceById.get(evidence.source_id);
        if (!source) { errors.push(`${evidenceId}: unknown source`); continue; }
        if (!["A","B"].includes(source.tier)) errors.push(`${source.id}: foundational source tier must be A or B`);
        if (source.status !== "active") errors.push(`${source.id}: foundational source is not active`);
        if (!evidence.locator) errors.push(`${evidence.id}: locator required`);
        const provenance = provById.get(evidence.provenance_id);
        if (!provenance) errors.push(`${evidence.id}: provenance missing`);
        else if (provenance.source_id !== source.id) errors.push(`${evidence.id}: provenance/source mismatch`);
      }
    }

    if (event.change_type !== "unassessed" && event.change_type !== "none" && !changeByEvent.get(event.id)?.length) {
      errors.push(`${event.id}: assessed change lacks Change Engine record`);
    }
  }
}

const graphCheck = validateCollections(collections);
if (!graphCheck.ok) errors.push(...graphCheck.errors.map((x) => `graph: ${x}`));

if (collections.events.length !== 50) errors.push(`expected exactly 50 foundational events, got ${collections.events.length}`);
if (collections.claims.length !== 50) errors.push(`expected 50 foundational claims, got ${collections.claims.length}`);
if (collections.evidence.length !== 50) errors.push(`expected 50 foundational evidence records, got ${collections.evidence.length}`);
if (collections.sources.length !== 50) errors.push(`expected 50 foundational sources, got ${collections.sources.length}`);
if (collections.provenance.length !== 50) errors.push(`expected 50 provenance records, got ${collections.provenance.length}`);
if (collections.technologies.length < 10) errors.push("technology foundation unexpectedly sparse");
if ((collections.assessments ?? []).length !== 0) errors.push("FE-05 must not fabricate milestone assessments");
if ((collections.changes ?? []).length !== 0) errors.push("FE-05 must not fabricate milestone Change records");

if (manifest.protocol !== "FE05-FOUNDATIONAL-BASELINE-v1") errors.push("wrong FE-05 manifest protocol");
if (manifest.entries.length !== 50) errors.push("manifest must contain 50 entries");
const manifestEvents = new Set(manifest.entries.map((x) => x.event_id));
for (const event of collections.events) if (!manifestEvents.has(event.id)) errors.push(`${event.id}: absent from FE-05 manifest`);

if (errors.length) {
  console.error("FE05_OBSERVATORIES_FAIL");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(
  `FE05_OBSERVATORIES_PASS|observatories=${observatories.length}|verified_events=${verifiedTotal}` +
  `|claims=${collections.claims.length}|evidence=${collections.evidence.length}` +
  `|sources=${collections.sources.length}|technologies=${collections.technologies.length}` +
  "|min_events_per_question=5|orphan_relations=0|fabricated_assessments=0|human_review_preserved=1"
);
