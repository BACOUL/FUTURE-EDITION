import { readFile } from "node:fs/promises";
import { loadCollections } from "./lib/load-collections.mjs";
import { validateCollections } from "./lib/graph-model.mjs";
import { assessmentStateHash, classifyMilestoneChange } from "./lib/change-engine.mjs";

const collections = await loadCollections();
const validation = validateCollections(collections);
if (!validation.ok) throw new Error("canonical collections invalid: " + validation.errors.join(" | "));

const change = collections.changes.find((x) => x.id === "CHANGE-000001");
const before = collections.assessments.find((x) => x.id === "ASSESS-000001");
const after = collections.assessments.find((x) => x.id === "ASSESS-000002");
const reviewBefore = collections.reviews.find((x) => x.id === "REVIEW-000001");
const reviewAfter = collections.reviews.find((x) => x.id === "REVIEW-000002");
const event = collections.events.find((x) => x.id === "EV-2026-008006");
const claim = collections.claims.find((x) => x.id === "CLAIM-050051");
const evidence = collections.evidence.find((x) => x.id === "EVID-050051");
const source = collections.sources.find((x) => x.id === "SRC-050051");

for (const [name, value] of Object.entries({change,before,after,reviewBefore,reviewAfter,event,claim,evidence,source})) {
  if (!value) throw new Error(name + " missing");
}

if (before.review_state !== "human_approved" || after.review_state !== "human_approved") throw new Error("assessments not human approved");
if (reviewBefore.decision !== "approve" || reviewAfter.decision !== "approve") throw new Error("reviews not approved");
if (after.supersedes_assessment_id !== before.id) throw new Error("after does not supersede before");
if (classifyMilestoneChange(before, after) !== "evidence_upgrade") throw new Error("classification mismatch");
if (change.change_type !== "evidence_upgrade") throw new Error("canonical change type mismatch");
if (change.before_state_hash !== assessmentStateHash(before)) throw new Error("before hash mismatch");
if (change.after_state_hash !== assessmentStateHash(after)) throw new Error("after hash mismatch");
if (change.review_id !== reviewAfter.id) throw new Error("change review mismatch");
if (!change.trigger_claim_ids.includes(claim.id)) throw new Error("trigger claim missing");
if (!change.trigger_evidence_ids.includes(evidence.id)) throw new Error("trigger evidence missing");
if (!change.trigger_event_ids.includes(event.id)) throw new Error("trigger event missing");
if (evidence.claim_id !== claim.id || evidence.source_id !== source.id) throw new Error("claim/evidence/source chain broken");
if (event.change_type !== "evidence_upgrade" || event.human_review !== "approved") throw new Error("event not promoted after human review");

const machine = JSON.parse(await readFile(new URL("../benchmarks/fe06r/first-real-change-machine.v1.json", import.meta.url), "utf8"));
const human = await readFile(new URL("../benchmarks/fe06r/first-real-change-human.v1.md", import.meta.url), "utf8");

if (machine.id !== change.id || machine.change_type !== change.change_type) throw new Error("machine Change mismatch");
if (machine.before.assessment_id !== before.id || machine.after.assessment_id !== after.id) throw new Error("machine assessment mismatch");
if (machine.before.state_hash !== change.before_state_hash || machine.after.state_hash !== change.after_state_hash) throw new Error("machine hash mismatch");
if (machine.trigger.claim_id !== claim.id || machine.trigger.evidence_id !== evidence.id || machine.trigger.source_id !== source.id || machine.trigger.event_id !== event.id) throw new Error("machine trigger chain mismatch");
if (machine.trigger.source_url !== source.canonical_url || machine.trigger.locator !== evidence.locator) throw new Error("machine provenance mismatch");

for (const required of ["CHANGE-000001","ASSESS-000001","ASSESS-000002","REVIEW-000001","REVIEW-000002","CLAIM-050051","EVID-050051","SRC-050051","EV-2026-008006","evidence_upgrade","Q-008-M4","Q-008-M5"]) {
  if (!human.includes(required)) throw new Error("human representation missing " + required);
}

console.log("FE06R_FIRST_REAL_CHANGE_PASS|change=CHANGE-000001|reviews=2|assessments=2|human_representation=1|machine_representation=1|canonical_consistency=1");
