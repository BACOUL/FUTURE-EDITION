import { readFile } from "node:fs/promises";

const path=process.argv[2];
if(!path) throw new Error("usage: node pipeline/test-fe06r-r2-living-slice.mjs <result.json>");
const result=JSON.parse(await readFile(path,"utf8"));

if(result.schema_version!=="fe06r/r2-living-editorial-input/v1") throw new Error("schema version mismatch");
if((result.metrics?.selected??0)<5) throw new Error("R2 requires at least 5 relevant resolved selected candidates");
if((result.metrics?.questions_covered??0)<5) throw new Error("R2 requires at least 5 questions covered");
if((result.metrics?.technology_questions_covered??0)<2) throw new Error("R2 requires at least 2 technology/science questions covered");
if((result.metrics?.relevance_rejected??0)<1) throw new Error("R2 relevance gate must demonstrate at least one rejected false-positive candidate");

const allowedQuestions=new Set(["Q-001","Q-003","Q-005","Q-007","Q-008","Q-009"]);
const originKeys=new Set();
for(const row of result.candidates??[]){
  if(row.editorial_status!=="candidate_only"||row.canonical_state_effect!=="none_until_review"||row.human_review_required!==true){
    throw new Error(row.candidate?.id+": candidate safety status invalid");
  }
  if(row.resolution?.status!=="resolved"||!row.resolution?.source) throw new Error(row.candidate?.id+": unresolved selected candidate");
  if(row.relevance_gate?.passed!==true||row.relevance_gate?.method!=="question_specific_title_v1") throw new Error(row.candidate?.id+": selected candidate did not pass relevance gate");
  if(!row.candidate?.question_ids?.length||!row.candidate.question_ids.every((id)=>allowedQuestions.has(id))) throw new Error(row.candidate?.id+": invalid question mapping");
  const source=row.resolution.source;
  const key=String(source.independence_group??source.url??source.external_id??"").toLowerCase();
  if(!key) throw new Error(row.candidate?.id+": no canonical dedup key");
  if(originKeys.has(key)) throw new Error("duplicate source after dedup: "+key);
  originKeys.add(key);
  if(!source.title||!source.url||!source.external_id) throw new Error(row.candidate?.id+": incomplete resolved primary source");
}

console.log("FE06R_R2_LIVING_SLICE_PASS|selected="+result.metrics.selected+"|questions="+result.metrics.questions_covered+"|technology_questions="+result.metrics.technology_questions_covered+"|deduped="+result.metrics.deduplicated_resolved+"|relevance_rejected="+result.metrics.relevance_rejected+"|candidate_only=1");
