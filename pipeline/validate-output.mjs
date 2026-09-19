import { access, readFile, readdir, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const questions = JSON.parse(await readFile(new URL("data/questions/questions.json", root), "utf8"));
const required = [
  "dist/index.html",
  "dist/aujourdhui/index.html",
  "dist/questions/index.html",
  "dist/methodologie/index.html",
  "dist/assets/styles.css",
  "dist/data/future-graph.json",
  "dist/robots.txt",
  "dist/sitemap.xml",
  ...questions.map((q) => `dist/questions/${q.slug}/index.html`)
];

const errors = [];
for (const path of required) {
  try { await access(new URL(path, root)); }
  catch { errors.push(`missing output: ${path}`); }
}

const home = await readFile(new URL("dist/index.html", root), "utf8");
if (!home.includes("Aucune avancée n’est encore déclarée validée.")) {
  errors.push("home must preserve unassessed scientific state");
}
if (home.includes("undefined") || home.includes("[object Object]")) {
  errors.push("home contains serialization artifact");
}

for (const q of questions) {
  const page = await readFile(new URL(`dist/questions/${q.slug}/index.html`, root), "utf8");
  if (!page.includes(q.title)) errors.push(`question title missing from page: ${q.id}`);
  if (!page.includes("Baseline scientifique en attente")) errors.push(`question baseline disclaimer missing: ${q.id}`);
}

if (errors.length) {
  console.error("FUTURE_SITE_INVALID");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`FUTURE_SITE_VALID|files=${required.length}|question_pages=${questions.length}`);
