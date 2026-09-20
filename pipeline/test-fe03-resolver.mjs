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
    <summary>Fixture summary only. We benchmark models under a shared evaluation protocol.</summary>
    <author><name>A. Example</name></author>
    <author><name>B. Example</name></author>
    <category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
    <arxiv:primary_category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
    <arxiv:doi>10.1000/arxiv-fixture</arxiv:doi>
  </entry>
</feed>`;

const fixtures={
  crossref:{message:{DOI:"10.1000/test",type:"journal-article",title:["Crossref synthetic"],URL:"https://doi.org/10.1000/test",abstract:"<jats:p>Crossref fixture abstract evidence.</jats:p>","updated-by":[],"update-to":[]}},
  pubmedXml:`<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>12345</PMID><Article><ArticleTitle>PubMed synthetic</ArticleTitle><Abstract><AbstractText Label="BACKGROUND" NlmCategory="BACKGROUND">Background fixture text.</AbstractText><AbstractText Label="RESULTS" NlmCategory="RESULTS">Primary result improved by 25 percent.</AbstractText></Abstract><PublicationTypeList><PublicationType>Journal Article</PublicationType></PublicationTypeList></Article></MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="pubmed">12345</ArticleId></ArticleIdList></PubmedData></PubmedArticle></PubmedArticleSet>`,
  clinicaltrials:{protocolSection:{identificationModule:{nctId:"NCT12345678",briefTitle:"Trial synthetic"},descriptionModule:{briefSummary:"Registry brief summary evidence.",detailedDescription:"Registry detailed description evidence."},designModule:{phases:["PHASE1","PHASE2"],designInfo:{allocation:"RANDOMIZED"}},outcomesModule:{primaryOutcomes:[{measure:"Primary endpoint",description:"Primary endpoint description.",timeFrame:"Week 12"}]}}},
  medrxiv:{collection:[{doi:"10.1101/2026.01.01.123456",title:"Randomized medRxiv synthetic trial",abstract:"We conducted a randomized controlled trial. medRxiv fixture abstract evidence."}]}
};

const fakeJson=payload=>async()=>({ok:true,status:200,json:async()=>payload});
const fakeXml=xml=>async()=>({ok:true,status:200,text:async()=>xml});
const fakeHtml=html=>async()=>({ok:true,status:200,text:async()=>html});

const nhsHtml=`<!doctype html>
<html>
<head>
  <title>NHS deployment fixture</title>
  <meta name="description" content="Official NHS England deployment evidence">
</head>
<body>
  <main>
    <h1>NHS deployment fixture</h1>
    <p>NHS England deployed artificial intelligence tools across 90 organisations.</p>
    <p>The operational rollout followed a workforce trial and is not itself proof of general clinical efficacy.</p>
  </main>
