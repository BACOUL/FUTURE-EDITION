import { adapterByProvider } from "./adapters/normalize.mjs";
import { groupIndependentSources } from "./lib/evidence-engine.mjs";

const doi="10.1000/same-work";

const crossref=adapterByProvider.crossref({
  message:{
    DOI:doi,
    type:"journal-article",
    title:["Same work Crossref"],
    URL:"https://doi.org/"+doi,
    "updated-by":[],
    "update-to":[]
  }
});

const pubmed=adapterByProvider.pubmed({
  pmid:"12345",
  doi,
  title:"Same work PubMed",
  publication_status:"active",
  kind:"paper",
  peer_reviewed:true,
  study_stage:"randomized_trial",
  integrity_relations:[]
});

const medrxiv=adapterByProvider.medrxiv({
  doi,
  title:"Same work medRxiv"
});

const arxiv=adapterByProvider.arxiv({
  arxiv_id:"2601.12345",
  id:"https://arxiv.org/abs/2601.12345",
  doi,
  title:"Same work arXiv"
});

for(const item of [crossref,pubmed,medrxiv,arxiv]){
  if(item.source.independence_group!=="doi:"+doi){
    throw new Error("provider did not canonicalize DOI independence group: "+item.provider);
  }
}

const groups=groupIndependentSources([
  crossref.source,
  pubmed.source,
  medrxiv.source,
  arxiv.source
]);

if(groups.length!==1){
  throw new Error("same work counted as independent across providers");
}

if(groups[0].group!=="doi:"+doi){
  throw new Error("canonical DOI group lost");
}

console.log("FE03_INDEPENDENCE_TEST_PASS|providers=4|logical_origins=1|cross_provider_double_count_blocked=1");
