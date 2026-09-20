import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const CHECKED_ON="2026-09-20";
const CANDIDATE_SHA="61d247da71a03e80a7275ba0c792a079f7221701";
const UA="FutureEditionHiddenHoldout/2.0 (+https://github.com/BACOUL/FUTURE-EDITION)";
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const seen=new Set();
const cases=[];
const claimPool=[];

async function request(url,{json=false,attempts=4}={}){
  let last=null;
  for(let i=0;i<attempts;i++){
    try{
      const res=await fetch(url,{headers:{"user-agent":UA,"accept":json?"application/json":"*/*"}});
      last=res;
      if(res.ok) return json?res.json():res.text();
      if(![429,500,502,503,504].includes(res.status)) throw new Error("HTTP "+res.status+" "+url);
    }catch(error){ last=error; }
    await wait(600*Math.pow(2,i));
  }
  throw new Error("request failed: "+String(last?.status??last?.message??last));
}

const stripTags=s=>String(s??"")
  .replace(/<[^>]+>/g," ")
  .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")
  .replace(/&quot;/g,'"').replace(/&#39;/g,"'")
  .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/\s+/g," ").trim();

function blocks(xml,tag){
  const out=[]; const re=new RegExp("<"+tag+"\\b([^>]*)>([\\s\\S]*?)<\\/"+tag+">","gi"); let m;
  while((m=re.exec(String(xml??"")))!==null) out.push({attrs:m[1],inner:m[2]});
  return out;
}
const textOf=(xml,tag)=>stripTags(blocks(xml,tag)[0]?.inner??"");
const attr=(attrs,name)=>{
  const m=String(attrs??"").match(new RegExp(name+'=["\\\']([^"\\\']+)["\\\']',"i"));
  return m?m[1]:null;
};

function parsePubmed(xml){
  const article=blocks(xml,"PubmedArticle")[0]; if(!article) return null;
  const x=article.inner;
  const pmid=textOf(x,"PMID"), title=textOf(x,"ArticleTitle");
  if(!pmid||!title) return null;
  const pubtypes=blocks(x,"PublicationType").map(b=>stripTags(b.inner)).filter(Boolean);
  const mesh=blocks(x,"DescriptorName").map(b=>stripTags(b.inner)).filter(Boolean);
  const abstract=blocks(x,"AbstractText").map(b=>stripTags(b.inner)).filter(Boolean).join(" ");
  let doi=null;
  for(const b of blocks(x,"ArticleId")){
    if(String(attr(b.attrs,"IdType")??"").toLowerCase()==="doi"){doi=stripTags(b.inner).toLowerCase();break;}
  }
  const relations=[];
  for(const b of blocks(x,"CommentsCorrections")){
    const type=String(attr(b.attrs,"RefType")??"");
    const related=textOf(b.inner,"PMID");
    if(type&&related) relations.push({type,pmid:related});
  }
  const incoming=relations.filter(r=>/In$/i.test(r.type));
  let status="active";
  if(pubtypes.some(x=>/Retracted Publication/i.test(x))||incoming.some(r=>/RetractionIn/i.test(r.type))) status="retracted";
  else if(incoming.some(r=>/ExpressionOfConcernIn/i.test(r.type))) status="expression_of_concern";
  else if(incoming.some(r=>/ErratumIn/i.test(r.type))) status="corrected";
  return {pmid,title,pubtypes,mesh,abstract,doi,relations,status,url:"https://pubmed.ncbi.nlm.nih.gov/"+pmid+"/"};
}

function meshScope(r){
  const m=new Set((r.mesh??[]).map(x=>String(x).toLowerCase()));
  const human=m.has("humans");
  const animal=m.has("animals")||["mice","rats","rabbits","swine","dogs","cats"].some(x=>m.has(x));
  return human&&animal?"mixed":human?"human":animal?"animal":"unknown";
}
function hasType(r,re){return (r.pubtypes??[]).some(x=>re.test(x));}

