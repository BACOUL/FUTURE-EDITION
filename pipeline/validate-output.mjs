import { access, readFile, readdir, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const [questions, events, claims, evidence, sources] = await Promise.all([
  readJson("data/questions/questions.json"),
  readJson("data/events/events.json"),
  readJson("data/claims/claims.json"),
  readJson("data/evidence/evidence.json"),
  readJson("data/sources/sources.json")
]);

const required = [
  "dist/index.html",
  "dist/aujourdhui/index.html",
  "dist/questions/index.html",
  "dist/methodologie/index.html",
  "dist/assets/styles.css",
  "dist/data/future-graph.json",
  "dist/robots.txt",
  "dist/sitemap.xml",
  ...questions.map((q) => `dist/questions/${q.slug}/index.html`),
  ...events.map((e) => `dist/preuves/${e.id.toLowerCase()}/index.html`)
];

const errors = [];
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
  if (html.includes("undefined") || html.includes("[object Object]")) errors.push(`${path}: serialization artifact`);
  if (/<script[\s>]/i.test(html)) errors.push(`${path}: unexpected client JavaScript`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${path}: title missing`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) errors.push(`${path}: meta description missing`);
};

for (const [path, html] of htmlByPath) baseChecks(path, html);

const home = htmlByPath.get("dist/index.html") ?? "";
for (const text of [
  "Le futur,",
  "preuve à l’appui.",
  "50",
  "événements fondateurs sourcés",
  "10 observatoires",
  "51 jalons",
  "Les derniers repères du socle"
]) if (!home.includes(text)) errors.push(`home missing FE-06 content: ${text}`);

if (home.includes("Aucune avancée n’est encore déclarée validée.")) {
  errors.push("home still contains obsolete FE-01 placeholder");
}

const today = htmlByPath.get("dist/aujourdhui/index.html") ?? "";
if (!today.includes("0 changement de jalon approuvé")) errors.push("today page must disclose zero approved milestone changes");
if (!today.includes("50 événements historiques vérifiés")) errors.push("today page missing verified baseline count");

const method = htmlByPath.get("dist/methodologie/index.html") ?? "";
for (const phrase of ["Hypothèse", "Préprint", "Animal", "Événement sourcé", "≠ jalon atteint"]) {
  if (!method.includes(phrase)) errors.push(`methodology missing epistemic rule: ${phrase}`);
}

for (const q of questions) {
  const path = `dist/questions/${q.slug}/index.html`;
  const page = htmlByPath.get(path) ?? "";
  if (!page.includes(q.title)) errors.push(`${q.id}: title missing`);
  if (!page.includes("État non évalué")) errors.push(`${q.id}: radar must disclose unassessed state`);
  if (!page.includes("La route vers une réponse.")) errors.push(`${q.id}: milestone section missing`);
  if (!page.includes("Chronologie fondatrice")) errors.push(`${q.id}: timeline missing`);
  const qEvents = events.filter((e) => e.question_ids.includes(q.id));
  if (qEvents.length < 5) errors.push(`${q.id}: less than five source-backed events`);
  for (const event of qEvents) {
    if (!page.includes(event.title)) errors.push(`${q.id}: event missing from public timeline: ${event.id}`);
    const proofHref = `/preuves/${event.id.toLowerCase()}/`;
    if (!page.includes(proofHref)) errors.push(`${q.id}: internal proof link missing for ${event.id}`);
  }
}

const claimById = new Map(claims.map((x) => [x.id, x]));
const evidenceById = new Map(evidence.map((x) => [x.id, x]));
const sourceById = new Map(sources.map((x) => [x.id, x]));

for (const event of events) {
  const path = `dist/preuves/${event.id.toLowerCase()}/index.html`;
  const page = htmlByPath.get(path) ?? "";
  const claim = claimById.get(event.claim_ids?.[0]);
  const ev = evidenceById.get(claim?.evidence_ids?.[0]);
  const source = sourceById.get(ev?.source_id);

  if (!claim || !ev || !source) {
    errors.push(`${event.id}: canonical proof chain incomplete`);
    continue;
  }

  for (const expected of [
    event.id,
    event.title,
    claim.text,
    source.title,
    ev.locator,
    source.canonical_url.replaceAll("&", "&amp;"),
    "État :",
    "non évalué"
  ]) if (!page.includes(expected)) errors.push(`${event.id}: proof page missing ${expected}`);

  if (claim.review_state !== "machine_proposed") errors.push(`${event.id}: FE-06 cannot present baseline claim as human approved`);
  if (event.change_type !== "unassessed") errors.push(`${event.id}: FE-06 baseline event must remain unassessed`);
}

const internalRouteSet = new Set([
  "/",
  "/aujourdhui/",
  "/questions/",
  "/methodologie/",
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
if (homeBytes > 180000) errors.push(`home HTML budget exceeded: ${homeBytes}`);
if (!css.includes("@media(max-width:620px)")) errors.push("mobile breakpoint missing");
if (!css.includes("@media(prefers-reduced-motion:reduce)")) errors.push("reduced-motion support missing");
if (!css.includes(":focus")) errors.push("focus affordance missing");

const graph = await readJson("dist/data/future-graph.json");
if (graph.counts?.events !== 50) errors.push(`public graph event count mismatch: ${graph.counts?.events}`);
if (graph.counts?.claims !== 50) errors.push(`public graph claim count mismatch: ${graph.counts?.claims}`);

if (errors.length) {
  console.error("FE06_PUBLIC_MEDIA_FAIL");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(
  `FE06_PUBLIC_MEDIA_PASS|pages=${htmlPaths.length}|observatories=${questions.length}` +
  `|proof_pages=${events.length}|orphan_public_claims=0|broken_internal_links=0` +
  `|client_js=0|milestone_overclaims=0|css_bytes=${cssBytes}|home_bytes=${homeBytes}` +
  "|mobile_breakpoint=1|reduced_motion=1|skip_link=1"
);