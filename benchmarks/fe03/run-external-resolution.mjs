import { readFile,writeFile } from "node:fs/promises";
import { evaluateExternalCases } from "./lib/external-evaluator.mjs";

const args=process.argv.slice(2);
const valueOf=prefix=>{
  const item=args.find(value=>value.startsWith(prefix));
  return item?item.slice(prefix.length):null;
};

const root=new URL("../../",import.meta.url);
const input=valueOf("--input=")??"benchmarks/fe03/external/dev-validation.seed.json";
const output=valueOf("--output=");
const mailto=valueOf("--mailto=");
const delayMs=Number(valueOf("--delay-ms=")??"100");
const enforce=args.includes("--enforce");

if(!Number.isFinite(delayMs)||delayMs<0) throw new Error("--delay-ms must be >= 0");

const cases=JSON.parse(await readFile(input,"utf8"));
const thresholds=JSON.parse(await readFile(new URL("benchmarks/fe03/thresholds.external.v1.json",root),"utf8"));
const result=await evaluateExternalCases(cases,{fetchFn:fetch,mailto,delayMs});

const t=thresholds.thresholds;
const checks={
  corpus_ready:cases.length>=thresholds.minimum_cases.dev_validation,
  no_transport_failures:result.execution.transport_failures===0,
  primary_source_precision:
    result.metrics.primary_source_precision!==null&&
    result.metrics.primary_source_precision>=t.primary_source_precision_min,
  primary_source_recall:
    result.metrics.primary_source_recall!==null&&
    result.metrics.primary_source_recall>=t.primary_source_recall_min,
  publication_status_precision:
    result.metrics.publication_status_precision!==null&&
    result.metrics.publication_status_precision>=t.publication_status_precision_min,
  evidence_level_precision:
    result.metrics.evidence_level_precision!==null&&
    result.metrics.evidence_level_precision>=t.evidence_level_precision_min,
  source_independence_precision:
    result.metrics.source_independence_precision!==null&&
    result.metrics.source_independence_precision>=t.source_independence_precision_min
};

const report={
  ...result,
  thresholds:t,
  checks,
  resolution_gate_pass:Object.values(checks).every(Boolean),
  full_fe03_gate_eligible:false,
  full_fe03_gate_blockers:[
    "claim_evidence_precision not yet measured on real content",
    "critical_false_confirmed_rate not yet measured on external EvidenceDossiers",
    "known_retracted_confirmed not yet measured on external EvidenceDossiers",
    "sealed holdout must remain unconsumed until all public dev+validation work is frozen"
  ]
};

const rendered=JSON.stringify(report,null,2)+"\n";
process.stdout.write(rendered);

if(output) await writeFile(output,rendered,"utf8");

console.log(
  "FE03_EXTERNAL_RESOLUTION_REPORT|cases="+report.cases+
  "|precision="+String(report.metrics.primary_source_precision)+
  "|recall="+String(report.metrics.primary_source_recall)+
  "|status="+String(report.metrics.publication_status_precision)+
  "|evidence_level="+String(report.metrics.evidence_level_precision)+
  "|independence="+String(report.metrics.source_independence_precision)+
  "|transport_failures="+report.execution.transport_failures+
  "|unsupported="+report.execution.unsupported_routes+
  "|resolution_gate_pass="+Number(report.resolution_gate_pass)+
  "|full_fe03_gate_eligible=0"
);

if(enforce&&!report.resolution_gate_pass) process.exit(1);
