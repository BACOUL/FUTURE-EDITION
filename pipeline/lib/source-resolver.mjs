import { normalizeIdentifier } from "./evidence-engine.mjs";
import { buildEvidenceDocument } from "./evidence-document.mjs";
import { adapterByProvider } from "../adapters/normalize.mjs";
import { parseArxivAtom } from "../adapters/arxiv-atom.mjs";
import { parsePubmedXml } from "../adapters/pubmed-xml.mjs";
import { parseOfficialWebHtml } from "../adapters/official-web.mjs";

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
      format:"xml",
      identifier:id,
      url:"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id="+encodeURIComponent(id)+"&retmode=xml"
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

  if(candidate.signal_kind==="url"){
    const parsed=new URL(id);
    const host=parsed.hostname.toLowerCase();
    const isNhsEngland=(host==="www.england.nhs.uk"||host==="england.nhs.uk")&&candidate.origin==="nhs_england";

    if(parsed.protocol==="https:"&&isNhsEngland){
      return {
        status:"ready",
        provider:"nhs_england",
        format:"html",
        identifier:id,
        url:id
      };
    }

    return {
      status:"unsupported",
      provider:candidate.origin||"url",
      reason:"untrusted_url_provider",
      identifier:id
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
  if(request.provider==="biorxiv"||request.provider==="medrxiv"){
    return payload?.collection?.[0]??null;
  }

  return payload;
}

export async function resolveCandidate(candidate,{fetchFn,mailto=null,retrievedAt=null}={}){
  if(typeof fetchFn!=="function") throw new Error("fetchFn is required");

  const request=buildProviderRequest(candidate,{mailto});

  if(request.status==="invalid"){
    return {
      status:"invalid",
      provider:request.provider,
      reason:request.reason,
      source:null,
      document:null,
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
      document:null,
      publication_status:"unresolved",
      request
    };
  }

  let response;

  try{
    const accept=request.format==="html"?"text/html":request.format==="xml"?"application/xml,text/xml":"application/json";
    response=await fetchFn(request.url,{headers:{accept}});
  }catch(error){
    return {
      status:"unresolved",
      provider:request.provider,
      reason:"network_error",
      source:null,
      document:null,
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
      document:null,
      publication_status:"unresolved",
      request
    };
  }

  let payload;

  try{
    if(request.format==="xml"){
      const xml=await response.text();
      payload=request.provider==="arxiv"?parseArxivAtom(xml):request.provider==="pubmed"?parsePubmedXml(xml):null;
      if(!payload){
        return {
          status:"unresolved",
          provider:request.provider,
          reason:"invalid_or_empty_atom",
          source:null,
          document:null,
          publication_status:"unresolved",
          request
        };
      }
    }else if(request.format==="html"){
      const html=await response.text();
      payload=parseOfficialWebHtml(html,{url:request.url});
      if(!payload){
        return {
          status:"unresolved",
          provider:request.provider,
          reason:"invalid_or_empty_html",
          source:null,
          document:null,
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
      reason:request.format==="xml"?"invalid_xml":request.format==="html"?"invalid_html":"invalid_json",
      source:null,
      document:null,
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
      document:null,
      publication_status:"unresolved",
      request
    };
  }

  const result=adapter(shaped);
  const document=result?.status==="resolved"
    ?buildEvidenceDocument(request.provider,shaped,{
      candidate,
      source:result.source,
      retrievedAt:retrievedAt??new Date().toISOString()
    })
    :null;

  return {...result,document,request};
}
