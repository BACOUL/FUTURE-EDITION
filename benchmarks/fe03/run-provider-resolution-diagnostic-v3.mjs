import { resolveCandidate, buildProviderRequest } from "../../pipeline/lib/source-resolver.mjs";

const UA="FutureEditionProviderDiagnostic/3.0 (+https://github.com/BACOUL/FUTURE-EDITION)";
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function request(url,{json=true,attempts=4}={}){
  let last=null;
  for(let i=0;i<attempts;i++){
    try{
      const res=await fetch(url,{headers:{"user-agent":UA,accept:json?"application/json":"*/*"}});
      last=res;
      if(res.ok) return {ok:true,status:res.status,payload:json?await res.json():await res.text()};
      if(![429,500,502,503,504].includes(res.status)) return {ok:false,status:res.status,payload:null};
    }catch(error){last=error;}
    await wait(500*Math.pow(2,i));
  }
  return {ok:false,status:Number(last?.status)||0,payload:null,error:String(last?.message??last)};
}

async function collect(server,start,end,target){
  const out=[];
  for(let cursor=0;cursor<1000&&out.length<target;cursor+=100){
    const url="https://api.biorxiv.org/details/"+server+"/"+start+"/"+end+"/"+cursor+"/json";
    const res=await request(url);
    if(!res.ok) break;
    const items=Array.isArray(res.payload?.collection)?res.payload.collection:[];
    if(items.length===0) break;
    for(const item of items){
      const doi=String(item?.doi??"").toLowerCase();
      if(!doi) continue;
      out.push({server,doi,title:String(item?.title??""),abstract:String(item?.abstract??"")});
      if(out.length>=target) break;
    }
    const total=Number(res.payload?.messages?.[0]?.total);
    if(Number.isFinite(total)&&cursor+items.length>=total) break;
  }
  return out;
}

const cohorts=[
  {server:"medrxiv",start:"2019-10-01",end:"2019-12-31",target:12},
  {server:"medrxiv",start:"2022-07-01",end:"2022-12-31",target:12},
  {server:"biorxiv",start:"2019-01-01",end:"2019-03-31",target:12}
];

