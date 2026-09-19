import { readFile } from "node:fs/promises";
import { validateSchema } from "../../pipeline/lib/schema-validator.mjs";

const root=new URL("../../",import.meta.url);
const cases=JSON.parse(await readFile(new URL("benchmarks/fe03/external/dev-validation.seed.json",root),"utf8"));
const schema=JSON.parse(await readFile(new URL("benchmarks/fe03/external-case.schema.json",root),"utf8"));
const errors=[];
const ids=new Set();

for(let index=0;index<cases.length;index++){
  const item=cases[index];
  errors.push(...validateSchema(item,schema,"case["+index+"]"));

  if(ids.has(item.id)) errors.push("duplicate id: "+item.id);
  ids.add(item.id);

  if(!item.label_evidence?.length){
    errors.push(item.id+": no label evidence");
  }

  if(item.labels.critical_safety_case&&item.case_family!=="invalid_identifier"){
    const externalEvidence=item.label_evidence.some(evidence=>evidence.authority!=="benchmark_design"&&evidence.url);
    if(!externalEvidence) errors.push(item.id+": critical case lacks external authority evidence");
  }
}

if(errors.length){
  console.error("FE03_EXTERNAL_SEED_INVALID");
  for(const error of errors) console.error("- "+error);
  process.exit(1);
}

console.log(
  "FE03_EXTERNAL_SEED_VALID|cases="+cases.length+
  "|critical="+cases.filter(item=>item.labels.critical_safety_case).length+
  "|evidence_links="+cases.reduce((n,item)=>n+item.label_evidence.length,0)
);
