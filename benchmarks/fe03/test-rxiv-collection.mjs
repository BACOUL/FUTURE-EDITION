import { buildRxivCollectionPlan,collectRxivCandidateQueue } from "./collect-rxiv-candidates.mjs";

const plan=buildRxivCollectionPlan(2);
if(plan.length!==2) throw new Error("expected bioRxiv and medRxiv");
if(!plan.every(item=>item.url.includes("api.biorxiv.org/details/"))) throw new Error("details API route missing");

const payloads=[
  {collection:[
    {doi:"10.1101/2026.01.01.111111",title:"med A",date:"2026-01-01"},
    {doi:"10.1101/2026.01.02.222222",title:"med B",date:"2026-01-02"}
  ]},
  {collection:[
    {doi:"10.1101/2026.01.02.222222",title:"bio duplicate",date:"2026-01-02"},
    {doi:"10.1101/2026.01.03.333333",title:"bio C",date:"2026-01-03"}
  ]}
];
let call=0;
const fakeFetch=async()=>({ok:true,status:200,json:async()=>payloads[call++]});
const queue=await collectRxivCandidateQueue({fetchFn:fakeFetch,perServer:2});

if(queue.length!==3) throw new Error("cross-server DOI dedup failed");
if(queue.some(item=>item.family!=="preprint")) throw new Error("preprint family lost");
if(queue.some(item=>item.needs_human_label!==true||item.benchmark_eligible!==false)){
  throw new Error("collector bypassed human curation");
}

console.log("FE03_RXIV_COLLECTION_PASS|servers=2|queue=3|dedup=1|human_label_required=1|auto_admit=0");
