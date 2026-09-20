import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const CHECKED_ON="2026-09-20";
const UA="FutureEditionHiddenHoldout/1.0 (+https://github.com/BACOUL/FUTURE-EDITION)";
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const seen=new Set();
const cases=[];
const claimPool=[];

async function request(url,{json=false,attempts=4}={}){
  let last;
  for(let i=0;i<attempts;i++){
    try{
      const res=await fetch(url,{headers:{"user-agent":UA,"accept":json?"application/json":"*/*"}});
      last=res;
      if(res.ok) return json?res.json():res.text();
      if(![429,500,502,503,504].includes(res.status)) throw new Error("HTTP "+res.status+" "+url);
    }catch(e){ last=e; }
    await wait(500*Math.pow(2,i));
  }
  throw new Error("request failed: "+String(last?.status??last?.message??last));
}

const stripTags=s=>String(s??"").replace(/<[^>]+>/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">")
  .replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g," ").trim();

function blocks(xml,tag){
  const out=[]; const re=new RegExp("<"+tag+"\\b([^>]*)>([\\s\\S]*?)<\\/"+tag+">","gi"); let m;
  while((m=re.exec(String(xml??"")))!==null) out.push({attrs:m[1],inner:m[2]});
  return out;
}
const textOf=(xml,tag)=>stripTags(blocks(xml,tag)[0]?.inner??"");
const attr=(attrs,name)=>{const m=String(attrs??"").match(new RegExp(name+'=["\\\']([^"\\\']+)["\\\']',"i"));return m?m[1]:null;};

function parsePubmed(xml){
  const article=blocks(xml,"PubmedArticle")[0]; if(!article) return null;
  const x=article.inner;
  const pmid=textOf(x,"PMID"), title=textOf(x,"ArticleTitle");
  if(!pmid||!title) return null;
  const pubtypes=blocks(x,"PublicationType").map(b=>stripTags(b.inner)).filter(Boolean);
  const mesh=blocks(x,"DescriptorName").map(b=>stripTags(b.inner)).filter(Boolean);
  const abs=blocks(x,"AbstractText").map(b=>stripTags(b.inner)).filter(Boolean).join(" ");
  let doi=null;
  for(const b of blocks(x,"ArticleId")) if(String(attr(b.attrs,"IdType")??"").toLowerCase()==="doi"){doi=stripTags(b.inner).toLowerCase();break;}
  const rel=[];
  for(const b of blocks(x,"CommentsCorrections")){
    const type=String(attr(b.attrs,"RefType")??"");
    const related=textOf(b.inner,"PMID");
    if(type&&related) rel.push({type,pmid:related});
  }
  const incoming=rel.filter(r=>/In$/i.test(r.type));
  let status="active";
  if(pubtypes.some(x=>/Retracted Publication/i.test(x))||incoming.some(r=>/RetractionIn/i.test(r.type))) status="retracted";
  else if(incoming.some(r=>/ExpressionOfConcernIn/i.test(r.type))) status="expression_of_concern";
  else if(incoming.some(r=>/ErratumIn/i.test(r.type))) status="corrected";
  const human=mesh.some(x=>/^Humans$/i.test(x));
  const animal=mesh.some(x=>/^(Animals|Mice|Rats|Rabbits|Swine|Dogs|Cats)$/i.test(x));
  let scope=human&&animal?"mixed":human?"human":animal?"animal":"unknown";
  let level="unknown";
  const both=(title+" "+abs).toLowerCase();
  if(pubtypes.some(x=>/Systematic Review|Meta-Analysis/i.test(x))||/\b(systematic review|meta-analysis|meta analysis)\b/.test(both)) level="replicated_human";
  else if(pubtypes.some(x=>/Clinical Trial, Phase I/i.test(x))||pubtypes.some(x=>/Clinical Trial, Phase II/i.test(x))||/\bphase\s*(?:i|1|ii|2a?|2b?)\b/.test(both)) level="early_human";
  else if(pubtypes.some(x=>/Clinical Trial, Phase III|Randomized Controlled Trial/i.test(x))||/\brandomi[sz]ed\b/.test(both)) level="controlled_human";
  else if(scope==="animal") level="preclinical";
  if(scope==="unknown"&&level!=="unknown"&&level!=="preclinical") scope="human";
  return {pmid,title,pubtypes,mesh,abstract:abs,doi,relations:rel,status,scope,level,url:"https://pubmed.ncbi.nlm.nih.gov/"+pmid+"/"};
}

