import { readFile } from "node:fs/promises";

const root=new URL("../../",import.meta.url);
const annotationPath=process.argv[2]??new URL("benchmarks/fe03/claims/dev-validation.seed.json",root);
const externalPath=process.argv[3]??new URL("benchmarks/fe03/external/dev-validation.seed.json",root);

const annotations=JSON.parse(await readFile(annotationPath,"utf8"));
const externalCases=JSON.parse(await readFile(externalPath,"utf8"));

if(!Array.isArray(annotations)||annotations.length===0) throw new Error("claim annotations must be a non-empty array");
if(!Array.isArray(externalCases)||externalCases.length===0) throw new Error("external cases missing");

const externalById=new Map(externalCases.map(item=>[item.id,item]));
const ids=new Set();
const externalIds=new Set();
const errors=[];

for(let index=0;index<annotations.length;index++){
  const item=annotations[index];
  const at="annotation["+index+"]";

  if(!/^FE03-CLAIM-[0-9]{4}$/.test(String(item.id??""))) errors.push(at+": invalid id");
  if(ids.has(item.id)) errors.push(at+": duplicate id "+item.id);
  ids.add(item.id);

  if(externalIds.has(item.external_case_id)) errors.push(at+": duplicate external_case_id "+item.external_case_id);
  externalIds.add(item.external_case_id);

  const external=externalById.get(item.external_case_id);
  if(!external){
    errors.push(at+": unknown external_case_id "+item.external_case_id);
    continue;
  }

  if(item.split!==external.split) errors.push(at+": split mismatch");
  if(external.labels?.primary_source_resolvable!==true) errors.push(at+": annotation references unresolved source");

  if(typeof item.claim?.text!=="string"||item.claim.text.trim().length<5) errors.push(at+": claim text missing");
  if(!Array.isArray(item.gold_evidence)||item.gold_evidence.length===0) errors.push(at+": gold evidence missing");

  for(let evidenceIndex=0;evidenceIndex<(item.gold_evidence??[]).length;evidenceIndex++){
    const evidence=item.gold_evidence[evidenceIndex];
    const where=at+".gold_evidence["+evidenceIndex+"]";
    const exact=String(evidence?.exact_text??"").trim();
    if(exact.length<4||exact.length>240) errors.push(where+": exact_text length invalid");
    try{
      new URL(evidence?.url);
    }catch{
      errors.push(where+": authority url invalid");
    }
  }
}

const families=new Set(
  annotations
    .map(item=>externalById.get(item.external_case_id)?.case_family)
    .filter(Boolean)
);
const providers=new Set(
  annotations
    .map(item=>externalById.get(item.external_case_id)?.candidate?.signal_kind)
    .filter(Boolean)
);
const authorities=new Set(
  annotations.flatMap(item=>(item.gold_evidence??[]).map(evidence=>evidence.authority))
);
const dev=annotations.filter(item=>item.split==="dev").length;
const validation=annotations.filter(item=>item.split==="validation").length;

const diversityRequirements={
  annotations:50,
  unique_external_cases:50,
  families:12,
  providers:4,
  authorities:4,
  dev:25,
  validation:15
};

if(annotations.length>=diversityRequirements.annotations){
  if(externalIds.size<diversityRequirements.unique_external_cases) errors.push("claim benchmark diversity: unique external cases below 50");
  if(families.size<diversityRequirements.families) errors.push("claim benchmark diversity: families below 12");
  if(providers.size<diversityRequirements.providers) errors.push("claim benchmark diversity: providers below 4");
  if(authorities.size<diversityRequirements.authorities) errors.push("claim benchmark diversity: authorities below 4");
  if(dev<diversityRequirements.dev) errors.push("claim benchmark diversity: dev below 25");
  if(validation<diversityRequirements.validation) errors.push("claim benchmark diversity: validation below 15");
}

if(errors.length) throw new Error(errors.join(" | "));

console.log(
  "FE03_CLAIM_ANNOTATIONS_PASS|annotations="+annotations.length+
  "|external_cases="+externalIds.size+
  "|families="+families.size+
  "|providers="+providers.size+
  "|authorities="+authorities.size+
  "|dev="+dev+
  "|validation="+validation+
  "|holdout_touched=0"
);
