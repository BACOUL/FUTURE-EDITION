import { readFile } from "node:fs/promises";

const root=new URL("../../",import.meta.url);
const seedPath=process.argv[2]??new URL("benchmarks/fe03/external/dev-validation.seed.json",root);
const cases=JSON.parse(await readFile(seedPath,"utf8"));
const matrix=JSON.parse(await readFile(new URL("benchmarks/fe03/collection-matrix.external.v1.json",root),"utf8"));

const rows=matrix.families.map(row=>{
  const dev=cases.filter(item=>item.case_family===row.family&&item.split==="dev").length;
  const validation=cases.filter(item=>item.case_family===row.family&&item.split==="validation").length;
  return {
    family:row.family,
    dev,
    dev_target:row.dev,
    dev_remaining:Math.max(0,row.dev-dev),
    validation,
    validation_target:row.validation,
    validation_remaining:Math.max(0,row.validation-validation)
  };
});

const summary={
  cases:cases.length,
  dev:cases.filter(item=>item.split==="dev").length,
  dev_target:matrix.dev_target,
  validation:cases.filter(item=>item.split==="validation").length,
  validation_target:matrix.validation_target,
  families_covered:new Set(cases.map(item=>item.case_family)).size,
  families_target:matrix.families.length,
  dev_remaining:rows.reduce((n,row)=>n+row.dev_remaining,0),
  validation_remaining:rows.reduce((n,row)=>n+row.validation_remaining,0),
  rows
};

console.log(JSON.stringify(summary,null,2));
console.log(
  "FE03_EXTERNAL_COVERAGE|cases="+summary.cases+
  "|dev="+summary.dev+"/"+summary.dev_target+
  "|validation="+summary.validation+"/"+summary.validation_target+
  "|families="+summary.families_covered+"/"+summary.families_target+
  "|remaining="+(summary.dev_remaining+summary.validation_remaining)
);