const rows=[];
for(const cohort of cohorts){
  const items=await collect(cohort.server,cohort.start,cohort.end,cohort.target);
  if(items.length<cohort.target) throw new Error("underfilled "+cohort.server+" "+cohort.start+": "+items.length+"/"+cohort.target);
  for(const item of items){
    const candidate={signal_kind:item.server,raw_value:item.doi,origin:item.server};
    const req=buildProviderRequest(candidate);
    const direct=await request(req.url);
    const directCollection=Array.isArray(direct.payload?.collection)?direct.payload.collection:[];
    let doiRoute={ok:false,status:0,url:null};
    try{
      const doiResponse=await fetch("https://doi.org/"+item.doi,{headers:{"user-agent":UA,accept:"text/html,application/xhtml+xml"}});
      doiRoute={ok:doiResponse.ok,status:doiResponse.status,url:doiResponse.url};
    }catch{}
    const suffix=item.doi.replace(/^10\.1101\//,"");
    const suffixRoute=await request("https://api.biorxiv.org/details/"+item.server+"/"+suffix+"/na/json");
    const suffixCollection=Array.isArray(suffixRoute.payload?.collection)?suffixRoute.payload.collection:[];
    const crossref=await request("https://api.crossref.org/works/"+encodeURIComponent(item.doi));
    const crossrefMessage=crossref.payload?.message??null;
    const crossrefParts=crossrefMessage?.published?.["date-parts"]?.[0]??crossrefMessage?.created?.["date-parts"]?.[0]??[];
    const crossrefDate=Array.isArray(crossrefParts)&&crossrefParts[0]
      ?[String(crossrefParts[0]),String(crossrefParts[1]??1).padStart(2,"0"),String(crossrefParts[2]??1).padStart(2,"0")].join("-")
      :null;
    const resolved=await resolveCandidate(candidate,{fetchFn:fetch});
    rows.push({
      cohort:cohort.server+":"+cohort.start+":"+cohort.end,
      provider:item.server,
      direct_http_status:direct.status,
      direct_http_ok:direct.ok,
      direct_collection_length:directCollection.length,
      direct_empty_success:direct.ok&&directCollection.length===0,
      doi_route_ok:doiRoute.ok,
      doi_route_status:doiRoute.status,
      doi_route_final_host:doiRoute.url?new URL(doiRoute.url).hostname:null,
      doi_date_parsable:/\/\d{4}\.\d{2}\.\d{2}\./.test(item.doi),
      suffix_route_ok:suffixRoute.ok&&suffixCollection.length>0,
      suffix_route_status:suffixRoute.status,
      crossref_ok:crossref.ok&&Boolean(crossrefMessage?.DOI),
      crossref_date:Boolean(crossrefDate),
      resolver_status:resolved?.status??"unknown",
      resolver_reason:resolved?.reason??null,
      resolver_provider:resolved?.provider??null
    });
    await wait(250);
  }
}

const count=(fn)=>rows.filter(fn).length;
const byProvider={};
for(const provider of ["medrxiv","biorxiv"]){
  const subset=rows.filter(x=>x.provider===provider);
  byProvider[provider]={
    cases:subset.length,
    resolved:subset.filter(x=>x.resolver_status==="resolved").length,
    resolution_recall:subset.length?subset.filter(x=>x.resolver_status==="resolved").length/subset.length:null,
    direct_empty_success:subset.filter(x=>x.direct_empty_success).length,
    doi_route_ok:subset.filter(x=>x.doi_route_ok).length,
    doi_date_parsable:subset.filter(x=>x.doi_date_parsable).length,
    suffix_route_ok:subset.filter(x=>x.suffix_route_ok).length,
    crossref_ok:subset.filter(x=>x.crossref_ok).length,
    crossref_date:subset.filter(x=>x.crossref_date).length,
    reasons:Object.fromEntries([...new Set(subset.map(x=>x.resolver_reason??"resolved"))].map(reason=>[
      reason,subset.filter(x=>(x.resolver_reason??"resolved")===reason).length
    ]))
  };
}

const report={
  protocol:"FE03-PROVIDER-DIAGNOSTIC-v3",
  freshness:{
    hidden_v1_identities_used:false,
    hidden_v2_identities_used:false,
    medrxiv_windows:["2019-10-01..2019-12-31","2022-07-01..2022-12-31"],
    biorxiv_window:"2019-01-01..2019-03-31"
  },
  cases:rows.length,
  authoritative_date_api_cases:rows.length,
  resolved:count(x=>x.resolver_status==="resolved"),
  resolution_recall:count(x=>x.resolver_status==="resolved")/rows.length,
  direct_empty_success:count(x=>x.direct_empty_success),
  doi_route_ok:count(x=>x.doi_route_ok),
  doi_date_parsable:count(x=>x.doi_date_parsable),
  suffix_route_ok:count(x=>x.suffix_route_ok),
  crossref_ok:count(x=>x.crossref_ok),
  crossref_date:count(x=>x.crossref_date),
  by_provider:byProvider,
  rows
};
console.log(JSON.stringify(report,null,2));
console.log(
  "FE03_PROVIDER_DIAGNOSTIC_V3|cases="+report.cases+
  "|resolved="+report.resolved+
  "|recall="+report.resolution_recall+
  "|direct_empty_success="+report.direct_empty_success+
  "|doi_route_ok="+report.doi_route_ok+
  "|doi_date_parsable="+report.doi_date_parsable+
  "|suffix_route_ok="+report.suffix_route_ok+
  "|crossref_ok="+report.crossref_ok+
  "|crossref_date="+report.crossref_date+
  "|medrxiv_recall="+String(byProvider.medrxiv.resolution_recall)+
  "|biorxiv_recall="+String(byProvider.biorxiv.resolution_recall)
);
