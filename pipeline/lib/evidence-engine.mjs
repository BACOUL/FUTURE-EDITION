const DOI_RE=/^10\\.\\d{4,9}\\/\\S+$/i;
const PMID_RE=/^\\d{1,9}$/;
const NCT_RE=/^NCT\\d{8}$/i;
const ARXIV_RE=/^\\d{4}\\.\\d{4,5}(v\\d+)?$/i;

export function normalizeIdentifier(kind,value){
  let v=String(value??"").trim();
  if(kind==="doi"){
    v=v.replace(/^https?:\\/\\/(dx\\.)?doi\\.org\\//i,"").replace(/^doi:\\s*/i,"").toLowerCase();
    return {value:v,valid:DOI_RE.test(v)};
  }
  if(kind==="pmid"){
    v=v.replace(/^pmid:\\s*/i,"");
    return {value:v,valid:PMID_RE.test(v)};
  }
  if(kind==="nct"){
    v=v.toUpperCase();
    return {value:v,valid:NCT_RE.test(v)};
  }
  if(kind==="arxiv"){
    v=v.replace(/^arxiv:\\s*/i,"");
    return {value:v,valid:ARXIV_RE.test(v)};
  }
  if(kind==="biorxiv"||kind==="medrxiv"){
    v=v.replace(/^https?:\\/\\/doi\\.org\\//i,"").toLowerCase();
    return {value:v,valid:DOI_RE.test(v)};
  }
  if(kind==="url"){
    try{
      const u=new URL(v);
      return {value:u.toString(),valid:["http:","https:"].includes(u.protocol)};
    }catch{
      return {value:v,valid:false};
    }
  }
  return {value:v,valid:v.length>=3};
}

export function classifyEvidenceLevel(source){
  const stage=source?.study_stage??"unknown";
  if(stage==="in_vitro"||stage==="preclinical_animal") return "preclinical";
  if(["observational_human","phase1","phase2"].includes(stage)) return "early_human";
  if(["phase3","randomized_trial"].includes(stage)) return "controlled_human";
  if(stage==="systematic_review") return "replicated_human";
  if(stage==="regulatory_approval") return "regulatory";
  if(stage==="technology_benchmark") return "technology_demo";
  if(stage==="real_world_deployment") return "real_world";
  return "unknown";
}

export function groupIndependentSources(sources=[]){
  const byOrigin=new Map();
  for(const source of sources){
    const group=source.independence_group||source.primary_origin||source.external_id||source.url;
    if(!byOrigin.has(group)) byOrigin.set(group,[]);
    byOrigin.get(group).push(source);
  }
  return [...byOrigin.entries()]
    .sort((a,b)=>String(a[0]).localeCompare(String(b[0])))
    .map(([group,items])=>({group,source_keys:items.map(x=>x.external_id||x.url).sort()}));
}

export function evaluateSafety(dossier){
  const reasons=[];
  const resolved=dossier.resolution?.status==="resolved" && dossier.source;
  if(!resolved){
    reasons.push(dossier.resolution?.status==="invalid"?"invalid_primary_identifier":"primary_source_unresolved");
    return {
      decision:dossier.resolution?.status==="invalid"?"reject":"investigate",
      confidence_ceiling:"unverifiable",
      human_review_required:true,
      reasons
    };
  }
  if(dossier.publication_status==="retracted"){
    reasons.push("source_retracted");
    return {decision:"reject",confidence_ceiling:"unverifiable",human_review_required:true,reasons};
  }
  if(dossier.publication_status==="expression_of_concern") reasons.push("expression_of_concern");
  if(dossier.publication_status==="corrected") reasons.push("source_corrected_review_update_required");
  if(dossier.source.kind==="preprint"||dossier.source.peer_reviewed===false) reasons.push("not_peer_reviewed");

  const noClaims=!Array.isArray(dossier.claims)||dossier.claims.length===0;
  if(noClaims) reasons.push("no_atomic_claim");
  const locatorMissing=(dossier.claims||[]).some(c=>!Array.isArray(c.evidence)||c.evidence.length===0||c.evidence.some(e=>!e.locator));
  if(locatorMissing) reasons.push("evidence_locator_missing");

  const levels=(dossier.claims||[]).map(c=>c.evidence_level);
  if(levels.includes("preclinical")) reasons.push("preclinical_not_human_efficacy");
  if(levels.includes("early_human")) reasons.push("early_human_not_confirmatory");
  if(levels.includes("unknown")) reasons.push("evidence_level_unknown");
  if((dossier.contradictions||[]).length) reasons.push("material_contradiction_present");

  let ceiling="solid_preliminary";
  if(noClaims||locatorMissing||levels.some(x=>["unknown","preclinical","early_human"].includes(x))) ceiling="needs_confirmation";
  if(dossier.source.kind==="preprint"||dossier.source.peer_reviewed===false) ceiling="needs_confirmation";

  let decision="publish";
  if(reasons.some(r=>["expression_of_concern","material_contradiction_present","source_corrected_review_update_required"].includes(r))) decision="investigate";
  else if(ceiling==="needs_confirmation") decision="hold";

  return {decision,confidence_ceiling:ceiling,human_review_required:true,reasons};
}

export function buildDossier(args){
  const {id,candidate,resolution,source=null,publication_status="unresolved",claimDrafts=[],relatedSources=[],contradictions=[],limitations=[],observed_at}=args;
  const claims=claimDrafts.map((claim,index)=>({
    id:claim.id||"CP-"+String(index+1).padStart(6,"0"),
    text:claim.text,
    evidence_level:claim.evidence_level||classifyEvidenceLevel(source),
    evidence:(claim.evidence||[]).map(e=>({locator:e.locator,support:e.support||"supports"}))
  }));
  const groups=groupIndependentSources(relatedSources.length?relatedSources:(source?[source]:[]));
  const dossier={
    id,
    candidate_id:candidate.id,
    observed_at,
    resolution,
    publication_status,
    source,
    claims,
    independence:groups.flatMap(g=>g.source_keys.map(source_key=>({source_key,group:g.group}))),
    contradictions,
    limitations,
    safety:null
  };
  dossier.safety=evaluateSafety(dossier);
  return dossier;
}
