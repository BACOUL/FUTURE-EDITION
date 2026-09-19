import { pathToFileURL } from "node:url";

const families=[
  {
    family:"corrected_publication",
    filter:"has-update:true",
    note:"Parent works with incoming updates; human curation must retain correction cases only."
  },
  {
    family:"retraction_notice",
    filter:"is-update:true,update-type:retraction",
    note:"Works that are retraction updates to another DOI."
  }
];

export function buildCrossrefUpdatePlan(perFamily=25){
  if(!Number.isInteger(perFamily)||perFamily<1||perFamily>1000){
    throw new Error("perFamily must be an integer from 1 to 1000");
  }

  return families.map(item=>({
    ...item,
    rows:perFamily,
    url:"https://api.crossref.org/works?rows="+perFamily+"&filter="+encodeURIComponent(item.filter)
  }));
}

export async function collectCrossrefUpdateQueue({fetchFn=fetch,perFamily=25}={}){
  const plan=buildCrossrefUpdatePlan(perFamily);
  const queue=[];
  const seen=new Set();

  for(const item of plan){
    const response=await fetchFn(item.url,{headers:{accept:"application/json"}});
    if(!response?.ok){
      throw new Error("Crossref collection failed for "+item.family+": HTTP "+String(response?.status??"unknown"));
    }

    const payload=await response.json();
    const works=payload?.message?.items??[];

    for(const work of works){
      const doi=String(work?.DOI??"").trim().toLowerCase();
      if(!doi) continue;
      const key="doi:"+doi;
      if(seen.has(key)) continue;
      seen.add(key);

      queue.push({
        queue_id:"CUR-CROSSREF-"+String(queue.length+1).padStart(5,"0"),
        family:item.family,
        candidate:{signal_kind:"doi",raw_value:doi,origin:"crossref"},
        suggested_by:{
          provider:"crossref",
          filter:item.filter,
          note:item.note
        },
        source_hint:{
          title:Array.isArray(work.title)?String(work.title[0]??""):String(work.title??""),
          type:work.type??null,
          url:work.URL??null
        },
        needs_human_label:true,
        benchmark_eligible:false
      });
    }
  }

  return queue;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const arg=process.argv.find(value=>value.startsWith("--per-family="));
  const perFamily=arg?Number(arg.split("=")[1]):25;
  const queue=await collectCrossrefUpdateQueue({perFamily});
  process.stdout.write(JSON.stringify(queue,null,2)+"\n");
}
