import { buildPubmedCollectionPlan,collectPubmedCandidateQueue } from "./collect-pubmed-candidates.mjs";

const plan=buildPubmedCollectionPlan(25);

if(plan.length!==6) throw new Error("expected six PubMed families");
if(!plan.every(item=>item.url.includes("esearch.fcgi"))) throw new Error("ESearch route missing");
if(!plan.some(item=>item.family==="retracted_publication"&&item.query.includes("retracted publication"))) throw new Error("retraction query missing");
if(!plan.some(item=>item.family==="animal_only"&&item.query.includes("NOT humans"))) throw new Error("animal-only query missing");

const payloads=[
  ["101","102"],
  ["201","202"],
  ["301","302"],
  ["401","402"],
  ["501","502"],
  ["601","602"]
];
let call=0;
const fakeFetch=async()=>({
  ok:true,
  status:200,
  json:async()=>({esearchresult:{idlist:payloads[call++]}})
});

const queue=await collectPubmedCandidateQueue({fetchFn:fakeFetch,perFamily:2});

if(queue.length!==12) throw new Error("queue size mismatch");
if(queue.some(item=>item.benchmark_eligible!==false||item.needs_human_label!==true)){
  throw new Error("collector bypassed human curation");
}
if(new Set(queue.map(item=>item.candidate.raw_value)).size!==12){
  throw new Error("candidate deduplication failed");
}

console.log("FE03_PUBMED_COLLECTION_TEST_PASS|families=6|queue=12|human_label_required=1|benchmark_auto_admission=0");