async function pubmedSearch(term,retmax=120){
  const u="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=pub+date&retmax="+retmax+"&term="+encodeURIComponent(term);
  const j=await request(u,{json:true});
  return j?.esearchresult?.idlist??[];
}
async function pubmedFetch(id){
  const xml=await request("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id="+encodeURIComponent(id)+"&retmode=xml");
  await wait(340);
  return parsePubmed(xml);
}
async function pubmedMany(term,count,predicate){
  const ids=await pubmedSearch(term);
  const out=[];
  for(const id of ids){
    if(out.length>=count) break;
    if(seen.has("pmid:"+id)) continue;
    const r=await pubmedFetch(id);
    if(r&&(!predicate||predicate(r))) out.push(r);
  }
  return out;
}

function addCase(family,candidate,labels,evidence,{notes=null,relations=null,claim=null}={}){
  const key=candidate.signal_kind.toLowerCase()+":"+candidate.raw_value.toLowerCase();
  if(seen.has(key)) return false;
  seen.add(key);
  const id="FE03-EXT-"+String(9000+cases.length+1).padStart(4,"0");
  const item={id,split:"validation",case_family:family,candidate,labels,label_evidence:evidence};
  if(notes) item.notes=notes;
  if(relations?.length) item.relations=relations;
  cases.push(item);
  if(claim?.exact_text){
    claimPool.push({external_case_id:id,...claim});
  }
  return true;
}
const ev=(authority,url,supports)=>[{authority,url,checked_on:CHECKED_ON,supports}];
const pubCandidate=r=>({signal_kind:"pmid",raw_value:r.pmid,origin:"pubmed"});
const labelsFor=(r,critical=false)=>({primary_source_resolvable:true,publication_status:r.status,critical_safety_case:critical,expected_subject_scope:r.scope,expected_evidence_level:r.level});

function sentence(text){
  const parts=String(text??"").split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=30&&x.length<=240);
  const ranked=parts.map(s=>({s,score:
    (/\b(significant|reduced|increased|improved|lower|higher|associated|noninferior|no difference|did not|showed|found|resulted)\b/i.test(s)?4:0)+
    (/\d/.test(s)?1:0)-
    (/^(background|objective|aim|purpose)\b/i.test(s)?2:0)
  })).sort((a,b)=>b.score-a.score);
  return ranked[0]?.s??null;
}
function claimKind(family,text){
  if(family==="negative_result"||/\b(no significant|did not|no difference|not significant)\b/i.test(text)) return "negative_result";
  if(family==="technology_benchmark") return "performance";
  if(family==="real_world_deployment") return "deployment";
  return "result";
}
function claimMeta(family,sourceText,authority,url,scope){
  const exact=sentence(sourceText); if(!exact) return null;
  return {exact_text:exact,authority,url,subject_scope:scope,claim_kind:claimKind(family,exact)};
}

const publicCorpus=JSON.parse(await readFile("benchmarks/fe03/external/dev-validation.seed.json","utf8"));
for(const x of publicCorpus) seen.add(String(x.candidate.signal_kind).toLowerCase()+":"+String(x.candidate.raw_value).toLowerCase());
for(const x of publicCorpus) for(const r of x.relations??[]) seen.add(String(r.candidate.signal_kind).toLowerCase()+":"+String(r.candidate.raw_value).toLowerCase());

