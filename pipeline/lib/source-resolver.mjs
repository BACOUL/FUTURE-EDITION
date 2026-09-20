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
    return payload?.collection?.[0]??payload??null;
  }

  return payload;
}

const DEFAULT_HEADERS={
  "user-agent":"FutureEditionEvidence/0.1 (+https://github.com/BACOUL/FUTURE-EDITION)",
  "accept-language":"en-US,en;q=0.9"
};

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function retryAfterMs(response){
  const raw=response?.headers?.get?.("retry-after");
  if(!raw) return null;
  const seconds=Number(raw);
  if(Number.isFinite(seconds)&&seconds>=0) return Math.min(seconds*1000,10000);
  const at=Date.parse(raw);
  return Number.isFinite(at)?Math.max(0,Math.min(at-Date.now(),10000)):null;
}

async function fetchWithRetry(url,options,{fetchFn,maxAttempts=4,baseDelayMs=500}){
  let lastResponse=null;
  let lastError=null;

  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{
      const response=await fetchFn(url,options);
      lastResponse=response;
      if(response?.ok) return {response,error:null};
      if(![429,500,502,503,504].includes(response?.status)||attempt===maxAttempts){
        return {response,error:null};
      }
      const delay=retryAfterMs(response)??baseDelayMs*Math.pow(2,attempt-1);
      await wait(delay);
    }catch(error){
      lastError=error;
      if(attempt===maxAttempts) return {response:null,error};
      await wait(baseDelayMs*Math.pow(2,attempt-1));
    }
  }

  return {response:lastResponse,error:lastError};
}

async function rxivHtmlFallback(request,{fetchFn}){
  if(!["biorxiv","medrxiv"].includes(request.provider)) return null;
  const url="https://www."+request.provider+".org/content/"+request.identifier;
  const {response,error}=await fetchWithRetry(url,{
    headers:{...DEFAULT_HEADERS,accept:"text/html"}
  },{fetchFn,maxAttempts:3,baseDelayMs:600});
  if(error||!response?.ok) return null;

  try{
    const parsed=parseOfficialWebHtml(await response.text(),{url});
    if(!parsed) return null;
    return {
      doi:request.identifier,
      title:parsed.title,
      abstract:parsed.description||parsed.paragraphs?.find(item=>String(item).length>=180)||parsed.body||"",
      page_body:parsed.body||"",
      url
    };
  }catch{
    return null;
  }
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

  const accept=request.format==="html"?"text/html,application/xhtml+xml":request.format==="xml"?"application/xml,text/xml":"application/json";
  const headers=request.format==="html"
    ?{...DEFAULT_HEADERS,"user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36",accept}
    :{...DEFAULT_HEADERS,accept};
  const fetched=await fetchWithRetry(request.url,{headers},{fetchFn});
  let response=fetched.response;

  if(fetched.error){
    return {
      status:"unresolved",
      provider:request.provider,
      reason:"network_error",
      source:null,
      document:null,
      publication_status:"unresolved",
      request,
      error:String(fetched.error?.message??fetched.error)
    };
  }

  let rxivFallback=null;
  if(!response?.ok&&["biorxiv","medrxiv"].includes(request.provider)){
    rxivFallback=await rxivHtmlFallback(request,{fetchFn});
  }

  if(!response?.ok&&!rxivFallback){
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
    if(rxivFallback){
      payload=rxivFallback;
    }else if(request.format==="xml"){
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
