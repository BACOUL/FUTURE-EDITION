import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const repoRoot=new URL("../",import.meta.url);
const distRoot=new URL("../dist-v2/",import.meta.url);
const readJson=async(path)=>JSON.parse(await readFile(new URL(path,repoRoot),"utf8"));
const gate=await readJson("benchmarks/fe06r/r4-capability-gate.v2.json");
const r3=await readJson("benchmarks/fe06r/r3-v2.proof.json");
const state=await readJson("project-state.json");

if(gate.schema_version!=="fe06r/capability-gate-v2/v1") throw new Error("R4 gate schema mismatch");
if(gate.authority!=="docs/FE06R-GATE.md") throw new Error("R4 authority mismatch");
if(gate.candidate.r3_candidate_sha!==r3.candidate_sha) throw new Error("R4/R3 candidate mismatch");
if(gate.candidate.artifact_digest!==r3.artifact.digest) throw new Error("R4/R3 artifact mismatch");
if(gate.review_method.automation_decides_media_quality!==false) throw new Error("automation must not decide media quality");
if(gate.prohibited_legacy_scoring_used!==false) throw new Error("legacy scoring must not be used");
if(gate.preconditions.verdict!=="PASS") throw new Error("preconditions not passed");

const gateEntries=Object.entries(gate.gates||{});
if(gateEntries.length!==8) throw new Error("G1-G8 incomplete");
for(const [id,item] of gateEntries){
  if(!/^G[1-8]$/.test(id)||item.verdict!=="PASS"||!item.rationale) throw new Error(id+" not qualitatively passed");
}
if(gate.ten_second_test?.verdict!=="PASS") throw new Error("ten-second test not passed");

for(const [path,expected] of Object.entries(gate.frozen_surface_hashes)){
  const bytes=await readFile(new URL(path,distRoot));
  const actual=createHash("sha256").update(bytes).digest("hex");
  if(actual!==expected) throw new Error("frozen surface drift: "+path+" expected="+expected+" actual="+actual);
}

const machine=JSON.parse(await readFile(new URL("machine/changes/change-000001.json",distRoot),"utf8"));
if(machine.id!=="CHANGE-000001") throw new Error("machine identity drift");
if(machine.trigger?.claim?.id!=="CLAIM-050051"||machine.trigger?.evidence?.id!=="EVID-050051"||machine.trigger?.source?.id!=="SRC-050051") throw new Error("machine citation chain drift");
if(machine.previous_state?.state_hash!=="ac63c074bccd3c87c7eda49dab6c3f909115a668663202e254ce68a13378ecbf") throw new Error("before state hash drift");
if(machine.current_state?.state_hash!=="34fa5b9b6d44790534db98877644e64b9d133a29928a142b246793cc5f0c1ff8") throw new Error("after state hash drift");
if(machine.current_state?.confidence!=="confirmed") throw new Error("current confidence drift");
if(machine.limitations?.length!==4) throw new Error("machine limitations missing");

if(state.current_assets?.fe06r_r1_status!=="PROVED"||state.current_assets?.fe06r_r2_status!=="PROVED"||state.current_assets?.fe06r_r3_v2_status!=="PROVED") throw new Error("R1-R3 proof chain incomplete");

console.log("FE06R_R4_CAPABILITY_GATE_PASS|gates=8|ten_second_test=1|frozen_surface_hashes="+Object.keys(gate.frozen_surface_hashes).length+"|legacy_scoring=0|candidate="+gate.candidate.r3_candidate_sha);
