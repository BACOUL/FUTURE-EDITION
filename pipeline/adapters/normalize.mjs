const first=v=>Array.isArray(v)?v[0]:v;
const getTitle=v=>String(first(v)||"").trim();

const normalizeUpdateType=value=>{
  const text=String(value||"").toLowerCase().replaceAll("-","_").replaceAll(" ","_");
  if(text.includes("retract")) return "retraction";
  if(text.includes("expression")&&text.includes("concern")) return "expression_of_concern";
  if(text.includes("correct")||text.includes("errat")) return "correction";
  return text||"other";
};

const relationList=(items,direction)=>(items||[]).map(item=>({
  direction,
  type:normalizeUpdateType(item.type||item.label),
  external_id:String(item.DOI||item.doi||"").toLowerCase(),
  source:item.source?String(item.source):null,
  label:item.label?String(item.label):null
})).filter(item=>item.external_id);

function relationsFromCrossrefRelation(relation={}){
  const out=[];
  const mapping=[
    ["is-retracted-by","updated_by","retraction"],
    ["is-retraction-of","updates","retraction"],
    ["is-corrected-by","updated_by","correction"],
    ["is-correction-of","updates","correction"]
  ];

  for(const [key,direction,type] of mapping){
    for(const entry of relation[key]||[]){
      const id=String(entry.id||entry.DOI||entry.doi||"").toLowerCase();
      if(id) out.push({direction,type,external_id:id,source:"crossref-relation",label:key});
    }
  }

  return out;
}