async function pubmedSearch(term,retmax=180){
  const url="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=pub+date&retmax="+retmax+"&term="+encodeURIComponent(term);
  const j=await request(url,{json:true});
  return j?.esearchresult?.idlist??[];
}
async function pubmedFetch(id){
  const xml=await request("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id="+encodeURIComponent(id)+"&retmode=xml");
  await wait(360);
  return parsePubmed(xml);
}
async function pubmedMany(term,count,predicate){
  const ids=await pubmedSearch(term);
  const out=[];
  for(const id of ids){
    if(out.length>=count) break;
    if(seen.has("pmid:"+String(id).toLowerCase())) continue;
    const r=await pubmedFetch(id);
    if(r&&(!predicate||predicate(r))) out.push(r);
  }
  return out;
}

function addCase(family,candidate,labels,evidence,{relations=null,claim=null,notes=null}={}){
  const key=String(candidate.signal_kind).toLowerCase()+":"+String(candidate.raw_value).toLowerCase();
  if(seen.has(key)) return false;
  seen.add(key);
  const id="FE03-EXT-"+String(9501+cases.length).padStart(4,"0");
  const item={id,split:"validation",candidate,labels,case_family:family,label_evidence:evidence};
  if(relations?.length) item.relations=relations;
  if(notes) item.notes=notes;
  cases.push(item);
  if(claim?.exact_text) claimPool.push({external_case_id:id,...claim});
  return true;
}
const ev=(authority,url,supports)=>[{authority,url,checked_on:CHECKED_ON,supports}];
const pubCandidate=r=>({signal_kind:"pmid",raw_value:r.pmid,origin:"pubmed"});

function sentence(text){
  const parts=String(text??"").split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=30&&x.length<=240);
  const ranked=parts.map(s=>({s,score:
    (/\b(significant|reduced|increased|improved|lower|higher|associated|noninferior|no difference|did not|showed|found|resulted|effective)\b/i.test(s)?4:0)+
    (/\d/.test(s)?1:0)-(/^(background|objective|aim|purpose)\b/i.test(s)?2:0)
  })).sort((a,b)=>b.score-a.score);
  return ranked[0]?.s??null;
}
function claimKind(family,text){
  if(family==="negative_result"||/\b(no significant|did not|no difference|not significant)\b/i.test(text)) return "negative_result";
  if(family==="technology_benchmark") return "performance";
  return "result";
}
function claimMeta(family,text,authority,url,scope){
  const exact=sentence(text); if(!exact) return null;
  return {exact_text:exact,authority,url,subject_scope:scope,claim_kind:claimKind(family,exact)};
}

const publicCorpus=JSON.parse(await readFile("benchmarks/fe03/external/dev-validation.seed.json","utf8"));
for(const x of publicCorpus){
  seen.add(String(x.candidate.signal_kind).toLowerCase()+":"+String(x.candidate.raw_value).toLowerCase());
  for(const rel of x.relations??[]) seen.add(String(rel.candidate.signal_kind).toLowerCase()+":"+String(rel.candidate.raw_value).toLowerCase());
}

// All PubMed windows below are 2008-2012: disjoint from V1's direct PubMed windows (2018-2026)
// and from the fresh V2 diagnostic window (2017-2022).
const active=await pubmedMany("2008:2012[pdat] AND Journal Article[pt] NOT Review[pt] NOT Retracted Publication[pt]",10,r=>r.status==="active"&&r.abstract.length>100);
for(const r of active.slice(0,6)) addCase("active_peer_reviewed",pubCandidate(r),{
  primary_source_resolvable:true,publication_status:"active",critical_safety_case:false,
  expected_subject_scope:meshScope(r),expected_evidence_level:"unknown"
},ev("pubmed",r.url,["identifier","active_publication"]),{claim:claimMeta("active_peer_reviewed",r.abstract,"pubmed",r.url,meshScope(r))});

const retracted=await pubmedMany("2008:2012[pdat] AND Retracted Publication[pt]",10,r=>r.status==="retracted");
for(const r of retracted.slice(0,4)) addCase("retracted_publication",pubCandidate(r),{
  primary_source_resolvable:true,publication_status:"retracted",critical_safety_case:true,
  expected_subject_scope:"unknown",expected_evidence_level:"unknown"
},ev("pubmed",r.url,["identifier","retracted_publication"]));

const notices=await pubmedMany("2008:2012[pdat] AND (Retraction of Publication[pt] OR Retraction Notice[pt])",8,r=>r.status==="active");
for(const r of notices.slice(0,3)) addCase("retraction_notice",pubCandidate(r),{
  primary_source_resolvable:true,publication_status:"active",critical_safety_case:false,
  expected_subject_scope:"unknown",expected_evidence_level:"unknown"
},ev("pubmed",r.url,["identifier","retraction_notice"]));

