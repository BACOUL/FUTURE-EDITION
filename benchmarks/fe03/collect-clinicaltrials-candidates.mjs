import { pathToFileURL } from "node:url";

const searches=[
  {
    family:"trial_registry",
    query:"interventional",
    note:"Broad trial-registry discovery; family membership is human reviewed."
  },
  {
    family:"negative_result",
    query:"completed results",
    note:"Candidate discovery only. A negative result may be labeled only after human review of posted or published results."
  }
];

export function buildClinicalTrialsCollectionPlan(perFamily=25){
  if(!Number.isInteger(perFamily)||perFamily<1||perFamily>1000){
    throw new Error("perFamily must be an integer from 1 to 1000");
  }

  return searches.map(item=>({
    ...item,
    pageSize:perFamily,
    url:"https://clinicaltrials.gov/api/v2/studies?format=json&pageSize="+perFamily+
      "&query.term="+encodeURIComponent(item.query)
  }));
}

function nctIdOf(study){
  return study?.protocolSection?.identificationModule?.nctId??study?.nctId??null;
}

function titleOf(study){
  return study?.protocolSection?.identificationModule?.briefTitle??study?.title??"";
}

export async function collectClinicalTrialsQueue({fetchFn=fetch,perFamily=25}={}){
  const plan=buildClinicalTrialsCollectionPlan(perFamily);
  const byId=new Map();

  for(const item of plan){
    const response=await fetchFn(item.url,{headers:{accept:"application/json"}});
    if(!response?.ok){
      throw new Error("ClinicalTrials.gov collection failed for "+item.family+": HTTP "+String(response?.status??"unknown"));
    }

    const payload=await response.json();
    for(const study of payload?.studies??[]){
      const nct=String(nctIdOf(study)??"").trim().toUpperCase();
      if(!/^NCT[0-9]{8}$/.test(nct)) continue;

      if(!byId.has(nct)){
        byId.set(nct,{
          queue_id:null,
          candidate:{signal_kind:"nct",raw_value:nct,origin:"clinicaltrials"},
          suggested_families:[],
          suggested_by:[],
          source_hint:{title:titleOf(study)},
          needs_human_label:true,
          benchmark_eligible:false
        });
      }

      const entry=byId.get(nct);
      if(!entry.suggested_families.includes(item.family)) entry.suggested_families.push(item.family);
      entry.suggested_by.push({provider:"clinicaltrials",query:item.query,note:item.note});
    }
  }

  return [...byId.values()].map((entry,index)=>({
    ...entry,
    queue_id:"CUR-CTG-"+String(index+1).padStart(5,"0")
  }));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const arg=process.argv.find(value=>value.startsWith("--per-family="));
  const perFamily=arg?Number(arg.split("=")[1]):25;
  const queue=await collectClinicalTrialsQueue({perFamily});
  process.stdout.write(JSON.stringify(queue,null,2)+"\n");
}
