const first=v=>Array.isArray(v)?v[0]:v;
const getTitle=v=>String(first(v)||"").trim();

export function normalizeCrossref(payload){
  const m=payload?.message??payload;
  if(!m?.DOI) return {status:"unresolved",provider:"crossref",reason:"doi_not_found",source:null,publication_status:"unresolved"};
  const updates=[...(m["update-to"]||[]),...(m["update-policy"]||[])].map(x=>String(x.type||x.label||"").toLowerCase());
  const status=updates.some(x=>x.includes("retract"))?"retracted":updates.some(x=>x.includes("correct"))?"corrected":"active";
  const doi=String(m.DOI).toLowerCase();
  return {status:"resolved",provider:"crossref",reason:null,publication_status:status,source:{
    external_id:doi,
    kind:m.type==="posted-content"?"preprint":"paper",
    tier:"A",
    title:getTitle(m.title)||doi,
    url:m.URL||"https://doi.org/"+m.DOI,
    peer_reviewed:m.type!=="posted-content",
    study_stage:"unknown",
    independence_group:"doi:"+doi
  }};
}

export function normalizePubMed(record){
  if(!record?.pmid) return {status:"unresolved",provider:"pubmed",reason:"pmid_not_found",source:null,publication_status:"unresolved"};
  const id=String(record.pmid);
  return {status:"resolved",provider:"pubmed",reason:null,publication_status:record.publication_status||"active",source:{
    external_id:id,
    kind:"paper",
    tier:"A",
    title:record.title||"PMID "+id,
    url:record.url||"https://pubmed.ncbi.nlm.nih.gov/"+id+"/",
    peer_reviewed:record.peer_reviewed!==false,
    study_stage:record.study_stage||"unknown",
    independence_group:record.independence_group||"pubmed:"+id
  }};
}

export function normalizeClinicalTrial(study){
  const id=study?.protocolSection?.identificationModule?.nctId||study?.nctId;
  if(!id) return {status:"unresolved",provider:"clinicaltrials",reason:"nct_not_found",source:null,publication_status:"unresolved"};
  const title=study?.protocolSection?.identificationModule?.briefTitle||study?.title||id;
  return {status:"resolved",provider:"clinicaltrials",reason:null,publication_status:"active",source:{
    external_id:id,
    kind:"trial_registry",
    tier:"A",
    title,
    url:"https://clinicaltrials.gov/study/"+id,
    peer_reviewed:false,
    study_stage:study.study_stage||"unknown",
    independence_group:"trial:"+id
  }};
}

export function normalizeArxiv(entry){
  const id=entry?.id?.split("/abs/").pop()||entry?.arxiv_id;
  if(!id) return {status:"unresolved",provider:"arxiv",reason:"arxiv_not_found",source:null,publication_status:"unresolved"};
  return {status:"resolved",provider:"arxiv",reason:null,publication_status:"active",source:{
    external_id:id,
    kind:"preprint",
    tier:"A",
    title:entry.title||id,
    url:entry.url||"https://arxiv.org/abs/"+id,
    peer_reviewed:false,
    study_stage:entry.study_stage||"unknown",
    independence_group:"arxiv:"+id
  }};
}

export function normalizeRxiv(record,server){
  if(!record?.doi) return {status:"unresolved",provider:server,reason:"doi_not_found",source:null,publication_status:"unresolved"};
  const doi=String(record.doi).toLowerCase();
  return {status:"resolved",provider:server,reason:null,publication_status:"active",source:{
    external_id:doi,
    kind:"preprint",
    tier:"A",
    title:record.title||doi,
    url:"https://www."+server+".org/content/"+doi,
    peer_reviewed:false,
    study_stage:record.study_stage||"unknown",
    independence_group:server+":"+doi
  }};
}

export const adapterByProvider={
  crossref:normalizeCrossref,
  pubmed:normalizePubMed,
  clinicaltrials:normalizeClinicalTrial,
  arxiv:normalizeArxiv,
  biorxiv:x=>normalizeRxiv(x,"biorxiv"),
  medrxiv:x=>normalizeRxiv(x,"medrxiv")
};
