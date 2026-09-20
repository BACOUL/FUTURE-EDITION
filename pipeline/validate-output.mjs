import { access, readFile, readdir, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const [questions, events, claims, evidence, sources, editorialFr, editorialArticles] = await Promise.all([
  readJson("data/questions/questions.json"),
  readJson("data/events/events.json"),
  readJson("data/claims/claims.json"),
  readJson("data/evidence/evidence.json"),
  readJson("data/sources/sources.json"),
  readJson("data/editorial/fr/events.json"),
  readJson("data/editorial/fr/articles.json")
]);
const articles = editorialArticles.entries ?? [];

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
  "Ce qui devient",
  "possible.",
  "Reality Check",
  "Des repères, pas un faux fil d’actualité.",
  "Un média qui conserve l’état du monde",
  "Dix questions qui valent des années de suivi.",
  "Future Graph",
  "354"
]) if (!home.includes(text)) errors.push(`home missing FE-06R reference content: ${text}`);

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

const method = htmlByPath.get("dist/methodologie/index.html") ?? "";
for (const phrase of ["Hypothèse", "Préprint", "Animal", "Affirmation", "Événement sourcé", "≠ jalon atteint"]) {
  if (!method.includes(phrase)) errors.push(`methodology missing epistemic rule: ${phrase}`);
}

for (const q of questions) {
  const path = `dist/questions/${q.slug}/index.html`;
  const page = htmlByPath.get(path) ?? "";
  if (!page.includes(q.title)) errors.push(`${q.id}: title missing`);
  if (!page.includes("État canonique non évalué")) errors.push(`${q.id}: State Plate must disclose unassessed state`);
  if (page.includes("radar-card") || page.includes("radar-center")) errors.push(`${q.id}: decorative radar must not remain`);
  if (!page.includes("La route vers une réponse.")) errors.push(`${q.id}: milestone section missing`);
  if (!page.includes("Chronologie fondatrice")) errors.push(`${q.id}: timeline missing`);
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
  ...articles.map((a) => `/avance/${a.slug}/`),
  ...articles.map((a) => `/machine/avance/${a.slug}.json`),
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
for (const primitive of [".state-plate", ".delta-block", ".evidence-spine", ".watch-horizon", ".mobile-dock"]) {
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

console.log(`FE06R_REFERENCE_SURFACES_PASS|reference_article=${articles.length}|delta=1|state_plate=1|evidence_spine=1|reality_check=1|agent_packet=1|historical_news_separation=1|home_bytes=${homeBytes}`);

console.log(
  `FE06_PUBLIC_MEDIA_PASS|pages=${htmlPaths.length}|observatories=${questions.length}` +
  `|proof_pages=${events.length}|orphan_public_claims=0|broken_internal_links=0` +
  `|client_js=0|milestone_overclaims=0|css_bytes=${cssBytes}|home_bytes=${homeBytes}` +
  "|mobile_breakpoint=1|reduced_motion=1|skip_link=1"
);