for(let i=0;i<5;i++){
  const doi=i<3;
  addCase("invalid_identifier",{
    signal_kind:doi?"doi":"pmid",
    raw_value:doi?"10.99998/future-edition-hidden-v2-"+String(800+i):"99888"+String(200+i),
    origin:"benchmark_design"
  },{
    primary_source_resolvable:false,publication_status:"unresolved",critical_safety_case:true,
    expected_subject_scope:"unknown",expected_evidence_level:"unknown"
  },ev("benchmark_design",null,["deterministic_invalid_identifier_v2"]));
}

const animals=await pubmedMany("2008:2012[pdat] AND Animals[MeSH Terms] NOT Humans[MeSH Terms] AND Journal Article[pt]",12,r=>r.status==="active"&&meshScope(r)==="animal"&&r.abstract.length>100);
for(const r of animals.slice(0,6)) addCase("animal_only",pubCandidate(r),{
  primary_source_resolvable:true,publication_status:"active",critical_safety_case:true,
  expected_subject_scope:"animal",expected_evidence_level:"preclinical"
},ev("pubmed",r.url,["identifier","animal_mesh_without_humans"]),{claim:claimMeta("animal_only",r.abstract,"pubmed",r.url,"animal")});

const phase2=await pubmedMany("2008:2012[pdat] AND Clinical Trial, Phase II[pt] AND Randomized Controlled Trial[pt]",16,r=>
  r.status==="active"&&hasType(r,/Clinical Trial, Phase II$/i)&&hasType(r,/Randomized Controlled Trial$/i)&&r.abstract.length>100
);
for(const r of phase2.slice(0,8)) addCase("early_human",pubCandidate(r),{
  primary_source_resolvable:true,publication_status:"active",critical_safety_case:true,
  expected_subject_scope:"human",expected_evidence_level:"early_human"
},ev("pubmed",r.url,["identifier","structured_phase_ii","randomized_design"]),{claim:claimMeta("early_human",r.abstract,"pubmed",r.url,"human")});

const phase3=await pubmedMany("2008:2012[pdat] AND Clinical Trial, Phase III[pt]",14,r=>
  r.status==="active"&&hasType(r,/Clinical Trial, Phase III$/i)&&r.abstract.length>100
);
for(const r of phase3.slice(0,7)) addCase("controlled_human",pubCandidate(r),{
  primary_source_resolvable:true,publication_status:"active",critical_safety_case:false,
  expected_subject_scope:"human",expected_evidence_level:"controlled_human"
},ev("pubmed",r.url,["identifier","structured_phase_iii"]),{claim:claimMeta("controlled_human",r.abstract,"pubmed",r.url,"human")});

const reviews=await pubmedMany("2008:2012[pdat] AND (Systematic Review[pt] OR Meta-Analysis[pt]) AND Humans[MeSH Terms]",12,r=>
  r.status==="active"&&hasType(r,/Systematic Review$|Meta-Analysis$/i)&&r.abstract.length>100
);
for(const r of reviews.slice(0,5)) addCase("systematic_review",pubCandidate(r),{
  primary_source_resolvable:true,publication_status:"active",critical_safety_case:false,
  expected_subject_scope:"human",expected_evidence_level:"replicated_human"
},ev("pubmed",r.url,["identifier","structured_systematic_review_or_meta_analysis"]),{claim:claimMeta("systematic_review",r.abstract,"pubmed",r.url,"human")});

const negatives=await pubmedMany('2008:2012[pdat] AND Randomized Controlled Trial[pt] NOT Clinical Trial, Phase I[pt] NOT Clinical Trial, Phase II[pt] AND ("no significant difference"[Title/Abstract] OR "did not improve"[Title/Abstract] OR "not significant"[Title/Abstract])',14,r=>
  r.status==="active"&&hasType(r,/Randomized Controlled Trial$/i)&&!hasType(r,/Clinical Trial, Phase I$/i)&&!hasType(r,/Clinical Trial, Phase II$/i)&&r.abstract.length>100
);
for(const r of negatives.slice(0,5)) addCase("negative_result",pubCandidate(r),{
  primary_source_resolvable:true,publication_status:"active",critical_safety_case:true,
  expected_subject_scope:"human",expected_evidence_level:"controlled_human"
},ev("pubmed",r.url,["identifier","structured_randomized_trial","negative_result_language"]),{claim:claimMeta("negative_result",r.abstract,"pubmed",r.url,"human")});

