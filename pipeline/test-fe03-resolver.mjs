import { buildProviderRequest,resolveCandidate } from "./lib/source-resolver.mjs";

const assert=(condition,message)=>{if(!condition) throw new Error(message);};

const fixtures={
  crossref:{message:{DOI:"10.1000/test",type:"journal-article",title:["Crossref synthetic"],URL:"https://doi.org/10.1000/test","update-to":[]}},
  pubmed:{result:{"12345":{uid:"12345",title:"PubMed synthetic"}}},
  clinicaltrials:{protocolSection:{identificationModule:{nctId:"NCT12345678",briefTitle:"Trial synthetic"}}},
  medrxiv:{collection:[{doi:"10.1101/2026.01.01.123456",title:"medRxiv synthetic"}]}
};

const fakeFetch=payload=>async()=>({ok:true,status:200,json:async()=>payload});

const doi={id:"CAND-000001",signal_kind:"doi",raw_value:"10.1000/test",origin:"crossref"};
const pubmed={id:"CAND-000002",signal_kind:"pmid",raw_value:"12345",origin:"pubmed"};
const nct={id:"CAND-000003",signal_kind:"nct",raw_value:"NCT12345678",origin:"clinicaltrials"};
const med={id:"CAND-000004",signal_kind:"medrxiv",raw_value:"10.1101/2026.01.01.123456",origin:"medrxiv"};

if(!buildProviderRequest(doi,{mailto:"test@example.invalid"}).url.includes("api.crossref.org/works/")) throw new Error("crossref request");
if(!buildProviderRequest(pubmed).url.includes("esummary.fcgi")) throw new Error("pubmed request");
if(!buildProviderRequest(nct).url.includes("/api/v2/studies/NCT12345678")) throw new Error("clinicaltrials request");
if(!buildProviderRequest(med).url.includes("api.biorxiv.org/details/medrxiv/")) throw new Error("medrxiv request");

const r1=await resolveCandidate(doi,{fetchFn:fakeFetch(fixtures.crossref)});
const r2=await resolveCandidate(pubmed,{fetchFn:fakeFetch(fixtures.pubmed)});
const r3=await resolveCandidate(nct,{fetchFn:fakeFetch(fixtures.clinicaltrials)});
const r4=await resolveCandidate(med,{fetchFn:fakeFetch(fixtures.medrxiv)});

for(const [name,result] of [["crossref",r1],["pubmed",r2],["clinicaltrials",r3],["medrxiv",r4]]){
  assert(result.status==="resolved",name+" not resolved");
  assert(result.source?.tier==="A",name+" tier missing");
}

const bad=await resolveCandidate(
  {id:"CAND-000005",signal_kind:"doi",raw_value:"fake",origin:"crossref"},
  {fetchFn:fakeFetch({})}
);
assert(bad.status==="invalid","invalid DOI not rejected");

const down=await resolveCandidate(doi,{fetchFn:async()=>{throw new Error("offline");}});
assert(down.status==="unresolved"&&down.reason==="network_error","network error not explicit");

const arxiv=buildProviderRequest({signal_kind:"arxiv",raw_value:"2601.12345",origin:"arxiv"});
assert(arxiv.status==="unsupported"&&arxiv.reason==="xml_network_parser_not_frozen","arxiv must fail explicitly");

console.log("FE03_RESOLVER_TEST_PASS|routes=4|offline_fixtures=4|invalid_id=1|network_error=1|arxiv_explicitly_unsupported=1");
