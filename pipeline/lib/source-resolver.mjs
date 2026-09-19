import { normalizeIdentifier } from "./evidence-engine.mjs";
import { adapterByProvider } from "../adapters/normalize.mjs";
import { parseArxivAtom } from "../adapters/arxiv-atom.mjs";

export function buildProviderRequest(candidate,{mailto=null}={}){
  const normalized=normalizeIdentifier(candidate.signal_kind,candidate.raw_value);

  if(!normalized.valid){
    return {
      status:"invalid",
      provider:candidate.origin||candidate.signal_kind,
      reason:"invalid_identifier",
      identifier:normalized.value
    };
  }

  const id=normalized.value;

  if(candidate.signal_kind==="doi"){
    const query=mailto?"?mailto="+encodeURIComponent(mailto):"";
    return {
      status:"ready",
      provider:"crossref",
      format:"json",
      identifier:id,
      url:"https://api.crossref.org/works/"+encodeURIComponent(id)+query
    };
  }

  if(candidate.signal_kind==="pmid"){
    return {
      status:"ready",
      provider:"pubmed",
      format:"json",
      identifier:id,
      url:"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id="+encodeURIComponent(id)+"&retmode=json"
    };
  }

  if(candidate.signal_kind==="nct"){
    return {
      status:"ready",
      provider:"clinicaltrials",
      format:"json",
      identifier:id,
      url:"https://clinicaltrials.gov/api/v2/studies/"+encodeURIComponent(id)
    };
  }

  if(candidate.signal_kind==="biorxiv"||candidate.signal_kind==="medrxiv"){
    return {
      status:"ready",
      provider:candidate.signal_kind,
      format:"json",
      identifier:id,
      url:"https://api.biorxiv.org/details/"+candidate.signal_kind+"/"+encodeURIComponent(id)+"/na/json"
    };
  }

  if(candidate.signal_kind==="arxiv"){
    return {
      status:"ready",
      provider:"arxiv",
      format:"xml",
      identifier:id,
      url:"https://export.arxiv.org/api/query?id_list="+encodeURIComponent(id)+"&max_results=1"
    };
  }

  return {
    status:"unsupported",
    provider:candidate.origin||candidate.signal_kind,
    reason:"no_provider_route",
    identifier:id
  };
}

function shapeProviderPayload(request,payload){
  if(request.provider==="pubmed"){
    const record=payload?.result?.[request.identifier];
    if(!record) return null;

    return {
      pmid:request.identifier,
      title:record.title,
      url:"https://pubmed.ncbi.nlm.nih.gov/"+request.identifier+"/",
      peer_reviewed:true,
      publication_status:"active",
      study_stage:"unknown",
      independence_group:"pubmed:"+request.identifier
    };
  }

  if(request.provider==="biorxiv"||request.provider==="medrxiv"){
    return payload?.collection?.[0]??null;
  }

  return payload;
}

export async function resolveCandidate(candidate,{fetchFn,mailto=null}={}){
  if(typeof fetchFn!=="function") throw new Error("fetchFn is required");

  const request=buildProviderRequest(candidate,{mailto});

  if(request.status==="invalid"){
    return {
      status:"invalid",
      provider:request.provider,
      reason:request.reason,
      source:null,
      publication_status:"unresolved",
      request
    };
  }

  if(request.status!=="ready"){
    return {
      status:"unresolved",
      provider:request.provider,
      reason:request.reason,
      source:null,
      publication_status:"unresolved",
      request
    };
  }

  let response;

  try{
    response=await fetchFn(request.url,{headers:{accept:"application/json"}});
  }catch(error){
    return {
      status:"unresolved",
      provider:request.provider,
      reason:"network_error",
      source:null,
      publication_status:"unresolved",
      request,
      error:String(error?.message??error)
    };
  }

  if(!response?.ok){
    return {
      status:"unresolved",
      provider:request.provider,
      reason:"http_"+String(response?.status??"unknown"),
      source:null,
      publication_status:"unresolved",
      request
    };
  }

  let payload;

  try{
    if(request.format==="xml"){
      const xml=await response.text();
      payload=parseArxivAtom(xml);
      if(!payload){
        return {
          status:"unresolved",
          provider:request.provider,
          reason:"invalid_or_empty_atom",
          source:null,
          publication_status:"unresolved",
          request
        };
      }
    }else{
      payload=await response.json();
    }
  }catch{
    return {
      status:"unresolved",
      provider:request.provider,
      reason:request.format==="xml"?"invalid_xml":"invalid_json",
      source:null,
      publication_status:"unresolved",
      request
    };
  }

  const shaped=shapeProviderPayload(request,payload);
  const adapter=adapterByProvider[request.provider];

  if(!adapter){
    return {
      status:"unresolved",
      provider:request.provider,
      reason:"adapter_missing",
      source:null,
      publication_status:"unresolved",
      request
    };
  }

  const result=adapter(shaped);
  return {...result,request};
}
