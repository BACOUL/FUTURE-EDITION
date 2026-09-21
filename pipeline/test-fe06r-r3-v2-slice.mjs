import { readFile, access, stat } from "node:fs/promises";
const root=new URL("../dist-v2/",import.meta.url);
const read=(p)=>readFile(new URL(p,root),"utf8");
const json=async(p)=>JSON.parse(await read(p));
const errors=[];
const required=[
  "index.html",
  "avance/robin-ia-hypothese-laboratoire/index.html",
  "observatoires/ia-decouvertes-scientifiques/index.html",
  "preuves/ev-2026-008006/index.html",
  "machine/changes/change-000001.json",
  "machine/manifest.json",
  "assets/styles.css",
  "robots.txt",
  "sitemap.xml"
];
for(const p of required){try{await access(new URL(p,root));}catch{errors.push("missing "+p)}}
const home=await read("index.html");
const article=await read("avance/robin-ia-hypothese-laboratoire/index.html");
const obs=await read("observatoires/ia-decouvertes-scientifiques/index.html");
const proof=await read("preuves/ev-2026-008006/index.html");
const machine=await json("machine/changes/change-000001.json");
const manifest=await json("machine/manifest.json");
const css=await read("assets/styles.css");

for(const [name,html] of [["home",home],["article",article],["observatory",obs],["evidence",proof]]){
  for(const marker of ['<!doctype html>','<html lang="fr">','class="skip"','aria-label="Navigation principale"','rel="canonical"','type="application/json"']){
    if(!html.includes(marker)) errors.push(name+" missing "+marker);
  }
  if(/<script[\s>]/i.test(html)) errors.push(name+" must be zero-client-JS");
  if(html.includes("undefined")||html.includes("[object Object]")) errors.push(name+" serialization artifact");
}

for(const phrase of [
  "Quand l’IA formule l’hypothèse",
  "1 changement confirmé · 5 enquêtes ouvertes",
  "Ce que nous enquêtons maintenant",
  "ENQUÊTE OUVERTE · PAS ENCORE UNE AVANCÉE",
  "Une question qui vient de bouger",
  "La prochaine preuve qui changerait vraiment la réponse"
]) if(!home.includes(phrase)) errors.push("home missing "+phrase);

const signalCount=(home.match(/class="signal"/g)||[]).length;
if(signalCount<5) errors.push("home needs 5 real R2 signals");
if((home.match(/ENQUÊTE OUVERTE · PAS ENCORE UNE AVANCÉE/g)||[]).length!==5) errors.push("all R2 signals must disclose candidate-only status");
if(home.includes("KNOWLEDGE CLOCK")||home.includes("STATE ROOM")||home.includes("EVIDENCE SPINE")||home.includes("Agent Dock")) errors.push("rejected v1 jargon leaked into Home V2");
if(/CHANGE-000001|ASSESS-00000|CLAIM-050051|EVID-050051/.test(home.split('<section class="proof-strip">')[0])) errors.push("internal IDs leaked into first Home screen");

for(const phrase of [
  "Une IA a proposé des pistes. Des chercheurs les ont testées.",
  "Ce qui change réellement",
  "Ce que ce résultat ne permet pas de dire",
  "Voir exactement quelle preuve soutient cette mise à jour"
]) if(!article.includes(phrase)) errors.push("article missing "+phrase);
const limitsPos=article.indexOf("Ce que ce résultat ne permet pas de dire");
const verifyPos=article.indexOf("Voir exactement quelle preuve soutient cette mise à jour");
if(limitsPos<0||verifyPos<0||verifyPos<limitsPos) errors.push("article must read before evidence panel");
if(article.indexOf("EVID-050051")>=0 && article.indexOf("EVID-050051")<verifyPos) errors.push("technical evidence ID appears before verification layer");