const active=await pubmedMany("2025:2026[pdat] AND Journal Article[pt] NOT Review[pt] NOT Retracted Publication[pt]",7,r=>r.status==="active"&&r.abstract.length>80);
for(const r of active.slice(0,5)) addCase("active_peer_reviewed",pubCandidate(r),labelsFor(r,false),ev("pubmed",r.url,["identifier","current_publication_status"]),{claim:claimMeta("active_peer_reviewed",r.abstract,"pubmed",r.url,r.scope)});

const retracted=await pubmedMany("Retracted Publication[pt] AND 2020:2026[pdat]",5,r=>r.status==="retracted");
for(const r of retracted.slice(0,4)) addCase("retracted_publication",pubCandidate(r),labelsFor(r,true),ev("pubmed",r.url,["identifier","retracted_publication"]),{claim:claimMeta("retracted_publication",r.abstract,"pubmed",r.url,r.scope)});

const notices=await pubmedMany("(Retraction of Publication[pt] OR Retraction Notice[pt]) AND 2020:2026[pdat]",5,r=>r.status==="active");
for(const r of notices.slice(0,3)) addCase("retraction_notice",pubCandidate(r),{primary_source_resolvable:true,publication_status:"active",critical_safety_case:false,expected_subject_scope:"unknown",expected_evidence_level:"unknown"},ev("pubmed",r.url,["identifier","retraction_notice"]));

async function originalsFromNotices(query,refRegex,count,expectedStatus,family){
  const ids=await pubmedSearch(query,80); const out=[];
  for(const id of ids){
    if(out.length>=count) break;
    const notice=await pubmedFetch(id); if(!notice) continue;
    const refs=notice.relations.filter(r=>refRegex.test(r.type)).map(r=>r.pmid);
    for(const rid of refs){
      if(out.length>=count) break;
      if(seen.has("pmid:"+rid)) continue;
      const orig=await pubmedFetch(rid);
      if(orig?.status===expectedStatus) out.push(orig);
    }
  }
  for(const r of out) addCase(family,pubCandidate(r),labelsFor(r,true),ev("pubmed",r.url,["identifier",expectedStatus]));
}
await originalsFromNotices("Published Erratum[pt] AND 2024:2026[pdat]",/ErratumFor/i,3,"corrected","corrected_publication");
await originalsFromNotices("Expression of Concern[pt] AND 2020:2026[pdat]",/ExpressionOfConcernFor/i,3,"expression_of_concern","expression_of_concern");

for(let i=0;i<5;i++){
  const bad=i<3?"10.99999/future-edition-hidden-"+String(700+i):"99999"+String(100+i);
  const kind=i<3?"doi":"pmid";
  addCase("invalid_identifier",{signal_kind:kind,raw_value:bad,origin:"benchmark_design"},{primary_source_resolvable:false,publication_status:"unresolved",critical_safety_case:true,expected_subject_scope:"unknown",expected_evidence_level:"unknown"},ev("benchmark_design",null,["deterministic_invalid_identifier"]));
}

const animals=await pubmedMany("2025:2026[pdat] AND Animals[MeSH Terms] NOT Humans[MeSH Terms]",8,r=>r.status==="active"&&r.scope==="animal"&&r.abstract.length>80);
for(const r of animals.slice(0,5)) addCase("animal_only",pubCandidate(r),{...labelsFor(r,true),expected_subject_scope:"animal",expected_evidence_level:"preclinical"},ev("pubmed",r.url,["identifier","animal_only"]),{claim:claimMeta("animal_only",r.abstract,"pubmed",r.url,"animal")});

const early=await pubmedMany("2024:2026[pdat] AND (Clinical Trial, Phase I[pt] OR Clinical Trial, Phase II[pt])",7,r=>r.status==="active"&&r.level==="early_human"&&r.abstract.length>80);
for(const r of early.slice(0,4)) addCase("early_human",pubCandidate(r),{...labelsFor(r,true),expected_subject_scope:"human",expected_evidence_level:"early_human"},ev("pubmed",r.url,["identifier","phase_i_or_ii"]),{claim:claimMeta("early_human",r.abstract,"pubmed",r.url,"human")});

