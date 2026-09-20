import { readFile } from "node:fs/promises";
import { resolveCandidate } from "../../pipeline/lib/source-resolver.mjs";
import { extractAtomicClaims } from "../../pipeline/lib/claim-extractor.mjs";
import { verifyClaimEvidenceLocators } from "../../pipeline/lib/evidence-locator.mjs";

const args=process.argv.slice(2);
const valueOf=prefix=>{
  const item=args.find(value=>value.startsWith(prefix));
  return item?item.slice(prefix.length):null;
};
const annotations=JSON.parse(await readFile(valueOf("--annotations=")??"benchmarks/fe03/claims/dev-validation.seed.json","utf8"));
const external=JSON.parse(await readFile(valueOf("--external=")??"benchmarks/fe03/external/dev-validation.seed.json","utf8"));
const thresholds=JSON.parse(await readFile("benchmarks/fe03/thresholds.atomic.v1.json","utf8"));
const delayMs=Number(valueOf("--delay-ms=")??"400");
const byId=new Map(external.map(x=>[x.id,x]));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const norm=value=>String(value??"").toLowerCase().normalize("NFKD")
  .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
  .replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/&nbsp;|&#xa0;/gi," ")
  .replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();

function overlap(a,b){
  const aa=new Set(norm(a).split(" ").filter(Boolean));
  const bb=new Set(norm(b).split(" ").filter(Boolean));
  if(!aa.size||!bb.size) return 0;
  let hit=0; for(const t of aa) if(bb.has(t)) hit++;
  return hit/Math.min(aa.size,bb.size);
}

let covered=0,transportFailures=0,totalClaims=0,verified=0,machineProposed=0,documents=0;
const details=[];
for(let i=0;i<annotations.length;i++){
  const ann=annotations[i];
  const ext=byId.get(ann.external_case_id);
  const candidate={id:"CAND-"+String(i+1).padStart(6,"0"),...ext.candidate};
  const resolved=await resolveCandidate(candidate,{fetchFn:fetch});
  if(delayMs>0) await wait(delayMs);
  if(["network_error","http_429","http_500","http_502","http_503","http_504"].includes(resolved?.reason)) transportFailures++;
  const document=resolved?.document??null;
  if(!document){
    details.push({id:ann.id,covered:false,reason:resolved?.reason??"no_document"});
    continue;
  }
  documents++;
  const claims=extractAtomicClaims(document,{source:resolved.source});
  totalClaims+=claims.length;
  machineProposed+=claims.filter(x=>x.review_state==="machine_proposed").length;
  const locatorCheck=verifyClaimEvidenceLocators(document,claims);
  if(locatorCheck.ok) verified+=claims.length;

  const gold=(ann.gold_evidence??[]).map(x=>x.exact_text);
  let best=0;
  for(const claim of claims){
    for(const g of gold){
      const a=norm(claim.text),b=norm(g);
      const exact=a.includes(b)||b.includes(a);
      best=Math.max(best,exact?1:overlap(claim.text,g));
    }
  }
  const ok=best>=0.72;
  if(ok) covered++;
  details.push({id:ann.id,covered:ok,best_overlap:Number(best.toFixed(4)),claims:claims.length});
}

const ratio=(a,b)=>b? a/b:null;
const metrics={
  gold_passage_recall:ratio(covered,annotations.length),
  verified_locator_rate:ratio(verified,totalClaims),
  machine_proposed_rate:ratio(machineProposed,totalClaims)
};
const t=thresholds.thresholds;
const checks={
  transport_clean:transportFailures===0,
  documents_complete:documents===annotations.length,
  gold_passage_recall:metrics.gold_passage_recall!==null&&metrics.gold_passage_recall>=t.gold_passage_recall_min,
  verified_locator_rate:metrics.verified_locator_rate===1,
  machine_proposed_rate:metrics.machine_proposed_rate===1
};
const report={protocol:"atomic-v1",annotations:annotations.length,documents,total_claims:totalClaims,transport_failures:transportFailures,metrics,checks,gate_eligible:Object.values(checks).every(Boolean),details};
console.log(JSON.stringify(report,null,2));
console.log("FE03_ATOMIC_EXTRACTION_REPORT|annotations="+annotations.length+"|documents="+documents+"|claims="+totalClaims+"|recall="+String(metrics.gold_passage_recall)+"|locator_rate="+String(metrics.verified_locator_rate)+"|machine_proposed="+String(metrics.machine_proposed_rate)+"|transport_failures="+transportFailures+"|gate_eligible="+Number(report.gate_eligible));
if(!report.gate_eligible) process.exit(1);
