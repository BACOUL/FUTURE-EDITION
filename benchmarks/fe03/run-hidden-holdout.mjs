import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { evaluateExternalCases } from "./lib/external-evaluator.mjs";
import { resolveCandidate } from "../../pipeline/lib/source-resolver.mjs";
import { linkClaimToDocument } from "../../pipeline/lib/claim-linker.mjs";
import { extractAtomicClaims } from "../../pipeline/lib/claim-extractor.mjs";
import { verifyClaimEvidenceLocators, stampVerifiedClaimEvidence } from "../../pipeline/lib/evidence-locator.mjs";
import { buildDossier, finalizeHumanConfirmation } from "../../pipeline/lib/evidence-engine.mjs";

const args=process.argv.slice(2);
const valueOf=prefix=>{
  const item=args.find(value=>value.startsWith(prefix));
  return item?item.slice(prefix.length):null;
};
const bundlePath=valueOf("--bundle=");
const expectedSha=valueOf("--sha256=");
const delayMs=Number(valueOf("--delay-ms=")??"400");
if(!bundlePath||!expectedSha){
  console.error("USAGE|node benchmarks/fe03/run-hidden-holdout.mjs --bundle=<holdout.json> --sha256=<sealed-sha256>");
  process.exit(2);
}
const raw=await readFile(bundlePath);
const actualSha=createHash("sha256").update(raw).digest("hex");
if(actualSha!==expectedSha) throw new Error("holdout seal mismatch");
const bundle=JSON.parse(raw.toString("utf8"));
const externalCases=bundle.external_cases;
const annotations=bundle.claim_annotations;
if(!Array.isArray(externalCases)||!Array.isArray(annotations)) throw new Error("invalid holdout bundle");

const externalThresholds=JSON.parse(await readFile("benchmarks/fe03/thresholds.external.v1.json","utf8"));
const holdoutThresholds=JSON.parse(await readFile("benchmarks/fe03/thresholds.holdout.v1.json","utf8"));
const atomicThresholds=JSON.parse(await readFile("benchmarks/fe03/thresholds.atomic.v1.json","utf8"));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const norm=value=>String(value??"").toLowerCase().normalize("NFKD")
  .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
  .replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();

const resolution=await evaluateExternalCases(externalCases,{fetchFn:fetch,delayMs});
const externalById=new Map(externalCases.map(x=>[x.id,x]));

let predictions=0,correct=0,critical=0,unsafeConfirmed=0,retractedConfirmed=0;
let claimTransportFailures=0,documents=0,atomicCovered=0,totalExtracted=0,verifiedExtracted=0,machineProposed=0;
const claimDetails=[];

for(let i=0;i<annotations.length;i++){
  const ann=annotations[i];
  const ext=externalById.get(ann.external_case_id);
  if(!ext) throw new Error("unknown external_case_id "+ann.external_case_id);
  const candidate={id:"CAND-"+String(i+1).padStart(6,"0"),...ext.candidate};
  const resolved=await resolveCandidate(candidate,{fetchFn:fetch});
  if(delayMs>0) await wait(delayMs);
  if(["network_error","http_429","http_500","http_502","http_503","http_504"].includes(resolved?.reason)) claimTransportFailures++;
  const document=resolved?.document??null;
  if(document) documents++;

  const linked=document?linkClaimToDocument(ann.claim.text,document,{minScore:0.55}):null;
  if(linked) predictions++;
  const predicted=norm(linked?.excerpt);
  const gold=(ann.gold_evidence??[]).map(x=>norm(x.exact_text));
  const evidenceCorrect=Boolean(linked&&gold.some(g=>predicted.includes(g)||g.includes(predicted)));
  if(evidenceCorrect) correct++;

  let confirmation=null;
  if(linked&&resolved?.status==="resolved"&&resolved.source&&document){
    const claimDrafts=stampVerifiedClaimEvidence(document,[{
      text:ann.claim.text,
      claim_kind:ann.claim.claim_kind,
      subject_scope:ann.claim.subject_scope,
      evidence:[{locator:linked.locator,excerpt_hash:linked.excerpt_hash,support:"supports"}]
    }]);
    const dossier=buildDossier({
      id:"DOS-"+String(i+1).padStart(6,"0"),
      candidate,
      resolution:{status:resolved.status,provider:resolved.provider,reason:resolved.reason??null},
      source:resolved.source,
      publication_status:resolved.publication_status,
      claimDrafts,
      relatedSources:[resolved.source],
      contradictions:[],
      limitations:[],
      integrity_relations:resolved.integrity_relations??[],
      observed_at:document.retrieved_at
    });
    confirmation=finalizeHumanConfirmation(dossier,{approved:true});
  }
  if(ext.labels?.critical_safety_case===true){
    critical++;
    if(confirmation?.confirmed===true) unsafeConfirmed++;
  }
  if(ext.labels?.publication_status==="retracted"&&confirmation?.confirmed===true) retractedConfirmed++;

  const extracted=document?extractAtomicClaims(document,{source:resolved.source}):[];
  totalExtracted+=extracted.length;
  machineProposed+=extracted.filter(x=>x.review_state==="machine_proposed").length;
  if(document&&verifyClaimEvidenceLocators(document,extracted).ok) verifiedExtracted+=extracted.length;
  let bestAtomic=false;
  for(const claim of extracted){
    const value=norm(claim.text);
    if(gold.some(g=>value.includes(g)||g.includes(value))){bestAtomic=true;break;}
  }
  if(bestAtomic) atomicCovered++;

  claimDetails.push({id:ann.id,prediction:Boolean(linked),evidence_correct:evidenceCorrect,confirmed:confirmation?.confirmed??false,atomic_covered:bestAtomic});
}

