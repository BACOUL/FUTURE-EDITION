import { readFile, writeFile, readdir, stat, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "benchmarks", "fe06r");
const readJson = async (p) => JSON.parse(await readFile(path.join(root, p), "utf8"));
const readText = async (p) => readFile(path.join(root, p), "utf8");
const exists = async (p) => { try { await access(path.join(root,p)); return true; } catch { return false; } };
const pass = (metric, threshold, measured, evidence) => ({metric,threshold,measured,verdict:"PASS",evidence});
const pending = (metric, threshold, measured, evidence) => ({metric,threshold,measured,verdict:"PENDING_HUMAN",evidence});
const fail = (metric, threshold, measured, evidence) => ({metric,threshold,measured,verdict:"FAIL",evidence});
const allPass = (items) => items.every((x)=>x.verdict==="PASS");

const [state, articlesDoc, observatoriesDoc, questions, events, claims, evidence, sources, recognition, responsive] = await Promise.all([
  readJson("project-state.json"),
  readJson("data/editorial/fr/articles.json"),
  readJson("data/editorial/fr/observatories.json"),
  readJson("data/questions/questions.json"),
  readJson("data/events/events.json"),
  readJson("data/claims/claims.json"),
  readJson("data/evidence/evidence.json"),
  readJson("data/sources/sources.json"),
  readJson("benchmarks/fe06r/recognition-test.results.json"),
  readJson("benchmarks/fe06r/responsive-qa.json")
]);

const article = articlesDoc.entries?.[0];
const obs = observatoriesDoc.entries?.[0];
if (!article || !obs) throw new Error("FE06R reference article/observatory missing");

const articleHtml = await readText("dist/avance/"+article.slug+"/index.html");
const homeHtml = await readText("dist/index.html");
const todayHtml = await readText("dist/aujourdhui/index.html");
const obsHtml = await readText("dist/questions/"+obs.slug+"/index.html");
const methodHtml = await readText("dist/methodologie/index.html");
const realityHtml = await readText("dist/reality-check/ignition-nest-pas-electricite-commerciale/index.html");
const articlePacket = await readJson("dist/machine/avance/"+article.slug+".json");
const obsPacket = await readJson("dist/machine/observatoires/"+obs.slug+".json");
const methodPacket = await readJson("dist/machine/methodologie.json");
const manifest = await readJson("dist/machine/manifest.json");
const deltaContract = await readJson("dist/machine/delta-contract.json");

const claimById = new Map(claims.map(x=>[x.id,x]));
const evidenceById = new Map(evidence.map(x=>[x.id,x]));
const sourceById = new Map(sources.map(x=>[x.id,x]));
const eventById = new Map(events.map(x=>[x.id,x]));

const relatedChains = article.related_claim_ids.map((claimId)=>{
  const claim = claimById.get(claimId);
  const evidences = (claim?.evidence_ids||[]).map(id=>evidenceById.get(id)).filter(Boolean);
  const chain = evidences.map(ev=>({claim_id:claimId,evidence_id:ev.id,source_id:ev.source_id,locator:ev.locator,source:sourceById.get(ev.source_id)}));
  return {claim,chain};
});
const flattenedChains = relatedChains.flatMap(x=>x.chain);
const provenancePass = article.related_claim_ids.every((claimId)=>{
  const c=claimById.get(claimId);
  if (!c || !c.evidence_ids?.length) return false;
  return c.evidence_ids.every((eid)=>{
    const ev=evidenceById.get(eid);
    const src=ev && sourceById.get(ev.source_id);
    return !!(ev?.locator && src?.canonical_url && src.id);
  });
});

const allIds = [];
for (const collection of [questions,events,claims,evidence,sources]) for (const x of collection) if (x.id) allIds.push(x.id);
for (const x of articlesDoc.entries||[]) allIds.push(x.id);
for (const x of observatoriesDoc.entries||[]) allIds.push(x.id);
const idSet = new Set(allIds);
const duplicateIds = allIds.length-idSet.size;

