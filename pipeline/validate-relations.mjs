import { readFile } from "node:fs/promises";

const read = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const questions = await read("../data/questions/questions.json");
const technologies = await read("../data/technologies/technologies.json");
const events = await read("../data/events/events.json");
const claims = await read("../data/claims/claims.json");
const evidence = await read("../data/evidence/evidence.json");
const provenance = await read("../data/provenance/provenance.json");
const organizations = await read("../data/organizations/organizations.json");
const people = await read("../data/people/people.json");

const errors=[];
const registry=new Map();
const add=(obj,type)=>{
  if(!obj?.id){errors.push(`missing id in ${type}`);return;}
  if(registry.has(obj.id)) errors.push(`duplicate global id: ${obj.id}`);
  registry.set(obj.id,{type,obj});
};

for(const q of questions){
  add(q,"Question");
  for(const m of q.milestones) add(m,"Milestone");
}
for(const [arr,type] of [
  [technologies,"Technology"],[events,"Event"],[claims,"Claim"],
  [evidence,"Evidence"],[provenance,"Provenance"],
  [organizations,"Organization"],[people,"Person"]
]) for(const obj of arr) add(obj,type);

for(const ev of events){
  for(const id of ev.question_ids ?? []) if(!registry.has(id)) errors.push(`${ev.id}: unknown question ${id}`);
  for(const id of ev.technology_ids ?? []) if(!registry.has(id)) errors.push(`${ev.id}: unknown technology ${id}`);
  for(const id of ev.claim_ids ?? []) if(!registry.has(id)) errors.push(`${ev.id}: unknown claim ${id}`);
  for(const id of ev.source_ids ?? []) if(!registry.has(id)) errors.push(`${ev.id}: unknown source ${id}`);
}
for(const c of claims){
  for(const id of c.evidence_ids ?? []) if(!registry.has(id)) errors.push(`${c.id}: unknown evidence ${id}`);
}
for(const e of evidence){
  if(!registry.has(e.source_id)) errors.push(`${e.id}: unknown source ${e.source_id}`);
}

if(errors.length){
  console.error("FUTURE_EDITION_RELATIONS_INVALID");
  for(const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`FUTURE_EDITION_RELATIONS_VALID|objects=${registry.size}`);
