import { readFile } from "node:fs/promises";

const root=new URL("../../",import.meta.url);
const matrix=JSON.parse(await readFile(new URL("benchmarks/fe03/collection-matrix.external.v1.json",root),"utf8"));
const thresholds=JSON.parse(await readFile(new URL("benchmarks/fe03/thresholds.external.v1.json",root),"utf8"));

const requiredFamilies=[
  "active_peer_reviewed",
  "preprint",
  "retracted_publication",
  "retraction_notice",
  "corrected_publication",
  "expression_of_concern",
  "invalid_identifier",
  "animal_only",
  "early_human",
  "controlled_human",
  "systematic_review",
  "trial_registry",
  "dependent_echo",
  "contradiction",
  "negative_result",
  "technology_benchmark",
  "real_world_deployment"
];

const allowedAuthorities=new Set([
  "pubmed","crossref","clinicaltrials","medrxiv","biorxiv","arxiv",
  "publisher","regulator","benchmark_design"
]);

const errors=[];
const rows=Array.isArray(matrix.families)?matrix.families:[];
const seen=new Set();

if(matrix.version!==thresholds.version) errors.push("matrix version does not match frozen thresholds");
if(matrix.dev_target!==100) errors.push("dev target must remain 100");
if(matrix.validation_target!==50) errors.push("validation target must remain 50");
if(matrix.dev_validation_target!==thresholds.minimum_cases.dev_validation){
  errors.push("dev+validation target does not match frozen threshold");
}
if(matrix.sealed_holdout_minimum!==thresholds.minimum_cases.sealed_holdout){
  errors.push("holdout minimum does not match frozen threshold");
}

let dev=0;
let validation=0;

for(const row of rows){
  if(seen.has(row.family)) errors.push("duplicate family: "+row.family);
  seen.add(row.family);

  if(!Number.isInteger(row.dev)||row.dev<1) errors.push(row.family+": invalid dev target");
  if(!Number.isInteger(row.validation)||row.validation<1) errors.push(row.family+": invalid validation target");
  if(typeof row.critical!=="boolean") errors.push(row.family+": critical flag missing");
  if(!Array.isArray(row.preferred_authorities)||row.preferred_authorities.length===0){
    errors.push(row.family+": preferred authorities missing");
  }else{
    for(const authority of row.preferred_authorities){
      if(!allowedAuthorities.has(authority)) errors.push(row.family+": unsupported authority "+authority);
    }
  }

  dev+=Number(row.dev)||0;
  validation+=Number(row.validation)||0;
}

for(const family of requiredFamilies){
  if(!seen.has(family)) errors.push("missing required family: "+family);
}
for(const family of seen){
  if(!requiredFamilies.includes(family)) errors.push("unexpected family: "+family);
}

if(dev!==matrix.dev_target) errors.push("dev family sum mismatch: "+dev);
if(validation!==matrix.validation_target) errors.push("validation family sum mismatch: "+validation);
if(dev+validation!==matrix.dev_validation_target) errors.push("combined family sum mismatch: "+(dev+validation));
if((dev+validation)+matrix.sealed_holdout_minimum<thresholds.minimum_cases.total){
  errors.push("matrix cannot reach frozen total minimum");
}

if(errors.length){
  console.error("FE03_COLLECTION_MATRIX_INVALID");
  for(const error of errors) console.error("- "+error);
  process.exit(1);
}

console.log(
  "FE03_COLLECTION_MATRIX_PASS|version="+matrix.version+
  "|families="+rows.length+
  "|dev="+dev+
  "|validation="+validation+
  "|holdout_min="+matrix.sealed_holdout_minimum+
  "|total_min="+((dev+validation)+matrix.sealed_holdout_minimum)
);
