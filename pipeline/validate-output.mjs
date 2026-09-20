import { access, readFile, readdir, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const [questions, events, claims, evidence, sources, editorialFr, editorialArticles, editorialObservatories] = await Promise.all([
  readJson("data/questions/questions.json"),
  readJson("data/events/events.json"),
  readJson("data/claims/claims.json"),
  readJson("data/evidence/evidence.json"),
  readJson("data/sources/sources.json"),
  readJson("data/editorial/fr/events.json"),
  readJson("data/editorial/fr/articles.json"),
  readJson("data/editorial/fr/observatories.json")
]);
const articles = editorialArticles.entries ?? [];
const editorialObs = editorialObservatories.entries ?? [];
const editorialObsByQuestion = new Map(editorialObs.map((o) => [o.question_id, o]));

const required = [
  "dist/index.html",
  "dist/aujourdhui/index.html",
  "dist/questions/index.html",
  "dist/methodologie/index.html",
  "dist/reality-check/index.html",
  "dist/reality-check/ignition-nest-pas-electricite-commerciale/index.html",
  "dist/ask/index.html",
  "dist/recherche/index.html",
  ...articles.map((a) => `dist/avance/${a.slug}/index.html`),
  ...articles.map((a) => `dist/machine/avance/${a.slug}.json`),
  ...editorialObs.map((o) => `dist/machine/observatoires/${o.slug}.json`),
  "dist/machine/methodologie.json",
  "dist/assets/styles.css",
  "dist/data/future-graph.json",
  "dist/robots.txt",
  "dist/sitemap.xml",
  ...questions.map((q) => `dist/questions/${q.slug}/index.html`),
  ...events.map((e) => `dist/preuves/${e.id.toLowerCase()}/index.html`)
];

const errors = [];
const editorialFrByEvent = new Map(Object.entries(editorialFr.entries ?? {}));
const profileLabel = {
  medical: "médical",
  technology: "technologie",
  fundamental_science: "science fondamentale"
};
const locatorFr = {
  "Product details — Original Approval Date": "Détails du produit — date d’autorisation initiale",
  "Marketing approved — May 10, 2001": "Autorisation de mise sur le marché — 10 mai 2001",
  "Supporting documents — August 30, 2017 approval": "Documents d’appui — autorisation du 30 août 2017",
  "Approval summary and KEYNOTE-177 efficacy section": "Résumé de l’autorisation et section d’efficacité de KEYNOTE-177",
  "Abstract": "Résumé",
  "Abstract and results": "Résumé et résultats",
  "HDE approval record — Decision Date": "Registre d’autorisation HDE — date de décision",
  "Abstract and primary outcome": "Résumé et critère principal",
  "Supporting documents — December 19, 2017 approval": "Documents d’appui — autorisation du 19 décembre 2017",
  "Abstract and evaluation summary": "Résumé et synthèse de l’évaluation",
  "Announcement body": "Corps de l’annonce",
  "Experiment summary": "Résumé de l’expérience",
  "Shot summary": "Résumé du tir expérimental",
  "July 30, 2023 ignition result": "Résultat d’ignition du 30 juillet 2023",
  "Deuterium-Tritium campaign — energy record": "Campagne deutérium-tritium — record d’énergie",
  "Record summary": "Résumé du record",
  "FDA approval announcement": "Annonce d’autorisation de la FDA",
  "Results section": "Section des résultats",
  "Supporting documents — August 17, 2022 approval": "Documents d’appui — autorisation du 17 août 2022",
  "Supporting documents — November 22, 2022 approval": "Documents d’appui — autorisation du 22 novembre 2022",
  "Supporting documents — December 8, 2023 approval": "Documents d’appui — autorisation du 8 décembre 2023",
  "Abstract and experimental validation": "Résumé et validation expérimentale",
  "Mission overview": "Présentation de la mission",
  "Mission overview and July 20, 1969 landing": "Présentation de la mission et alunissage du 20 juillet 1969",
  "Mission overview and lunar rover section": "Présentation de la mission et section sur le rover lunaire",
  "Expedition 1 and continuous habitation section": "Section sur l’Expédition 1 et la présence humaine continue"
};
const localizeLocator = (locator) => locatorFr[locator] ?? locator;
const claimById = new Map(claims.map((x) => [x.id, x]));
const evidenceById = new Map(evidence.map((x) => [x.id, x]));
const sourceById = new Map(sources.map((x) => [x.id, x]));
if (editorialFrByEvent.size !== events.length) errors.push(`French editorial coverage mismatch: ${editorialFrByEvent.size}/${events.length}`);
for (const path of required) {
  try { await access(new URL(path, root)); }
  catch { errors.push(`missing output: ${path}`); }
}

const htmlPaths = required.filter((p) => p.endsWith("index.html"));
const htmlByPath = new Map();
for (const path of htmlPaths) {
  try {
    htmlByPath.set(path, await readFile(new URL(path, root), "utf8"));
  } catch {}
}

const baseChecks = (path, html) => {
  if (!html.startsWith("<!doctype html>")) errors.push(`${path}: doctype missing`);
  if (!html.includes('<html lang="fr">')) errors.push(`${path}: lang=fr missing`);
  if (!html.includes('class="skip"')) errors.push(`${path}: skip link missing`);
  if (!html.includes('aria-label="Navigation principale"')) errors.push(`${path}: navigation label missing`);
  for (const navHref of ["/aujourdhui/", "/questions/", "/reality-check/", "/ask/", "/recherche/"]) {
    if (!html.includes(`href="${navHref}"`)) errors.push(`${path}: primary navigation missing ${navHref}`);
  }
  if (html.includes("undefined") || html.includes("[object Object]")) errors.push(`${path}: serialization artifact`);
  if (/<script[\s>]/i.test(html)) errors.push(`${path}: unexpected client JavaScript`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${path}: title missing`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) errors.push(`${path}: meta description missing`);
};

for (const [path, html] of htmlByPath) baseChecks(path, html);

const home = htmlByPath.get("dist/index.html") ?? "";
for (const text of [
  "KNOWLEDGE CLOCK",
  "REFERENCE EDITION",
  "HISTORICAL_BASELINE",
  "Le moment où l’ignition a cessé d’être",
  "État canonique non évalué",
  "Avant",
  "Preuve",
  "Maintenant",
  "Aucune nouvelle avancée qualifiée dans le flux public.",
  "REALITY CHECK · RC-001",
  "WATCH HORIZON",
  "Dix questions qui valent des années de suivi.",
  "FUTURE GRAPH",
  "354",
  "Voir le même état pour un agent IA"
]) if (!home.includes(text)) errors.push(`home missing FE-06R media-2.0 content: ${text}`);

if (!home.includes("/avance/nif-ignition-fusion-2022/")) errors.push("home missing lead article route");
if (!home.includes("/preuves/ev-2022-006002/")) errors.push("home missing lead proof route");
if (!home.includes("/reality-check/ignition-nest-pas-electricite-commerciale/")) errors.push("home missing Reality Check route");
if (!home.includes("/machine/avance/nif-ignition-fusion-2022.json")) errors.push("home missing agent representation route");

if (home.includes("Aucune avancée n’est encore déclarée validée.")) {
  errors.push("home still contains obsolete FE-01 placeholder");
}

const today = htmlByPath.get("dist/aujourdhui/index.html") ?? "";
if (!today.includes("Aucune nouvelle avancée publiée automatiquement")) errors.push("today page must disclose no current validated feed");
if (!today.includes("Les 50 événements déjà présents constituent le socle historique")) errors.push("today page must distinguish historical baseline from current news");
if (!today.includes("Pas de faux")) errors.push("today page must explicitly reject fake real-time presentation");

const referenceArticle = articles[0];
const articlePath = referenceArticle ? `dist/avance/${referenceArticle.slug}/index.html` : "";
const article = htmlByPath.get(articlePath) ?? "";
if (!referenceArticle) errors.push("reference article data missing");
else {
  for (const text of [
    referenceArticle.title,
    "AVANCÉE DE RÉFÉRENCE",
    "État canonique non évalué",
    "Avant",
    "Nouvelle preuve",
    "Maintenant",
    "EVIDENCE SPINE",
    "CE QUE CELA NE PROUVE PAS",
    "WATCH HORIZON",
    "AGENT VIEW"
  ]) if (!article.includes(text)) errors.push(`reference article missing: ${text}`);
  for (const eid of referenceArticle.related_evidence_ids) {
    if (!article.includes(eid)) errors.push(`reference article missing evidence atom ${eid}`);
  }
  if (!article.includes("/preuves/ev-2022-006002/")) errors.push("reference article missing proof dossier link");
  if (!article.includes("/reality-check/ignition-nest-pas-electricite-commerciale/")) errors.push("reference article missing Reality Check link");
  if (!article.includes(`/machine/avance/${referenceArticle.slug}.json`)) errors.push("reference article missing machine representation link");

  try {
    const packet = await readJson(`dist/machine/avance/${referenceArticle.slug}.json`);
    if (packet.id !== referenceArticle.id) errors.push("machine packet article id mismatch");
    if (packet.as_of !== referenceArticle.as_of) errors.push("machine packet as_of mismatch");
    if (packet.question_id !== referenceArticle.question_id) errors.push("machine packet question mismatch");
    if (packet.state?.status !== "unassessed") errors.push("machine packet must preserve unassessed state");
    if (packet.citations?.length !== referenceArticle.related_evidence_ids.length) errors.push("machine packet citation count mismatch");
    for (const eid of referenceArticle.related_evidence_ids) {
      if (!packet.citations?.some((x) => x.evidence_id === eid)) errors.push(`machine packet missing citation ${eid}`);
    }
  } catch (error) {
    errors.push("machine packet invalid JSON: " + error.message);
  }
}

const reality = htmlByPath.get("dist/reality-check/ignition-nest-pas-electricite-commerciale/index.html") ?? "";
for (const text of ["CLAIM STRESS TEST", "CONCLUSION PERMISE", "CONCLUSION EXCESSIVE", "2,05 MJ", "3,15 MJ"]) {
  if (!reality.includes(text)) errors.push(`Reality Check missing: ${text}`);
}

const ask = htmlByPath.get("dist/ask/index.html") ?? "";
if (!ask.includes("NOT YET OPEN") || !ask.includes("Pas de faux chatbot")) errors.push("Ask preview must disclose non-functional status");

const search = htmlByPath.get("dist/recherche/index.html") ?? "";
for (const text of ["QUESTION", "CHANGE / ARTICLE", "CLAIM / EVIDENCE"]) {
  if (!search.includes(text)) errors.push(`search prototype missing result type: ${text}`);
}

const referenceObs = editorialObs[0];
if (!referenceObs) errors.push("reference observatory editorial model missing");
else {
  const obsPath = `dist/questions/${referenceObs.slug}/index.html`;
  const obsPage = htmlByPath.get(obsPath) ?? "";
  for (const text of [
    "STATE ROOM",
    "TIMEGLASS",
    "La trajectoire des preuves.",
    "MILESTONE FIELD",
    "Six conditions. Aucun raccourci.",
    "COMPETING PATHS",
    "Trois architectures, trois trajectoires.",
    "EVIDENCE LANDSCAPE",
    "CONTRADICTION SPLIT",
    "WATCH HORIZON",
    "AGENT STATE",
    "État canonique non évalué"
  ]) if (!obsPage.includes(text)) errors.push(`reference observatory missing: ${text}`);

  for (const eventId of referenceObs.evidence_landscape.supporting_event_ids) {
    if (!obsPage.includes(eventId)) errors.push(`reference observatory missing evidence event ${eventId}`);
    if (!obsPage.includes(`/preuves/${eventId.toLowerCase()}/`)) errors.push(`reference observatory missing proof route for ${eventId}`);
  }

  for (const path of referenceObs.paths) {
    if (!obsPage.includes(path.label)) errors.push(`reference observatory missing path: ${path.label}`);
  }

  if (!obsPage.includes(`/machine/observatoires/${referenceObs.slug}.json`)) errors.push("reference observatory missing machine state route");
  if (!obsPage.includes("/avance/nif-ignition-fusion-2022/")) errors.push("reference observatory missing advancement route");
  if (!obsPage.includes("/reality-check/ignition-nest-pas-electricite-commerciale/")) errors.push("reference observatory missing Reality Check route");
  if (obsPage.includes("radar-card") || obsPage.includes("radar-center")) errors.push("reference observatory must not contain decorative radar");
  if (obsPage.includes("%") && /progress|completion|complete/i.test(obsPage)) errors.push("reference observatory contains suspicious percentage progress UI");

  try {
    const packet = await readJson(`dist/machine/observatoires/${referenceObs.slug}.json`);
    if (packet.id !== referenceObs.id) errors.push("observatory machine packet id mismatch");
    if (packet.question_id !== referenceObs.question_id) errors.push("observatory machine packet question mismatch");
    if (packet.as_of !== referenceObs.as_of) errors.push("observatory machine packet as_of mismatch");
    if (packet.state?.status !== "unassessed") errors.push("observatory machine packet must preserve unassessed state");
    if (packet.events?.length !== referenceObs.evidence_landscape.supporting_event_ids.length) errors.push("observatory machine event count mismatch");
    if (packet.milestone_states?.some((m) => m.status !== "unassessed")) errors.push("observatory machine packet fabricated milestone state");
    if (packet.paths?.length !== referenceObs.paths.length) errors.push("observatory machine paths mismatch");
    if (packet.evidence_landscape?.contradicting_event_ids?.length !== 0) errors.push("reference observatory contradiction set changed unexpectedly");
  } catch (error) {
    errors.push("observatory machine packet invalid JSON: " + error.message);
  }
}

const method = htmlByPath.get("dist/methodologie/index.html") ?? "";
for (const phrase of [
  "R4 · OPEN THE MACHINE",
  "Douze portes avant une conclusion.",
  "SIGNAL",
  "SOURCE PRIMAIRE",
  "AUTHENTICITÉ + STATUT",
  "CLAIM",
  "EVIDENCE + LOCATOR",
  "INDÉPENDANCE",
  "LIMITES + CONTRADICTIONS",
  "RÉPLICATION",
  "ÉTAT PRÉCÉDENT",
  "CHANGE PROPOSÉ",
  "REVUE HUMAINE",
  "PUBLICATION + PROPAGATION",
  "SOURCE HIERARCHY",
  "EVIDENCE LADDERS",
  "STATE RESOLUTION",
  "CHANGE ENGINE · FE-04",
  "HUMAN GATE",
  "CORRECTION TRAIL",
  "ONE TRUTH · MULTIPLE VIEWS",
  "ABSTENTION IS A FEATURE",
  "MACHINE CONTRACT",
  "Hypothèse",
  "Préprint",
  "Animal",
  "Événement sourcé",
  "≠ jalon atteint"
]) if (!method.includes(phrase)) errors.push(`R4 methodology missing: ${phrase}`);

for (const sourceTier of ["Primaire forte","Secondaire spécialisée","Communication","Signal"]) {
  if (!method.includes(sourceTier)) errors.push(`R4 source hierarchy missing: ${sourceTier}`);
}
for (const scale of ["M0 · hypothèse","M7 · usage clinique réel","T0 · concept","T7 · usage courant","S0 · hypothèse","S5 · consensus robuste / usage scientifique"]) {
  if (!method.includes(scale)) errors.push(`R4 evidence ladder missing: ${scale}`);
}
for (const changeType of ["none","minor_progress","evidence_upgrade","milestone_reached","setback","invalidation"]) {
  if (!method.includes(changeType)) errors.push(`R4 Change type missing: ${changeType}`);
}
if (!method.includes("/machine/methodologie.json")) errors.push("R4 methodology missing machine contract route");
if (!method.includes("/machine/avance/nif-ignition-fusion-2022.json")) errors.push("R4 methodology missing Agent Answer Packet example");
if (!method.includes("/questions/energie-de-fusion-commerciale/")) errors.push("R4 methodology missing observatory example");

try {
  const contract = await readJson("dist/machine/methodologie.json");
  if (contract.schema_version !== "fe/methodology-contract/v1") errors.push("R4 methodology contract schema mismatch");
  if (contract.canonical_truth !== "future_graph") errors.push("R4 methodology contract canonical truth mismatch");
  if (contract.source_tiers?.D !== "signal_only") errors.push("R4 methodology contract D source rule mismatch");
  if (contract.evidence_scales?.medicine?.length !== 8) errors.push("R4 medicine evidence scale mismatch");
  if (contract.evidence_scales?.technology?.length !== 8) errors.push("R4 technology evidence scale mismatch");
  if (contract.evidence_scales?.fundamental_science?.length !== 6) errors.push("R4 science evidence scale mismatch");
  if (contract.change_types?.length !== 6) errors.push("R4 change type count mismatch");
  if (contract.change_invariants?.human_review_required !== true) errors.push("R4 human review invariant missing");
  if (contract.change_invariants?.before_after_hash_binding !== true) errors.push("R4 hash binding invariant missing");
  if (!/unassessed/i.test(contract.state_rule ?? "")) errors.push("R4 state resolution unassessed rule missing");
  if (!/Insufficient evidence/i.test(contract.publication_rule ?? "")) errors.push("R4 abstention publication rule missing");
} catch (error) {
  errors.push("R4 methodology machine contract invalid JSON: " + error.message);
}

for (const q of questions) {
  const path = `dist/questions/${q.slug}/index.html`;
  const page = htmlByPath.get(path) ?? "";
  if (!page.includes(q.title)) errors.push(`${q.id}: title missing`);
  if (!page.includes("État canonique non évalué")) errors.push(`${q.id}: State Plate must disclose unassessed state`);
  if (page.includes("radar-card") || page.includes("radar-center")) errors.push(`${q.id}: decorative radar must not remain`);
  if (q.id === "Q-006") {
    if (!page.includes("MILESTONE FIELD")) errors.push(`${q.id}: R3 milestone field missing`);
    if (!page.includes("TIMEGLASS")) errors.push(`${q.id}: R3 Timeglass missing`);
  } else {
    if (!page.includes("La route vers une réponse.")) errors.push(`${q.id}: milestone section missing`);
    if (!page.includes("Chronologie fondatrice")) errors.push(`${q.id}: timeline missing`);
  }
  if (!page.includes(profileLabel[q.evidence_profile] ?? q.evidence_profile)) errors.push(`${q.id}: French evidence-profile label missing`);
  const qEvents = events.filter((e) => e.question_ids.includes(q.id));
  if (qEvents.length < 5) errors.push(`${q.id}: less than five source-backed events`);
  for (const event of qEvents) {
    const fr = editorialFrByEvent.get(event.id);
    if (!fr) errors.push(`${event.id}: missing French editorial entry`);
    else {
      if (!page.includes(fr.title)) errors.push(`${q.id}: French event title missing from public timeline: ${event.id}`);
      if (!page.includes(fr.claim)) errors.push(`${q.id}: French event summary missing from public timeline: ${event.id}`);
      if (event.title !== fr.title && page.includes(`<h3>${event.title}</h3>`)) errors.push(`${event.id}: English event title leaked into French timeline`);
      const canonicalClaim = claimById.get(event.claim_ids?.[0]);
      if (canonicalClaim?.text && canonicalClaim.text !== fr.claim && page.includes(`<p>${canonicalClaim.text}</p>`)) errors.push(`${event.id}: English claim leaked into French timeline`);
    }
    const proofHref = `/preuves/${event.id.toLowerCase()}/`;
    if (!page.includes(proofHref)) errors.push(`${q.id}: internal proof link missing for ${event.id}`);
  }
}

for (const event of events) {
  const path = `dist/preuves/${event.id.toLowerCase()}/index.html`;
  const page = htmlByPath.get(path) ?? "";
  const claim = claimById.get(event.claim_ids?.[0]);
  const ev = evidenceById.get(claim?.evidence_ids?.[0]);
  const source = sourceById.get(ev?.source_id);
  const fr = editorialFrByEvent.get(event.id);

  if (!claim || !ev || !source || !fr) {
    errors.push(`${event.id}: canonical proof chain incomplete`);
    continue;
  }

  for (const expected of [
    event.id,
    fr.title,
    fr.claim,
    source.title,
    localizeLocator(ev.locator),
    source.canonical_url.replaceAll("&", "&amp;"),
    "Titre original de la source",
    "État :",
    "non évalué"
  ]) if (!page.includes(expected)) errors.push(`${event.id}: proof page missing ${expected}`);

  if (event.title !== fr.title && page.includes(`<h1>${event.title}</h1>`)) errors.push(`${event.id}: English event title leaked into French proof dossier`);
  if (claim.text !== fr.claim && page.includes(`<p>${claim.text}</p>`)) errors.push(`${event.id}: English claim leaked into French proof dossier`);
  if (ev.locator !== localizeLocator(ev.locator) && page.includes(`<b>Repère dans la source :</b> ${ev.locator}`)) errors.push(`${event.id}: English source locator leaked into French proof dossier`);
  if (page.includes("machine_proposed")) errors.push(`${event.id}: internal review state leaked into French public page`);
  if (page.includes("03 · Claim") || page.includes("Tier ")) errors.push(`${event.id}: English editorial label leaked into public page`);
  if (claim.review_state !== "machine_proposed") errors.push(`${event.id}: FE-06 cannot present baseline claim as human approved`);
  if (event.change_type !== "unassessed") errors.push(`${event.id}: FE-06 baseline event must remain unassessed`);
}

const internalRouteSet = new Set([
  "/",
  "/aujourdhui/",
  "/questions/",
  "/methodologie/",
  "/reality-check/",
  "/reality-check/ignition-nest-pas-electricite-commerciale/",
  "/ask/",
  "/recherche/",
  "/machine/methodologie.json",
  ...articles.map((a) => `/avance/${a.slug}/`),
  ...articles.map((a) => `/machine/avance/${a.slug}.json`),
  ...editorialObs.map((o) => `/machine/observatoires/${o.slug}.json`),
  ...questions.map((q) => `/questions/${q.slug}/`),
  ...events.map((e) => `/preuves/${e.id.toLowerCase()}/`)
]);

for (const [path, html] of htmlByPath) {
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    if (href.startsWith("/assets/")) continue;
    if (!internalRouteSet.has(href)) errors.push(`${path}: broken internal href ${href}`);
  }
}

const css = await readFile(new URL("dist/assets/styles.css", root), "utf8");
const cssBytes = Buffer.byteLength(css);
const homeBytes = Buffer.byteLength(home);
if (cssBytes > 60000) errors.push(`CSS budget exceeded: ${cssBytes}`);
if (homeBytes > 70000) errors.push(`home HTML budget exceeded: ${homeBytes}`);
if (!css.includes("@media(max-width:620px)")) errors.push("mobile breakpoint missing");
if (!css.includes("@media(prefers-reduced-motion:reduce)")) errors.push("reduced-motion support missing");
if (!css.includes(":focus")) errors.push("focus affordance missing");
for (const primitive of [".state-plate", ".delta-block", ".evidence-spine", ".watch-horizon", ".mobile-dock", ".obs2-timeglass", ".obs2-evidence-grid", ".obs2-contradiction", ".method2-flow", ".method2-source-grid", ".method2-state-grid", ".method2-correction-flow", ".method2-machine-stack"]) {
  if (!css.includes(primitive)) errors.push(`media-2.0 primitive CSS missing: ${primitive}`);
}
if (!css.includes("@media(max-width:700px)")) errors.push("media-2.0 mobile breakpoint missing");

const graph = await readJson("dist/data/future-graph.json");
if (graph.counts?.events !== 50) errors.push(`public graph event count mismatch: ${graph.counts?.events}`);
if (graph.counts?.claims !== 50) errors.push(`public graph claim count mismatch: ${graph.counts?.claims}`);

if (errors.length) {
  console.error("FE06_PUBLIC_MEDIA_FAIL");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(`FE06R_REFERENCE_SURFACES_PASS|reference_article=${articles.length}|reference_observatory=${editorialObs.length}|reference_methodology=1|delta=1|state_plate=1|evidence_spine=1|timeglass=1|evidence_landscape=1|contradiction_split=1|correction_trail=1|reality_check=1|agent_packet=1|observatory_packet=1|methodology_packet=1|historical_news_separation=1|home_bytes=${homeBytes}`);

console.log(
  `FE06_PUBLIC_MEDIA_PASS|pages=${htmlPaths.length}|observatories=${questions.length}` +
  `|proof_pages=${events.length}|orphan_public_claims=0|broken_internal_links=0` +
  `|client_js=0|milestone_overclaims=0|css_bytes=${cssBytes}|home_bytes=${homeBytes}` +
  "|mobile_breakpoint=1|reduced_motion=1|skip_link=1"
);