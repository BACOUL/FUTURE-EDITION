import assert from "node:assert/strict";
import { extractAtomicClaims } from "./lib/claim-extractor.mjs";
import { verifyClaimEvidenceLocators } from "./lib/evidence-locator.mjs";

const document={
  id:"DOC-999999",
  sections:[{
    id:"results",
    title:"Results",
    text:"Treatment reduced symptoms by 25.4% compared with placebo. No significant difference was observed."
  }]
};
const source={study_stage:"randomized_trial",subject_scope:"human"};
const claims=extractAtomicClaims(document,{source});
assert.ok(claims.length>=2);
assert.equal(claims[0].review_state,"machine_proposed");
assert.equal(verifyClaimEvidenceLocators(document,claims).ok,true);
assert.ok(claims.some(x=>x.claim_kind==="result"));
assert.ok(claims.some(x=>x.claim_kind==="negative_result"));
console.log("FE03_CLAIM_EXTRACTOR_PASS|claims="+claims.length+"|verified_locators=1|human_gate=1");
