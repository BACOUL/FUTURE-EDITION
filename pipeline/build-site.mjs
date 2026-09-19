import { readFile, mkdir, rm, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const questions = JSON.parse(await readFile(new URL("data/questions/questions.json", root), "utf8"));
const graph = JSON.parse(await readFile(new URL("generated/future-graph.json", root), "utf8"));
const out = new URL("dist/", root);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const layout = (title, description, body) => `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#071018">
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <header class="shell header">
    <a class="brand" href="/">FUTURE <span>EDITION</span></a>
    <nav aria-label="Navigation principale">
      <a href="/aujourdhui/">Aujourd’hui</a>
      <a href="/questions/">Questions</a>
      <a href="/methodologie/">Méthode</a>
    </nav>
  </header>
  <main>${body}</main>
  <footer class="shell footer">
    <strong>Future Edition</strong>
    <span>Nous suivons ce qui devient possible.</span>
    <a href="/methodologie/">Méthodologie</a>
  </footer>
</body>
</html>`;

const writePage = async (path, html) => {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const dir = clean ? new URL(`${clean}/`, out) : out;
  await mkdir(dir, { recursive: true });
  await writeFile(new URL("index.html", dir), html);
};

const cards = questions.map((q, index) => `
<a class="card" href="/questions/${esc(q.slug)}/">
  <span class="num">${String(index + 1).padStart(2, "0")}</span>
  <div>
    <h3>${esc(q.title)}</h3>
    <p>${esc(q.summary)}</p>
    <span class="pill">État à établir par preuve</span>
  </div>
</a>`).join("");

await writePage("/", layout(
  "Future Edition — Ce qui devient possible",
  "Future Edition suit les avancées qui peuvent changer notre vie.",
  `<section class="shell hero">
    <p class="eyebrow">Observatoire du progrès réel</p>
    <h1>Ce qui devient possible.</h1>
    <p class="lead">Nous suivons les avancées qui peuvent changer notre vie, remontons aux preuves et montrons ce qui a réellement changé.</p>
  </section>
  <section class="shell section">
    <div class="today">
      <p class="eyebrow dark">Aujourd’hui</p>
      <h2>Aucune avancée n’est encore déclarée validée.</h2>
      <p>Les premiers états seront publiés après constitution de la base de preuves.</p>
      <a href="/methodologie/">Voir comment nous vérifions →</a>
    </div>
  </section>
  <section class="shell section">
    <p class="eyebrow">10 observatoires</p>
    <h2>Les grandes questions</h2>
    <div class="grid">${cards}</div>
  </section>`
));

await writePage("/aujourdhui", layout(
  "Aujourd’hui — Future Edition",
  "Les changements réellement importants détectés par Future Edition.",
  `<section class="shell hero narrow">
    <p class="eyebrow">Aujourd’hui</p>
    <h1>Nous ne publierons pas pour remplir le vide.</h1>
    <p class="lead">Aucune avancée n’est encore validée dans le Future Graph initial.</p>
  </section>`
));

await writePage("/questions", layout(
  "Questions — Future Edition",
  "Les grandes questions suivies par Future Edition.",
  `<section class="shell hero narrow">
    <p class="eyebrow">Observatoires</p>
    <h1>10 questions que nous suivrons pendant des années.</h1>
    <p class="lead">Chaque question possède des jalons prédéfinis.</p>
  </section>
  <section class="shell section">
    <div class="grid">${cards}</div>
  </section>`
));

for (const q of questions) {
  const milestones = q.milestones.map((m) => `
    <li>
      <strong>${esc(m.title)}</strong>
      <span>${esc(m.criterion)}</span>
      <em>Non évalué</em>
    </li>`).join("");

  await writePage(`/questions/${q.slug}`, layout(
    `${q.title} — Future Edition`,
    q.summary,
    `<section class="shell hero narrow">
      <p class="eyebrow">${esc(q.id)}</p>
      <h1>${esc(q.title)}</h1>
      <p class="lead">${esc(q.summary)}</p>
      <span class="pill">Baseline scientifique en attente</span>
    </section>
    <section class="shell section narrow">
      <h2>Jalons</h2>
      <ol class="milestones">${milestones}</ol>
      <p class="notice">Aucun jalon n’est déclaré atteint avant revue des preuves.</p>
    </section>`
  ));
}

await writePage("/methodologie", layout(
  "Méthodologie — Future Edition",
  "Comment Future Edition vérifie les avancées.",
  `<section class="shell hero narrow">
    <p class="eyebrow">Méthodologie</p>
    <h1>La preuve avant le bruit.</h1>
    <p class="lead">Une information n’est pas considérée vraie parce qu’elle est virale, répétée ou formulée avec assurance par une IA.</p>
  </section>
  <section class="shell section narrow prose">
    <h2>Source primaire</h2>
    <p>Nous remontons à la publication, au registre, à l’autorité ou à la donnée originale.</p>
    <h2>Niveau de preuve</h2>
    <p>Nous séparons hypothèse, laboratoire, animal, humain, validation avancée et usage réel.</p>
    <h2>Avant → après</h2>
    <p>Nous mesurons ce que la nouvelle preuve permet réellement d’affirmer de plus.</p>
    <h2>Corrections</h2>
    <p>Rétractations et changements d’interprétation restent visibles dans l’historique.</p>
  </section>`
));

await mkdir(new URL("assets/", out), { recursive: true });
await writeFile(new URL("assets/styles.css", out), `*{box-sizing:border-box}html{background:#071018;color:#eef6fa;font-family:Inter,ui-sans-serif,system-ui,sans-serif}body{margin:0;background:radial-gradient(circle at 80% 4%,rgba(56,189,248,.14),transparent 28rem),#071018}a{color:inherit;text-decoration:none}.shell{width:min(1160px,calc(100% - 36px));margin:auto}.header{min-height:76px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff14}.header nav{display:flex;gap:22px;color:#9cb0bc}.brand{font-weight:900;letter-spacing:-.04em}.brand span,.eyebrow{color:#7dd3fc}.hero{padding:88px 0 56px}.narrow{max-width:860px}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:.74rem;font-weight:800}.dark{color:#164a60}h1{font-size:clamp(3rem,8vw,7rem);line-height:.9;letter-spacing:-.07em;margin:18px 0 22px}h2{font-size:clamp(2rem,4vw,3.2rem);letter-spacing:-.05em}.lead{color:#b6c7d0;font-size:clamp(1.08rem,2vw,1.34rem);line-height:1.65;max-width:760px}.section{padding:48px 0 72px}.today{background:#eff8fb;color:#071018;padding:34px;border-radius:24px}.today h2{margin:8px 0 12px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{padding:26px;border:1px solid #ffffff17;border-radius:22px;min-height:210px;display:flex;flex-direction:column;justify-content:space-between;background:#ffffff06}.card:hover{border-color:#7dd3fc88}.card h3{font-size:1.5rem;letter-spacing:-.035em;margin:24px 0 10px}.card p,.prose p,.milestones span{color:#9fb2bd;line-height:1.6}.num{color:#607985;font-size:.8rem}.pill{display:inline-flex;margin-top:18px;padding:7px 10px;border-radius:999px;background:#7dd3fc15;color:#9be1ff;font-size:.78rem}.milestones{padding:0;list-style:none;display:grid;gap:12px}.milestones li{border:1px solid #ffffff17;border-radius:16px;padding:20px;display:grid;gap:7px}.milestones em{font-style:normal;color:#7dd3fc;font-size:.8rem}.notice{padding:18px;border-left:3px solid #7dd3fc;background:#ffffff06;color:#b6c7d0}.footer{border-top:1px solid #ffffff14;padding:42px 0 58px;display:grid;gap:7px;color:#8fa5b2}.footer strong{color:#eef6fa}@media(max-width:720px){.grid{grid-template-columns:1fr}.header nav a:last-child{display:none}.header nav{gap:13px;font-size:.84rem}.hero{padding:60px 0 42px}h1{font-size:clamp(3rem,15vw,5.2rem)}}`);

await mkdir(new URL("data/", out), { recursive: true });
await writeFile(new URL("data/future-graph.json", out), JSON.stringify(graph, null, 2) + "\n");

const urls = [
  "/",
  "/aujourdhui/",
  "/questions/",
  "/methodologie/",
  ...questions.map((q) => `/questions/${q.slug}/`)
];

await writeFile(
  new URL("sitemap.xml", out),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>https://future-edition.pages.dev${u}</loc></url>`).join("")}</urlset>`
);

await writeFile(
  new URL("robots.txt", out),
  "User-agent: *\nAllow: /\nSitemap: https://future-edition.pages.dev/sitemap.xml\n"
);

console.log(`FUTURE_SITE_BUILT|pages=${urls.length}|questions=${questions.length}`);