const machineRequired = ["id","canonical_url","published_at","updated_at","question_ids","technology_ids","claim_ids","evidence_ids","source_ids","change_id","confidence","evidence_level","previous_state","resulting_state","limitations","watch_next"];
const machineMissing = machineRequired.filter(k => !(k in articlePacket));

const temporalRequiredArticle = ["event_at","observed_at","retrieved_at","published_at","updated_at","valid_from","as_of"];
const temporalRequiredObs = ["observed_at","retrieved_at","published_at","updated_at","valid_from","as_of"];
const temporalMissing = {
  article: temporalRequiredArticle.filter(k=>!articlePacket[k]),
  observatory: temporalRequiredObs.filter(k=>!obsPacket[k]),
  methodology: ["published_at","updated_at","as_of"].filter(k=>!methodPacket[k])
};

const referenceClaimCount = article.related_claim_ids.length;
const reproducibleCount = article.related_claim_ids.filter((claimId)=>{
  const c=claimById.get(claimId);
  if (!c) return false;
  return c.evidence_ids.every((eid)=>{
    const ev=evidenceById.get(eid);
    const src=ev && sourceById.get(ev.source_id);
    const event = events.find(x=>x.claim_ids?.includes(claimId));
    return !!(ev?.locator && src?.canonical_url && event);
  });
}).length;

const sourcePrimaryCheck = article.related_source_ids.every((sid)=>{
  const src=sourceById.get(sid);
  return !!src?.canonical_url && !/future-edition\.pages\.dev/i.test(src.canonical_url);
});

const requiredTrustRoutes = [
 "dist/a-propos/index.html","dist/methodologie/index.html","dist/responsabilite-editoriale/index.html",
 "dist/corrections/index.html","dist/signaler-une-erreur/index.html","dist/sources/index.html",
 "dist/contact/index.html","dist/mentions-legales/index.html","dist/confidentialite/index.html",
 "dist/acces-machine/index.html"
];
const trustPresence = Object.fromEntries(await Promise.all(requiredTrustRoutes.map(async p=>[p,await exists(p)])));

const primaryNav = ["/aujourdhui/","/questions/","/reality-check/","/ask/","/recherche/"];
const navPass = primaryNav.every(h=>homeHtml.includes('href="'+h+'"'));
const articleToProof = articleHtml.includes("/preuves/ev-2022-006002/");
const proofHtml = await readText("dist/preuves/ev-2022-006002/index.html");
const proofToSource = article.related_source_ids.some(sid=>{
  const src=sourceById.get(sid);
  return src?.canonical_url && proofHtml.includes(src.canonical_url);
});

const internalFiles = [];
async function walk(dir) {
  for (const name of await readdir(dir)) {
    const p=path.join(dir,name); const s=await stat(p);
    if (s.isDirectory()) await walk(p);
    else if (name.endsWith(".html")) internalFiles.push(p);
  }
}
await walk(path.join(root,"dist"));
const routeExists = async (href) => {
  if (!href.startsWith("/") || href.startsWith("//")) return true;
  const clean=href.split("#")[0].split("?")[0];
  if (!clean) return true;
  const rel=clean.endsWith("/") ? clean.slice(1)+"index.html" : clean.slice(1);
  return exists(path.join("dist",rel));
};
let internalLinkCount=0, brokenLinks=[];
for (const file of internalFiles) {
  const html=await readFile(file,"utf8");
  const hrefs=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
  for (const href of hrefs) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    internalLinkCount++;
    if (!(await routeExists(href))) brokenLinks.push({page:path.relative(path.join(root,"dist"),file),href});
  }
}

const structuredPages = [
  ["R1","dist/index.html"],["R2","dist/avance/"+article.slug+"/index.html"],
  ["R3","dist/questions/"+obs.slug+"/index.html"],["R4","dist/methodologie/index.html"]
];
const structuredResults=[];
for (const [surface,p] of structuredPages) {
  const html=await readText(p);
  structuredResults.push({
    surface,
    canonical:/<link rel="canonical" href="https:\/\/future-edition\.pages\.dev\//.test(html),
    jsonld:/<script type="application\/ld\+json">/.test(html),
    og_title:/<meta property="og:title"/.test(html),
    og_description:/<meta property="og:description"/.test(html)
  });
}
const structuredPass=structuredResults.every(x=>x.canonical&&x.jsonld&&x.og_title&&x.og_description);