const controlled=await pubmedMany("2025:2026[pdat] AND Randomized Controlled Trial[pt] AND Humans[MeSH Terms]",9,r=>r.status==="active"&&r.level==="controlled_human"&&r.abstract.length>80);
for(const r of controlled.slice(0,5)) addCase("controlled_human",pubCandidate(r),{...labelsFor(r,false),expected_subject_scope:"human",expected_evidence_level:"controlled_human"},ev("pubmed",r.url,["identifier","randomized_controlled_trial"]),{claim:claimMeta("controlled_human",r.abstract,"pubmed",r.url,"human")});

const reviews=await pubmedMany("2025:2026[pdat] AND (Systematic Review[pt] OR Meta-Analysis[pt])",7,r=>r.status==="active"&&r.level==="replicated_human"&&r.abstract.length>80);
for(const r of reviews.slice(0,4)) addCase("systematic_review",pubCandidate(r),{...labelsFor(r,false),expected_subject_scope:"human",expected_evidence_level:"replicated_human"},ev("pubmed",r.url,["identifier","systematic_review"]),{claim:claimMeta("systematic_review",r.abstract,"pubmed",r.url,"human")});

const neg=await pubmedMany('2024:2026[pdat] AND Randomized Controlled Trial[pt] AND ("no significant difference"[Title/Abstract] OR "did not improve"[Title/Abstract] OR "not significantly"[Title/Abstract])',8,r=>r.status==="active"&&r.abstract.length>80);
for(const r of neg.slice(0,4)) addCase("negative_result",pubCandidate(r),{...labelsFor(r,true),expected_subject_scope:r.scope==="unknown"?"human":r.scope,expected_evidence_level:r.level==="unknown"?"controlled_human":r.level},ev("pubmed",r.url,["identifier","negative_result_language"]),{claim:claimMeta("negative_result",r.abstract,"pubmed",r.url,r.scope==="unknown"?"human":r.scope)});

for(const r of [...controlled,...active].filter(x=>x.doi).slice(0,3)){
  const relation={relation_type:"same_primary_origin",candidate:{signal_kind:"doi",raw_value:r.doi,origin:"crossref"},basis:["PMID and DOI identify the same publication"]};
  addCase("dependent_echo",pubCandidate(r),labelsFor(r,true),ev("pubmed",r.url,["identifier","same_publication_doi"]),{relations:[relation],claim:claimMeta("dependent_echo",r.abstract,"pubmed",r.url,r.scope)});
}

async function rxivCases(){
  const dates=[["2026-06-01","2026-09-20"],["2026-01-01","2026-05-31"]];
  const out=[];
  for(const [a,b] of dates){
    for(let cursor=0;cursor<300&&out.length<8;cursor+=100){
      let j;
      try{j=await request("https://api.biorxiv.org/details/medrxiv/"+a+"/"+b+"/"+cursor+"/json",{json:true});}catch{break;}
      for(const r of j?.collection??[]){
        const doi=String(r.doi??"").toLowerCase(); if(!doi||seen.has("medrxiv:"+doi)) continue;
        const text=(String(r.title??"")+" "+String(r.abstract??"")).toLowerCase();
        if(!/\b(randomi[sz]ed|phase\s*(?:1|i|2|ii|3|iii)|trial)\b/.test(text)) continue;
        const early=/\bphase\s*(?:1|i|2a?|ii)\b/.test(text);
        out.push({doi,title:r.title,abstract:r.abstract,url:"https://www.medrxiv.org/content/"+doi,level:early?"early_human":"controlled_human"});
        if(out.length>=8) break;
      }
    }
  }
  return out;
}
for(const r of (await rxivCases()).slice(0,4)){
  addCase("preprint",{signal_kind:"medrxiv",raw_value:r.doi,origin:"medrxiv"},{primary_source_resolvable:true,publication_status:"active",critical_safety_case:true,expected_subject_scope:"human",expected_evidence_level:r.level},ev("medrxiv",r.url,["identifier","preprint","human_trial"]),{claim:claimMeta("preprint",r.abstract,"medrxiv",r.url,"human")});
}

