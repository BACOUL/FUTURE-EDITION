import { readFile } from "node:fs/promises";
import { validateSchema } from "../../pipeline/lib/schema-validator.mjs";

const path=process.argv[2];

if(!path){
  console.error("USAGE|node benchmarks/fe03/validate-external.mjs <dev-validation.json>");
  process.exit(2);
}

const root=new URL("../../",import.meta.url);
const schema=JSON.parse(await readFile(new URL("benchmarks/fe03/external-case.schema.json",root),"utf8"));
const matrix=JSON.parse(await readFile(new URL("benchmarks/fe03/collection-matrix.external.v1.json",root),"utf8"));
const cases=JSON.parse(await readFile(path,"utf8"));
const errors=[];

function candidateKey(item){
  const candidate=item?.candidate??item;
  const kind=String(candidate?.signal_kind??"").trim().toLowerCase();
  const value=String(candidate?.raw_value??"").trim().toLowerCase();
  return kind+":"+value;
}

function validateRelations(item){
  const relations=Array.isArray(item?.relations)?item.relations:[];
  const relationKeys=new Set();
  const requiredType=
    item?.case_family==="dependent_echo"?"same_primary_origin":
    item?.case_family==="contradiction"?"materially_conflicts":
    null;

  if(requiredType&&!relations.some(relation=>relation.relation_type===requiredType)){
    errors.push(item?.id+": relational family missing "+requiredType);
  }

  for(const relation of relations){
    const key=relation.relation_type+":"+candidateKey(relation.candidate);
    if(relationKeys.has(key)) errors.push(item?.id+": duplicate relation "+key);
    relationKeys.add(key);

    if(candidateKey(relation.candidate)===candidateKey(item)){
      errors.push(item?.id+": relation points to primary candidate itself");
    }
  }
}

if(!Array.isArray(cases)){
  errors.push("corpus must be an array");
}else{
  const ids=new Set();
  const candidates=new Set();
  const coverage=new Map(
    matrix.families.map(row=>[
      row.family,
      {dev:0,validation:0,target_dev:row.dev,target_validation:row.validation}
    ])
  );

  for(let i=0;i<cases.length;i++){
    const item=cases[i];
    errors.push(...validateSchema(item,schema,"case["+i+"]"));

    if(ids.has(item?.id)) errors.push("duplicate case id: "+item?.id);
    ids.add(item?.id);

    const key=candidateKey(item);
    if(candidates.has(key)) errors.push("duplicate candidate: "+key);
    candidates.add(key);

    validateRelations(item);

    if(item?.split==="holdout") errors.push("holdout labels must not be present in tuning corpus");

    if(!Array.isArray(item?.label_evidence)||item.label_evidence.length===0){
      errors.push(item?.id+": no label evidence");
    }

    if(item?.labels?.critical_safety_case&&item?.case_family!=="invalid_identifier"){
      const externalEvidence=(item.label_evidence||[]).some(
        evidence=>evidence.authority!=="benchmark_design"&&Boolean(evidence.url)
      );
      if(!externalEvidence) errors.push(item?.id+": critical case lacks external authority evidence");
    }

    if(item?.labels?.primary_source_resolvable===false&&item?.labels?.publication_status!=="unresolved"){
      errors.push(item?.id+": unresolved source has non-unresolved publication status");
    }

    if(item?.labels?.publication_status==="retracted"&&item?.labels?.primary_source_resolvable!==true){
      errors.push(item?.id+": retracted source must be resolvable");
    }

    const bucket=coverage.get(item?.case_family);
    if(bucket&&["dev","validation"].includes(item?.split)){
      bucket[item.split]++;
    }
  }

  const dev=cases.filter(item=>item.split==="dev").length;
  const validation=cases.filter(item=>item.split==="validation").length;

  if(cases.length<matrix.dev_validation_target){
    errors.push("dev+validation corpus must contain at least "+matrix.dev_validation_target+" cases before holdout");
  }
  if(dev<matrix.dev_target) errors.push("dev split must contain at least "+matrix.dev_target+" cases");
  if(validation<matrix.validation_target){
    errors.push("validation split must contain at least "+matrix.validation_target+" cases");
  }

  for(const row of matrix.families){
    const got=coverage.get(row.family);
    if((got?.dev??0)<row.dev){
      errors.push(row.family+": dev coverage "+String(got?.dev??0)+"/"+row.dev);
    }
    if((got?.validation??0)<row.validation){
      errors.push(row.family+": validation coverage "+String(got?.validation??0)+"/"+row.validation);
    }
  }
}

if(errors.length){
  console.error("FE03_EXTERNAL_CORPUS_INVALID");
  for(const error of errors) console.error("- "+error);
  process.exit(1);
}

console.log(
  "FE03_EXTERNAL_CORPUS_VALID|cases="+cases.length+
  "|dev="+cases.filter(item=>item.split==="dev").length+
  "|validation="+cases.filter(item=>item.split==="validation").length+
  "|families="+matrix.families.length+
  "|unique_candidates="+new Set(cases.map(candidateKey)).size
);