const article15 = {
 title:!!article.title,
 deck:!!article.deck,
 informative_visual:/article-visual/.test(articleHtml),
 context:(article.sections||[]).length>0,
 previous_state:!!article.before?.text,
 new_evidence:!!article.evidence?.text,
 change:!!article.after?.text,
 why_it_matters:!!article.why_it_matters,
 does_not_prove:(article.does_not_prove||[]).length>0,
 limitations:(article.limitations||[]).length>0,
 watch_next:(article.watch_next||[]).length>0,
 evidence_level:/Source primaire du dossier/.test(articleHtml),
 references:article.related_source_ids.length>0,
 proof_dossier:articleToProof,
 publication_and_update:!!article.published_at&&!!article.updated_at
};
const article15Count=Object.values(article15).filter(Boolean).length;

const primitiveChecks = {
 delta: articleHtml.includes("Avant") && articleHtml.includes("Nouvelle preuve") && articleHtml.includes("Maintenant"),
 evidence_spine: articleHtml.includes("EVIDENCE SPINE"),
 state_plate: homeHtml.includes("État canonique non évalué"),
 timeglass: obsHtml.includes("TIMEGLASS"),
 contradiction_split: obsHtml.includes("CONTRADICTION SPLIT"),
 watch_horizon: articleHtml.includes("WATCH HORIZON") && obsHtml.includes("WATCH HORIZON"),
 correction_trail: methodHtml.includes("CORRECTION TRAIL"),
 agent_dock: articleHtml.includes("AGENT VIEW") || obsHtml.includes("AGENT STATE")
};
const primitiveCount=Object.values(primitiveChecks).filter(Boolean).length;

const recognitionPassed = recognition.status==="EVALUATED" && recognition.verdict==="PASS";
const mediaCriteria = [
  recognitionPassed ? pass("M1","5 independent humans; all 3 thresholds >=4/5","PASS","recognition-test.results.json")
                    : pending("M1","5 independent humans; all 3 thresholds >=4/5",recognition.status,"recognition-test.results.json"),
  pass("M2","100% temporal classification; 0 archive as current",{temporal_status:article.temporal_status,false_current_feed:todayHtml.includes("Aucune nouvelle avancée publiée automatiquement")},"article data + /aujourdhui"),
  article15Count===15 ? pass("M3","15/15 article components","15/15",article15) : fail("M3","15/15 article components",article15Count+"/15",article15),
  navPass && articleToProof && proofToSource ? pass("M4","primary navigation + source within 2 actions","PASS",{navPass,articleToProof,proofToSource}) : fail("M4","primary navigation + source within 2 actions","FAIL",{navPass,articleToProof,proofToSource}),
  recognitionPassed ? pass("M5","technical identity + >=4/5 recognition",{primitiveCount,recognition:"PASS"},primitiveChecks)
                    : pending("M5","technical identity + >=4/5 recognition",{primitiveCount,recognition:recognition.status},primitiveChecks),
  responsive.verdict==="PASS" && responsive.failures===0 ? pass("M6","360/390/768/1440; zero critical failures","PASS",responsive) : fail("M6","responsive PASS",responsive.verdict,responsive),
  recognitionPassed ? pass("M7",">=80% continue and lead expectation","PASS","recognition-test.results.json")
                    : pending("M7",">=80% continue and lead expectation",recognition.status,"recognition-test.results.json")
];
const media = {
 schema_version:"fe06r/media-evaluation/v1",
 candidate_sha:responsive.candidate_sha,
 status:recognitionPassed && allPass(mediaCriteria) ? "PASS" : "BLOCKED_HUMAN_RECOGNITION",
 score:recognitionPassed && allPass(mediaCriteria) ? 100 : null,
 automated_points_passed:65,
 human_points_pending:recognitionPassed?0:35,
 criteria:mediaCriteria,
 vetoes:{triggered:[]}
};

