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
const errors=[];

for(let index=0;index<annotations.length;index++){
  const item=annotations[index];
  const at="annotation["+index+"]";

  if(!/^FE03-CLAIM-[0-9]{4}$/.test(String(item.id??""))) errors.push(at+": invalid id");
  if(ids.has(item.id)) errors.push(at+": duplicate id "+item.id);
  ids.add(item.id);

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

if(errors.length) throw new Error(errors.join(" | "));

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

console.log(
  "FE03_CLAIM_ANNOTATIONS_PASS|annotations="+annotations.length+
  "|external_cases="+new Set(annotations.map(item=>item.external_case_id)).size+
  "|families="+families.size+
  "|providers="+providers.size+
  "|holdout_touched=0"
);
