import { buildDossier,finalizeHumanConfirmation } from "./lib/evidence-engine.mjs";

const verified=[{
  locator:"results:primary",
  support:"supports",
  excerpt_hash:null,
  verification_status:"verified"
}];

function dossier(id,source,publication_status="active",extra={}){
  return buildDossier({
    id,
    candidate:{id:"CAND-"+id.slice(-6)},
    resolution:{status:"resolved",provider:"fixture",reason:null},
    source,
    publication_status,
    claimDrafts:[{
      text:extra.text||"Synthetic evidence claim.",
      claim_kind:extra.claim_kind||"result",
      subject_scope:extra.subject_scope,
      evidence:extra.evidence||verified
    }],
    relatedSources:extra.relatedSources||[source],
    contradictions:extra.contradictions||[],
    limitations:[],
    observed_at:"2099-01-01T00:00:00Z"
  });
}

const systematicSource={
  external_id:"systematic-1",
  kind:"paper",
  tier:"A",
  title:"Systematic review fixture",
  url:"https://example.invalid/systematic-1",
  peer_reviewed:true,
  study_stage:"systematic_review",
  independence_group:"origin-systematic-1"
};

const systematic=dossier("DOS-000201",systematicSource);
const systematicFinal=finalizeHumanConfirmation(systematic,{approved:true});
if(!systematicFinal.confirmed||systematicFinal.confidence!=="confirmed"){
  throw new Error("replicated human evidence failed confirmation gate");
}

const regulatorSource={
  external_id:"regulator-1",
  kind:"regulator",
  tier:"A",
  title:"Regulatory approval fixture",
  url:"https://example.invalid/regulator-1",
  peer_reviewed:false,
  study_stage:"regulatory_approval",
  independence_group:"regulator:1"
};

const regulator=dossier("DOS-000202",regulatorSource);
const regulatorFinal=finalizeHumanConfirmation(regulator,{approved:true});
if(!regulatorFinal.confirmed){
  throw new Error("regulatory authority incorrectly blocked as non-peer-reviewed");
}

const rctSource={
  external_id:"rct-1",
  kind:"paper",
  tier:"A",
  title:"Single RCT fixture",
  url:"https://example.invalid/rct-1",
  peer_reviewed:true,
  study_stage:"randomized_trial",
  independence_group:"rct:1"
};

const rct=dossier("DOS-000203",rctSource);
const rctFinal=finalizeHumanConfirmation(rct,{approved:true});
if(rctFinal.confirmed||!rctFinal.reasons.includes("confirmation_evidence_strength_insufficient")){
  throw new Error("single controlled trial was allowed to become confirmed");
}

const retracted=dossier("DOS-000204",rctSource,"retracted");
if(finalizeHumanConfirmation(retracted,{approved:true}).confirmed){
  throw new Error("retracted evidence became confirmed");
}

const preprintSource={
  external_id:"preprint-1",
  kind:"preprint",
  tier:"A",
  title:"Preprint fixture",
  url:"https://example.invalid/preprint-1",
  peer_reviewed:false,
  study_stage:"systematic_review",
  independence_group:"preprint:1"
};

const preprint=dossier("DOS-000205",preprintSource);
if(finalizeHumanConfirmation(preprint,{approved:true}).confirmed){
  throw new Error("preprint became confirmed");
}

const realWorldA={
  external_id:"deployment-a",
  kind:"official_data",
  tier:"A",
  title:"Deployment source A",
  url:"https://example.invalid/deployment-a",
  peer_reviewed:false,
  study_stage:"real_world_deployment",
  independence_group:"deployment-origin-a"
};
const realWorldB={...realWorldA,external_id:"deployment-b",url:"https://example.invalid/deployment-b",independence_group:"deployment-origin-b"};

const realWorld=dossier("DOS-000206",realWorldA,"active",{relatedSources:[realWorldA,realWorldB]});
if(!finalizeHumanConfirmation(realWorld,{approved:true}).confirmed){
  throw new Error("independently corroborated real-world evidence failed confirmation gate");
}

const realWorldSingle=dossier("DOS-000207",realWorldA);
const singleFinal=finalizeHumanConfirmation(realWorldSingle,{approved:true});
if(singleFinal.confirmed||!singleFinal.reasons.includes("real_world_independent_confirmation_missing")){
  throw new Error("single-origin real-world evidence became confirmed");
}

const noApproval=finalizeHumanConfirmation(systematic,{approved:false});
if(noApproval.confirmed||!noApproval.reasons.includes("human_approval_missing")){
  throw new Error("human approval gate bypassed");
}

console.log("FE03_CONFIRMATION_GATE_PASS|confirmed_safe=3|unsafe_confirmed=0|human_gate=1|single_rct_blocked=1|retracted_blocked=1|preprint_blocked=1|real_world_independence=1");