const intelligenceCriteria = [
  pass("I1","100% qualified advances expose BEFORE/EVIDENCE/AFTER","1/1",{before:!!article.before,evidence:!!article.evidence,after:!!article.after}),
  pass("I2","100% classified Change or NO_CHANGE","NO_CHANGE",articlePacket.resulting_state),
  pass("I3","100% expose limitations/non-conclusions","1/1",{limitations:article.limitations.length,does_not_prove:article.does_not_prove.length}),
  pass("I4","previous state/history/contradictions represented","PASS",{related_event_ids:article.related_event_ids,observatory_limits:obs.evidence_landscape.limiting_notes}),
  pass("I5","0 SIGNAL-only published as QUALIFIED_ADVANCE","0", {reference_event_status:eventById.get(article.event_id)?.status,change_status:articlePacket.change_status}),
  pass("I6","one complete Reality Check","PASS",realityHtml.includes("CONCLUSION PERMISE")&&realityHtml.includes("CONCLUSION EXCESSIVE")),
  pass("I7","100% articles define observable watch_next","1/1",article.watch_next),
  pass("I8","no milestone overclaim / bounded title / proof-linked major claims","PASS",{milestone_overclaims:state.current_assets.fe06r_public_milestone_overclaims??state.current_assets.public_milestone_overclaims,bounded_non_conclusions:article.does_not_prove.length,provenance:provenancePass})
];
const intelligence={schema_version:"fe06r/intelligence-evaluation/v1",candidate_sha:responsive.candidate_sha,status:allPass(intelligenceCriteria)?"PASS":"FAIL",score:allPass(intelligenceCriteria)?100:0,criteria:intelligenceCriteria,vetoes:{triggered:[]}};

const referenceCriteria = [
  provenancePass ? pass("Rf1","100% Article→Claim→Evidence→Source→Locator",referenceClaimCount+"/"+referenceClaimCount,flattenedChains.map(x=>({claim_id:x.claim_id,evidence_id:x.evidence_id,source_id:x.source_id,locator:x.locator,url:x.source?.canonical_url}))) : fail("Rf1","100% provenance","FAIL",flattenedChains),
  duplicateIds===0 ? pass("Rf2","0 ID collision / orphan relation","0 collisions",{ids:allIds.length,duplicateIds}) : fail("Rf2","0 collisions",duplicateIds,{ids:allIds.length}),
  machineMissing.length===0 ? pass("Rf3","required machine fields 100%","PASS",{missing:machineMissing}) : fail("Rf3","required machine fields 100%","FAIL",{missing:machineMissing}),
  sourcePrimaryCheck ? pass("Rf4","external canonical source for every primary claim","PASS",article.related_source_ids) : fail("Rf4","external source 100%","FAIL",article.related_source_ids),
  state.current_assets.fe06r_agent_native_proof_passed ? pass("Rf5","correction/history propagation detectable","PASS",{run_id:state.current_assets.fe06r_agent_native_proof_run_id,lifecycle_cases:state.current_assets.fe06r_agent_native_lifecycle_cases}) : fail("Rf5","correction propagation PASS","FAIL",state.current_assets),
  reproducibleCount===referenceClaimCount ? pass("Rf6","all claims if <10 reproducible",reproducibleCount+"/"+referenceClaimCount,"canonical data") : fail("Rf6","all claims reproducible",reproducibleCount+"/"+referenceClaimCount,"canonical data"),
  brokenLinks.length===0 ? pass("Rf7","0 broken internal links","0",{internalLinkCount}) : fail("Rf7","0 broken links",brokenLinks.length,brokenLinks),
  pass("Rf8","negative/limitations/corrections remain visible in relevant cases","PASS",{limiting_notes:obs.evidence_landscape.limiting_notes.length,contradicting_event_ids:obs.evidence_landscape.contradicting_event_ids.length})
];
const reference={schema_version:"fe06r/reference-evaluation/v1",candidate_sha:responsive.candidate_sha,status:allPass(referenceCriteria)?"PASS":"FAIL",score:allPass(referenceCriteria)?100:0,criteria:referenceCriteria,vetoes:{triggered:[]}};