function dedupeRelations(items){
  const seen=new Set();
  const result=[];

  for(const item of items){
    const key=[item.direction,item.type,item.external_id,item.source||""].join("|");
    if(seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result.sort((a,b)=>
    [a.direction,a.type,a.external_id,a.source||""].join("|")
      .localeCompare([b.direction,b.type,b.external_id,b.source||""].join("|"))
  );
}

function statusFromIncomingRelations(relations){
  const incoming=relations.filter(item=>item.direction==="updated_by");
  if(incoming.some(item=>item.type==="retraction")) return "retracted";
  if(incoming.some(item=>item.type==="expression_of_concern")) return "expression_of_concern";
  if(incoming.some(item=>item.type==="correction")) return "corrected";
  return "active";
}

function kindFromOutgoingRelations(baseKind,relations){
  const outgoing=relations.filter(item=>item.direction==="updates");
  if(outgoing.some(item=>item.type==="retraction")) return "retraction_notice";
  if(outgoing.some(item=>item.type==="correction")) return "correction_notice";
  return baseKind;
}

export function normalizeCrossref(payload){
  const m=payload?.message??payload;

  if(!m?.DOI){
    return {
      status:"unresolved",
      provider:"crossref",
      reason:"doi_not_found",
      source:null,
      publication_status:"unresolved",
      integrity_relations:[]
    };
  }

  const integrity_relations=dedupeRelations([
    ...relationList(m["updated-by"],"updated_by"),
    ...relationList(m["update-to"],"updates"),
    ...relationsFromCrossrefRelation(m.relation)
  ]);

  const doi=String(m.DOI).toLowerCase();
  const baseKind=m.type==="posted-content"?"preprint":"paper";
  const kind=kindFromOutgoingRelations(baseKind,integrity_relations);
  const publication_status=statusFromIncomingRelations(integrity_relations);

  return {
    status:"resolved",
    provider:"crossref",
    reason:null,
    publication_status,
    integrity_relations,
    source:{
      external_id:doi,
      kind,
      tier:"A",
      title:getTitle(m.title)||doi,
      url:m.URL||"https://doi.org/"+m.DOI,
      peer_reviewed:m.type!=="posted-content",
      study_stage:"unknown",
      independence_group:"doi:"+doi
    }
  };
}

export function normalizePubMed(record){
  if(!record?.pmid) return {status:"unresolved",provider:"pubmed",reason:"pmid_not_found",source:null,publication_status:"unresolved",integrity_relations:[]};
  const id=String(record.pmid);
  return {status:"resolved",provider:"pubmed",reason:null,publication_status:record.publication_status||"active",integrity_relations:record.integrity_relations||[],source:{
    external_id:id,
    kind:record.kind||"paper",
    tier:"A",
    title:record.title||"PMID "+id,
    url:record.url||"https://pubmed.ncbi.nlm.nih.gov/"+id+"/",
    peer_reviewed:record.peer_reviewed!==false,
    study_stage:record.study_stage||"unknown",
    independence_group:record.independence_group||(record.doi?"doi:"+String(record.doi).toLowerCase():"pubmed:"+id)
  }};
}

function clinicalTrialStage(study){
  const design=study?.protocolSection?.designModule??{};
  const phases=Array.isArray(design.phases)?design.phases:(Array.isArray(study?.phases)?study.phases:[]);
  const normalized=phases.map(value=>String(value).toUpperCase().replaceAll("_",""));

  if(normalized.some(value=>value.includes("PHASE1"))) return "phase1";
  if(normalized.some(value=>value.includes("PHASE2"))) return "phase2";
  if(normalized.some(value=>value.includes("PHASE3"))) return "phase3";

  const allocation=String(design?.designInfo?.allocation??study?.allocation??"").toUpperCase();
  if(allocation==="RANDOMIZED") return "randomized_trial";

  return "unknown";
}

export function normalizeClinicalTrial(study){
  const id=study?.protocolSection?.identificationModule?.nctId||study?.nctId;
  if(!id) return {status:"unresolved",provider:"clinicaltrials",reason:"nct_not_found",source:null,publication_status:"unresolved",integrity_relations:[]};
  const title=study?.protocolSection?.identificationModule?.briefTitle||study?.title||id;
  return {status:"resolved",provider:"clinicaltrials",reason:null,publication_status:"active",integrity_relations:[],source:{
    external_id:id,
    kind:"trial_registry",
    tier:"A",
    title,
    url:"https://clinicaltrials.gov/study/"+id,
    peer_reviewed:false,
    study_stage:study.study_stage||clinicalTrialStage(study),
    independence_group:"trial:"+id
  }};
}

function arxivStudyStage(entry){
  const categories=[
    entry?.primary_category,
    ...(Array.isArray(entry?.categories)?entry.categories:[])
  ]
    .filter(Boolean)
    .map(value=>String(value).toLowerCase());

  const technicalCategory=categories.some(value=>
    value.startsWith("cs.")||
    value==="stat.ml"||
    value.startsWith("eess.")
  );

  if(!technicalCategory) return "unknown";

  const text=(String(entry?.title??"")+" "+String(entry?.summary??"")).toLowerCase();
  const explicitBenchmark=
    /\bbenchmark(?:s|ed|ing)?\b/.test(text)||
    /\bleaderboard\b/.test(text)||
    /\bevaluation (?:suite|protocol|benchmark)\b/.test(text)||
    /\bmeasurement (?:audit|benchmark|protocol)\b/.test(text);

  return explicitBenchmark?"technology_benchmark":"unknown";
}

export function normalizeArxiv(entry){
  const id=entry?.id?.split("/abs/").pop()||entry?.arxiv_id;
  if(!id) return {status:"unresolved",provider:"arxiv",reason:"arxiv_not_found",source:null,publication_status:"unresolved",integrity_relations:[]};
  return {status:"resolved",provider:"arxiv",reason:null,publication_status:"active",integrity_relations:[],source:{
    external_id:id,
    kind:"preprint",
    tier:"A",
    title:entry.title||id,
    url:entry.url||"https://arxiv.org/abs/"+id,
    peer_reviewed:false,
    study_stage:entry.study_stage||arxivStudyStage(entry),
    independence_group:entry.doi?"doi:"+String(entry.doi).toLowerCase():"arxiv:"+id
  }};
}

function rxivStudyStage(record){
  const text=(String(record?.title??"")+" "+String(record?.abstract??"")).toLowerCase();

  if(/\bphase\s*(?:i|1)\b/.test(text)) return "phase1";
  if(/\bphase\s*(?:ii|2)\b/.test(text)) return "phase2";
  if(/\bphase\s*(?:iii|3)\b/.test(text)) return "phase3";
  if(/\b(?:randomized|randomised)\b/.test(text)&&/\b(?:trial|study)\b/.test(text)) return "randomized_trial";
  if(/\b(?:systematic review|meta-analysis|meta analysis)\b/.test(text)) return "systematic_review";

  const animal=/\b(?:mice|mouse|rats|rat|rabbits|rabbit|swine|porcine|dogs|canine)\b/.test(text);
  const human=/\b(?:human|humans|patient|patients|participants|adults|children|people)\b/.test(text);
  if(animal&&!human) return "preclinical_animal";

  if(human&&/\b(?:cohort|observational|cross-sectional|retrospective|prospective)\b/.test(text)){
    return "observational_human";
  }

  return "unknown";
}

export function normalizeRxiv(record,server){
  if(!record?.doi) return {status:"unresolved",provider:server,reason:"doi_not_found",source:null,publication_status:"unresolved",integrity_relations:[]};
  const doi=String(record.doi).toLowerCase();
  return {status:"resolved",provider:server,reason:null,publication_status:"active",integrity_relations:[],source:{
    external_id:doi,
    kind:"preprint",
    tier:"A",
    title:record.title||doi,
    url:"https://www."+server+".org/content/"+doi,
    peer_reviewed:false,
    study_stage:record.study_stage||rxivStudyStage(record),
    independence_group:"doi:"+doi
  }};
}

export function normalizeOfficialWeb(record,{provider="official_web",kind="official_data",study_stage="real_world_deployment"}={}){
  const url=String(record?.url??"").trim();
  const title=String(record?.title??"").trim();
  if(!url||!title){
    return {
      status:"unresolved",
      provider,
      reason:"official_web_parse_failed",
      source:null,
      publication_status:"unresolved",
      integrity_relations:[]
    };
  }

  return {
    status:"resolved",
    provider,
    reason:null,
    publication_status:"active",
    integrity_relations:[],
    source:{
      external_id:url,
      kind,
      tier:"A",
      title,
      url,
      peer_reviewed:false,
      study_stage,
      independence_group:"official:"+url
    }
  };
}

export const adapterByProvider={
  crossref:normalizeCrossref,
  pubmed:normalizePubMed,
  clinicaltrials:normalizeClinicalTrial,
  arxiv:normalizeArxiv,
  biorxiv:x=>normalizeRxiv(x,"biorxiv"),
  medrxiv:x=>normalizeRxiv(x,"medrxiv"),
  nhs_england:x=>normalizeOfficialWeb(x,{provider:"nhs_england",kind:"official_data",study_stage:"real_world_deployment"})
};
