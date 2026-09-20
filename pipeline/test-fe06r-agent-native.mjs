import { readFile } from "node:fs/promises";
import {
  resolveClaimState,
  propagateClaimLifecycle,
  buildQuestionAnswerPacket,
  citationAtom
} from "./lib/agent-native-state.mjs";

const bench = JSON.parse(await readFile(new URL("../benchmarks/fe06r/agent-negative-cases.json", import.meta.url), "utf8"));

const baseClaim = {
  id: "CLAIM-A-v1",
  version: 1,
  text: "A supported answer.",
  evidence_id: "EVID-A",
  source_id: "SRC-A",
  locator: "Results paragraph 2",
  status: "active",
  valid_from: "2026-01-01T00:00:00Z",
  valid_to: null,
  source_available: true,
  evidence_verified: true
};

const replacement = {
  id: "CLAIM-A-v2",
  version: 2,
  text: "A corrected supported answer.",
  evidence_id: "EVID-B",
  source_id: "SRC-B",
  locator: "Corrected results paragraph 1",
  source_available: true,
  evidence_verified: true
};

const corrected = propagateClaimLifecycle({
  versions:[baseClaim], priorId:baseClaim.id, nextClaim:replacement,
  kind:"correction", effectiveAt:"2026-06-01T00:00:00Z", reason:"corrected source"
});
const cBefore = resolveClaimState(corrected, "2026-05-01T00:00:00Z");
const cAfter = resolveClaimState(corrected, "2026-07-01T00:00:00Z");
if (cBefore.claim?.id !== "CLAIM-A-v1" || cAfter.claim?.id !== "CLAIM-A-v2") throw new Error("correction propagation failed");

const superseded = propagateClaimLifecycle({
  versions:[baseClaim], priorId:baseClaim.id, nextClaim:{...replacement,id:"CLAIM-A-v3",text:"A superseding answer."},
  kind:"supersession", effectiveAt:"2026-07-01T00:00:00Z", reason:"new evidence supersedes old claim"
});
if (resolveClaimState(superseded, "2026-08-01T00:00:00Z").claim?.id !== "CLAIM-A-v3") throw new Error("supersession propagation failed");

const retracted = propagateClaimLifecycle({
  versions:[baseClaim], priorId:baseClaim.id, kind:"retraction",
  effectiveAt:"2026-08-01T00:00:00Z", reason:"source retracted"
});
if (resolveClaimState(retracted, "2026-09-01T00:00:00Z").status !== "retracted") throw new Error("retraction propagation failed");

const atom = citationAtom(baseClaim);
if (!atom.claim_id || !atom.evidence_id || !atom.source_id || !atom.locator) throw new Error("citation atom incomplete");

const makeScenario = (name) => {
  const state = { status:"confirmed" };
  let versions = [{...baseClaim}];
  const contradictions = [];
  if (name.startsWith("unassessed")) state.status = "unassessed";
  if (name === "ambiguous_state" || name === "ambiguous_with_verified_claim") state.status = "ambiguous";
  if (name === "retracted_claim" || name === "retracted_source_available") versions = [{...baseClaim,status:"retracted"}];
  if (name === "invalidated_claim") versions = [{...baseClaim,status:"invalidated"}];
  if (name === "corrected_without_replacement") versions = [{...baseClaim,status:"corrected"}];
  if (name === "superseded_without_replacement") versions = [{...baseClaim,status:"superseded"}];
  if (name === "no_claim") versions = [];
  if (name === "future_claim") versions = [{...baseClaim,valid_from:"2027-01-01T00:00:00Z"}];
  if (name === "expired_claim") versions = [{...baseClaim,valid_to:"2026-02-01T00:00:00Z"}];
  if (name === "source_unavailable") versions = [{...baseClaim,source_available:false}];
  if (name === "evidence_unverified") versions = [{...baseClaim,evidence_verified:false}];
  if (name.includes("unresolved_contradiction")) contradictions.push({id:"CONTRA-1",status:"unresolved"});
  if (name === "no_active_after_correction_window") versions = [{...baseClaim,status:"corrected",valid_to:null}];
  if (name === "no_active_after_supersession_window") versions = [{...baseClaim,status:"superseded",valid_to:null}];
  return {state,versions,contradictions};
};

let negativePass = 0;
for (const item of bench.cases) {
  const s = makeScenario(item.scenario);
  const packet = buildQuestionAnswerPacket({
    question_id:"Q-TEST",
    as_of:"2026-09-20T00:00:00Z",
    state:s.state,
    claim_versions:s.versions,
    contradictions:s.contradictions
  });
  if (packet.abstention !== item.expected_abstention) {
    throw new Error(`${item.id}: expected ${item.expected_abstention}, got ${packet.abstention}`);
  }
  if (packet.answer !== null) throw new Error(`${item.id}: negative case returned an answer`);
  if (packet.citations.length !== 0) throw new Error(`${item.id}: negative case fabricated citation`);
  negativePass++;
}

const positive = buildQuestionAnswerPacket({
  question_id:"Q-TEST",
  as_of:"2026-09-20T00:00:00Z",
  state:{status:"confirmed"},
  claim_versions:[baseClaim],
  limitations:["scope limited"],
  watch_next:["replication"]
});
if (positive.abstention !== null || positive.answer !== baseClaim.text || positive.citations.length !== 1) {
  throw new Error("positive agent packet failed");
}

console.log(`FE06R_AGENT_NATIVE_PASS|lifecycle_cases=3|negative_cases=${negativePass}|negative_false_answers=0|negative_fake_citations=0|positive_cases=1|citation_atoms=1`);
