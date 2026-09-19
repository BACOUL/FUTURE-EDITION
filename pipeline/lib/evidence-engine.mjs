const DOI_RE=new RegExp("^10[.][0-9]{4,9}/[^ ]+$","i");
const PMID_RE=new RegExp("^[0-9]{1,9}$");
const NCT_RE=new RegExp("^NCT[0-9]{8}$","i");
const ARXIV_RE=new RegExp("^[0-9]{4}[.][0-9]{4,5}(v[0-9]+)?$","i");

function stripKnownPrefix(value,prefixes){
  const lower=value.toLowerCase();
  for(const prefix of prefixes){
    if(lower.startsWith(prefix)) return value.slice(prefix.length);
  }
  return value;
}

export function normalizeIdentifier(kind,value){
  let v=String(value??"").trim();

  if(kind==="doi"){
    v=stripKnownPrefix(v,["https://doi.org/","http://doi.org/","https://dx.doi.org/","http://dx.doi.org/","doi:"]);
    v=v.trim().toLowerCase();
    return {value:v,valid:DOI_RE.test(v)};
  }

  if(kind==="pmid"){
    v=stripKnownPrefix(v,["pmid:"]).trim();
    return {value:v,valid:PMID_RE.test(v)};
  }

  if(kind==="nct"){
    v=v.toUpperCase();
    return {value:v,valid:NCT_RE.test(v)};
  }

  if(kind==="arxiv"){
    v=stripKnownPrefix(v,["arxiv:"]).trim();
    return {value:v,valid:ARXIV_RE.test(v)};
  }

  if(kind==="biorxiv"||kind==="medrxiv"){
    v=stripKnownPrefix(v,["https://doi.org/","http://doi.org/"]).trim().toLowerCase();
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

export function inferSubjectScope(source){
  const stage=source?.study_stage??"unknown";
  if(stage==="in_vitro") return "in_vitro";
  if(stage==="preclinical_animal") return "animal";
  if(["observational_human","phase1","phase2","phase3","randomized_trial","systematic_review","regulatory_approval"].includes(stage)) return "human";
  if(["technology_benchmark","real_world_deployment"].includes(stage)) return "technology";
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
    .map(([group,items])=>({
      group,
      source_keys:items.map(x=>x.external_id||x.url).sort()
    }));
}

export function evaluateSafety(dossier){
  const reasons=[];
  const resolved=dossier.resolution?.status==="resolved"&&dossier.source;

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
    return {
      decision:"reject",
      confidence_ceiling:"unverifiable",
      human_review_required:true,
      reasons
    };
  }

  if(dossier.publication_status==="expression_of_concern") reasons.push("expression_of_concern");
  if(dossier.publication_status==="corrected") reasons.push("source_corrected_review_update_required");
  if(["retraction_notice","correction_notice"].includes(dossier.source.kind)) reasons.push("integrity_notice");
  if(dossier.source.kind==="preprint"||dossier.source.peer_reviewed===false) reasons.push("not_peer_reviewed");

  const noClaims=!Array.isArray(dossier.claims)||dossier.claims.length===0;

  const scopeMismatch=(dossier.claims||[]).some(claim=>
    (dossier.source.study_stage==="preclinical_animal"&&claim.subject_scope==="human")||
    (dossier.source.study_stage==="in_vitro"&&["human","animal"].includes(claim.subject_scope))
  );

  if(scopeMismatch){
    reasons.push("claim_scope_exceeds_source_scope");
    return {
      decision:"reject",
      confidence_ceiling:"unverifiable",
      human_review_required:true,
      reasons
    };
  }

  const phase1Efficacy=(dossier.claims||[]).some(claim=>
    dossier.source.study_stage==="phase1"&&claim.claim_kind==="efficacy"
  );

  if(phase1Efficacy) reasons.push("phase1_efficacy_not_confirmatory");
  if(noClaims) reasons.push("no_atomic_claim");

  const locatorMissing=(dossier.claims||[]).some(
    claim=>!Array.isArray(claim.evidence)||claim.evidence.length===0||claim.evidence.some(item=>!item.locator)
  );
  if(locatorMissing) reasons.push("evidence_locator_missing");

  const locatorUnverified=(dossier.claims||[]).some(
    claim=>(claim.evidence||[]).some(item=>item.verification_status!=="verified")
  );
  if(locatorUnverified) reasons.push("evidence_locator_unverified");

  const levels=(dossier.claims||[]).map(claim=>claim.evidence_level);
  if(levels.includes("preclinical")) reasons.push("preclinical_not_human_efficacy");
  if(levels.includes("early_human")) reasons.push("early_human_not_confirmatory");
  if(levels.includes("unknown")) reasons.push("evidence_level_unknown");
  if((dossier.contradictions||[]).length) reasons.push("material_contradiction_present");

  let ceiling="solid_preliminary";
  if(noClaims||locatorMissing||locatorUnverified||levels.some(level=>["unknown","preclinical","early_human"].includes(level))){
    ceiling="needs_confirmation";
  }
  if(dossier.source.kind==="preprint"||dossier.source.peer_reviewed===false){
    ceiling="needs_confirmation";
  }

  if(phase1Efficacy){
    ceiling="needs_confirmation";
  }

  let decision="publish";
  if(reasons.some(reason=>[
    "expression_of_concern",
    "material_contradiction_present",
    "source_corrected_review_update_required",
    "integrity_notice"
  ].includes(reason))){
    decision="investigate";
  }else if(ceiling==="needs_confirmation"){
    decision="hold";
  }

  return {
    decision,
    confidence_ceiling:ceiling,
    human_review_required:true,
    reasons
  };
}

export function buildDossier(args){
  const {
    id,
    candidate,
    resolution,
    source=null,
    publication_status="unresolved",
    claimDrafts=[],
    relatedSources=[],
    contradictions=[],
    limitations=[],
    integrity_relations=[],
    observed_at
  }=args;

  const claims=claimDrafts.map((claim,index)=>({
    id:claim.id||"CP-"+String(index+1).padStart(6,"0"),
    text:claim.text,
    claim_kind:claim.claim_kind||"result",
    subject_scope:claim.subject_scope||inferSubjectScope(source),
    evidence_level:claim.evidence_level||classifyEvidenceLevel(source),
    evidence:(claim.evidence||[]).map(item=>({
      locator:item.locator,
      support:item.support||"supports",
      excerpt_hash:item.excerpt_hash??null,
      verification_status:item.verification_status==="verified"?"verified":"unverified"
    }))
  }));

  const groups=groupIndependentSources(
    relatedSources.length?relatedSources:(source?[source]:[])
  );

  const dossier={
    id,
    candidate_id:candidate.id,
    observed_at,
    resolution,
    publication_status,
    source,
    claims,
    independence:groups.flatMap(group=>
      group.source_keys.map(source_key=>({source_key,group:group.group}))
    ),
    contradictions,
    limitations,
    integrity_relations,
    safety:null
  };

  dossier.safety=evaluateSafety(dossier);
  return dossier;
}
