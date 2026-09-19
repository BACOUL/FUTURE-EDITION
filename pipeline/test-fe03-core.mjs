import { normalizeIdentifier,classifyEvidenceLevel,groupIndependentSources,buildDossier,evaluateSafety } from "./lib/evidence-engine.mjs";
import { adapterByProvider } from "./adapters/normalize.mjs";

const assert=(condition,message)=>{if(!condition) throw new Error(message);};

assert(normalizeIdentifier("doi","https://doi.org/10.1000/ABC").value==="10.1000/abc","doi normalization");
assert(!normalizeIdentifier("doi","not-a-doi").valid,"fake doi accepted");
assert(normalizeIdentifier("nct","nct12345678").valid,"NCT normalization");
assert(classifyEvidenceLevel({study_stage:"preclinical_animal"})==="preclinical","animal level");
assert(classifyEvidenceLevel({study_stage:"randomized_trial"})==="controlled_human","RCT level");

const cross=adapterByProvider.crossref({message:{DOI:"10.1000/test",type:"journal-article",title:["Test"],URL:"https://doi.org/10.1000/test","update-to":[]}});
assert(cross.status==="resolved"&&cross.source.peer_reviewed===true,"crossref normalize");

const retracted=adapterByProvider.crossref({message:{DOI:"10.1000/bad",type:"journal-article",title:["Bad"],URL:"https://doi.org/10.1000/bad","update-to":[{type:"retraction"}]}});
assert(retracted.publication_status==="retracted","retraction normalize");

const candidate={id:"CAND-000001"};
const mk=(id,resolution,source,status,claims=[],extra={})=>buildDossier({
  id,
  candidate,
  resolution,
  source,
  publication_status:status,
  claimDrafts:claims,
  relatedSources:extra.relatedSources||[],
  contradictions:extra.contradictions||[],
  limitations:extra.limitations||[],
  observed_at:"2099-01-01T00:00:00Z"
});
const ev=[{locator:"results:primary",support:"supports"}];

const strong=mk("DOS-000001",{status:"resolved",provider:"fixture",reason:null},{external_id:"x",kind:"paper",title:"x",url:"https://example.invalid/x",peer_reviewed:true,study_stage:"randomized_trial",independence_group:"origin-x"},"active",[{text:"Strong synthetic claim",evidence:ev}]);
assert(strong.safety.decision==="publish","strong evidence not publish candidate");
assert(strong.safety.confidence_ceiling==="solid_preliminary","automated confirmed ceiling violated");
assert(strong.safety.human_review_required===true,"human gate missing");

const pre=mk("DOS-000002",{status:"resolved",provider:"fixture",reason:null},{external_id:"p",kind:"preprint",title:"p",url:"https://example.invalid/p",peer_reviewed:false,study_stage:"phase1",independence_group:"origin-p"},"active",[{text:"Early synthetic claim",evidence:ev}]);
assert(pre.safety.decision==="hold"&&pre.safety.confidence_ceiling==="needs_confirmation","preprint safety");

const ret=mk("DOS-000003",{status:"resolved",provider:"fixture",reason:null},{external_id:"r",kind:"paper",title:"r",url:"https://example.invalid/r",peer_reviewed:true,study_stage:"randomized_trial",independence_group:"origin-r"},"retracted",[{text:"Retracted synthetic claim",evidence:ev}]);
assert(ret.safety.decision==="reject"&&ret.safety.confidence_ceiling==="unverifiable","retracted safety");

const invalid=mk("DOS-000004",{status:"invalid",provider:"resolver",reason:"bad identifier"},null,"unresolved",[]);
assert(invalid.safety.decision==="reject","invalid id safety");

const contradiction=structuredClone(strong);
contradiction.contradictions=["synthetic contrary source"];
assert(evaluateSafety(contradiction).decision==="investigate","contradiction safety");

const groups=groupIndependentSources([
  {external_id:"a",independence_group:"origin-1"},
  {external_id:"b",independence_group:"origin-1"},
  {external_id:"c",independence_group:"origin-2"}
]);
assert(groups.length===2&&groups.find(x=>x.group==="origin-1").source_keys.length===2,"independence grouping");

console.log("FE03_CORE_TEST_PASS|normalization=1|adapters=6|retraction=1|human_gate=1|contradiction=1|independence=1");