const dependent=await pubmedMany("2008:2012[pdat] AND Journal Article[pt]",12,r=>r.status==="active"&&Boolean(r.doi)&&r.abstract.length>100);
for(const r of dependent.slice(0,4)){
  const rel={relation_type:"same_primary_origin",candidate:{signal_kind:"doi",raw_value:r.doi,origin:"crossref"},basis:["PMID and DOI identify the same publication"]};
  addCase("dependent_echo",pubCandidate(r),{
    primary_source_resolvable:true,publication_status:"active",critical_safety_case:true,
    expected_subject_scope:"unknown",expected_evidence_level:"unknown"
  },ev("pubmed",r.url,["identifier","same_publication_doi"]),{relations:[rel],claim:claimMeta("dependent_echo",r.abstract,"pubmed",r.url,meshScope(r))});
}

async function medrxivCases(){
  const out=[];
  for(const [a,b] of [["2020-01-01","2020-12-31"],["2021-01-01","2021-12-31"]]){
    for(let cursor=0;cursor<500&&out.length<10;cursor+=100){
      let j;
      try{j=await request("https://api.biorxiv.org/details/medrxiv/"+a+"/"+b+"/"+cursor+"/json",{json:true});}catch{break;}
      for(const r of j?.collection??[]){
        const doi=String(r.doi??"").toLowerCase();
        if(!doi||seen.has("medrxiv:"+doi)) continue;
        const text=(String(r.title??"")+" "+String(r.abstract??"")).toLowerCase();
        const phase2=/\bphase\s*(?:ii|2)(?:a|b)?\b/.test(text);
        const phase3=/\bphase\s*(?:iii|3)\b/.test(text);
        const randomized=/\b(?:randomized|randomised|randomly assigned|randomly allocated)\b/.test(text);
        if(!phase2&&!phase3&&!randomized) continue;
        const level=phase2?"early_human":"controlled_human";
        out.push({doi,title:r.title,abstract:r.abstract,url:"https://www.medrxiv.org/content/"+doi,level});
        if(out.length>=10) break;
      }
    }
  }
  return out;
}
for(const r of (await medrxivCases()).slice(0,5)) addCase("preprint",{
  signal_kind:"medrxiv",raw_value:r.doi,origin:"medrxiv"
},{
  primary_source_resolvable:true,publication_status:"active",critical_safety_case:true,
  expected_subject_scope:"human",expected_evidence_level:r.level
},ev("medrxiv",r.url,["identifier","preprint","explicit_human_trial_design"]),{claim:claimMeta("preprint",r.abstract,"medrxiv",r.url,"human")});

async function arxivCases(){
  const q='submittedDate:[201301010000 TO 201412312359] AND all:benchmark AND (cat:cs.AI OR cat:cs.LG OR cat:cs.CV)';
  const xml=await request("https://export.arxiv.org/api/query?search_query="+encodeURIComponent(q)+"&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending");
  const out=[];
  for(const e of blocks(xml,"entry")){
    const id=textOf(e.inner,"id").split("/abs/").pop()?.replace(/v\d+$/,"");
    const title=textOf(e.inner,"title"), summary=textOf(e.inner,"summary");
    if(!id||!title||!summary||seen.has("arxiv:"+id.toLowerCase())) continue;
    if(!/\bbenchmark\b/i.test(title+" "+summary)) continue;
    out.push({id,title,summary,url:"https://arxiv.org/abs/"+id});
  }
  return out;
}
for(const r of (await arxivCases()).slice(0,4)) addCase("technology_benchmark",{
  signal_kind:"arxiv",raw_value:r.id,origin:"arxiv"
},{
  primary_source_resolvable:true,publication_status:"active",critical_safety_case:false,
  expected_subject_scope:"technology",expected_evidence_level:"technology_demo"
},ev("arxiv",r.url,["identifier","technical_category","benchmark_language"]),{claim:claimMeta("technology_benchmark",r.summary,"arxiv",r.url,"technology")});