async function trialCases(){
  const url="https://clinicaltrials.gov/api/v2/studies?query.term="+encodeURIComponent("AREA[Phase]PHASE3")+"&pageSize=50&format=json";
  const j=await request(url,{json:true}); const out=[];
  for(const s of j?.studies??[]){
    const id=s?.protocolSection?.identificationModule?.nctId; if(!id||seen.has("nct:"+id.toLowerCase())) continue;
    const desc=s?.protocolSection?.descriptionModule?.briefSummary??"";
    const title=s?.protocolSection?.identificationModule?.briefTitle??id;
    out.push({id,title,desc});
    if(out.length>=6) break;
  }
  return out;
}
for(const r of (await trialCases()).slice(0,4)){
  const url="https://clinicaltrials.gov/study/"+r.id;
  addCase("trial_registry",{signal_kind:"nct",raw_value:r.id,origin:"clinicaltrials"},{primary_source_resolvable:true,publication_status:"active",critical_safety_case:true,expected_subject_scope:"human",expected_evidence_level:"controlled_human"},ev("clinicaltrials",url,["identifier","phase_3_registry"]),{claim:claimMeta("trial_registry",r.desc,"clinicaltrials",url,"human")});
}

async function arxivCases(){
  const q='all:benchmark AND (cat:cs.AI OR cat:cs.LG OR cat:cs.CV)';
  const xml=await request("https://export.arxiv.org/api/query?search_query="+encodeURIComponent(q)+"&start=0&max_results=30&sortBy=submittedDate&sortOrder=descending");
  const out=[];
  for(const e of blocks(xml,"entry")){
    const id=textOf(e.inner,"id").split("/abs/").pop()?.replace(/v\d+$/,"");
    const title=textOf(e.inner,"title"), summary=textOf(e.inner,"summary");
    if(id&&title&&summary&&!seen.has("arxiv:"+id.toLowerCase())&&/benchmark/i.test(title+" "+summary)) out.push({id,title,summary,url:"https://arxiv.org/abs/"+id});
  }
  return out;
}
for(const r of (await arxivCases()).slice(0,3)){
  addCase("technology_benchmark",{signal_kind:"arxiv",raw_value:r.id,origin:"arxiv"},{primary_source_resolvable:true,publication_status:"active",critical_safety_case:false,expected_subject_scope:"technology",expected_evidence_level:"technology_demo"},ev("arxiv",r.url,["identifier","technology_benchmark"]),{claim:claimMeta("technology_benchmark",r.summary,"arxiv",r.url,"technology")});
}

