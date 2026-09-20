import { readFile } from "node:fs/promises";
import { resolveCandidate } from "../../pipeline/lib/source-resolver.mjs";

const UA="FutureEditionProviderDiagnostic/3.0 (+https://github.com/BACOUL/FUTURE-EDITION)";
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function request(url,{json=false,attempts=4}={}){
  let last=null;
  for(let i=0;i<attempts;i++){
    try{
      const res=await fetch(url,{headers:{"user-agent":UA,accept:json?"application/json":"*/*"}});
      last=res;
      if(res.ok) return {ok:true,status:res.status,data:json?await res.json():await res.text()};
      if(![429,500,502,503,504].includes(res.status)) return {ok:false,status:res.status,data:null};
    }catch(error){ last=error; }
    await wait(500*Math.pow(2,i));
  }
  return {ok:false,status:Number(last?.status)||0,data:null};
}

const publicCases=JSON.parse(await readFile("benchmarks/fe03/external/dev-validation.seed.json","utf8"));
const excluded=new Set(
  publicCases
    .filter(x=>["medrxiv","biorxiv"].includes(x?.candidate?.signal_kind))
    .map(x=>String(x.candidate.raw_value).toLowerCase())
);

async function collect(server,target){
  const out=[];
  for(const [a,b] of [["2022-01-01","2022-12-31"],["2023-01-01","2023-12-31"]]){
    for(let cursor=0;cursor<1000&&out.length<target;cursor+=100){
      const url="https://api.biorxiv.org/details/"+server+"/"+a+"/"+b+"/"+cursor+"/json";
      const r=await request(url,{json:true});
      if(!r.ok) throw new Error(server+" date API failed "+r.status);
      const rows=Array.isArray(r.data?.collection)?r.data.collection:[];
      if(rows.length===0) break;
      for(const row of rows){
        const doi=String(row?.doi??"").toLowerCase();
        if(!doi||excluded.has(doi)||out.some(x=>x.doi===doi)) continue;
        if(!String(row?.title??"").trim()||!String(row?.abstract??"").trim()) continue;
        out.push({server,doi});
        if(out.length>=target) break;
      }
      const total=Number(r.data?.messages?.[0]?.total);
      if(Number.isFinite(total)&&cursor+rows.length>=total) break;
    }
    if(out.length>=target) break;
  }
  if(out.length<target) throw new Error(server+" diagnostic underfilled "+out.length+"/"+target);
  return out;
}

const rows=[...(await collect("medrxiv",12)),...(await collect("biorxiv",12))];
const summary={
  total:rows.length,
  by_server:{medrxiv:{cases:0,resolved:0},biorxiv:{cases:0,resolved:0}},
  resolver_reasons:{},
  encoded_http_status:{},
  raw_http_status:{},
  raw_exact_match:0,
  encoded_exact_match:0,
  resolver_success_after_encoded_miss:0
};

for(const row of rows){
  summary.by_server[row.server].cases++;
  const encodedUrl="https://api.biorxiv.org/details/"+row.server+"/"+encodeURIComponent(row.doi)+"/na/json";
  const encoded=await request(encodedUrl,{json:true});
  const encodedStatus=String(encoded.status);
  summary.encoded_http_status[encodedStatus]=(summary.encoded_http_status[encodedStatus]??0)+1;
  const encodedCollection=Array.isArray(encoded.data?.collection)?encoded.data.collection:[];
  const encodedExact=encodedCollection.some(x=>String(x?.doi??"").toLowerCase()===row.doi);
  if(encodedExact) summary.encoded_exact_match++;

  const rawDoiPath=row.doi.split("/").map(encodeURIComponent).join("/");
  const rawUrl="https://api.biorxiv.org/details/"+row.server+"/"+rawDoiPath+"/na/json";
  const raw=await request(rawUrl,{json:true});
  const rawStatus=String(raw.status);
  summary.raw_http_status[rawStatus]=(summary.raw_http_status[rawStatus]??0)+1;
  const rawCollection=Array.isArray(raw.data?.collection)?raw.data.collection:[];
  const rawExact=rawCollection.some(x=>String(x?.doi??"").toLowerCase()===row.doi);
  if(rawExact) summary.raw_exact_match++;

  const resolved=await resolveCandidate({
    id:"DIAG-"+row.server+"-"+row.doi,
    signal_kind:row.server,
    raw_value:row.doi,
    origin:row.server
  },{fetchFn:fetch});
  await wait(250);

  const reason=resolved?.status==="resolved"?"resolved":String(resolved?.reason??"unknown");
  summary.resolver_reasons[reason]=(summary.resolver_reasons[reason]??0)+1;
  if(resolved?.status==="resolved"){
    summary.by_server[row.server].resolved++;
    if(!encodedExact) summary.resolver_success_after_encoded_miss++;
  }
}

summary.resolved_total=summary.by_server.medrxiv.resolved+summary.by_server.biorxiv.resolved;
summary.resolution_rate=summary.resolved_total/summary.total;
summary.pass=summary.resolution_rate===1;

console.log(JSON.stringify({
  protocol:"FE03-PROVIDER-DIAGNOSTIC-v3",
  independence_rule:"Fresh 2022-2023 rxiv records; public rxiv identifiers excluded; hidden V1/V2 identities never read or reused.",
  ...summary
},null,2));

console.log(
  "FE03_PROVIDER_DIAGNOSTIC|cases="+summary.total+
  "|resolved="+summary.resolved_total+
  "|rate="+summary.resolution_rate+
  "|encoded_exact="+summary.encoded_exact_match+
  "|raw_exact="+summary.raw_exact_match+
  "|resolver_success_after_encoded_miss="+summary.resolver_success_after_encoded_miss
);

if(!summary.pass) process.exit(1);