async function contradictionPairs(){
  const topics=[
    '"vitamin D"[Title/Abstract] AND respiratory[Title/Abstract]',
    'exercise[Title/Abstract] AND depression[Title/Abstract]',
    'omega-3[Title/Abstract] AND cardiovascular[Title/Abstract]'
  ];
  const pairs=[];
  for(const topic of topics){
    const ids=await pubmedSearch("2008:2012[pdat] AND Randomized Controlled Trial[pt] AND "+topic,80);
    const positive=[],negative=[];
    for(const id of ids.slice(0,36)){
      if(seen.has("pmid:"+String(id).toLowerCase())) continue;
      const r=await pubmedFetch(id);
      if(!r||r.status!=="active"||r.abstract.length<80) continue;
      if(/\b(no significant|did not|not significantly|no difference)\b/i.test(r.abstract)) negative.push(r);
      if(/\b(significantly (?:reduced|improved|lower|higher)|was effective|reduced the risk)\b/i.test(r.abstract)) positive.push(r);
    }
    if(positive[0]&&negative[0]&&positive[0].pmid!==negative[0].pmid) pairs.push([positive[0],negative[0],topic]);
    if(pairs.length>=2) break;
  }
  return pairs;
}
for(const [a,b,topic] of await contradictionPairs()){
  if(seen.has("pmid:"+a.pmid)||seen.has("pmid:"+b.pmid)) continue;
  const rel={relation_type:"materially_conflicts",candidate:pubCandidate(b),basis:["Independent randomized records on the same topic were selected because their abstracts contain opposing result language",topic]};
  addCase("contradiction",pubCandidate(a),{
    primary_source_resolvable:true,publication_status:"active",critical_safety_case:true,
    expected_subject_scope:"human",expected_evidence_level:"controlled_human"
  },ev("pubmed",a.url,["identifier","independent_randomized_record"]),{relations:[rel],claim:claimMeta("contradiction",a.abstract,"pubmed",a.url,"human")});
  seen.add("pmid:"+b.pmid);
}

if(cases.length<50) throw new Error("hidden holdout v2 underfilled: "+cases.length);

const annotations=[];
for(const x of claimPool.filter(x=>x.exact_text&&x.exact_text.length<=240)){
  if(annotations.length>=24) break;
  annotations.push({
    id:"FE03-CLAIM-"+String(9501+annotations.length).padStart(4,"0"),
    external_case_id:x.external_case_id,
    split:"validation",
    claim:{text:x.exact_text,claim_kind:x.claim_kind,subject_scope:x.subject_scope},
    gold_evidence:[{relation:"supports",exact_text:x.exact_text,authority:x.authority,url:x.url}],
    checked_on:CHECKED_ON,
    notes:"Fresh hidden V2 annotation generated only after candidate-v2 freeze."
  });
}
if(annotations.length<15) throw new Error("hidden claim annotations v2 underfilled: "+annotations.length);

const familyCounts={};
for(const x of cases) familyCounts[x.case_family]=(familyCounts[x.case_family]??0)+1;
const bundle={
  protocol:"FE03-HIDDEN-HOLDOUT-v2",
  created_after_candidate_freeze:true,
  candidate_sha:CANDIDATE_SHA,
  freshness:{
    v1_holdout_reused:false,
    public_ids_excluded:true,
    pubmed_window:"2008-2012",
    diagnostic_pubmed_window:"2017-2022",
    v1_direct_pubmed_window:"2018-2026",
    medrxiv_window:"2020-2021",
    arxiv_window:"2013-2014"
  },
  external_cases:cases,
  claim_annotations:annotations
};
await writeFile("hidden-holdout-v2.json",JSON.stringify(bundle,null,2)+"\n");
const sha=createHash("sha256").update(await readFile("hidden-holdout-v2.json")).digest("hex");
console.log("FE03_HIDDEN_V2_GENERATED|cases="+cases.length+"|claims="+annotations.length+"|families="+Object.keys(familyCounts).length+"|sha256="+sha);
console.log("FE03_HIDDEN_V2_FAMILY_COUNTS|"+Object.entries(familyCounts).sort().map(([k,v])=>k+"="+v).join("|"));
