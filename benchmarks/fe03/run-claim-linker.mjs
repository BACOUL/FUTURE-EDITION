import { readFile } from "node:fs/promises";
import { resolveCandidate } from "../../pipeline/lib/source-resolver.mjs";
import { linkClaimToDocument } from "../../pipeline/lib/claim-linker.mjs";
import { stampVerifiedClaimEvidence } from "../../pipeline/lib/evidence-locator.mjs";
import {
  buildDossier,
  finalizeHumanConfirmation
} from "../../pipeline/lib/evidence-engine.mjs";

const args=process.argv.slice(2);
const valueOf=prefix=>{
  const item=args.find(value=>value.startsWith(prefix));
  return item?item.slice(prefix.length):null;
};

const root=new URL("../../",import.meta.url);
const annotationPath=valueOf("--annotations=")??"benchmarks/fe03/claims/dev-validation.seed.json";
const externalPath=valueOf("--external=")??"benchmarks/fe03/external/dev-validation.seed.json";
const mailto=valueOf("--mailto=");
const delayMs=Number(valueOf("--delay-ms=")??"100");
const minScore=Number(valueOf("--min-score=")??"0.12");

if(!Number.isFinite(delayMs)||delayMs<0) throw new Error("--delay-ms must be >= 0");
if(!Number.isFinite(minScore)||minScore<0||minScore>1) throw new Error("--min-score must be between 0 and 1");

const annotations=JSON.parse(await readFile(annotationPath,"utf8"));
const externalCases=JSON.parse(await readFile(externalPath,"utf8"));
const thresholds=JSON.parse(await readFile(new URL("benchmarks/fe03/thresholds.external.v1.json",root),"utf8"));
const externalById=new Map(externalCases.map(item=>[item.id,item]));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const normalize=value=>String(value??"").toLowerCase().replace(/\s+/g," ").trim();

let predictions=0;
let correct=0;
let critical=0;
let unsafeConfirmed=0;
let transportFailures=0;
let documentsAvailable=0;
const details=[];

for(let index=0;index<annotations.length;index++){
  const annotation=annotations[index];
  const external=externalById.get(annotation.external_case_id);
  if(!external) throw new Error("unknown external case "+annotation.external_case_id);

  const candidate={
    id:"CAND-"+String(index+1).padStart(6,"0"),
    ...external.candidate
  };

  const resolved=await resolveCandidate(candidate,{fetchFn:fetch,mailto});

  if(delayMs>0) await wait(delayMs);

  if(["network_error","http_429","http_500","http_502","http_503","http_504"].includes(resolved?.reason)){
    transportFailures++;
  }

  const document=resolved?.document??null;
  if(document) documentsAvailable++;

  const linked=document?linkClaimToDocument(annotation.claim.text,document,{minScore}):null;
  if(linked) predictions++;

  const goldTexts=(annotation.gold_evidence??[]).map(item=>normalize(item.exact_text));
  const predictedText=normalize(linked?.excerpt);
  const evidenceCorrect=Boolean(
    linked&&goldTexts.some(gold=>predictedText.includes(gold)||gold.includes(predictedText))
  );
  if(evidenceCorrect) correct++;

  let confirmation=null;
  let safety=null;

  if(linked&&resolved?.status==="resolved"&&resolved?.source&&document){
    const claimDrafts=stampVerifiedClaimEvidence(document,[{
      text:annotation.claim.text,
      claim_kind:annotation.claim.claim_kind,
      subject_scope:annotation.claim.subject_scope,
      evidence:[{
        locator:linked.locator,
        excerpt_hash:linked.excerpt_hash,
        support:"supports"
      }]
    }]);

    const dossier=buildDossier({
      id:"DOS-"+String(index+1).padStart(6,"0"),
      candidate,
      resolution:{
        status:resolved.status,
        provider:resolved.provider,
        reason:resolved.reason??null
      },
      source:resolved.source,
      publication_status:resolved.publication_status,
      claimDrafts,
      relatedSources:[resolved.source],
      contradictions:[],
      limitations:[],
      integrity_relations:resolved.integrity_relations??[],
      observed_at:document.retrieved_at
    });

    safety=dossier.safety;
    confirmation=finalizeHumanConfirmation(dossier,{approved:true});
  }

  if(external.labels?.critical_safety_case===true){
    critical++;
    if(confirmation?.confirmed===true) unsafeConfirmed++;
  }

  details.push({
    id:annotation.id,
    external_case_id:annotation.external_case_id,
    provider:resolved?.provider??null,
    resolution_status:resolved?.status??"unknown",
    document_available:Boolean(document),
    prediction:Boolean(linked),
    prediction_score:linked?.score??null,
    prediction_excerpt:linked?.excerpt??null,
    evidence_correct:evidenceCorrect,
    safety_decision:safety?.decision??null,
    confirmed:confirmation?.confirmed??false,
    confirmation_reasons:confirmation?.reasons??[]
  });
}

const ratio=(a,b)=>b===0?null:a/b;
const metrics={
  claim_evidence_precision:ratio(correct,predictions),
  claim_evidence_recall:ratio(correct,annotations.length),
  critical_false_confirmed_rate:ratio(unsafeConfirmed,critical)
};

const minimumPublicClaimAnnotations=50;
const checks={
  transport_clean:transportFailures===0,
  documents_complete:documentsAvailable===annotations.length,
  claim_annotation_scale:annotations.length>=minimumPublicClaimAnnotations,
  claim_evidence_precision:
    metrics.claim_evidence_precision!==null&&
    metrics.claim_evidence_precision>=thresholds.thresholds.claim_evidence_precision_min,
  critical_false_confirmed_rate:
    metrics.critical_false_confirmed_rate!==null&&
    metrics.critical_false_confirmed_rate<=thresholds.thresholds.critical_false_confirmed_rate_max
};

const report={
  protocol:"external-v1-claim-sidecar",
  annotations:annotations.length,
  minimum_public_claim_annotations:minimumPublicClaimAnnotations,
  predictions,
  correct,
  critical_cases:critical,
  unsafe_confirmed:unsafeConfirmed,
  transport_failures:transportFailures,
  documents_available:documentsAvailable,
  metrics,
  checks,
  gate_eligible:Object.values(checks).every(Boolean),
  full_fe03_gate_eligible:false,
  blockers:[
    "public claim annotation sidecar must reach at least 50 reviewed claims",
    "atomic claim extraction remains unmeasured; this runner evaluates claim-to-evidence linking only",
    "external dev+validation corpus must reach 150 cases",
    "sealed holdout remains unconsumed"
  ],
  details
};

console.log(JSON.stringify(report,null,2));
console.log(
  "FE03_CLAIM_LINK_REPORT|annotations="+report.annotations+
  "|documents="+report.documents_available+
  "|predictions="+report.predictions+
  "|precision="+String(report.metrics.claim_evidence_precision)+
  "|recall="+String(report.metrics.claim_evidence_recall)+
  "|critical_fcr="+String(report.metrics.critical_false_confirmed_rate)+
  "|transport_failures="+report.transport_failures+
  "|gate_eligible="+Number(report.gate_eligible)+
  "|full_fe03_gate_eligible=0"
);