for(const phrase of [
  "Une IA peut-elle faire des découvertes scientifiques originales ?",
  "Oui — dans un sens limité mais désormais mieux étayé.",
  "La trajectoire en six moments",
  "Cinq étapes. Une seule possède aujourd’hui un état validé.",
  "ATTEINT · CONFIANCE CONFIRMÉE",
  "PAS ENCORE ÉVALUÉ SÉPARÉMENT",
  "Ce qui ferait bouger l’Observatoire ensuite"
]) if(!obs.includes(phrase)) errors.push("observatory missing "+phrase);
if((obs.match(/ATTEINT · CONFIANCE CONFIRMÉE/g)||[]).length!==1) errors.push("observatory must promote exactly one milestone");
if((obs.match(/PAS ENCORE ÉVALUÉ SÉPARÉMENT/g)||[]).length!==4) errors.push("unassessed milestones must remain explicit");

for(const phrase of [
  "Pourquoi Robin renforce le niveau de confiance",
  "L’affirmation soutenue",
  "Où vérifier dans la source",
  "Frontières de l’affirmation",
  "Décision éditoriale",
  "A multi-agent system for automating scientific discovery",
  "https://doi.org/10.1038/s41586-026-10652-y",
  "CLAIM-050051",
  "EVID-050051",
  "CHANGE-000001"
]) if(!proof.includes(phrase.replaceAll("&","&amp;"))&&!proof.includes(phrase)) errors.push("evidence page missing "+phrase);

if(machine.id!=="CHANGE-000001"||machine.type!=="canonical_change") errors.push("machine change identity mismatch");
if(machine.question?.id!=="Q-008"||machine.milestone?.id!=="Q-008-M3") errors.push("machine question/milestone mismatch");
if(machine.previous_state?.confidence!=="solid_preliminary"||machine.current_state?.confidence!=="confirmed") errors.push("machine confidence transition mismatch");
if(machine.trigger?.claim?.id!=="CLAIM-050051"||machine.trigger?.evidence?.id!=="EVID-050051"||machine.trigger?.source?.id!=="SRC-050051") errors.push("machine trigger chain mismatch");
if(machine.trigger?.evidence?.locator?.includes("Fig. 4")!==true) errors.push("machine source locator missing");
if(proof.includes("Robin generated therapeutic hypotheses")||proof.includes("Supports experimental validation")||proof.includes("Abstract; Results around Fig. 4")) errors.push("raw English canonical prose/locator leaked into French evidence page");
if(obs.includes("Deep learning identifies halicin")||obs.includes("AlphaDev discovers faster sorting algorithms")) errors.push("raw English timeline leaked into French observatory");
if(machine.limitations?.length!==4||machine.watch_next?.length!==3) errors.push("machine limits/watch mismatch");
if(manifest.human_machine_truth_model!=="single_canonical_truth"||manifest.reference_change!=="CHANGE-000001") errors.push("machine manifest truth model mismatch");

for(const href of ["/avance/robin-ia-hypothese-laboratoire/","/observatoires/ia-decouvertes-scientifiques/","/preuves/ev-2026-008006/","/machine/changes/change-000001.json"]){
  if(!home.includes('href="'+href+'"') && !article.includes('href="'+href+'"') && !obs.includes('href="'+href+'"') && !proof.includes('href="'+href+'"')) errors.push("missing slice route "+href);
}
if(!proof.includes('href="https://doi.org/10.1038/s41586-026-10652-y"')) errors.push("original source link missing");

if(!css.includes("@media(max-width:620px)")||!css.includes("@media(prefers-reduced-motion:reduce)")||!css.includes(":focus-visible")) errors.push("responsive/accessibility CSS incomplete");
const cssBytes=Buffer.byteLength(css);
if(cssBytes>30000) errors.push("R3 CSS budget exceeded "+cssBytes);

if(errors.length){
  console.error("FE06R_R3_V2_SLICE_FAIL");
  for(const e of errors) console.error("- "+e);
  process.exit(1);
}
console.log("FE06R_R3_V2_SLICE_PASS|human_routes=4|machine_routes=2|signals=5|canonical_change=CHANGE-000001|promoted_milestones=1|candidate_overclaims=0|client_js=0|css_bytes="+cssBytes);
