import { pathToFileURL } from "node:url";

const servers=["medrxiv","biorxiv"];

export function buildRxivCollectionPlan(perServer=25){
  if(!Number.isInteger(perServer)||perServer<1||perServer>100){
    throw new Error("perServer must be an integer from 1 to 100");
  }

  return servers.map(server=>({
    server,
    family:"preprint",
    url:"https://api.biorxiv.org/details/"+server+"/"+perServer+"/0/json"
  }));
}

export async function collectRxivCandidateQueue({fetchFn=fetch,perServer=25}={}){
  const plan=buildRxivCollectionPlan(perServer);
  const queue=[];
  const seen=new Set();

  for(const item of plan){
    const response=await fetchFn(item.url,{headers:{accept:"application/json"}});
    if(!response?.ok){
      throw new Error(item.server+" collection failed: HTTP "+String(response?.status??"unknown"));
    }

    const payload=await response.json();
    for(const record of payload?.collection??[]){
      const doi=String(record?.doi??"").trim().toLowerCase();
      if(!doi) continue;
      const key="doi:"+doi;
      if(seen.has(key)) continue;
      seen.add(key);

      queue.push({
        queue_id:"CUR-RXIV-"+String(queue.length+1).padStart(5,"0"),
        family:"preprint",
        candidate:{signal_kind:item.server,raw_value:doi,origin:item.server},
        suggested_by:{provider:item.server,mode:"recent"},
        source_hint:{
          title:String(record?.title??""),
          date:record?.date??null,
          category:record?.category??null,
          version:record?.version??null
        },
        needs_human_label:true,
        benchmark_eligible:false
      });
    }
  }

  return queue;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const arg=process.argv.find(value=>value.startsWith("--per-server="));
  const perServer=arg?Number(arg.split("=")[1]):25;
  const queue=await collectRxivCandidateQueue({perServer});
  process.stdout.write(JSON.stringify(queue,null,2)+"\n");
}