async function nhsCases(){
  const links=[]; const seenUrl=new Set();
  for(let page=1;page<=4;page++){
    const url=page===1?"https://www.england.nhs.uk/category/digital/":"https://www.england.nhs.uk/category/digital/page/"+page+"/";
    let html; try{html=await request(url);}catch{continue;}
    const re=/<a\b[^>]*href=["'](https:\/\/www\.england\.nhs\.uk\/2026\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
    while((m=re.exec(html))!==null){
      const href=m[1].split("#")[0]; const title=stripTags(m[2]);
      if(seenUrl.has(href)||seen.has("url:"+href.toLowerCase())) continue;
      if(!/\b(ai|artificial intelligence|digital|technology|copilot|virtual|app)\b/i.test(title)) continue;
      seenUrl.add(href); links.push({href,title});
    }
  }
  const out=[];
  for(const x of links){
    let html; try{html=await request(x.href);}catch{continue;}
    const body=stripTags(html);
    if(!/\b(rollout|rolled out|access|deployment|deployed|being given|introduced|launch)\b/i.test(body)) continue;
    out.push({...x,body});
    if(out.length>=5) break;
  }
  return out;
}
for(const r of (await nhsCases()).slice(0,3)){
  addCase("real_world_deployment",{signal_kind:"url",raw_value:r.href,origin:"nhs_england"},{primary_source_resolvable:true,publication_status:"active",critical_safety_case:false,expected_subject_scope:"technology",expected_evidence_level:"real_world"},ev("publisher",r.href,["official_nhs_page","real_world_deployment"]),{claim:claimMeta("real_world_deployment",r.body,"publisher",r.href,"technology")});
}

async function contradictionCases(){
  const topics=[
    '"vitamin D"[Title/Abstract] AND respiratory[Title/Abstract]',
    'exercise[Title/Abstract] AND depression[Title/Abstract]',
    'omega-3[Title/Abstract] AND depression[Title/Abstract]'
  ];
  const pairs=[];
  for(const topic of topics){
    const ids=await pubmedSearch("2018:2026[pdat] AND Randomized Controlled Trial[pt] AND "+topic,50);
    const pos=[],negative=[];
    for(const id of ids.slice(0,24)){
      const r=await pubmedFetch(id); if(!r||r.status!=="active"||!r.abstract) continue;
      if(/\b(no significant|did not improve|not significantly|no difference)\b/i.test(r.abstract)) negative.push(r);
      if(/\b(significantly (?:reduced|improved|lower|higher)|was effective|reduced the risk)\b/i.test(r.abstract)) pos.push(r);
    }
    if(pos[0]&&negative[0]&&pos[0].pmid!==negative[0].pmid) pairs.push([pos[0],negative[0],topic]);
    if(pairs.length>=2) break;
  }
  return pairs;
}
for(const [a,b,topic] of await contradictionCases()){
  if(seen.has("pmid:"+a.pmid)||seen.has("pmid:"+b.pmid)) continue;
  const relation={relation_type:"materially_conflicts",candidate:pubCandidate(b),basis:["Independent randomized records on the same topic were selected because their abstracts contain opposing result language",topic]};
  addCase("contradiction",pubCandidate(a),labelsFor(a,true),ev("pubmed",a.url,["identifier","independent_trial_record"]),{relations:[relation],claim:claimMeta("contradiction",a.abstract,"pubmed",a.url,a.scope)});
  seen.add("pmid:"+b.pmid);
}

if(cases.length<50) throw new Error("hidden holdout underfilled: "+cases.length);

const eligibleClaims=claimPool.filter(x=>x.exact_text&&x.exact_text.length<=240);
const annotations=[];
for(const x of eligibleClaims){
  if(annotations.length>=24) break;
  annotations.push({
    id:"FE03-CLAIM-"+String(9000+annotations.length+1).padStart(4,"0"),
    external_case_id:x.external_case_id,
    split:"validation",
    claim:{text:x.exact_text,claim_kind:x.claim_kind,subject_scope:x.subject_scope},
    gold_evidence:[{relation:"supports",exact_text:x.exact_text,authority:x.authority,url:x.url}],
    checked_on:CHECKED_ON,
    notes:"Hidden holdout claim generated from an exact authoritative passage after candidate freeze."
  });
}
if(annotations.length<15) throw new Error("hidden claim annotations underfilled: "+annotations.length);

const familyCounts={};
for(const x of cases) familyCounts[x.case_family]=(familyCounts[x.case_family]??0)+1;
const bundle={protocol:"FE03-HIDDEN-HOLDOUT-v1",created_after_candidate_freeze:true,candidate_sha:"d3aa028642bbfd78bdd334c1f8186f6eb5d58591",external_cases:cases,claim_annotations:annotations};
await writeFile("hidden-holdout.json",JSON.stringify(bundle,null,2)+"\n");
const sha=createHash("sha256").update(await readFile("hidden-holdout.json")).digest("hex");
console.log("FE03_HIDDEN_GENERATED|cases="+cases.length+"|claims="+annotations.length+"|families="+Object.keys(familyCounts).length+"|sha256="+sha);
console.log("FE03_HIDDEN_FAMILY_COUNTS|"+Object.entries(familyCounts).sort().map(([k,v])=>k+"="+v).join("|"));
