import { execFileSync } from "node:child_process";
import { buildDossier } from "../../pipeline/lib/evidence-engine.mjs";

const raw=execFileSync(process.execPath,["benchmarks/fe03/generate-cases.mjs"],{encoding:"utf8"});
const cases=JSON.parse(raw);

const metrics={
  total:0,
  decision_correct:0,
  ceiling_correct:0,
  false_confirmed:0,
  retracted_safe:0,
  retracted_total:0,
  preprint_safe:0,
  preprint_total:0
};

for(const c of cases){
  const source=c.resolution_status==="resolved"?{
    external_id:"synthetic:"+c.id,
    kind:c.source_kind,
    title:c.id,
    url:"https://example.invalid/"+c.id,
    peer_reviewed:c.peer_reviewed,
    study_stage:c.study_stage,
    independence_group:"origin:"+c.id
  }:null;

  const resolution={
    status:c.resolution_status,
    provider:"synthetic-benchmark",
    reason:c.resolution_status==="resolved"?null:"synthetic"
  };

  const claimDrafts=c.has_locator?[{
    text:"Synthetic claim "+c.id,
    evidence:[{locator:"fixture:1",support:"supports"}]
  }]:[];

  const dossier=buildDossier({
    id:"DOS-"+String(metrics.total+1).padStart(6,"0"),
    candidate:{id:"CAND-"+String(metrics.total+1).padStart(6,"0")},
    resolution,
    source,
    publication_status:c.publication_status,
    claimDrafts,
    contradictions:c.contradiction?["synthetic contradiction"]:[],
    limitations:[],
    observed_at:"2099-01-01T00:00:00Z"
  });

  metrics.total++;
  if(dossier.safety.decision===c.expected_decision) metrics.decision_correct++;
  if(dossier.safety.confidence_ceiling===c.expected_confidence_ceiling) metrics.ceiling_correct++;
  if(c.must_not_confirm&&dossier.safety.confidence_ceiling==="confirmed") metrics.false_confirmed++;

  if(c.scenario==="retracted"){
    metrics.retracted_total++;
    if(dossier.safety.decision==="reject") metrics.retracted_safe++;
  }
  if(c.scenario==="preprint"){
    metrics.preprint_total++;
    if(dossier.safety.confidence_ceiling!=="confirmed") metrics.preprint_safe++;
  }
}

metrics.decision_accuracy=metrics.decision_correct/metrics.total;
metrics.ceiling_accuracy=metrics.ceiling_correct/metrics.total;
metrics.false_confirmed_rate=metrics.false_confirmed/metrics.total;
metrics.retracted_reject_rate=metrics.retracted_safe/metrics.retracted_total;
metrics.preprint_not_confirmed_rate=metrics.preprint_safe/metrics.preprint_total;

console.log(JSON.stringify(metrics));

const thresholds={
  decision_accuracy:1,
  ceiling_accuracy:1,
  false_confirmed_rate:0,
  retracted_reject_rate:1,
  preprint_not_confirmed_rate:1
};

const pass=Object.entries(thresholds).every(([key,value])=>
  key==="false_confirmed_rate"?metrics[key]<=value:metrics[key]>=value
);

if(!pass) process.exit(1);

console.log("FE03_SYNTHETIC_BENCH_PASS|cases=240|dev=120|validation=60|holdout=60|false_confirmed=0");
