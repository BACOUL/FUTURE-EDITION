import { readFile } from "node:fs/promises";
import { validateSchema } from "../../pipeline/lib/schema-validator.mjs";

const path=process.argv[2];

if(!path){
  console.error("USAGE|node benchmarks/fe03/validate-external.mjs <dev-validation.json>");
  process.exit(2);
}

const root=new URL("../../",import.meta.url);
const schema=JSON.parse(await readFile(new URL("benchmarks/fe03/external-case.schema.json",root),"utf8"));
const cases=JSON.parse(await readFile(path,"utf8"));
const errors=[];

if(!Array.isArray(cases)){
  errors.push("corpus must be an array");
}else{
  const ids=new Set();
  for(let i=0;i<cases.length;i++){
    errors.push(...validateSchema(cases[i],schema,"case["+i+"]"));
    if(ids.has(cases[i]?.id)) errors.push("duplicate case id: "+cases[i]?.id);
    ids.add(cases[i]?.id);
    if(cases[i]?.split==="holdout") errors.push("holdout labels must not be present in tuning corpus");
  }

  const dev=cases.filter(item=>item.split==="dev").length;
  const validation=cases.filter(item=>item.split==="validation").length;

  if(cases.length<150) errors.push("dev+validation corpus must contain at least 150 cases before holdout");
  if(dev<100) errors.push("dev split must contain at least 100 cases");
  if(validation<50) errors.push("validation split must contain at least 50 cases");
}

if(errors.length){
  console.error("FE03_EXTERNAL_CORPUS_INVALID");
  for(const error of errors) console.error("- "+error);
  process.exit(1);
}

console.log(
  "FE03_EXTERNAL_CORPUS_VALID|cases="+cases.length+
  "|dev="+cases.filter(item=>item.split==="dev").length+
  "|validation="+cases.filter(item=>item.split==="validation").length
);
