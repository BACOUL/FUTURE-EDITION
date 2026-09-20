import { readFile } from "node:fs/promises";
import { parsePubmedXml } from "../../pipeline/adapters/pubmed-xml.mjs";
import { adapterByProvider } from "../../pipeline/adapters/normalize.mjs";
import { classifyEvidenceLevel } from "../../pipeline/lib/evidence-engine.mjs";

const wait=ms=>new Promise(r=>setTimeout(r,ms));
const UA="FutureEditionEvidenceDiagnostic/2.0 (+https://github.com/BACOUL/FUTURE-EDITION)";

async function request(url,{json=false,attempts=4}={}){
  let last=null;
  for(let i=0;i<attempts;i++){
    try{
      const res=await fetch(url,{headers:{"user-agent":UA,accept:json?"application/json":"application/xml,text/xml"}});
      last=res;
      if(res.ok) return json?res.json():res.text();
      if(![429,500,502,503,504].includes(res.status)) throw new Error("HTTP "+res.status+" "+url);
    }catch(error){ last=error; }
    await wait(500*Math.pow(2,i));
  }
  throw new Error("request failed: "+String(last?.status??last?.message??last));
}

async function search(term,retmax=100){
  const url="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax="+retmax+"&sort=pub+date&term="+encodeURIComponent(term);
  const payload=await request(url,{json:true});
  return payload?.esearchresult?.idlist??[];
}

async function fetchXml(id){
  const xml=await request("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id="+encodeURIComponent(id)+"&retmode=xml");
  await wait(360);
  return xml;
}

function blocks(xml,tag){
  const out=[];
  const re=new RegExp("<"+tag+"\\b[^>]*>([\\s\\S]*?)<\\/"+tag+">","gi");
  let m;
  while((m=re.exec(String(xml??"")))!==null) out.push(m[1].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());
  return out;
}

function rawMetadata(xml){
  const pubtypes=blocks(xml,"PublicationType");
  const mesh=blocks(xml,"DescriptorName");
  return {pubtypes,mesh};
}

function hasType(meta,re){ return meta.pubtypes.some(x=>re.test(x)); }
function hasMesh(meta,re){ return meta.mesh.some(x=>re.test(x)); }

function eligible(family,meta){
  const p1=hasType(meta,/Clinical Trial, Phase I$/i);
  const p2=hasType(meta,/Clinical Trial, Phase II$/i);
  const p3=hasType(meta,/Clinical Trial, Phase III$/i);
  const rct=hasType(meta,/Randomized Controlled Trial$/i);
  const sys=hasType(meta,/Systematic Review$|Meta-Analysis$/i);
  const humans=hasMesh(meta,/^Humans$/i);
  const animals=hasMesh(meta,/^(Animals|Mice|Rats|Rabbits|Swine|Dogs|Cats)$/i);

  if(family==="phase1") return p1&&!p2&&!p3;
  if(family==="phase2") return p2&&!p3;
  if(family==="phase3") return p3;
  if(family==="rct_nonphase") return rct&&!p1&&!p2&&!p3;
  if(family==="systematic_review") return sys;
  if(family==="animal_only") return animals&&!humans&&!p1&&!p2&&!p3&&!rct&&!sys;
  return false;
}

const goldByFamily={
  phase1:"early_human",
  phase2:"early_human",
  phase3:"controlled_human",
  rct_nonphase:"controlled_human",
  systematic_review:"replicated_human",
  animal_only:"preclinical"
};

const queries={
  phase1:"2017:2022[pdat] AND Clinical Trial, Phase I[pt]",
  phase2:"2017:2022[pdat] AND Clinical Trial, Phase II[pt]",
  phase3:"2017:2022[pdat] AND Clinical Trial, Phase III[pt]",
  rct_nonphase:"2017:2022[pdat] AND Randomized Controlled Trial[pt]",
  systematic_review:"2017:2022[pdat] AND (Systematic Review[pt] OR Meta-Analysis[pt])",
  animal_only:"2017:2022[pdat] AND Animals[MeSH Terms] NOT Humans[MeSH Terms] AND Journal Article[pt]"
};

const publicCases=JSON.parse(await readFile("benchmarks/fe03/external/dev-validation.seed.json","utf8"));
const excluded=new Set(publicCases.filter(x=>x?.candidate?.signal_kind==="pmid").map(x=>String(x.candidate.raw_value)));
const perFamily=12;
const rows=[];

for(const [family,query] of Object.entries(queries)){
  const ids=await search(query,120);
  let accepted=0;
  for(const id of ids){
    if(accepted>=perFamily) break;
    if(excluded.has(String(id))) continue;
    const xml=await fetchXml(id);
    const meta=rawMetadata(xml);
    if(!eligible(family,meta)) continue;

    const parsed=parsePubmedXml(xml);
    if(!parsed) continue;
    const normalized=adapterByProvider.pubmed(parsed);
    if(normalized?.status!=="resolved") continue;

    const predicted=classifyEvidenceLevel(normalized.source);
    const gold=goldByFamily[family];
    rows.push({
      pmid:String(id),
      family,
      gold,
      predicted,
      pass:gold===predicted,
      study_stage:normalized.source.study_stage,
      subject_scope:normalized.source.subject_scope,
      pubtypes:meta.pubtypes,
      title:parsed.title
    });
    accepted++;
  }
  if(accepted<perFamily) throw new Error("underfilled diagnostic family "+family+": "+accepted+"/"+perFamily);
}

const mismatches=rows.filter(x=>!x.pass);
const byFamily={};
for(const row of rows){
  const bucket=byFamily[row.family]??={cases:0,correct:0,mismatches:0};
  bucket.cases++;
  if(row.pass) bucket.correct++;
  else bucket.mismatches++;
}
const precision=rows.length?rows.filter(x=>x.pass).length/rows.length:null;

console.log(JSON.stringify({
  protocol:"FE03-EVIDENCE-DIAGNOSTIC-v2",
  independence_rule:"2017-2022 structured PubMed corpus; public 150 PMIDs excluded; consumed holdout not read or reused",
  cases:rows.length,
  correct:rows.length-mismatches.length,
  mismatches:mismatches.length,
  evidence_level_precision:precision,
  by_family:byFamily,
  mismatch_details:mismatches
},null,2));

console.log("FE03_EVIDENCE_DIAGNOSTIC|cases="+rows.length+"|correct="+(rows.length-mismatches.length)+"|mismatches="+mismatches.length+"|precision="+precision);
console.log("FE03_EVIDENCE_DIAGNOSTIC_FAMILIES|"+Object.entries(byFamily).map(([k,v])=>k+"="+v.correct+"/"+v.cases).join("|"));
