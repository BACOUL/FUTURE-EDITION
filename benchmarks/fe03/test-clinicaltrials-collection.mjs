import { buildClinicalTrialsCollectionPlan,collectClinicalTrialsQueue } from "./collect-clinicaltrials-candidates.mjs";

const plan=buildClinicalTrialsCollectionPlan(2);
if(plan.length!==2) throw new Error("expected two ClinicalTrials discovery searches");
if(!plan.every(item=>item.url.includes("/api/v2/studies?"))) throw new Error("v2 studies route missing");
if(!plan.every(item=>item.url.includes("query.term="))) throw new Error("query.term missing");

const study=id=>({protocolSection:{identificationModule:{nctId:id,briefTitle:"Trial "+id}}});
const payloads=[
  {studies:[study("NCT12345678"),study("NCT87654321")]},
  {studies:[study("NCT87654321"),study("NCT11112222")]}
];
let call=0;
const fakeFetch=async()=>({ok:true,status:200,json:async()=>payloads[call++]});
const queue=await collectClinicalTrialsQueue({fetchFn:fakeFetch,perFamily:2});

if(queue.length!==3) throw new Error("NCT dedup failed");
const shared=queue.find(item=>item.candidate.raw_value==="NCT87654321");
if(!shared||shared.suggested_families.length!==2) throw new Error("multi-family suggestion merge failed");
if(queue.some(item=>item.needs_human_label!==true||item.benchmark_eligible!==false)){
  throw new Error("collector bypassed human curation");
}

console.log("FE03_CLINICALTRIALS_COLLECTION_PASS|searches=2|queue=3|dedup=1|multi_family=1|human_label_required=1|auto_admit=0");
