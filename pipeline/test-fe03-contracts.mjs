import { readFile } from "node:fs/promises";
import { validateSchema } from "./lib/schema-validator.mjs";
import { buildDossier } from "./lib/evidence-engine.mjs";
import { dossierToFe02Draft } from "./lib/fe02-bridge.mjs";

const root=new URL("../",import.meta.url);
const candidateSchema=JSON.parse(await readFile(new URL("schemas/candidate.schema.json",root),"utf8"));
const dossierSchema=JSON.parse(await readFile(new URL("schemas/evidence-dossier.schema.json",root),"utf8"));

const candidate={
  id:"CAND-000001",
  received_at:"2099-01-01T00:00:00Z",
  signal_kind:"doi",
  raw_value:"10.1000/x",
  question_ids:["Q-001"],
  origin:"crossref",
  signal_url:"https://doi.org/10.1000/x",
  notes:null
};

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
  resolution:{status:"resolved",provider:"crossref",reason:null},
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

const errors=[
  ...validateSchema(candidate,candidateSchema,"Candidate"),
  ...validateSchema(dossier,dossierSchema,"EvidenceDossier")
];

if(errors.length) throw new Error(errors.join(" | "));

const patch=dossierToFe02Draft(dossier,{
  source_id:"SRC-900001",
  provenance_id:"PROV-900001",
  claim_ids:["CLAIM-900001"],
  evidence_ids:["EVID-900001"]
});

if(patch.source.tier!=="A") throw new Error("source tier lost");
if(patch.claims[0].review_state!=="machine_proposed") throw new Error("human gate bypassed");
if(patch.human_review_required!==true) throw new Error("human review not required");

console.log("FE03_CONTRACT_TEST_PASS|candidate=1|dossier=1|fe02_bridge=1");