</body>
</html>`;

const doi={id:"CAND-000001",signal_kind:"doi",raw_value:"10.1000/test",origin:"crossref"};
const pubmed={id:"CAND-000002",signal_kind:"pmid",raw_value:"12345",origin:"pubmed"};
const nct={id:"CAND-000003",signal_kind:"nct",raw_value:"NCT12345678",origin:"clinicaltrials"};
const med={id:"CAND-000004",signal_kind:"medrxiv",raw_value:"10.1101/2026.01.01.123456",origin:"medrxiv"};
const arxiv={id:"CAND-000005",signal_kind:"arxiv",raw_value:"2601.12345v2",origin:"arxiv"};
const nhs={id:"CAND-000006",signal_kind:"url",raw_value:"https://www.england.nhs.uk/2026/06/fixture/",origin:"nhs_england"};
const retrievedAt="2099-01-01T00:00:00Z";

if(!buildProviderRequest(doi,{mailto:"test@example.invalid"}).url.includes("api.crossref.org/works/")) throw new Error("crossref request");
if(!buildProviderRequest(pubmed).url.includes("efetch.fcgi")) throw new Error("pubmed request");
if(!buildProviderRequest(nct).url.includes("/api/v2/studies/NCT12345678")) throw new Error("clinicaltrials request");
if(!buildProviderRequest(med).url.includes("api.biorxiv.org/details/medrxiv/")) throw new Error("medrxiv request");
if(!buildProviderRequest(arxiv).url.includes("export.arxiv.org/api/query?id_list=")) throw new Error("arxiv request");
if(buildProviderRequest(nhs).provider!=="nhs_england") throw new Error("NHS official URL route");

const parsed=parseArxivAtom(arxivXml);
assert(parsed?.arxiv_id==="2601.12345v2","arxiv id parse");
assert(parsed?.title==="Synthetic & Reproducible arXiv Fixture","arxiv title/entity parse");
assert(parsed?.authors.length===2,"arxiv authors parse");
assert(parsed?.primary_category==="cs.AI","arxiv primary category parse");
assert(parsed?.doi==="10.1000/arxiv-fixture","arxiv DOI parse");

const r1=await resolveCandidate(doi,{fetchFn:fakeJson(fixtures.crossref),retrievedAt});
const r2=await resolveCandidate(pubmed,{fetchFn:fakeXml(fixtures.pubmedXml),retrievedAt});
const r3=await resolveCandidate(nct,{fetchFn:fakeJson(fixtures.clinicaltrials),retrievedAt});
const r4=await resolveCandidate(med,{fetchFn:fakeJson(fixtures.medrxiv),retrievedAt});
const r5=await resolveCandidate(arxiv,{fetchFn:fakeXml(arxivXml),retrievedAt});
const r6=await resolveCandidate(nhs,{fetchFn:fakeHtml(nhsHtml),retrievedAt});

for(const [name,result] of [["crossref",r1],["pubmed",r2],["clinicaltrials",r3],["medrxiv",r4],["arxiv",r5],["nhs_england",r6]]){
  assert(result.status==="resolved",name+" not resolved");
  assert(result.source?.tier==="A",name+" tier missing");
  assert(result.document?.sections?.length>0,name+" evidence document missing");
  assert(result.document.retrieved_at===retrievedAt,name+" retrieval timestamp lost");
}

assert(r1.document.id==="DOC-000001","crossref deterministic document id");
assert(r2.document.id==="DOC-000002","pubmed deterministic document id");
assert(r2.document.sections.length===2,"pubmed structured abstract sections missing");
assert(r2.document.sections[1].text==="Primary result improved by 25 percent.","pubmed result abstract text lost");
assert(r3.document.license_scope==="registry_record","clinicaltrials license scope");
assert(r3.document.sections.some(item=>item.id==="primary-outcome-1"),"clinicaltrials outcome evidence missing");
assert(r4.document.sections[0].text.includes("medRxiv fixture abstract evidence."),"rxiv abstract evidence missing");
assert(r5.document.sections[0].text.includes("benchmark models"),"arxiv summary evidence missing");
assert(r6.document.license_scope==="official_record","NHS official-record license scope");
assert(r6.document.sections.some(item=>item.text.includes("90 organisations")),"NHS official evidence text missing");
assert(r6.source.study_stage==="real_world_deployment","NHS real-world stage missing");
assert(r6.source.kind==="official_data","NHS official source kind missing");

assert(r3.source.study_stage==="phase1","clinicaltrials conservative phase mapping");
assert(r4.source.study_stage==="randomized_trial","rxiv randomized study stage missing");
assert(r5.source.kind==="preprint"&&r5.source.peer_reviewed===false,"arxiv preprint safety metadata");
assert(r5.source.study_stage==="technology_benchmark","explicit arxiv benchmark stage missing");

const bad=await resolveCandidate(
  {id:"CAND-000007",signal_kind:"doi",raw_value:"fake",origin:"crossref"},
  {fetchFn:fakeJson({}),retrievedAt}
);
assert(bad.status==="invalid"&&bad.document===null,"invalid DOI not rejected");

const down=await resolveCandidate(doi,{fetchFn:async()=>{throw new Error("offline");},retrievedAt});
assert(down.status==="unresolved"&&down.reason==="network_error"&&down.document===null,"network error not explicit");

const arxivError=`<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/api/errors#bad</id><title>Error</title><summary>bad id</summary></entry></feed>`;
const badArxiv=await resolveCandidate(arxiv,{fetchFn:fakeXml(arxivError),retrievedAt});
assert(badArxiv.status==="unresolved"&&badArxiv.reason==="invalid_or_empty_atom","arxiv error feed accepted");

let untrustedFetchCalled=false;
const untrusted=await resolveCandidate(
  {id:"CAND-000008",signal_kind:"url",raw_value:"https://example.com/untrusted/",origin:"manual"},
  {fetchFn:async()=>{untrustedFetchCalled=true;throw new Error("must not fetch");},retrievedAt}
);
assert(untrusted.status==="unresolved"&&untrusted.reason==="untrusted_url_provider","untrusted URL not rejected");
assert(untrustedFetchCalled===false,"untrusted URL reached network");

console.log("FE03_RESOLVER_TEST_PASS|routes=6|offline_fixtures=6|evidence_documents=6|structured_pubmed=1|clinicaltrials_outcome=1|official_web=1|arxiv_technology_stage=1|rxiv_randomized_stage=1|untrusted_url_rejected=1|invalid_id=1|network_error=1|arxiv_atom=1|arxiv_error_rejected=1");
