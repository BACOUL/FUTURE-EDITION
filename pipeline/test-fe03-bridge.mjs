import { buildDossier } from "./lib/evidence-engine.mjs";
import { buildHumanReviewQueue } from "./lib/review-queue.mjs";
import { dossierToFe02Draft } from "./lib/fe02-bridge.mjs";

const candidate={id:"CAND-000001"};
const source={
  external_id:"10.1000/x",
  kind:"paper",
  tier:"A",
  title:"Synthetic",
  url:"https://doi.org/10.1000/x",
  peer_reviewed:true,
  study_stage:"randomized_trial",
  independence_group:"doi:10.1000/x"
};

const dossier=buildDossier({
  id:"DOS-000001",
  candidate,
  resolution:{status:"resolved",provider:"fixture",reason:null},
  source,
  publication_status:"active",
  claimDrafts:[{
    text:"Synthetic controlled result.",
    evidence:[{locator:"results:table1",support:"supports"}]
  }],
  relatedSources:[source],
  contradictions:[],
  limitations:["synthetic"],
  observed_at:"2099-01-01T00:00:00Z"
});

const queue=buildHumanReviewQueue([dossier]);
if(queue.length!==1||queue[0].dossier_id!=="DOS-000001") throw new Error("review queue failed");

const patch=dossierToFe02Draft(dossier,{
  source_id:"SRC-900001",
  provenance_id:"PROV-900001",
  claim_ids:["CLAIM-900001"],
  evidence_ids:["EVID-900001"]
});

if(patch.claims[0].confidence==="confirmed") throw new Error("bridge promoted confirmed");
if(patch.claims[0].review_state!=="machine_proposed") throw new Error("bridge bypassed review");
if(patch.evidence[0].claim_id!=="CLAIM-900001") throw new Error("bridge claim/evidence mismatch");

console.log("FE03_BRIDGE_TEST_PASS|review_queue=1|fe02_compatible_draft=1|human_gate_preserved=1");
