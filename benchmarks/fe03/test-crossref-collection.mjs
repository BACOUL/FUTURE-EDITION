import { buildCrossrefUpdatePlan,collectCrossrefUpdateQueue } from "./collect-crossref-updates.mjs";

const plan=buildCrossrefUpdatePlan(2);
if(plan.length!==2) throw new Error("expected two Crossref update families");
if(!plan.some(item=>item.family==="corrected_publication"&&item.filter==="has-update:true")){
  throw new Error("corrected publication discovery filter missing");
}
if(!plan.some(item=>item.family==="retraction_notice"&&item.filter.includes("update-type:retraction"))){
  throw new Error("retraction notice filter missing");
}

const payloads=[
  {message:{items:[
    {DOI:"10.1000/A",title:["Corrected parent A"],type:"journal-article",URL:"https://doi.org/10.1000/A"},
    {DOI:"10.1000/B",title:["Corrected parent B"],type:"journal-article",URL:"https://doi.org/10.1000/B"}
  ]}},
  {message:{items:[
    {DOI:"10.1000/C",title:["Retraction notice C"],type:"journal-article",URL:"https://doi.org/10.1000/C"},
    {DOI:"10.1000/A",title:["Duplicate A"],type:"journal-article",URL:"https://doi.org/10.1000/A"}
  ]}}
];
let call=0;
const fakeFetch=async()=>({ok:true,status:200,json:async()=>payloads[call++]});
const queue=await collectCrossrefUpdateQueue({fetchFn:fakeFetch,perFamily:2});

if(queue.length!==3) throw new Error("cross-family DOI dedup failed");
if(queue.some(item=>item.needs_human_label!==true||item.benchmark_eligible!==false)){
  throw new Error("collector bypassed human curation");
}
if(!queue.every(item=>item.candidate.raw_value===item.candidate.raw_value.toLowerCase())){
  throw new Error("DOI normalization missing");
}

console.log("FE03_CROSSREF_COLLECTION_PASS|families=2|queue=3|dedup=1|human_label_required=1|auto_admit=0");
