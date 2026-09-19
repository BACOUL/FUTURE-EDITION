import {
  createEvidenceLocator,
  resolveEvidenceLocator,
  verifyEvidenceReference,
  verifyClaimEvidenceLocators,
  stampVerifiedClaimEvidence
} from "./lib/evidence-locator.mjs";
import { buildDossier } from "./lib/evidence-engine.mjs";

const document={
  id:"DOC-000001",
  source_external_id:"10.1000/synthetic",
  retrieved_at:"2099-01-01T00:00:00Z",
  license_scope:"permitted_excerpt",
  sections:[
    {
      id:"abstract",
      title:"Abstract",
      text:"Background. Primary result improved by 25 percent. Limitation: synthetic fixture only."
    },
    {
      id:"results",
      title:"Results",
      text:"The primary endpoint changed from 10 to 7.5 in the treated group."
    }
  ]
};

const phrase="Primary result improved by 25 percent";
const start=document.sections[0].text.indexOf(phrase);
const ref=createEvidenceLocator(
  document,
  "abstract",
  start,
  start+phrase.length
);

if(!ref.locator.startsWith("DOC-000001#abstract:")){
  throw new Error("locator syntax");
}

if(resolveEvidenceLocator(document,ref.locator).excerpt!==phrase){
  throw new Error("locator resolution");
}

if(!verifyEvidenceReference(document,ref).ok){
  throw new Error("reference verification");
}

const claimDrafts=[{
  text:"Synthetic improvement claim.",
  claim_kind:"efficacy",
  subject_scope:"human",
  evidence:[{
    locator:ref.locator,
    excerpt_hash:ref.excerpt_hash,
    support:"supports"
  }]
}];

const good=verifyClaimEvidenceLocators(document,claimDrafts);
if(!good.ok) throw new Error(good.errors.join(" | "));

const stamped=stampVerifiedClaimEvidence(document,claimDrafts);
if(stamped[0].evidence[0].verification_status!=="verified"){
  throw new Error("verified evidence stamp missing");
}
if(stamped[0].evidence[0].excerpt_hash!==ref.excerpt_hash){
  throw new Error("verified excerpt hash changed");
}

const source={
  external_id:"10.1000/synthetic",
  kind:"paper",
  tier:"A",
  title:"Synthetic controlled trial",
  url:"https://doi.org/10.1000/synthetic",
  peer_reviewed:true,
  study_stage:"randomized_trial",
  independence_group:"doi:10.1000/synthetic"
};

const common={
  candidate:{id:"CAND-000401"},
  resolution:{status:"resolved",provider:"fixture",reason:null},
  source,
  publication_status:"active",
  relatedSources:[source],
  contradictions:[],
  limitations:[],
  integrity_relations:[],
  observed_at:"2099-01-01T00:00:00Z"
};

const verifiedDossier=buildDossier({
  id:"DOS-000401",
  ...common,
  claimDrafts:stamped
});

if(verifiedDossier.safety.decision!=="publish"){
  throw new Error("verified locator did not reach publish candidate path");
}

const unverifiedDossier=buildDossier({
  id:"DOS-000402",
  ...common,
  claimDrafts
});

if(unverifiedDossier.safety.decision!=="hold"){
  throw new Error("unverified locator was not held");
}
if(!unverifiedDossier.safety.reasons.includes("evidence_locator_unverified")){
  throw new Error("unverified locator reason missing");
}

const tampered=structuredClone(claimDrafts);
tampered[0].evidence[0].excerpt_hash="0".repeat(64);

if(verifyClaimEvidenceLocators(document,tampered).ok){
  throw new Error("tampered hash accepted");
}

const wrongDoc=structuredClone(claimDrafts);
wrongDoc[0].evidence[0].locator=wrongDoc[0].evidence[0].locator.replace(
  "DOC-000001",
  "DOC-999999"
);

if(verifyClaimEvidenceLocators(document,wrongDoc).ok){
  throw new Error("wrong document accepted");
}

let boundsRejected=false;

try{
  createEvidenceLocator(document,"abstract",0,9999);
}catch{
  boundsRejected=true;
}

if(!boundsRejected) throw new Error("out of bounds locator accepted");

console.log("FE03_LOCATOR_TEST_PASS|verified_publish_path=1|unverified_hold=1|tamper_rejected=1|wrong_document_rejected=1|bounds_rejected=1");