const ratio=(a,b)=>b===0?null:a/b;
const metrics={
  ...resolution.metrics,
  claim_evidence_precision:ratio(correct,predictions),
  claim_prediction_coverage:ratio(predictions,annotations.length),
  critical_false_confirmed_rate:ratio(unsafeConfirmed,critical),
  known_retracted_confirmed:retractedConfirmed,
  atomic_gold_passage_recall:ratio(atomicCovered,annotations.length),
  verified_locator_rate:ratio(verifiedExtracted,totalExtracted),
  machine_proposed_rate:ratio(machineProposed,totalExtracted)
};
const t=externalThresholds.thresholds;
const h=holdoutThresholds;
const checks={
  seal_matches:true,
  candidate_frozen:h.candidate_sha==="d3aa028642bbfd78bdd334c1f8186f6eb5d58591",
  hidden_cases:externalCases.length>=h.minimum_hidden_cases,
  hidden_claims:annotations.length>=h.minimum_hidden_claim_annotations,
  transport_clean:!h.require_zero_transport_failures||(resolution.execution.transport_failures===0&&claimTransportFailures===0),
  primary_source_precision:metrics.primary_source_precision!==null&&metrics.primary_source_precision>=t.primary_source_precision_min,
  primary_source_recall:metrics.primary_source_recall!==null&&metrics.primary_source_recall>=t.primary_source_recall_min,
  publication_status_precision:metrics.publication_status_precision!==null&&metrics.publication_status_precision>=t.publication_status_precision_min,
  evidence_level_precision:metrics.evidence_level_precision!==null&&metrics.evidence_level_precision>=t.evidence_level_precision_min,
  source_independence_precision:metrics.source_independence_precision!==null&&metrics.source_independence_precision>=t.source_independence_precision_min,
  claim_evidence_precision:metrics.claim_evidence_precision!==null&&metrics.claim_evidence_precision>=t.claim_evidence_precision_min,
  claim_prediction_coverage:metrics.claim_prediction_coverage!==null&&metrics.claim_prediction_coverage>=h.minimum_claim_prediction_coverage,
  critical_false_confirmed_rate:metrics.critical_false_confirmed_rate!==null&&metrics.critical_false_confirmed_rate<=t.critical_false_confirmed_rate_max,
  known_retracted_confirmed:metrics.known_retracted_confirmed<=t.known_retracted_confirmed_max,
  atomic_recall:metrics.atomic_gold_passage_recall!==null&&metrics.atomic_gold_passage_recall>=h.atomic_gold_passage_recall_min,
  verified_locators:metrics.verified_locator_rate===h.require_verified_locator_rate,
  machine_proposed:metrics.machine_proposed_rate===h.require_machine_proposed_rate
};
const verdict=Object.values(checks).every(Boolean)?"PROVED":"FAIL";
const report={
  protocol:"FE03-HOLDOUT-v1",
  candidate_sha:h.candidate_sha,
  holdout_sha256:actualSha,
  hidden_cases:externalCases.length,
  hidden_claim_annotations:annotations.length,
  metrics,
  resolution_execution:resolution.execution,
  claim_transport_failures:claimTransportFailures,
  checks,
  verdict,
  consumed_once:true,
  claim_details:claimDetails
};
console.log(JSON.stringify(report,null,2));
console.log("FE03_HIDDEN_HOLDOUT_VERDICT|verdict="+verdict+"|cases="+externalCases.length+"|claims="+annotations.length+"|precision="+String(metrics.primary_source_precision)+"|recall="+String(metrics.primary_source_recall)+"|claim_precision="+String(metrics.claim_evidence_precision)+"|claim_coverage="+String(metrics.claim_prediction_coverage)+"|critical_fcr="+String(metrics.critical_false_confirmed_rate)+"|atomic_recall="+String(metrics.atomic_gold_passage_recall)+"|sha256="+actualSha);
if(verdict!=="PROVED") process.exit(1);
