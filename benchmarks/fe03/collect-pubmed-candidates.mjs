import { pathToFileURL } from "node:url";

const families=[
  {
    family:"active_peer_reviewed",
    query:'"journal article"[pt] AND 2024:3000[pdat]'
  },
  {
    family:"controlled_human",
    query:'"randomized controlled trial"[pt] AND 2024:3000[pdat]'
  },
  {
    family:"early_human",
    query:'"clinical trial, phase i"[pt] AND 2024:3000[pdat]'
  },
  {
    family:"systematic_review",
    query:'"systematic review"[pt] AND 2024:3000[pdat]'
  },
  {
    family:"animal_only",
    query:'animals[mh:noexp] NOT humans[mh] AND 2024:3000[pdat]'
  },
  {
    family:"retracted_publication",
    query:'"retracted publication"[pt]'
  },
  {
    family:"retraction_notice",
    query:'"retraction notice"[pt]'
  },
  {
    family:"expression_of_concern",
    query:'"expression of concern"[pt]'
  }
];

export function buildPubmedCollectionPlan(perFamily=25){
  if(!Number.isInteger(perFamily)||perFamily<1||perFamily>100){
    throw new Error("perFamily must be an integer from 1 to 100");
  }

  return families.map(item=>({
    ...item,
    retmax:perFamily,
    url:"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax="+perFamily+"&sort=pub+date&term="+encodeURIComponent(item.query)
  }));
}

export async function collectPubmedCandidateQueue({fetchFn=fetch,perFamily=25}={}){
  const plan=buildPubmedCollectionPlan(perFamily);
  const queue=[];
  const seen=new Set();

  for(const item of plan){
    const response=await fetchFn(item.url,{headers:{accept:"application/json"}});

    if(!response?.ok){
      throw new Error("PubMed ESearch failed for "+item.family+": HTTP "+String(response?.status??"unknown"));
    }

    const payload=await response.json();
    const ids=payload?.esearchresult?.idlist??[];

    for(const pmid of ids){
      const id=String(pmid);
      const key="pmid:"+id;

      if(seen.has(key)) continue;
      seen.add(key);

      queue.push({
        queue_id:"CUR-PUBMED-"+String(queue.length+1).padStart(5,"0"),
        family:item.family,
        candidate:{
          signal_kind:"pmid",
          raw_value:id,
          origin:"pubmed"
        },
        suggested_by:{
          provider:"pubmed",
          query:item.query
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
  const queue=await collectPubmedCandidateQueue({perFamily});
  process.stdout.write(JSON.stringify(queue,null,2)+"\n");
}
