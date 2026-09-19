import { readFile } from "node:fs/promises";

const root=new URL("../../",import.meta.url);
const matrix=JSON.parse(await readFile(new URL("benchmarks/fe03/collection-matrix.external.v1.json",root),"utf8"));
const plan=JSON.parse(await readFile(new URL("benchmarks/fe03/acquisition-plan.external.v1.json",root),"utf8"));

const errors=[];
const strategies=Array.isArray(plan.strategies)?plan.strategies:[];
const byFamily=new Map();

if(plan.version!==matrix.version) errors.push("acquisition plan version mismatch");
if(plan.auto_admit!==false) errors.push("auto_admit must remain false");
if(plan.human_label_required!==true) errors.push("human label gate missing");

for(const item of strategies){
  if(byFamily.has(item.family)) errors.push("duplicate acquisition strategy: "+item.family);
  byFamily.set(item.family,item);
  if(!item.mode) errors.push(item.family+": mode missing");
  if(!Array.isArray(item.providers)||item.providers.length===0) errors.push(item.family+": providers missing");
  if(item.collector!==null&&typeof item.collector!=="string") errors.push(item.family+": collector invalid");
}

for(const row of matrix.families){
  if(!byFamily.has(row.family)) errors.push("missing acquisition strategy: "+row.family);
}

for(const family of byFamily.keys()){
  if(!matrix.families.some(row=>row.family===family)) errors.push("strategy outside matrix: "+family);
}

const automated=strategies.filter(item=>item.collector).length;
const manual=strategies.filter(item=>!item.collector).length;

if(errors.length){
  console.error("FE03_ACQUISITION_PLAN_INVALID");
  for(const error of errors) console.error("- "+error);
  process.exit(1);
}

console.log(
  "FE03_ACQUISITION_PLAN_PASS|families="+strategies.length+
  "|automated="+automated+
  "|manual_or_deterministic="+manual+
  "|auto_admit=0|human_label_required=1"
);
