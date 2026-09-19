import { buildProviderRequest,resolveCandidate } from "./lib/source-resolver.mjs";
import { parseArxivAtom } from "./adapters/arxiv-atom.mjs";

const assert=(condition,message)=>{if(!condition) throw new Error(message);};

const arxivXml=`<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
  <title>ArXiv Query</title>
  <entry>
    <id>http://arxiv.org/abs/2601.12345v2</id>
    <updated>2026-01-20T12:00:00Z</updated>
    <published>2026-01-10T12:00:00Z</published>
    <title>
      Synthetic &amp; Reproducible arXiv Fixture
    </title>
    <summary>Fixture summary only.</summary>
    <author><name>A. Example</name></author>
    <author><name>B. Example</name></author>
    <category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
    <arxiv:primary_category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
    <arxiv:doi>10.1000/arxiv-fixture</arxiv:doi>
  </entry>
</feed>`;

const fixtures={
  crossref:{message:{DOI:"10.1000/test",type:"journal-article",title:["Crossref synthetic"],URL:"https://doi.org/10.1000/test","updated-by":[],"update-to":[]}},
  pubmedXml:`<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>12345</PMID><Article><ArticleTitle>PubMed synthetic</ArticleTitle><PublicationTypeList><PublicationType>Journal Article</PublicationType></PublicationTypeList></Article></MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="pubmed">12345</ArticleId></ArticleIdList></PubmedData></PubmedArticle></PubmedArticleSet>`,
  clinicaltrials:{protocolSection:{identificationModule:{nctId:"NCT12345678",briefTitle:"Trial synthetic"},designModule:{phases:["PHASE1","PHASE2"],designInfo:{allocation:"RANDOMIZED"}}}},
  medrxiv:{collection:[{doi:"10.1101/2026.01.01.123456",title:"medRxiv synthetic"}]}
};

const fakeJson=payload=>async()=>({ok:true,status:200,json:async()=>payload});
const fakeXml=xml=>async()=>({ok:true,status:200,text:async()=>xml});

const doi={id:"CAND-000001",signal_kind:"doi",raw_value:"10.1000/test",origin:"crossref"};
const pubmed={id:"CAND-000002",signal_kind:"pmid",raw_value:"12345",origin:"pubmed"};
const nct={id:"CAND-000003",signal_kind:"nct",raw_value:"NCT12345678",origin:"clinicaltrials"};
const med={id:"CAND-000004",signal_kind:"medrxiv",raw_value:"10.1101/2026.01.01.123456",origin:"medrxiv"};
const arxiv={id:"CAND-000005",signal_kind:"arxiv",raw_value:"2601.12345v2",origin:"arxiv"};

if(!buildProviderRequest(doi,{mailto:"test@example.invalid"}).url.includes("api.crossref.org/works/")) throw new Error("crossref request");
if(!buildProviderRequest(pubmed).url.includes("efetch.fcgi")) throw new Error("pubmed request");
if(!buildProviderRequest(nct).url.includes("/api/v2/studies/NCT12345678")) throw new Error("clinicaltrials request");
if(!buildProviderRequest(med).url.includes("api.biorxiv.org/details/medrxiv/")) throw new Error("medrxiv request");
if(!buildProviderRequest(arxiv).url.includes("export.arxiv.org/api/query?id_list=")) throw new Error("arxiv request");

const parsed=parseArxivAtom(arxivXml);
assert(parsed?.arxiv_id==="2601.12345v2","arxiv id parse");
assert(parsed?.title==="Synthetic & Reproducible arXiv Fixture","arxiv title/entity parse");
assert(parsed?.authors.length===2,"arxiv authors parse");
assert(parsed?.primary_category==="cs.AI","arxiv primary category parse");
assert(parsed?.doi==="10.1000/arxiv-fixture","arxiv DOI parse");

const r1=await resolveCandidate(doi,{fetchFn:fakeJson(fixtures.crossref)});
const r2=await resolveCandidate(pubmed,{fetchFn:fakeXml(fixtures.pubmedXml)});
const r3=await resolveCandidate(nct,{fetchFn:fakeJson(fixtures.clinicaltrials)});
const r4=await resolveCandidate(med,{fetchFn:fakeJson(fixtures.medrxiv)});
const r5=await resolveCandidate(arxiv,{fetchFn:fakeXml(arxivXml)});

for(const [name,result] of [["crossref",r1],["pubmed",r2],["clinicaltrials",r3],["medrxiv",r4],["arxiv",r5]]){
  assert(result.status==="resolved",name+" not resolved");
  assert(result.source?.tier==="A",name+" tier missing");
}

assert(r3.source.study_stage==="phase1","clinicaltrials conservative phase mapping");
assert(r5.source.kind==="preprint"&&r5.source.peer_reviewed===false,"arxiv preprint safety metadata");

const bad=await resolveCandidate(
  {id:"CAND-000006",signal_kind:"doi",raw_value:"fake",origin:"crossref"},
  {fetchFn:fakeJson({})}
);
assert(bad.status==="invalid","invalid DOI not rejected");

const down=await resolveCandidate(doi,{fetchFn:async()=>{throw new Error("offline");}});
assert(down.status==="unresolved"&&down.reason==="network_error","network error not explicit");

const arxivError=`<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/api/errors#bad</id><title>Error</title><summary>bad id</summary></entry></feed>`;
const badArxiv=await resolveCandidate(arxiv,{fetchFn:fakeXml(arxivError)});
assert(badArxiv.status==="unresolved"&&badArxiv.reason==="invalid_or_empty_atom","arxiv error feed accepted");

console.log("FE03_RESOLVER_TEST_PASS|routes=5|offline_fixtures=5|clinicaltrials_stage=1|invalid_id=1|network_error=1|arxiv_atom=1|arxiv_error_rejected=1");
