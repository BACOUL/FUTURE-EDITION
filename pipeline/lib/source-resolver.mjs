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

async function fetchWithRetry(url,options,{fetchFn,maxAttempts=4,baseDelayMs=500,retryStatuses=[429,500,502,503,504]}){
  let lastResponse=null;
  let lastError=null;

  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{
      const response=await fetchFn(url,options);
      lastResponse=response;
      if(response?.ok) return {response,error:null};
      if(!retryStatuses.includes(response?.status)||attempt===maxAttempts){
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


const nhsPostCache=new Map();

function decodeXmlEntityText(value){
  return String(value??"")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
    .replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(Number.parseInt(hex,16)))
    .replace(/&#([0-9]+);/g,(_,dec)=>String.fromCodePoint(Number.parseInt(dec,10)))
    .replaceAll("&amp;","&")
    .replaceAll("&lt;","<")
    .replaceAll("&gt;",">")
    .replaceAll("&quot;",String.fromCharCode(34))
    .replaceAll("&apos;","'");
}

function rssElement(xml,tag){
  const match=String(xml??"").match(new RegExp("<"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+tag+">","i"));
  return match?decodeXmlEntityText(match[1]).trim():null;
}

function rssItems(xml){
  const items=[];
  const re=/<item>([\s\S]*?)<\/item>/gi;
  let match;
  while((match=re.exec(String(xml??"")))!==null){
    const inner=match[1];
    items.push({
      link:rssElement(inner,"link"),
      guid:rssElement(inner,"guid"),
      title:rssElement(inner,"title"),
      description:rssElement(inner,"description")
    });
  }
  return items;
}

function canonicalWebUrl(value){
  try{
    const url=new URL(value);
    url.hash="";
    if(!url.pathname.endsWith("/")) url.pathname+="/";
    return url.toString();
  }catch{
    return String(value??"");
  }
}

function nhsArchiveFeedUrl(value){
  const url=new URL(value);
  const match=url.pathname.match(/^(.*?\/\d{4}\/\d{2})\//);
  if(!match) return null;
  url.pathname=match[1]+"/feed/";
  url.search="";
  url.hash="";
  return url.toString();
}

async function nhsWordpressFallback(request,{fetchFn}){
  if(request.provider!=="nhs_england") return null;
  const target=canonicalWebUrl(request.url);
  if(nhsPostCache.has(target)) return nhsPostCache.get(target);

  const archive=nhsArchiveFeedUrl(target);
  if(!archive) return null;

  let postId=null;
  let feedDescription=null;

  for(let page=1;page<=12;page++){
    const feedUrl=archive+(page===1?"":"?paged="+page);
    const {response,error}=await fetchWithRetry(feedUrl,{
      headers:{...DEFAULT_HEADERS,accept:"application/rss+xml,application/xml,text/xml"}
    },{fetchFn,maxAttempts:3,baseDelayMs:500});
    if(error||!response?.ok) break;

    let xml;
    try{ xml=await response.text(); }catch{ break; }
    const items=rssItems(xml);
    if(items.length===0) break;

    const item=items.find(entry=>canonicalWebUrl(entry.link)===target);
    if(item){
      const idMatch=String(item.guid??"").match(/[?&]p=([0-9]+)/);
      if(idMatch) postId=idMatch[1];
      feedDescription=item.description??null;
      break;
    }
  }

  if(!postId) return null;

  const apiUrl="https://www.england.nhs.uk/wp-json/wp/v2/posts/"+postId;
  const {response,error}=await fetchWithRetry(apiUrl,{
    headers:{...DEFAULT_HEADERS,accept:"application/json"}
  },{fetchFn,maxAttempts:3,baseDelayMs:500});
  if(error||!response?.ok) return null;

  try{
    const post=await response.json();
    const title=String(post?.title?.rendered??"").trim();
    const body=String(post?.content?.rendered??"").trim();
    const excerpt=String(post?.excerpt?.rendered??feedDescription??"").trim();
    if(!title||!body) return null;

    const synthetic="<html><head><title>"+title+"</title></head><body>"+body+"</body></html>";
    const parsed=parseOfficialWebHtml(synthetic,{url:target});
    if(!parsed) return null;
    if(!parsed.description&&excerpt){
      const excerptParsed=parseOfficialWebHtml("<html><head><title>x</title></head><body><p>"+excerpt+"</p></body></html>",{url:target});
      parsed.description=excerptParsed?.body??null;
    }
    parsed.url=target;
    nhsPostCache.set(target,parsed);
    return parsed;
  }catch{
    return null;
  }
}

function rxivDateFromIdentifier(identifier){
  const match=String(identifier??"").match(/\/(\d{4})\.(\d{2})\.(\d{2})\./);
  return match?match[1]+"-"+match[2]+"-"+match[3]:null;
}

async function rxivDateApiFallback(request,{fetchFn}){
  if(!["biorxiv","medrxiv"].includes(request.provider)) return null;
  const date=rxivDateFromIdentifier(request.identifier);
  if(!date) return null;

  let cursor=0;
  for(let page=0;page<8;page++){
    const url="https://api.biorxiv.org/details/"+request.provider+"/"+date+"/"+date+"/"+cursor+"/json";
    const {response,error}=await fetchWithRetry(url,{
      headers:{...DEFAULT_HEADERS,accept:"application/json"}
    },{
      fetchFn,
      maxAttempts:3,
      baseDelayMs:500,
      retryStatuses:[404,429,500,502,503,504]
    });
    if(error||!response?.ok) return null;

    let payload;
    try{ payload=await response.json(); }catch{ return null; }
    const collection=Array.isArray(payload?.collection)?payload.collection:[];
    const found=collection.find(item=>String(item?.doi??"").toLowerCase()===String(request.identifier).toLowerCase());
    if(found) return found;
    if(collection.length===0) return null;

    const message=Array.isArray(payload?.messages)?payload.messages[0]:null;
    const total=Number(message?.total);
    cursor+=collection.length;
    if(Number.isFinite(total)&&cursor>=total) return null;
  }

  return null;
}

async function rxivHtmlFallback(request,{fetchFn}){
  if(!["biorxiv","medrxiv"].includes(request.provider)) return null;

  // Newer bioRxiv/medRxiv records can return 404 on the unversioned content
  // route while the canonical v1 record is live. Try both deterministically.
  const urls=[
    "https://www."+request.provider+".org/content/"+request.identifier,
    "https://www."+request.provider+".org/content/"+request.identifier+"v1"
  ];

  for(const url of urls){
    const {response,error}=await fetchWithRetry(url,{
      headers:{...DEFAULT_HEADERS,accept:"text/html"}
    },{
      fetchFn,
      maxAttempts:3,
      baseDelayMs:600,
      retryStatuses:[404,429,500,502,503,504]
    });
    if(error||!response?.ok) continue;

    try{
      const parsed=parseOfficialWebHtml(await response.text(),{url});
      if(!parsed) continue;
      return {
        doi:request.identifier,
        title:parsed.title,
        abstract:parsed.description||parsed.paragraphs?.find(item=>String(item).length>=180)||parsed.body||"",
        page_body:parsed.body||"",
        url
      };
    }catch{
      continue;
    }
  }

  return null;
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
  const rxivProvider=["biorxiv","medrxiv"].includes(request.provider);
  const fetched=await fetchWithRetry(request.url,{headers},{
    fetchFn,
    ...(rxivProvider?{
      maxAttempts:3,
      baseDelayMs:500,
      retryStatuses:[404,429,500,502,503,504]
    }:{})
  });
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
  if(!response?.ok&&rxivProvider){
    rxivFallback=await rxivDateApiFallback(request,{fetchFn});
    if(!rxivFallback) rxivFallback=await rxivHtmlFallback(request,{fetchFn});
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
      if(!payload&&request.provider==="nhs_england"){
        payload=await nhsWordpressFallback(request,{fetchFn});
      }
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
