import { buildDossier } from "./lib/evidence-engine.mjs";

const make=(id,source,claim)=>buildDossier({
  id,
  candidate:{id:"CAND-"+id.slice(-6)},
  resolution:{status:"resolved",provider:"fixture",reason:null},
  source,
  publication_status:"active",
  claimDrafts:[claim],
  relatedSources:[source],
  contradictions:[],
  limitations:[],
  observed_at:"2099-01-01T00:00:00Z"
});

const animalSource={
  external_id:"animal",
  kind:"paper",
  tier:"A",
  title:"Animal fixture",
  url:"https://example.invalid/animal",
  peer_reviewed:true,
  study_stage:"preclinical_animal",
  independence_group:"animal-origin"
};

const animalAsHuman=make(
  "DOS-000101",
  animalSource,
  {
    text:"Synthetic human efficacy claim.",
    claim_kind:"efficacy",
    subject_scope:"human",
    evidence:[{locator:"results:1",support:"supports"}]
  }
);

if(animalAsHuman.safety.decision!=="reject") throw new Error("animal to human mismatch not rejected");
if(!animalAsHuman.safety.reasons.includes("claim_scope_exceeds_source_scope")) throw new Error("scope mismatch reason missing");

const phase1Source={
  external_id:"phase1",
  kind:"paper",
  tier:"A",
  title:"Phase I fixture",
  url:"https://example.invalid/phase1",
  peer_reviewed:true,
  study_stage:"phase1",
  independence_group:"phase1-origin"
};

const phase1Efficacy=make(
  "DOS-000102",
  phase1Source,
  {
    text:"Synthetic efficacy signal.",
    claim_kind:"efficacy",
    subject_scope:"human",
    evidence:[{locator:"results:1",support:"supports"}]
  }
);

if(phase1Efficacy.safety.confidence_ceiling!=="needs_confirmation"){
  throw new Error("phase I efficacy ceiling too high");
}
if(!phase1Efficacy.safety.reasons.includes("phase1_efficacy_not_confirmatory")){
  throw new Error("phase I reason missing");
}

const techSource={
  external_id:"tech",
  kind:"technical_report",
  tier:"A",
  title:"Technology fixture",
  url:"https://example.invalid/tech",
  peer_reviewed:true,
  study_stage:"technology_benchmark",
  independence_group:"tech-origin"
};

const tech=make(
  "DOS-000103",
  techSource,
  {
    text:"Synthetic benchmark performance result.",
    claim_kind:"performance",
    evidence:[{locator:"benchmark:1",support:"supports"}]
  }
);

if(tech.claims[0].subject_scope!=="technology") throw new Error("technology scope inference failed");
if(tech.claims[0].evidence_level!=="technology_demo") throw new Error("technology evidence level failed");

console.log("FE03_SEMANTIC_SAFETY_PASS|animal_to_human_rejected=1|phase1_ceiling=1|technology_scope=1");