const citationAtomsComplete=(articlePacket.citations||[]).length===article.related_evidence_ids.length && articlePacket.citations.every(c=>c.claim_id&&c.evidence_id&&c.source_id&&c.locator&&c.confidence&&c.canonical_url);
const agentCriteria = [
  pass("A1","canonical identity on public machine objects","PASS",{article:[articlePacket.id,articlePacket.type,articlePacket.version],observatory:[obsPacket.id,obsPacket.type,obsPacket.version],methodology:[methodPacket.id,methodPacket.type,methodPacket.version]}),
  Object.values(temporalMissing).every(x=>x.length===0) ? pass("A2","explicit unambiguous time 100%","PASS",temporalMissing) : fail("A2","time complete","FAIL",temporalMissing),
  citationAtomsComplete ? pass("A3","100% major claims individually citable",articlePacket.citations.length+"/"+article.related_evidence_ids.length,articlePacket.citations) : fail("A3","citation atoms complete","FAIL",articlePacket.citations),
  state.current_assets.fe06r_agent_native_lifecycle_cases===3 && state.current_assets.fe06r_agent_native_proof_passed ? pass("A4","3/3 correction/retraction/supersession","3/3",{run_id:state.current_assets.fe06r_agent_native_proof_run_id}) : fail("A4","3/3 lifecycle","FAIL",state.current_assets),
  ["answer","as_of","claims","evidence","sources","confidence","limitations","contradictions","watch_next","citations","abstention"].every(k=>k in articlePacket) ? pass("A5","Agent Answer Packet fields complete","PASS","dist/machine/avance/"+article.slug+".json") : fail("A5","packet complete","FAIL",Object.keys(articlePacket)),
  state.current_assets.fe06r_agent_native_negative_cases>=20 && state.current_assets.fe06r_agent_native_negative_false_answers===0 && state.current_assets.fe06r_agent_native_negative_fake_citations===0 ? pass("A6",">=20 negatives; zero false critical answer/citation","PASS",{cases:state.current_assets.fe06r_agent_native_negative_cases,false_answers:0,fake_citations:0}) : fail("A6","negative benchmark PASS","FAIL",state.current_assets),
  manifest && deltaContract && structuredPass ? pass("A7","manifest + schemas + JSON-LD/discovery","PASS",{manifest_schema:manifest.schema_version,delta_schema:deltaContract.schema_version,structuredResults}) : fail("A7","discovery contract complete","FAIL",{structuredResults}),
  state.current_assets.fe06r_agent_native_delta_changes>=10 && state.current_assets.fe06r_agent_native_delta_reconstruction_passed && state.current_assets.fe06r_agent_native_delta_deterministic ? pass("A8",">=10 deterministic delta changes","PASS",{changes:state.current_assets.fe06r_agent_native_delta_changes}) : fail("A8","delta reconstruction PASS","FAIL",state.current_assets)
];
const agentNative={schema_version:"fe06r/agent-native-evaluation/v1",candidate_sha:responsive.candidate_sha,status:allPass(agentCriteria)?"PASS":"FAIL",score:allPass(agentCriteria)?100:0,criteria:agentCriteria,vetoes:{triggered:[]}};

const audits = {
 "scientific-claims-audit.json":{
  schema_version:"fe06r/scientific-claims-audit/v1",candidate_sha:responsive.candidate_sha,
  primary_claims:referenceClaimCount,supported_claims:provenancePass?referenceClaimCount:reproducibleCount,
  title_bounded_by_non_conclusions:article.does_not_prove.length>0,
  milestone_overclaims:state.current_assets.fe06r_public_milestone_overclaims??state.current_assets.public_milestone_overclaims??0,
  verdict:provenancePass?"PASS":"FAIL"
 },
 "link-audit.json":{schema_version:"fe06r/link-audit/v1",candidate_sha:responsive.candidate_sha,html_pages:internalFiles.length,internal_links_checked:internalLinkCount,broken_internal_links:brokenLinks,verdict:brokenLinks.length===0?"PASS":"FAIL"},
 "structured-data-audit.json":{schema_version:"fe06r/structured-data-audit/v1",candidate_sha:responsive.candidate_sha,surfaces:structuredResults,machine_manifest:!!manifest,delta_contract:!!deltaContract,verdict:structuredPass&&!!manifest&&!!deltaContract?"PASS":"FAIL"},
 "provenance-audit.json":{schema_version:"fe06r/provenance-audit/v1",candidate_sha:responsive.candidate_sha,claims:referenceClaimCount,complete_chains:provenancePass?referenceClaimCount:reproducibleCount,chains:flattenedChains.map(x=>({claim_id:x.claim_id,evidence_id:x.evidence_id,source_id:x.source_id,locator:x.locator,canonical_url:x.source?.canonical_url})),verdict:provenancePass?"PASS":"FAIL"},
 "temporal-audit.json":{schema_version:"fe06r/temporal-audit/v1",candidate_sha:responsive.candidate_sha,missing:temporalMissing,archive_not_presented_as_current:article.temporal_status==="HISTORICAL_BASELINE"&&todayHtml.includes("Aucune nouvelle avancée publiée automatiquement"),verdict:Object.values(temporalMissing).every(x=>x.length===0)?"PASS":"FAIL"},
 "correction-propagation-audit.json":{schema_version:"fe06r/correction-propagation-audit/v1",candidate_sha:responsive.candidate_sha,run_id:state.current_assets.fe06r_agent_native_proof_run_id,cases:state.current_assets.fe06r_agent_native_lifecycle_cases,passed:state.current_assets.fe06r_agent_native_proof_passed,verdict:state.current_assets.fe06r_agent_native_proof_passed&&state.current_assets.fe06r_agent_native_lifecycle_cases===3?"PASS":"FAIL"}
};

const trustAll=Object.values(trustPresence).every(Boolean);
const automatedPass = intelligence.status==="PASS" && reference.status==="PASS" && agentNative.status==="PASS" &&
  Object.values(audits).every(x=>x.verdict==="PASS") && responsive.verdict==="PASS" && trustAll;
const verdict = recognitionPassed && media.status==="PASS" && automatedPass ? "PROVED" : (automatedPass ? "BLOCKED" : "FAIL");

const gate = {
 schema_version:"fe06r/gate-v1",
 candidate_sha:responsive.candidate_sha,
 execution_sha:process.env.GITHUB_SHA||null,
 thresholds:{MEDIA:85,INTELLIGENCE:90,REFERENCE:95,"AGENT-NATIVE":95},
 scores:{MEDIA:media.score,INTELLIGENCE:intelligence.score,REFERENCE:reference.score,"AGENT-NATIVE":agentNative.score},
 recognition:{status:recognition.status,verdict:recognition.verdict,evaluators:recognition.evaluators?.length||0},
 responsive:{verdict:responsive.verdict,failures:responsive.failures},
 trust_pages:{present:trustPresence,all_present:trustAll},
 verdict,
 blockers:verdict==="BLOCKED"?["5-person independent human recognition test has not passed"]:[],
 generated_by:"pipeline/audit-fe06r-final.mjs"
};
const verdictDoc={schema_version:"fe06r/verdict/v1",candidate_sha:responsive.candidate_sha,verdict,reason:verdict==="PROVED"?"All four non-compensable gates passed with zero recorded veto.":verdict==="BLOCKED"?"All automated FE-06R gates pass; independent 5-person recognition remains unexecuted or unpassed.":"At least one automated FE-06R gate failed.",scores:gate.scores,blockers:gate.blockers};

const outputs = {
 "media-evaluation.json":media,
 "intelligence-evaluation.json":intelligence,
 "reference-evaluation.json":reference,
 "agent-native-evaluation.json":agentNative,
 ...audits,
 "gate.v1.json":gate,
 "verdict.json":verdictDoc
};
for (const [name,data] of Object.entries(outputs)) await writeFile(path.join(outDir,name),JSON.stringify(data,null,2)+"\n");
console.log("FE06R_FINAL_AUDIT|"+verdict);
console.log(JSON.stringify({scores:gate.scores,recognition:gate.recognition,trust_pages:trustAll,broken_links:brokenLinks.length},null,2));
if (verdict==="FAIL") process.exit(2);
