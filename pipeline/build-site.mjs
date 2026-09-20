import { readFile, mkdir, rm, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const [questions, observatories, events, claims, evidence, sources, technologies, graph, editorialFr, editorialArticles] = await Promise.all([
  read("data/questions/questions.json"),
  read("data/observatories/observatories.json"),
  read("data/events/events.json"),
  read("data/claims/claims.json"),
  read("data/evidence/evidence.json"),
  read("data/sources/sources.json"),
  read("data/technologies/technologies.json"),
  read("generated/future-graph.json"),
  read("data/editorial/fr/events.json"),
  read("data/editorial/fr/articles.json")
]);

const out = new URL("../dist/", import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const byId = (items) => new Map(items.map((x) => [x.id, x]));
const claimById = byId(claims);
const sourceById = byId(sources);
const techById = byId(technologies);
const obsByQuestion = new Map(observatories.map((o) => [o.question_id, o]));
const editorialFrByEvent = new Map(Object.entries(editorialFr.entries ?? {}));
const articles = editorialArticles.entries ?? [];
const articleByEvent = new Map(articles.map((a) => [a.event_id, a]));
const evidenceById = byId(evidence);
const eventById = byId(events);
const profileLabel = {
  medical: "médical",
  technology: "technologie",
  fundamental_science: "science fondamentale"
};
const reviewStateLabel = {
  machine_proposed: "proposé par la machine",
  human_approved: "approuvé par un humain",
  human_rejected: "rejeté par un humain",
  not_required: "revue non requise"
};
const localizeEvent = (event) => editorialFrByEvent.get(event.id) ?? {
  title: event.title,
  claim: claimById.get(event.claim_ids?.[0])?.text ?? "",
  technology: techById.get(event.technology_ids?.[0])?.canonical_name ?? "",
  tech_desc: techById.get(event.technology_ids?.[0])?.description ?? ""
};

const esc = (v) => String(v ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const fmtDate = (v) => new Intl.DateTimeFormat("fr-FR", {
  year: "numeric", month: "short", day: "numeric", timeZone: "UTC"
}).format(new Date(v + "T00:00:00Z"));

const confidenceLabel = {
  confirmed: "Confirmé",
  solid_preliminary: "Préliminaire solide",
  needs_confirmation: "À confirmer",
  contested: "Contesté",
  misleading: "Trompeur",
  unverifiable: "Invérifiable",
  retracted_invalidated: "Invalidé"
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

const sourceLabel = {
  paper: "Publication",
  preprint: "Prépublication",
  trial_registry: "Registre",
  regulator: "Régulateur",
  official_data: "Donnée officielle",
  technical_report: "Rapport technique",
  institution_release: "Institution",
  media: "Média",
  social: "Social",
  correction_notice: "Correction",
  retraction_notice: "Rétractation",
  other: "Source"
};

const icon = (name) => ({
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  proof: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4M12 3l7 4v5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V7l7-4z"/></svg>',
  graph: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 7l3 9M16 7l-3 9M8 6h8"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>',
  ask: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v11H9l-4 3V5z"/><path d="M9 9h6M9 12h4"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4L19 6"/></svg>'
}[name]);

const writePage = async (path, html) => {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const dir = clean ? new URL(clean + "/", out) : out;
  await mkdir(dir, { recursive: true });
  await writeFile(new URL("index.html", dir), html);
};

const layout = (title, description, body, { active = "" } = {}) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(description)}"><meta name="theme-color" content="#060b10">
<title>${esc(title)}</title><link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="top"><div class="shell nav">
<a class="brand" href="/" aria-label="Future Edition, accueil"><span class="brand-mark">F</span><span>FUTURE<br><b>EDITION</b></span></a>
<nav class="desktop-nav" aria-label="Navigation principale">
<a class="${active === "today" ? "active" : ""}" href="/aujourdhui/">Aujourd’hui</a>
<a class="${active === "questions" ? "active" : ""}" href="/questions/">Observatoires</a>
<a class="${active === "reality" ? "active" : ""}" href="/reality-check/">Reality Check</a>
<a class="${active === "ask" ? "active" : ""}" href="/ask/">Ask</a>
<a class="${active === "search" ? "active" : ""}" href="/recherche/" aria-label="Recherche">${icon("search")}<span>Recherche</span></a>
</nav>
</div></header>
<main id="contenu">${body}</main>
<nav class="mobile-dock" aria-label="Navigation mobile">
<a class="${active === "today" ? "active" : ""}" href="/aujourdhui/"><span>Maintenant</span></a>
<a class="${active === "questions" ? "active" : ""}" href="/questions/"><span>Observatoires</span></a>
<a class="${active === "reality" ? "active" : ""}" href="/reality-check/"><span>Reality</span></a>
<a class="${active === "ask" ? "active" : ""}" href="/ask/"><span>Ask</span></a>
<a class="${active === "search" ? "active" : ""}" href="/recherche/"><span>Search</span></a>
</nav>
<footer><div class="shell footer-grid"><div><div class="brand footer-brand"><span class="brand-mark">F</span><span>FUTURE<br><b>EDITION</b></span></div><p>Un média pour voir comment l’état des connaissances change.</p></div><div><strong>Explorer</strong><a href="/aujourdhui/">Aujourd’hui</a><a href="/questions/">Observatoires</a><a href="/reality-check/">Reality Check</a><a href="/recherche/">Recherche</a></div><div><strong>Confiance</strong><a href="/methodologie/">Méthodologie</a><a href="/ask/">Ask Future Edition</a><p>50 événements fondateurs sourcés.<br>51 jalons encore non évalués.</p></div></div></footer>
</body></html>`;

const qEvents = (qid) => events.filter((e) => e.question_ids.includes(qid)).sort((a, b) => b.event_date.localeCompare(a.event_date));
const latestByQuestion = questions
  .map((q) => ({ q, event: qEvents(q.id)[0] }))
  .filter((x) => x.event)
  .sort((a, b) => b.event.event_date.localeCompare(a.event.event_date));

const articleHrefForEvent = (event) => {
  const article = articleByEvent.get(event?.id);
  return article ? `/avance/${article.slug}/` : `/preuves/${event?.id?.toLowerCase()}/`;
};

const statePlate = ({ question, latestEvent, asOf = "2026-09-20", compact = false }) => `
<aside class="state-plate ${compact ? "compact" : ""}" aria-label="État de connaissance">
  <div class="state-plate-head"><span>STATE</span><time datetime="${esc(asOf)}">as of ${fmtDate(asOf)}</time></div>
  <strong class="state-value">État canonique non évalué</strong>
  <p>Aucun jalon n’est promu automatiquement par la présence d’une preuve. Un Change validé est requis.</p>
  <div class="state-meta">
    <span><b>Question</b>${esc(question?.id ?? "")}</span>
    <span><b>Dernier repère du socle</b>${latestEvent ? fmtDate(latestEvent.event_date) : "—"}</span>
    <span><b>Statut</b>UNASSESSED</span>
  </div>
</aside>`;

const deltaBlock = (article) => `
<section class="delta-block" aria-label="Avant, nouvelle preuve, après">
  <div class="delta-line" aria-hidden="true"><span></span><i></i><span></span></div>
  <article class="delta-before"><span class="delta-label">01 · ${esc(article.before.label)}</span><h2>Avant</h2><p>${esc(article.before.text)}</p></article>
  <article class="delta-evidence"><span class="delta-label">02 · ${esc(article.evidence.label)}</span><h2>Preuve</h2><p>${esc(article.evidence.text)}</p><a href="/preuves/${esc(article.event_id.toLowerCase())}/">Ouvrir le dossier de preuve ${icon("arrow")}</a></article>
  <article class="delta-after"><span class="delta-label">03 · ${esc(article.after.label)}</span><h2>Maintenant</h2><p>${esc(article.after.text)}</p></article>
</section>`;

const eventCard = (event, { compact = false } = {}) => {
  const claim = claimById.get(event.claim_ids?.[0]);
  const source = sourceById.get(event.source_ids?.[0]);
  const tech = techById.get(event.technology_ids?.[0]);
  const q = questions.find((x) => x.id === event.question_ids?.[0]);
  const fr = localizeEvent(event);
  return `<article class="event-card ${compact ? "compact" : ""}">
   <div class="event-top"><time datetime="${esc(event.event_date)}">${fmtDate(event.event_date)}</time><span class="evidence-badge ${esc(claim?.confidence)}">${esc(confidenceLabel[claim?.confidence] ?? "Non évalué")}</span></div>
   <div><h3>${esc(fr.title)}</h3>
   ${tech ? `<p class="tech">${esc(fr.technology)}</p>` : ""}
   <p>${esc(fr.claim)}</p>
   <div class="event-meta"><span>${esc(q?.title ?? "")}</span><span>${esc(sourceLabel[source?.kind] ?? "Source")} · niveau ${esc(source?.tier ?? "–")}</span></div>
   <a class="proof-link" href="${articleHrefForEvent(event)}">${articleByEvent.has(event.id) ? icon("arrow") + " Lire l’analyse" : icon("proof") + " Ouvrir la preuve"}</a></div>
 </article>`;
};

const cards = questions.map((q, index) => {
  const qe = qEvents(q.id);
  const latest = qe[0];
  return `<a class="obs-card" href="/questions/${esc(q.slug)}/">
   <div class="obs-number">${String(index + 1).padStart(2, "0")}</div>
   <div class="obs-card-main"><span class="obs-kicker">${esc(profileLabel[q.evidence_profile] ?? q.evidence_profile)}</span><h3>${esc(q.title)}</h3><p>${esc(q.summary)}</p></div>
   <div class="obs-stats"><span><b>${qe.length}</b> preuves historiques</span><span><b>${q.milestones.length}</b> jalons</span></div>
   <div class="obs-latest">Dernier événement du socle <strong>${latest ? fmtDate(latest.event_date) : "—"}</strong></div>
   <span class="round-arrow">${icon("arrow")}</span>
 </a>`;
}).join("");

const recent = latestByQuestion.slice(0, 6).map(({ event }) => eventCard(event, { compact: true })).join("");

const r1Stories = latestByQuestion.slice(0, 3).map(({ event }, i) => {
  const fr = localizeEvent(event);
  const q = questions.find((x) => x.id === event.question_ids?.[0]);
  const claim = claimById.get(event.claim_ids?.[0]);
  return `<article class="r1-story r1-story-${i + 1}">
    <div class="r1-story-top"><span>${esc(q?.title ?? "")}</span><span>${fmtDate(event.event_date)}</span></div>
    <h3>${esc(fr.title)}</h3>
    <p>${esc(fr.claim)}</p>
    <div class="r1-story-bottom"><span>${esc(confidenceLabel[claim?.confidence] ?? "Non évalué")}</span><a href="${articleHrefForEvent(event)}">${articleByEvent.has(event.id) ? "Lire l’analyse" : "Voir la preuve"} ${icon("arrow")}</a></div>
  </article>`;
}).join("");

const r1Topics = questions.map((q, i) => `<a href="/questions/${esc(q.slug)}/"><span>${String(i + 1).padStart(2, "0")}</span><strong>${esc(q.title)}</strong><em>${esc(profileLabel[q.evidence_profile] ?? q.evidence_profile)}</em>${icon("arrow")}</a>`).join("");

const referenceArticle = articles[0];
const referenceEvent = referenceArticle ? eventById.get(referenceArticle.event_id) : null;
const referenceQuestion = referenceArticle ? questions.find((q) => q.id === referenceArticle.question_id) : null;
const referenceQuestionEvents = referenceQuestion ? qEvents(referenceQuestion.id) : [];

await writePage("/", layout(
  "Future Edition — Voir comment la connaissance change",
  "Future Edition rend visibles l’état, le changement, la preuve, le temps et les limites — pour les humains comme pour les agents IA.",
  `<section class="home2-clock">
    <div class="shell home2-clock-grid">
      <div><span>KNOWLEDGE CLOCK</span><strong>as of 20 sept. 2026</strong></div>
      <div><span>CURRENT FEED</span><strong>Pas encore ouvert</strong></div>
      <p>Aucun faux temps réel : cette édition de référence démontre le produit sur un événement historique déjà vérifié. Le flux continu sera ouvert après FE-07/08.</p>
      <a href="/aujourdhui/">Voir l’état d’aujourd’hui ${icon("arrow")}</a>
    </div>
  </section>

  <section class="home2-lead">
    <div class="shell home2-lead-grid">
      <div class="home2-lead-copy">
        <div class="home2-overline"><span>REFERENCE EDITION</span><span>HISTORICAL_BASELINE</span><span>Q-006 · FUSION</span></div>
        <h1>Le moment où l’ignition a cessé d’être <em>une cible.</em></h1>
        <p>Le 5 décembre 2022, le NIF a produit environ 3,15 MJ d’énergie de fusion après 2,05 MJ d’énergie laser délivrée à la cible. Future Edition ne s’arrête pas au mot « ignition » : il montre exactement ce que cette preuve change, et ce qu’elle ne change pas.</p>
        <div class="home2-lead-actions">
          <a class="r1-primary" href="/avance/nif-ignition-fusion-2022/">Lire l’avancée ${icon("arrow")}</a>
          <a class="r1-text-link" href="/preuves/ev-2022-006002/">Voir la preuve originale ${icon("proof")}</a>
        </div>
      </div>
      <figure class="home2-lead-visual" aria-label="Comparaison visuelle du NIF entre 2021 et 2022">
        <svg viewBox="0 0 760 660" role="img" aria-labelledby="home-v-title home-v-desc">
          <title id="home-v-title">Avant et après le franchissement du seuil d’ignition</title>
          <desc id="home-v-desc">Visualisation éditoriale comparant les rendements de fusion 2021 et 2022 au NIF, avec la ligne de 2,05 MJ délivrés à la cible.</desc>
          <rect width="760" height="660" fill="#071014"/>
          <text x="64" y="70" fill="#90a5ae" font-size="14" font-family="system-ui" letter-spacing="3">BEFORE / EVIDENCE / AFTER</text>
          <line x1="86" y1="466" x2="680" y2="466" stroke="#344b55"/>
          <line x1="86" y1="156" x2="86" y2="466" stroke="#344b55"/>
          <line x1="86" y1="278" x2="680" y2="278" stroke="#73e4ff" stroke-width="2" stroke-dasharray="9 12"/>
          <rect x="188" y="344" width="126" height="122" fill="#354a53"/>
          <rect x="448" y="196" width="126" height="270" fill="#d9ff74"/>
          <circle cx="511" cy="196" r="9" fill="#071014" stroke="#d9ff74" stroke-width="4"/>
          <text x="188" y="328" fill="#eef6f5" font-size="28" font-family="system-ui" font-weight="800">1,35 MJ</text>
          <text x="448" y="177" fill="#d9ff74" font-size="34" font-family="system-ui" font-weight="900">3,15 MJ</text>
          <text x="188" y="502" fill="#8ba0aa" font-size="17" font-family="system-ui">2021 · seuil approché</text>
          <text x="448" y="502" fill="#8ba0aa" font-size="17" font-family="system-ui">2022 · ignition</text>
          <text x="666" y="265" text-anchor="end" fill="#73e4ff" font-size="14" font-family="system-ui">2,05 MJ laser à la cible</text>
          <text x="86" y="578" fill="#eef6f5" font-size="42" font-family="system-ui" font-weight="800">Un changement mesurable.</text>
          <text x="86" y="612" fill="#8ba0aa" font-size="16" font-family="system-ui">Pas une promesse de centrale commerciale.</text>
        </svg>
      </figure>
    </div>
  </section>

  <section class="home2-core shell">
    <div class="home2-core-label"><span>STATE</span><span>CHANGE</span><span>EVIDENCE</span><span>TIME</span></div>
    ${statePlate({ question: referenceQuestion, latestEvent: referenceQuestionEvents[0], asOf: referenceArticle?.as_of ?? "2026-09-20", compact: true })}
    ${referenceArticle ? deltaBlock(referenceArticle) : ""}
  </section>

  <section class="home2-now">
    <div class="shell home2-now-grid">
      <div><p class="r1-kicker">AUJOURD’HUI</p><h2>Ne rien publier peut être une information.</h2></div>
      <div><strong>Aucune nouvelle avancée qualifiée dans le flux public.</strong><p>Les événements historiques restent dans les observatoires. Future Edition refuse de les recycler comme actualité pour donner l’impression que le média bouge.</p><a href="/aujourdhui/">Voir pourquoi ${icon("arrow")}</a></div>
    </div>
  </section>

  <section class="home2-reality">
    <div class="shell home2-reality-grid">
      <div class="home2-reality-label"><span>REALITY CHECK · RC-001</span><strong>Claim Stress Test</strong></div>
      <div class="home2-reality-claim"><span>AFFIRMATION PUBLIQUE</span><blockquote>« L’ignition signifie que l’électricité de fusion commerciale est démontrée. »</blockquote></div>
      <div class="home2-reality-result">
        <div><span>PERMIS</span><strong>L’ignition a été démontrée au NIF.</strong></div>
        <div><span>EXCESSIF</span><strong>Une centrale électrique commerciale est démontrée.</strong></div>
        <a href="/reality-check/ignition-nest-pas-electricite-commerciale/">Voir le stress test complet ${icon("arrow")}</a>
      </div>
    </div>
  </section>

  <section class="home2-watch">
    <div class="shell">
      <div class="r1-section-heading"><div><p class="r1-kicker">WATCH HORIZON</p><h2>Ce qui ferait réellement bouger l’état.</h2></div><p>Pas de date spéculative. Future Edition définit les preuves observables qui comptent ensuite.</p></div>
      <div class="home2-watch-grid">
        <article><span>Q-006-M2</span><h3>Reproductibilité</h3><p>Répéter le résultat clé de manière contrôlée.</p></article>
        <article><span>Q-006-M4</span><h3>Production électrique</h3><p>Convertir effectivement la fusion en électricité exploitable dans un système intégré.</p></article>
        <article><span>Q-006-M5</span><h3>Démonstrateur industriel</h3><p>Faire fonctionner l’ensemble sous contraintes industrielles.</p></article>
      </div>
    </div>
  </section>

  <section class="shell r1-observatories home2-observatories">
    <div class="r1-section-heading"><div><p class="r1-kicker">OBSERVATOIRES</p><h2>Dix questions qui valent des années de suivi.</h2></div><a class="r1-inline-link" href="/questions/">Explorer les dix questions ${icon("arrow")}</a></div>
    <div class="r1-topic-list">${r1Topics}</div>
  </section>

  <section class="home2-graph">
    <div class="shell home2-graph-grid">
      <div><p class="r1-kicker">FUTURE GRAPH</p><h2>Le média visible n’est qu’une vue de la mémoire.</h2><p>354 objets et 451 relations relient questions, événements, claims, preuves, sources et états. L’article raconte ; le graphe conserve.</p></div>
      <div class="home2-graph-metrics"><span><b>354</b>objets</span><span><b>451</b>relations</span><span><b>50</b>événements fondateurs</span><span><b>0</b>jalon promu sans revue</span></div>
      <a class="r1-primary inverse" href="/methodologie/">Ouvrir la machine ${icon("arrow")}</a>
      <a class="r1-text-link" href="/machine/avance/nif-ignition-fusion-2022.json">Voir le même état pour un agent IA ${icon("arrow")}</a>
    </div>
  </section>

  <section class="r1-closing">
    <div class="shell r1-closing-grid"><p class="r1-kicker">LA RÈGLE</p><blockquote>Le futur du média n’est pas de publier plus vite. C’est de montrer exactement quand et pourquoi notre représentation du monde change.</blockquote><a class="r1-primary inverse" href="/avance/nif-ignition-fusion-2022/">Voir le prototype complet ${icon("arrow")}</a></div>
  </section>`
));

await writePage("/aujourdhui", layout(
  "Aujourd’hui — Future Edition",
  "Le flux éditorial contrôlé de Future Edition et les archives récentes du socle.",
  `<section class="page-hero shell"><p class="kicker">Aujourd’hui</p><h1>Pas de faux<br>temps réel.</h1><p>Le flux continu n’est pas encore ouvert. Tant que FE-07/FE-08 n’a pas détecté puis validé une nouvelle avancée, Future Edition préfère afficher honnêtement l’absence d’actualité qualifiée plutôt que recycler un événement ancien.</p></section>
 <section class="shell section"><div class="status-callout"><span>Flux éditorial</span><strong>Aucune nouvelle avancée publiée automatiquement</strong><p>Les 50 événements déjà présents constituent le socle historique des observatoires. Ils ne sont pas présentés comme des nouvelles du jour.</p></div>
 <div class="section-head"><div><p class="kicker">Archives de référence</p><h2>Les repères les plus récents du socle.</h2></div><p class="section-copy">Ces entrées restent utiles pour comprendre la trajectoire des dix grandes questions, mais leur date est affichée sans ambiguïté.</p></div>
 <div class="timeline-list">${latestByQuestion.map(({ event }) => eventCard(event)).join("")}</div></section>`,
  { active: "today" }
));

await writePage("/questions", layout(
  "Observatoires — Future Edition",
  "Les dix grandes questions suivies par Future Edition.",
  `<section class="page-hero shell"><p class="kicker">Observatoires</p><h1>Dix questions.<br>Des années de preuves.</h1><p>Chaque observatoire possède des jalons définis à l’avance, un historique sourcé et une règle simple : ne jamais confondre signal, démonstration et preuve suffisante.</p></section><section class="shell section"><div class="obs-grid">${cards}</div></section>`,
  { active: "questions" }
));

for (const q of questions) {
  const qe = qEvents(q.id);
  const obs = obsByQuestion.get(q.id);
  const milestoneHtml = q.milestones.map((m, i) =>
    `<li><div class="milestone-index">${String(i + 1).padStart(2, "0")}</div><div><strong>${esc(m.title)}</strong><p>${esc(m.criterion)}</p></div><span class="state">Non évalué</span></li>`
  ).join("");

  const timeline = qe.map((e) => {
    const claim = claimById.get(e.claim_ids?.[0]);
    const source = sourceById.get(e.source_ids?.[0]);
    const tech = techById.get(e.technology_ids?.[0]);
    const fr = localizeEvent(e);
    return `<article class="timeline-item"><time>${fmtDate(e.event_date)}</time><div><span class="timeline-tech">${esc(fr.technology)}</span><h3>${esc(fr.title)}</h3><p>${esc(fr.claim)}</p><a href="/preuves/${esc(e.id.toLowerCase())}/">${sourceLabel[source?.kind] ?? "Source"} · niveau ${esc(source?.tier ?? "–")} ${icon("arrow")}</a></div></article>`;
  }).join("");

  await writePage("/questions/" + q.slug, layout(
    q.title + " — Future Edition",
    q.summary,
    `<section class="obs-hero shell"><a class="back" href="/questions/">← Les observatoires</a><div class="obs-label"><span>${esc(obs?.id)}</span><span>${esc(profileLabel[q.evidence_profile] ?? q.evidence_profile)}</span></div><h1>${esc(q.title)}</h1><p>${esc(q.summary)}</p><div class="obs-hero-stats"><span><b>${qe.length}</b> événements sourcés</span><span><b>${q.milestones.length}</b> jalons prédéfinis</span><span><b>0</b> état approuvé</span></div></section>
  <section class="shell split-section state-section"><div><p class="kicker">État actuel</p><h2>Une réponse explicite, même quand elle est incomplète.</h2><p class="section-copy">Future Edition ne remplace jamais une absence d’évaluation par une jauge. Tant qu’aucun Change validé n’a promu un jalon, l’état reste explicitement non évalué.</p></div>${statePlate({ question: q, latestEvent: qe[0] })}</section>
  <section class="shell section"><div class="section-head"><div><p class="kicker">Jalons</p><h2>La route vers une réponse.</h2></div></div><ol class="milestone-list">${milestoneHtml}</ol></section>
  <section class="shell section"><div class="section-head"><div><p class="kicker">Chronologie fondatrice</p><h2>${qe.length} événements vérifiés.</h2></div><p class="section-copy">Chaque entrée ci-dessous remonte à une source canonique et conserve son niveau de confiance.</p></div><div class="timeline">${timeline}</div></section>`,
    { active: "questions" }
  ));
}


for (const article of articles) {
  const event = eventById.get(article.event_id);
  const q = questions.find((x) => x.id === article.question_id);
  const qe = q ? qEvents(q.id) : [];
  const primaryClaim = claimById.get(event?.claim_ids?.[0]);
  const primaryEvidence = evidenceById.get(primaryClaim?.evidence_ids?.[0]);
  const primarySource = sourceById.get(primaryEvidence?.source_id);

  const evidenceNotes = article.sections.flatMap((section) =>
    section.paragraphs.flatMap((paragraph) =>
      paragraph.evidence_ids.map((eid) => {
        const ev = evidenceById.get(eid);
        const claim = claimById.get(ev?.claim_id);
        const source = sourceById.get(ev?.source_id);
        return { eid, ev, claim, source };
      })
    )
  );
  const uniqueEvidence = [...new Map(evidenceNotes.map((x) => [x.eid, x])).values()];

  const narrative = article.sections.map((section) => `
    <section class="article-section" id="${esc(section.id)}">
      <div class="article-section-title"><span>SECTION</span><h2>${esc(section.title)}</h2></div>
      <div class="article-section-body">
        ${section.paragraphs.map((paragraph) => `
          <div class="evidence-paragraph">
            <p>${esc(paragraph.text)}</p>
            <div class="evidence-inline" aria-label="Preuves liées">
              ${paragraph.evidence_ids.map((eid) => {
                const ev = evidenceById.get(eid);
                const source = sourceById.get(ev?.source_id);
                return `<a href="#${esc(eid.toLowerCase())}"><span>${esc(eid)}</span><b>${esc(source?.tier ?? "–")}</b></a>`;
              }).join("")}
            </div>
          </div>`).join("")}
      </div>
    </section>`).join("");

  const spine = uniqueEvidence.map(({ eid, ev, claim, source }, i) => `
    <article class="evidence-node" id="${esc(eid.toLowerCase())}">
      <div class="evidence-node-index">${String(i + 1).padStart(2, "0")}</div>
      <div><span>${esc(eid)} · ${esc(sourceLabel[source?.kind] ?? "Source")} ${esc(source?.tier ?? "")}</span>
      <strong>${esc(source?.title ?? "")}</strong>
      <p>${esc(localizeLocator(ev?.locator ?? ""))}</p>
      <small>${esc(confidenceLabel[claim?.confidence] ?? "Non évalué")}</small>
      <a href="${esc(source?.canonical_url ?? "#")}" rel="noopener noreferrer">Source originale ${icon("arrow")}</a></div>
    </article>`).join("");

  const watch = article.watch_next.map((item) => {
    const milestone = q?.milestones?.find((m) => m.id === item.milestone_id);
    return `<article><span>${esc(item.milestone_id)}</span><h3>${esc(milestone?.title ?? "À surveiller")}</h3><p>${esc(item.text)}</p></article>`;
  }).join("");

  const machinePacket = {
    schema_version: "fe/agent-answer-packet/v1",
    id: article.id,
    canonical_url: `https://future-edition.pages.dev/avance/${article.slug}/`,
    language: "fr",
    temporal_status: article.temporal_status,
    event_at: event?.event_date ?? null,
    published_at: article.published_at,
    updated_at: article.updated_at,
    as_of: article.as_of,
    question_id: article.question_id,
    state: { status: "unassessed", reason: "No validated Change promotes an observatory milestone." },
    before: article.before,
    evidence: article.evidence,
    after: article.after,
    claims: article.related_claim_ids,
    evidence_ids: article.related_evidence_ids,
    sources: article.related_source_ids,
    confidence: primaryClaim?.confidence ?? null,
    limitations: article.limitations,
    contradictions: [],
    watch_next: article.watch_next,
    citations: uniqueEvidence.map(({ eid, ev, source }) => ({
      evidence_id: eid,
      source_id: source?.id ?? null,
      locator: ev?.locator ?? null,
      canonical_url: source?.canonical_url ?? null
    })),
    abstention: null
  };

  await writePage("/avance/" + article.slug, layout(
    article.title + " — Future Edition",
    article.deck,
    `<article class="future-article">
      <header class="article-hero">
        <div class="shell article-hero-grid">
          <div class="article-title">
            <a class="back" href="/questions/${esc(q?.slug ?? "")}/">← Observatoire Fusion</a>
            <div class="article-eyebrow"><span>AVANCÉE DE RÉFÉRENCE</span><span>${esc(article.temporal_status)}</span><time datetime="${esc(article.published_at)}">Publié ${fmtDate(article.published_at)}</time></div>
            <h1>${esc(article.title)}</h1>
            <p class="article-deck">${esc(article.deck)}</p>
            <div class="article-meta"><span><b>Événement</b>${fmtDate(event?.event_date)}</span><span><b>Confiance</b>${esc(confidenceLabel[primaryClaim?.confidence] ?? "Non évalué")}</span><span><b>Source primaire du dossier</b>Niveau ${esc(primarySource?.tier ?? "–")}</span><span><b>État</b>Archive · as of ${fmtDate(article.as_of)}</span></div>
          </div>
          <figure class="article-visual" aria-label="Visualisation du changement de seuil au NIF">
            <svg viewBox="0 0 760 620" role="img" aria-labelledby="art-v-title art-v-desc">
              <title id="art-v-title">Du seuil approché à l’ignition</title>
              <desc id="art-v-desc">Comparaison éditoriale des valeurs de 2021 et 2022, sans représenter le bilan énergétique complet d’une centrale.</desc>
              <rect width="760" height="620" fill="#071014"/>
              <line x1="120" y1="420" x2="660" y2="420" stroke="#3b515c"/>
              <line x1="120" y1="120" x2="120" y2="420" stroke="#3b515c"/>
              <rect x="205" y="270" width="115" height="150" fill="#31464f"/>
              <rect x="445" y="170" width="115" height="250" fill="#d9ff74"/>
              <line x1="120" y1="225" x2="660" y2="225" stroke="#73e4ff" stroke-dasharray="8 10"/>
              <text x="205" y="455" fill="#91a6af" font-size="18">2021</text><text x="445" y="455" fill="#91a6af" font-size="18">2022</text>
              <text x="205" y="250" fill="#edf6f5" font-size="24" font-weight="700">1,35 MJ</text>
              <text x="445" y="150" fill="#d9ff74" font-size="28" font-weight="800">3,15 MJ</text>
              <text x="640" y="214" text-anchor="end" fill="#73e4ff" font-size="15">énergie laser à la cible · 2,05 MJ</text>
              <text x="120" y="84" fill="#edf6f5" font-size="42" font-weight="800">Le point de bascule</text>
              <text x="120" y="510" fill="#91a6af" font-size="16">Visualisation éditoriale · pas un bilan énergétique de centrale</text>
            </svg>
          </figure>
        </div>
      </header>
      <div class="shell article-state">${statePlate({ question: q, latestEvent: qe[0], asOf: article.as_of, compact: true })}</div>
      <div class="shell article-delta">${deltaBlock(article)}</div>
      <section class="article-summary-band"><div class="shell"><div><span>WHY IT MATTERS</span><p>${esc(article.why_it_matters)}</p></div><a href="/reality-check/ignition-nest-pas-electricite-commerciale/">Reality Check associé ${icon("arrow")}</a></div></section>
      <div class="shell article-reading-grid">
        <div class="article-narrative">${narrative}
          <section class="article-boundaries"><span class="boundary-kicker">CE QUE CELA NE PROUVE PAS</span><h2>La frontière entre résultat et promesse.</h2><ul>${article.does_not_prove.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>
          <section class="article-limitations"><span class="boundary-kicker">LIMITES</span>${article.limitations.map((x) => `<p>${esc(x)}</p>`).join("")}</section>
        </div>
        <aside class="evidence-spine" aria-label="Evidence Spine"><div class="spine-head"><span>EVIDENCE SPINE</span><b>${uniqueEvidence.length} preuves reliées</b></div>${spine}</aside>
      </div>
      <section class="watch-horizon"><div class="shell"><div class="watch-heading"><span>WATCH HORIZON</span><h2>La prochaine preuve qui compterait.</h2><p>Future Edition ne prédit pas une date. Il définit les conditions observables qui feraient réellement évoluer l’état.</p></div><div class="watch-grid">${watch}</div></div></section>
      <section class="shell article-agent-dock"><div><span>AGENT VIEW</span><h2>Le même état, sans parser l’article.</h2><p>ID stable, temporalité, claims, preuves, sources, limites et prochaines conditions sont exportés depuis les mêmes objets.</p></div><a class="r1-primary" href="/machine/avance/${esc(article.slug)}.json">Ouvrir la représentation structurée ${icon("arrow")}</a></section>
    </article>`,
    { active: "questions" }
  ));

  const machineDir = new URL("machine/avance/", out);
  await mkdir(machineDir, { recursive: true });
  await writeFile(new URL(article.slug + ".json", machineDir), JSON.stringify(machinePacket, null, 2) + "\n");
}

await writePage("/reality-check", layout(
  "Reality Check — Future Edition",
  "Les affirmations publiques confrontées à ce que les preuves permettent réellement d’affirmer.",
  `<section class="page-hero shell"><p class="kicker">Reality Check</p><h1>Une affirmation.<br>La preuve en face.</h1><p>Future Edition ne distribue pas des badges vrai/faux quand la science exige davantage de nuance. Nous séparons ce qui est démontré de ce qui est extrapolé.</p></section>
   <section class="shell section reality-index"><a href="/reality-check/ignition-nest-pas-electricite-commerciale/"><span>FUSION · RC-001</span><h2>« L’ignition signifie que l’électricité de fusion commerciale est démontrée. »</h2><p>Conclusion : l’ignition est démontrée au NIF ; la production électrique commerciale ne l’est pas.</p><b>Ouvrir le stress test ${icon("arrow")}</b></a></section>`,
  { active: "reality" }
));

await writePage("/reality-check/ignition-nest-pas-electricite-commerciale", layout(
  "Ignition ≠ électricité commerciale — Reality Check — Future Edition",
  "Ce que l’ignition du NIF démontre et ce qu’elle ne démontre pas.",
  `<section class="reality-hero"><div class="shell"><a class="back" href="/reality-check/">← Reality Check</a><p class="kicker">CLAIM STRESS TEST · RC-001 · as of 20 sept. 2026</p><h1>« L’ignition signifie que l’électricité de fusion commerciale est démontrée. »</h1><div class="reality-verdict"><span>CONCLUSION PERMISE</span><strong>L’ignition a été démontrée au NIF.</strong><span>CONCLUSION EXCESSIVE</span><strong>Une centrale électrique commerciale est démontrée.</strong></div></div></section>
   <section class="shell reality-proof-path"><div><span>01 · CONDITION</span><h2>Que faudrait-il démontrer ?</h2><p>Une production électrique exploitable nécessite un système intégré allant bien au-delà du gain mesuré au niveau de la cible.</p></div><div><span>02 · PREUVE</span><h2>2,05 MJ → ~3,15 MJ</h2><p>Le tir NIF du 5 décembre 2022 établit le franchissement du seuil dans cette comparaison expérimentale.</p><a href="/preuves/ev-2022-006002/">Voir la preuve ${icon("arrow")}</a></div><div><span>03 · LIMITE</span><h2>Le système complet n’est pas évalué ici.</h2><p>Le dossier ne démontre ni conversion électrique, ni cadence industrielle, ni viabilité commerciale.</p></div></section>
   <section class="shell article-delta">${deltaBlock(articles[0])}</section>
   <section class="shell manifesto"><p class="kicker">Reality Check</p><blockquote>Une étape scientifique majeure peut être réelle sans que la promesse industrielle soit déjà démontrée.</blockquote><a href="/avance/nif-ignition-fusion-2022/">Lire l’analyse complète ${icon("arrow")}</a></section>`,
  { active: "reality" }
));

await writePage("/ask", layout(
  "Ask Future Edition",
  "Interroger le Future Graph avec citations obligatoires.",
  `<section class="page-hero shell"><p class="kicker">Ask Future Edition · FE-10</p><h1>Posez une question.<br>Le graphe devra répondre.</h1><p>Cette surface est une préfiguration volontairement non simulée. Le produit fonctionnel sera ouvert quand les citations, l’abstention et la temporalité auront passé leur gate.</p></section>
   <section class="shell ask-preview"><div><span>EXEMPLE DE CONTRAT</span><h2>« Où en est la fusion commerciale ? »</h2><p>La future réponse devra contenir : état, as_of, claims, preuves, contradictions, limites, Watch Next et citations. Si la preuve est insuffisante, Ask doit s’abstenir.</p></div><div class="ask-status"><span>STATUS</span><strong>NOT YET OPEN</strong><p>Pas de faux chatbot avant FE-10.</p></div></section>`,
  { active: "ask" }
));

await writePage("/recherche", layout(
  "Recherche — Future Edition",
  "Explorer les questions, avancées et preuves Future Edition.",
  `<section class="page-hero shell"><p class="kicker">Recherche unifiée</p><h1>Des objets,<br>pas seulement des pages.</h1><p>La recherche interactive complète arrive avec les stages suivants. Ce prototype expose déjà la taxonomie de résultats prévue sans simuler un moteur inexistant.</p></section>
   <section class="shell search-types">
     <div><span>QUESTION</span><h2>Observatoires</h2>${questions.slice(0,5).map((q)=>`<a href="/questions/${esc(q.slug)}/">${esc(q.title)} ${icon("arrow")}</a>`).join("")}</div>
     <div><span>CHANGE / ARTICLE</span><h2>Avancées</h2>${articles.map((a)=>`<a href="/avance/${esc(a.slug)}/">${esc(a.title)} ${icon("arrow")}</a>`).join("")}</div>
     <div><span>CLAIM / EVIDENCE</span><h2>Preuves</h2><a href="/preuves/ev-2022-006002/">NIF · ignition 2022 ${icon("arrow")}</a><a href="/reality-check/ignition-nest-pas-electricite-commerciale/">Reality Check associé ${icon("arrow")}</a></div>
   </section>`,
  { active: "search" }
));


for (const event of events) {
  const claim = claimById.get(event.claim_ids?.[0]);
  const source = sourceById.get(event.source_ids?.[0]);
  const tech = techById.get(event.technology_ids?.[0]);
  const q = questions.find((x) => x.id === event.question_ids?.[0]);
  const ev = evidence.find((x) => claim?.evidence_ids?.includes(x.id));
  const milestone = q?.milestones?.find((m) => event.milestone_ids?.includes(m.id));
  const fr = localizeEvent(event);
  await writePage("/preuves/" + event.id.toLowerCase(), layout(
    "Preuve — " + fr.title + " — Future Edition",
    "Chaîne de preuve Future Edition pour " + fr.title,
    `<section class="proof-hero shell"><a class="back" href="/questions/${esc(q?.slug ?? "")}/">← Retour à l’observatoire</a><p class="kicker">Dossier de preuve · ${esc(event.id)}</p><h1>${esc(fr.title)}</h1><p>${esc(fr.claim)}</p><div class="proof-summary"><span><b>${fmtDate(event.event_date)}</b>Date de l’événement</span><span><b>${esc(confidenceLabel[claim?.confidence] ?? "Non évalué")}</b>Niveau de confiance</span><span><b>${esc(source?.tier ?? "–")}</b>Niveau de source</span></div></section>
    <section class="shell proof-chain">
      <article><span class="chain-label">01 · Question</span><h2>${esc(q?.title ?? "")}</h2><p>${esc(q?.summary ?? "")}</p></article>
      <article><span class="chain-label">02 · Technologie</span><h2>${esc(fr.technology)}</h2><p>${esc(fr.tech_desc)}</p></article>
      <article><span class="chain-label">03 · Affirmation</span><h2>Ce que nous retenons</h2><p>${esc(fr.claim)}</p><div class="chain-meta">Statut : ${esc(reviewStateLabel[claim?.review_state] ?? claim?.review_state ?? "")} · Confiance : ${esc(confidenceLabel[claim?.confidence] ?? "")}</div></article>
      <article><span class="chain-label">04 · Preuve</span><p class="source-original-label">Titre original de la source</p><h2>${esc(source?.title ?? "")}</h2><p><b>Repère dans la source :</b> ${esc(localizeLocator(ev?.locator ?? ""))}</p><p><b>Type :</b> ${esc(sourceLabel[source?.kind] ?? "Source")} · niveau ${esc(source?.tier ?? "–")}</p><a class="source-button" href="${esc(source?.canonical_url ?? "#")}" rel="noopener noreferrer">Ouvrir la source originale ${icon("arrow")}</a></article>
      <article><span class="chain-label">05 · Jalon concerné</span><h2>${esc(milestone?.title ?? "Jalon non attribué")}</h2><p>${esc(milestone?.criterion ?? "")}</p><div class="state-note">État : <b>non évalué</b>. La présence de cette preuve ne signifie pas que le jalon est atteint.</div></article>
    </section>`,
    { active: "questions" }
  ));
}

await writePage("/methodologie", layout(
  "Méthodologie — Future Edition",
  "Comment Future Edition sépare signal, preuve et changement réel.",
  `<section class="page-hero shell"><p class="kicker">Méthodologie</p><h1>La preuve<br>avant le bruit.</h1><p>Notre produit n’est pas un flux d’articles. C’est une machine à répondre : « qu’est-ce que cette nouvelle preuve change réellement ? »</p></section>
 <section class="shell method-grid">
   <article><span>01</span><h2>Question</h2><p>Nous partons d’une grande question durable, pas d’une tendance.</p></article>
   <article><span>02</span><h2>Source</h2><p>Nous remontons à la publication, au registre, au régulateur ou à la donnée officielle.</p></article>
   <article><span>03</span><h2>Affirmation</h2><p>Nous isolons précisément ce que la source permet d’affirmer, avec son niveau de confiance.</p></article>
   <article><span>04</span><h2>Changement</h2><p>Nous comparons l’état avant et après. Aucun jalon ne bouge sans justification traçable.</p></article>
 </section>
 <section class="shell section"><div class="method-table"><div><span>Hypothèse</span><b>≠ fait</b></div><div><span>Préprint</span><b>≠ validation</b></div><div><span>Animal</span><b>≠ efficacité humaine</b></div><div><span>Annonce</span><b>≠ déploiement</b></div><div><span>Événement sourcé</span><b>≠ jalon atteint</b></div></div></section>
 <section class="shell manifesto"><p class="kicker">Règle de publication</p><blockquote>Quand la preuve est insuffisante, le bon résultat est parfois de ne rien conclure.</blockquote></section>`,
  { active: "method" }
));

await mkdir(new URL("assets/", out), { recursive: true });
await writeFile(new URL("assets/styles.css", out), `
:root{--bg:#060b10;--panel:#0c131a;--line:#1d2a34;--text:#f4f7f9;--muted:#9eabb5;--cyan:#72e7ff;--lime:#baf36a;--paper:#edf2f3;--ink:#071017}
*{box-sizing:border-box}html{background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 75% 0,rgba(114,231,255,.08),transparent 28rem),var(--bg);font-size:16px;line-height:1.5;overflow-wrap:anywhere}a{color:inherit;text-decoration:none}svg{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.shell{width:min(1240px,calc(100% - 48px));margin:auto}.skip{position:absolute;left:-9999px}.skip:focus{left:16px;top:16px;z-index:99;background:white;color:black;padding:12px}.top{position:sticky;top:0;z-index:20;background:rgba(6,11,16,.88);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.06)}.nav{height:82px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;gap:11px;align-items:center;font-size:.72rem;line-height:.9;letter-spacing:.14em;font-weight:700}.brand b{color:var(--cyan)}.brand-mark{display:grid;place-items:center;width:34px;height:34px;border:1px solid #48606e;border-radius:50%;font-size:.9rem;color:var(--cyan)}nav{display:flex;gap:30px;color:#b3bec5;font-size:.9rem}nav a{position:relative}nav a:hover,nav a.active{color:white}nav a.active:after{content:"";height:2px;background:var(--cyan);position:absolute;left:0;right:0;bottom:-10px}.hero{padding:112px 0 80px}.hero-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,.65fr);gap:74px;align-items:end}.kicker{text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;font-weight:800;color:var(--cyan);margin:0 0 18px}.hero h1,.page-hero h1,.obs-hero h1{font-size:clamp(4.1rem,9vw,8.6rem);line-height:.82;letter-spacing:-.075em;margin:0;font-weight:820}.hero h1 em{font-style:normal;color:transparent;-webkit-text-stroke:1px #9fb0ba}.hero-copy,.page-hero>p:last-child,.obs-hero>p{font-size:clamp(1.08rem,1.8vw,1.35rem);color:#b3bec5;line-height:1.7;max-width:760px;margin:30px 0}.hero-actions{display:flex;gap:12px;flex-wrap:wrap}.button{height:52px;padding:0 20px;border-radius:4px;display:inline-flex;align-items:center;gap:10px;font-weight:750;font-size:.9rem}.button.primary{background:var(--cyan);color:#041016}.button.ghost{border:1px solid #2a3944;color:#dce4e8}.signal{border:1px solid #26343e;padding:28px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01));min-height:360px;display:flex;flex-direction:column}.signal p{font-size:.68rem;letter-spacing:.14em;color:#8da0ac}.signal strong{font-size:7rem;line-height:1;letter-spacing:-.07em;margin-top:auto}.signal>span:not(.live-dot){color:#aebbc3}.live-dot{width:8px;height:8px;border-radius:50%;background:var(--lime);box-shadow:0 0 18px var(--lime)}.signal-row{display:flex;justify-content:space-between;border-top:1px solid #22303a;margin-top:22px;padding-top:18px;color:#d9e1e5;font-size:.86rem}.signal small{color:#748591;margin-top:18px}.proof-strip{border-top:1px solid #17232c;border-bottom:1px solid #17232c;background:#080f15}.proof-grid{display:grid;grid-template-columns:repeat(3,1fr)}.proof-grid>div{padding:25px 30px;border-right:1px solid #17232c;display:flex;align-items:center;gap:16px}.proof-grid>div:first-child{padding-left:0}.proof-grid>div:last-child{border:0}.proof-grid svg,.delta{color:var(--cyan);font-size:1.5rem}.proof-grid span{display:flex;flex-direction:column;color:#758793;font-size:.82rem}.proof-grid b{color:#eaf0f3;font-size:.91rem;margin-bottom:3px}.section{padding:90px 0}.section-head{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:38px}.section-head h2,.split-section h2{font-size:clamp(2.4rem,5vw,5rem);line-height:.95;letter-spacing:-.055em;margin:0;max-width:840px}.section-head>a{color:var(--cyan);display:flex;gap:8px;align-items:center}.section-copy{max-width:470px;color:#8ea0ac;line-height:1.7}.events-grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);border-left:1px solid var(--line)}.event-card{border-bottom:1px solid var(--line);padding:30px 0;display:grid;grid-template-columns:160px 1fr;gap:26px}.event-card.compact{display:block;border-right:1px solid var(--line);padding:26px;min-height:340px}.event-top{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:26px}.event-top time{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#7f929e;font-size:.76rem;text-transform:uppercase}.evidence-badge{font-size:.69rem;border:1px solid #2d414e;padding:5px 7px;color:#aebec7}.evidence-badge.confirmed{color:var(--lime);border-color:#597a3b}.evidence-badge.solid_preliminary{color:var(--cyan);border-color:#315867}.evidence-badge.needs_confirmation{color:#e9ca7c;border-color:#655631}.event-card h3{font-size:1.36rem;line-height:1.12;letter-spacing:-.03em;margin:0 0 12px}.event-card p{color:#91a1ac;margin:0 0 18px;line-height:1.6}.event-card .tech{color:#d9e2e6;font-size:.8rem;text-transform:uppercase;letter-spacing:.07em}.event-meta{display:flex;flex-wrap:wrap;gap:7px 18px;color:#70828d;font-size:.72rem;margin-top:24px}.proof-link{display:flex;align-items:center;gap:7px;color:var(--cyan);font-size:.82rem;margin-top:24px}.disclaimer{color:#70818c;font-size:.78rem;border-left:2px solid #30434f;padding-left:14px;margin-top:22px}.obs-grid{display:grid;grid-template-columns:repeat(2,1fr);border-top:1px solid var(--line);border-left:1px solid var(--line)}.obs-card{position:relative;min-height:390px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:28px;display:grid;grid-template-columns:50px 1fr;gap:20px;transition:.2s background}.obs-card:hover{background:#0b131a}.obs-number{font-family:ui-monospace,monospace;color:#526470;font-size:.75rem}.obs-kicker{color:var(--cyan);text-transform:uppercase;font-size:.67rem;letter-spacing:.14em}.obs-card h3{font-size:clamp(1.6rem,3vw,2.55rem);letter-spacing:-.045em;line-height:1.04;margin:14px 0}.obs-card p{color:#8799a5;max-width:510px}.obs-stats,.obs-latest{grid-column:2;display:flex;gap:24px;color:#798a95;font-size:.76rem}.obs-stats b{color:#e5ecef;font-size:1.05rem}.obs-latest{align-items:center;border-top:1px solid #17232b;padding-top:18px}.obs-latest strong{color:#b8c6cd}.round-arrow{position:absolute;right:25px;bottom:25px;width:38px;height:38px;border:1px solid #2a3944;border-radius:50%;display:grid;place-items:center}.manifesto{padding:90px 0 120px;border-top:1px solid var(--line)}.manifesto blockquote{font-size:clamp(2.5rem,5.5vw,5.8rem);line-height:.98;letter-spacing:-.055em;margin:18px 0 35px;max-width:1120px}.manifesto a{color:var(--cyan);display:inline-flex;align-items:center;gap:8px}.page-hero,.obs-hero{padding:95px 0 75px;border-bottom:1px solid var(--line)}.page-hero h1,.obs-hero h1{font-size:clamp(3.8rem,8vw,7rem)}.page-hero p:last-child,.obs-hero>p{max-width:760px}.status-callout{background:var(--paper);color:var(--ink);padding:28px;display:grid;grid-template-columns:160px 1fr 1fr;gap:30px;align-items:start;margin-bottom:60px}.status-callout>span{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em}.status-callout strong{font-size:1.6rem;line-height:1.1}.status-callout p{margin:0;color:#48555d}.timeline-list{display:grid;gap:8px}.timeline-list .event-card{border-top:1px solid var(--line)}.back{color:#8296a2;font-size:.82rem}.obs-label{display:flex;gap:15px;color:var(--cyan);font-size:.7rem;text-transform:uppercase;letter-spacing:.13em;margin:46px 0 18px}.obs-hero-stats{display:flex;gap:44px;margin-top:40px;padding-top:24px;border-top:1px solid var(--line);color:#82939e}.obs-hero-stats b{font-size:1.4rem;color:white}.split-section{width:min(1240px,calc(100% - 48px));margin:auto;padding:80px 0;display:grid;grid-template-columns:1.2fr .8fr;gap:70px;align-items:center}.radar-card{height:360px;position:relative;border:1px solid #263540;background:radial-gradient(circle,rgba(114,231,255,.08),transparent 55%);overflow:hidden}.radar-ring{position:absolute;border:1px solid #27414d;border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)}.r1{width:80px;height:80px}.r2{width:180px;height:180px}.r3{width:290px;height:290px}.radar-axis:before,.radar-axis:after{content:"";position:absolute;background:#1e3540}.radar-axis:before{width:100%;height:1px;left:0;top:50%}.radar-axis:after{height:100%;width:1px;top:0;left:50%}.radar-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:var(--cyan);color:#061016;font-weight:900;font-size:1.5rem}.radar-card small{position:absolute;bottom:20px;left:20px;color:#7f919c}.milestone-list{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}.milestone-list li{display:grid;grid-template-columns:70px 1fr 130px;gap:22px;align-items:start;padding:25px 0;border-bottom:1px solid var(--line)}.milestone-index{color:#526571;font-family:ui-monospace,monospace}.milestone-list strong{font-size:1.3rem}.milestone-list p{color:#8496a1;margin:6px 0 0}.state{font-size:.72rem;border:1px solid #344751;padding:6px 8px;color:#91a3ae;text-align:center}.timeline{position:relative;margin-left:100px}.timeline:before{content:"";position:absolute;left:0;top:0;bottom:0;width:1px;background:#263741}.timeline-item{display:grid;grid-template-columns:130px 1fr;gap:35px;padding:0 0 56px;position:relative}.timeline-item:before{content:"";position:absolute;width:7px;height:7px;border-radius:50%;background:var(--cyan);left:-3px;top:8px}.timeline-item time{margin-left:-165px;text-align:right;color:#657984;font-family:ui-monospace,monospace;font-size:.72rem;padding-top:2px}.timeline-item>div{padding-left:35px}.timeline-tech{color:var(--cyan);font-size:.67rem;text-transform:uppercase;letter-spacing:.12em}.timeline-item h3{font-size:1.5rem;letter-spacing:-.03em;margin:8px 0}.timeline-item p{color:#8da0aa;max-width:760px}.timeline-item a{color:#c7d3d9;font-size:.8rem;display:inline-flex;gap:8px;align-items:center}.method-grid{width:min(1240px,calc(100% - 48px));margin:0 auto 60px;display:grid;grid-template-columns:repeat(2,1fr);border-top:1px solid var(--line);border-left:1px solid var(--line)}.method-grid article{padding:42px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);min-height:280px}.method-grid article>span{color:var(--cyan);font-family:ui-monospace,monospace}.method-grid h2{font-size:2.5rem;letter-spacing:-.04em}.method-grid p{color:#8fa1ac;max-width:480px}.method-table{border-top:1px solid var(--line)}.method-table>div{display:grid;grid-template-columns:1fr 1fr;padding:18px 0;border-bottom:1px solid var(--line);font-size:1.1rem}.method-table span{color:#8fa1ac}.method-table b{color:var(--cyan);font-weight:650}.proof-hero{padding:80px 0 55px;border-bottom:1px solid var(--line)}.proof-hero h1{font-size:clamp(3rem,7vw,6.5rem);line-height:.9;letter-spacing:-.06em;margin:20px 0;max-width:1050px}.proof-hero>p:not(.kicker){font-size:1.2rem;color:#aebbc3;max-width:850px}.proof-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-top:42px}.proof-summary span{background:var(--bg);padding:20px;display:flex;flex-direction:column;color:#71838e;font-size:.75rem}.proof-summary b{color:#edf3f5;font-size:1rem;margin-bottom:4px}.proof-chain{padding:70px 0 100px;max-width:940px}.proof-chain article{padding:30px 0;border-bottom:1px solid var(--line)}.chain-label{font-size:.68rem;color:var(--cyan);text-transform:uppercase;letter-spacing:.14em}.proof-chain h2{font-size:2rem;letter-spacing:-.035em;margin:10px 0}.proof-chain p{color:#91a2ac;line-height:1.7}.chain-meta,.state-note{margin-top:14px;padding:13px 15px;background:#0b1319;color:#899ba6;font-size:.8rem;border-left:2px solid #334b58}.state-note b{color:#dbe5e9}.source-button{display:inline-flex;align-items:center;gap:8px;background:var(--cyan);color:#041016;padding:12px 16px;margin-top:10px;font-weight:750;font-size:.85rem}footer{border-top:1px solid var(--line);padding:60px 0;color:#7f919c}.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:50px}.footer-grid>div{display:flex;flex-direction:column;gap:9px}.footer-grid strong{color:#e6edf0;font-size:.8rem}.footer-grid a{font-size:.82rem}.footer-grid p{font-size:.8rem}.footer-brand{color:#eaf1f3}
@media(max-width:900px){.hero-grid,.split-section{grid-template-columns:1fr}.signal{min-height:260px}.proof-grid,.events-grid{grid-template-columns:1fr}.proof-grid>div{border-right:0;border-bottom:1px solid #17232c;padding-left:0}.obs-grid{grid-template-columns:1fr}.status-callout{grid-template-columns:1fr}.timeline{margin-left:0}.timeline:before{left:3px}.timeline-item{display:block;padding-left:28px}.timeline-item:before{left:0}.timeline-item time{margin:0;text-align:left}.timeline-item>div{padding:8px 0 0}.footer-grid{grid-template-columns:1fr 1fr}.footer-grid>div:first-child{grid-column:1/-1}}
@media(max-width:620px){.proof-summary{grid-template-columns:1fr}.shell,.split-section,.method-grid{width:min(100% - 28px,1240px)}.nav{height:70px}.nav nav{gap:14px;font-size:.77rem}.nav nav a:nth-child(3){display:none}.hero{padding:72px 0 56px}.hero h1,.page-hero h1,.obs-hero h1{font-size:clamp(3.5rem,18vw,5.4rem)}.hero-grid{gap:42px}.signal strong{font-size:5.5rem}.section{padding:65px 0}.section-head{display:block}.section-head>a{margin-top:20px}.event-card{display:block}.event-card.compact{min-height:auto}.obs-card{grid-template-columns:34px 1fr;padding:22px;min-height:360px}.obs-stats{flex-direction:column;gap:4px}.obs-latest{padding-right:48px}.page-hero,.obs-hero{padding:66px 0 48px}.obs-hero-stats{flex-direction:column;gap:8px}.radar-card{height:300px}.milestone-list li{grid-template-columns:45px 1fr}.milestone-list .state{grid-column:2}.timeline{margin-left:0}.timeline:before{left:3px}.timeline-item{display:block;padding-left:28px}.timeline-item:before{left:0}.timeline-item time{margin:0;text-align:left}.timeline-item>div{padding:8px 0 0}.method-grid{grid-template-columns:1fr}.method-grid article{padding:28px}.footer-grid{grid-template-columns:1fr}.footer-grid>div:first-child{grid-column:auto}}
/* FE-06R reference home */
.r1-cover{position:relative;overflow:hidden;padding:70px 0 0;background:linear-gradient(180deg,#071014 0%,#071014 78%,#0d171c 100%);border-bottom:1px solid #203039}.r1-cover:before{content:"";position:absolute;width:560px;height:560px;border-radius:50%;right:-180px;top:-250px;background:rgba(124,231,255,.06);filter:blur(20px)}
.r1-cover-grid{display:grid;grid-template-columns:minmax(0,1.03fr) minmax(430px,.97fr);gap:58px;align-items:center;min-height:680px}.r1-eyebrow{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;color:#91a6af;text-transform:uppercase;letter-spacing:.12em;font-size:.67rem;font-weight:800}.r1-live{width:7px;height:7px;border-radius:50%;background:#d9ff74;box-shadow:0 0 18px rgba(217,255,116,.7)}
.r1-cover h1{font-size:clamp(4.5rem,8.6vw,8.9rem);line-height:.78;letter-spacing:-.078em;margin:38px 0 30px;max-width:820px}.r1-cover h1 em{display:inline-block;font-style:normal;color:#d9ff74;font-weight:400}.r1-deck{font-size:clamp(1.08rem,1.65vw,1.36rem);line-height:1.66;color:#a9b8bf;max-width:690px;margin:0}.r1-actions{display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-top:38px}
.r1-primary{display:inline-flex;align-items:center;gap:12px;background:#f1f6f5;color:#061014;padding:15px 18px;font-weight:850;font-size:.86rem}.r1-primary svg,.r1-inline-link svg,.r1-text-link svg{width:17px}.r1-primary.inverse{background:#071014;color:#f4f7f7}.r1-text-link,.r1-inline-link{display:inline-flex;align-items:center;gap:9px;color:#bfefff;font-weight:750;font-size:.85rem}
.r1-hero-visual{margin:0;position:relative;min-width:0}.r1-hero-visual svg{display:block;width:100%;height:auto;max-height:640px}.r1-hero-visual figcaption{border-top:1px solid #294049;padding:14px 4px 0;display:flex;justify-content:space-between;gap:18px;font-size:.69rem;color:#78909b;text-transform:uppercase;letter-spacing:.08em}.r1-hero-visual figcaption strong{color:#bfd0d6;font-weight:700;text-align:right}
.r1-metrics{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #263943}.r1-metrics>div{padding:25px 28px 31px 0;display:flex;gap:13px;align-items:flex-start}.r1-metrics b{font-size:2rem;line-height:1;color:#edf6f5}.r1-metrics span{font-size:.72rem;line-height:1.45;color:#718892;max-width:150px}
.r1-editorial{background:#edf1ee;color:#071014;padding:100px 0}.r1-section-label{display:flex;justify-content:space-between;gap:24px;padding-bottom:15px;border-bottom:1px solid #bac5c1;text-transform:uppercase;letter-spacing:.12em;font-size:.68rem;font-weight:850;color:#425058}.r1-reality-grid{display:grid;grid-template-columns:minmax(0,.83fr) minmax(0,1.17fr);gap:70px;padding-top:38px;align-items:center}.r1-reality-art{background:#091216;min-height:560px;overflow:hidden}.r1-reality-art svg{display:block;width:100%;height:100%}
.r1-kicker{margin:0 0 14px;text-transform:uppercase;letter-spacing:.14em;font-size:.67rem;font-weight:850;color:#24809a}.r1-reality-copy h2,.r1-system-copy h2,.r1-section-heading h2{font-size:clamp(2.5rem,5vw,5.6rem);line-height:.92;letter-spacing:-.06em;margin:0}.r1-reality-copy .r1-lead{font-size:1.14rem;line-height:1.72;color:#445159;margin:28px 0 34px;max-width:760px}.r1-before-after{border-top:1px solid #aebbb8}.r1-before-after>div{display:grid;grid-template-columns:90px 1fr;gap:22px;padding:18px 0;border-bottom:1px solid #c5cecb}.r1-before-after span{font-size:.65rem;text-transform:uppercase;letter-spacing:.12em;color:#67747a;font-weight:850}.r1-before-after strong{font-size:.9rem;line-height:1.5;font-weight:720}.r1-reality-copy .r1-inline-link{color:#0b657b;margin-top:28px}
.r1-foundation{padding:105px 0}.r1-section-heading{display:flex;justify-content:space-between;gap:70px;align-items:flex-end;margin-bottom:42px}.r1-section-heading>div{max-width:820px}.r1-section-heading>p{max-width:440px;color:#8ca0aa;line-height:1.7;margin:0}.r1-story-grid{display:grid;grid-template-columns:1.2fr .9fr .9fr;gap:1px;background:#26343b;border:1px solid #26343b}.r1-story{background:#0a1116;padding:30px;min-height:430px;display:flex;flex-direction:column}.r1-story-1{background:linear-gradient(160deg,#101d22 0%,#091116 70%)}.r1-story-top,.r1-story-bottom{display:flex;justify-content:space-between;gap:18px;font-size:.67rem;text-transform:uppercase;letter-spacing:.08em;color:#718792}.r1-story h3{font-size:clamp(1.55rem,2.5vw,2.75rem);line-height:1.02;letter-spacing:-.045em;margin:45px 0 18px}.r1-story p{color:#91a2ab;line-height:1.65;margin:0}.r1-story-bottom{margin-top:auto;padding-top:30px;border-top:1px solid #26343b}.r1-story-bottom a{color:#bdefff;display:flex;align-items:center;gap:7px}
.r1-system{background:#0d171c;padding:110px 0;border-top:1px solid #263943;border-bottom:1px solid #263943}.r1-system-grid{display:grid;grid-template-columns:1fr 1fr;gap:90px;align-items:start}.r1-system-copy p:not(.r1-kicker){color:#91a4ad;line-height:1.75;max-width:680px;font-size:1.05rem}.r1-system-copy .r1-inline-link{margin-top:20px}.r1-pipeline{border-top:1px solid #31444d}.r1-pipeline>div{display:grid;grid-template-columns:44px 130px 1fr;gap:18px;padding:22px 0;border-bottom:1px solid #263943;align-items:baseline}.r1-pipeline span{font-family:ui-monospace,monospace;color:#5f7984;font-size:.72rem}.r1-pipeline b{font-size:1.25rem}.r1-pipeline small{color:#8599a2}
.r1-observatories{padding:105px 0}.r1-topic-list{border-top:1px solid #263943}.r1-topic-list a{display:grid;grid-template-columns:60px 1fr 170px 24px;gap:22px;align-items:center;padding:22px 4px;border-bottom:1px solid #263943;transition:.18s background,.18s padding}.r1-topic-list a:hover{background:#0b1419;padding-left:14px}.r1-topic-list span{font-family:ui-monospace,monospace;color:#5f7782;font-size:.72rem}.r1-topic-list strong{font-size:clamp(1.15rem,2vw,1.8rem);letter-spacing:-.025em}.r1-topic-list em{font-style:normal;color:#78909b;text-transform:uppercase;letter-spacing:.09em;font-size:.66rem}.r1-topic-list svg{color:#79e6ff}
.r1-closing{background:#d9ff74;color:#071014;padding:86px 0}.r1-closing-grid{display:grid;grid-template-columns:140px 1fr auto;gap:46px;align-items:end}.r1-closing .r1-kicker{color:#43521c}.r1-closing blockquote{font-size:clamp(2.4rem,4.8vw,5.2rem);line-height:.94;letter-spacing:-.055em;margin:0;max-width:930px}
@media(max-width:1050px){.r1-cover-grid{grid-template-columns:1fr;min-height:auto}.r1-hero-visual{max-width:720px}.r1-reality-grid,.r1-system-grid{grid-template-columns:1fr}.r1-story-grid{grid-template-columns:1fr 1fr}.r1-story-1{grid-column:1/-1}.r1-closing-grid{grid-template-columns:1fr}.r1-section-heading{align-items:flex-start}}
@media(max-width:700px){.r1-cover{padding-top:38px}.r1-cover-grid{gap:24px}.r1-cover h1{font-size:clamp(4rem,18vw,6.3rem);margin:28px 0 24px}.r1-deck{font-size:1.02rem}.r1-actions{display:grid;gap:14px}.r1-primary{justify-content:space-between}.r1-hero-visual{margin:10px -8px 0}.r1-hero-visual figcaption{display:block}.r1-hero-visual figcaption strong{display:block;text-align:left;margin-top:7px}.r1-metrics{grid-template-columns:1fr 1fr}.r1-metrics>div{display:block;padding:20px 12px 24px 0}.r1-metrics b{display:block;margin-bottom:7px}.r1-editorial{padding:70px 0}.r1-section-label{display:block}.r1-section-label span:last-child{display:block;margin-top:8px}.r1-reality-grid{gap:30px}.r1-reality-art{min-height:0}.r1-reality-copy h2,.r1-system-copy h2,.r1-section-heading h2{font-size:clamp(2.55rem,12vw,4.5rem)}.r1-before-after>div{grid-template-columns:1fr;gap:7px}.r1-section-heading{display:block}.r1-section-heading>p,.r1-section-heading>a{display:block;margin-top:20px}.r1-foundation,.r1-observatories{padding:72px 0}.r1-story-grid{grid-template-columns:1fr}.r1-story-1{grid-column:auto}.r1-story{min-height:350px}.r1-system{padding:75px 0}.r1-pipeline>div{grid-template-columns:32px 1fr}.r1-pipeline small{grid-column:2}.r1-topic-list a{grid-template-columns:38px 1fr 18px;padding:17px 2px}.r1-topic-list em{display:none}.r1-closing{padding:68px 0}.r1-closing blockquote{font-size:clamp(2.5rem,12vw,4.5rem)}}

/* FE-06R Home — edition of changes */
.home2-clock{border-bottom:1px solid #263943;background:#091116}.home2-clock-grid{min-height:72px;display:grid;grid-template-columns:170px 170px 1fr auto;gap:22px;align-items:center}.home2-clock-grid>div{display:flex;flex-direction:column}.home2-clock-grid span{font:750 .61rem ui-monospace,monospace;letter-spacing:.1em;color:#6f858f}.home2-clock-grid strong{font-size:.8rem;color:#dce7e9;margin-top:3px}.home2-clock-grid p{margin:0;color:#81959f;font-size:.75rem}.home2-clock-grid a{display:flex;align-items:center;gap:7px;color:#bfefff;font-size:.75rem;font-weight:800}
.home2-lead{background:#edf1ee;color:#071014;padding:76px 0 0}.home2-lead-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(420px,.92fr);gap:56px;align-items:end}.home2-overline{display:flex;flex-wrap:wrap;gap:9px 18px;font:800 .65rem ui-monospace,monospace;letter-spacing:.1em;color:#657278}.home2-overline span:first-child{color:#0b7188}.home2-lead h1{font-size:clamp(4rem,8.3vw,8.7rem);line-height:.8;letter-spacing:-.077em;margin:35px 0 28px;max-width:860px}.home2-lead h1 em{font-style:normal;color:#0a7088;font-weight:450}.home2-lead-copy>p{font-size:clamp(1.08rem,1.6vw,1.32rem);line-height:1.66;color:#4d5b61;max-width:760px}.home2-lead-actions{display:flex;gap:22px;align-items:center;flex-wrap:wrap;margin-top:34px}.home2-lead .r1-primary{background:#071014;color:#edf5f4}.home2-lead .r1-text-link{color:#0b6a80}.home2-lead-visual{margin:0;background:#071014}.home2-lead-visual svg{display:block;width:100%;height:auto}
.home2-core{padding:55px 0 95px}.home2-core-label{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #2a3e47;border-bottom:1px solid #2a3e47;margin-bottom:28px}.home2-core-label span{padding:10px 0;font:800 .61rem ui-monospace,monospace;letter-spacing:.13em;color:#627983}.home2-core .state-plate{margin-bottom:70px}.home2-core .delta-block{background:#edf1ee;color:#071014}
.home2-now{background:#0d171c;padding:88px 0;border-top:1px solid #263943;border-bottom:1px solid #263943}.home2-now-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:80px}.home2-now h2,.home2-graph h2{font-size:clamp(2.8rem,5.5vw,6rem);line-height:.9;letter-spacing:-.06em;margin:0}.home2-now-grid>div:last-child{border-top:1px solid #38505a;padding-top:24px}.home2-now-grid strong{font-size:1.3rem}.home2-now-grid p{color:#8ca0aa;line-height:1.7}.home2-now-grid a{display:inline-flex;align-items:center;gap:7px;color:#bfefff;font-weight:800;font-size:.82rem}
.home2-reality{background:#d9ff74;color:#071014;padding:82px 0}.home2-reality-grid{display:grid;grid-template-columns:180px 1.2fr .8fr;gap:45px}.home2-reality-label{display:flex;flex-direction:column;gap:8px}.home2-reality-label span,.home2-reality-claim>span,.home2-reality-result span{font:850 .63rem ui-monospace,monospace;letter-spacing:.11em}.home2-reality-claim blockquote{font-size:clamp(2rem,4vw,4.6rem);line-height:.94;letter-spacing:-.05em;margin:18px 0}.home2-reality-result>div{border-top:1px solid #879e45;padding:16px 0}.home2-reality-result strong{display:block;font-size:1.05rem;margin-top:7px}.home2-reality-result a{display:flex;align-items:center;gap:7px;margin-top:26px;font-weight:850}
.home2-watch{background:#071014;padding:100px 0}.home2-watch .r1-section-heading>p{color:#8ca0aa}.home2-watch-grid{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #2b404a;margin-top:45px}.home2-watch-grid article{padding:28px 28px 10px 0;border-right:1px solid #2b404a}.home2-watch-grid article+article{padding-left:28px}.home2-watch-grid span{font:750 .65rem ui-monospace,monospace;color:#748b95}.home2-watch-grid h3{font-size:1.7rem;line-height:1.05;margin:20px 0}.home2-watch-grid p{color:#8da1aa}.home2-observatories{padding-top:100px}
.home2-graph{background:#edf1ee;color:#071014;padding:95px 0}.home2-graph-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:65px;align-items:end}.home2-graph-grid>div:first-child p:not(.r1-kicker){color:#526168;line-height:1.7;max-width:720px}.home2-graph-metrics{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #aebbb8;border-left:1px solid #aebbb8}.home2-graph-metrics span{padding:22px;border-right:1px solid #aebbb8;border-bottom:1px solid #aebbb8;color:#617078;font-size:.72rem}.home2-graph-metrics b{display:block;font-size:2.4rem;line-height:1;color:#071014;margin-bottom:7px}.home2-graph .r1-primary{justify-self:start}.home2-graph .r1-text-link{color:#0b697e;justify-self:end}
@media(max-width:1050px){.home2-clock-grid{grid-template-columns:1fr 1fr}.home2-clock-grid p{grid-column:1/-1}.home2-lead-grid{grid-template-columns:1fr}.home2-lead-visual{max-width:760px}.home2-reality-grid{grid-template-columns:1fr 1fr}.home2-reality-label{grid-column:1/-1}.home2-graph-grid{grid-template-columns:1fr}.home2-graph .r1-text-link{justify-self:start}}
@media(max-width:700px){.home2-clock-grid{grid-template-columns:1fr 1fr;padding-top:15px;padding-bottom:15px}.home2-clock-grid p,.home2-clock-grid a{grid-column:1/-1}.home2-lead{padding-top:48px}.home2-lead h1{font-size:clamp(3.9rem,18vw,6.2rem);margin-top:27px}.home2-lead-actions{display:grid}.home2-core{padding:42px 0 66px}.home2-core-label{grid-template-columns:1fr 1fr}.home2-core-label span{padding:8px 0}.home2-core .state-plate{margin-bottom:48px}.home2-now{padding:65px 0}.home2-now-grid{grid-template-columns:1fr;gap:38px}.home2-reality{padding:62px 0}.home2-reality-grid{grid-template-columns:1fr;gap:28px}.home2-reality-label{grid-column:auto}.home2-watch{padding:70px 0}.home2-watch-grid{grid-template-columns:1fr}.home2-watch-grid article,.home2-watch-grid article+article{padding:22px 0;border-right:0;border-bottom:1px solid #2b404a}.home2-graph{padding:70px 0}.home2-graph-metrics{grid-template-columns:1fr 1fr}}

/* FE-06R media-2.0 primitives */
.mobile-dock{display:none}.desktop-nav a:last-child{display:flex;align-items:center;gap:7px}.desktop-nav svg{width:15px}
.state-section{align-items:stretch}.state-plate{border:1px solid #2a3f49;background:linear-gradient(145deg,#0d191f,#081116);padding:28px;display:flex;flex-direction:column;min-height:330px}.state-plate.compact{min-height:auto}.state-plate-head{display:flex;justify-content:space-between;gap:20px;padding-bottom:18px;border-bottom:1px solid #29404a;color:#7e949e;font:700 .67rem ui-monospace,monospace;letter-spacing:.1em}.state-value{font-size:clamp(2rem,4vw,4rem);line-height:.95;letter-spacing:-.055em;margin:34px 0 18px;color:#edf5f4}.state-plate>p{color:#8da0aa;max-width:620px}.state-meta{margin-top:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding-top:24px}.state-meta span{border-top:1px solid #243640;padding-top:12px;color:#8da0aa;font-size:.72rem}.state-meta b{display:block;color:#dce8e9;margin-bottom:4px}
.future-article{background:#edf1ee;color:#071014}.article-hero{background:#071014;color:#eef5f4;padding:70px 0 52px}.article-hero-grid{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(380px,.88fr);gap:58px;align-items:end}.article-eyebrow{display:flex;gap:10px 20px;flex-wrap:wrap;color:#89a0aa;font:750 .67rem ui-monospace,monospace;letter-spacing:.08em;margin:28px 0}.article-eyebrow span:first-child{color:#d9ff74}.article-title h1{font-size:clamp(3.5rem,7.5vw,7.6rem);line-height:.84;letter-spacing:-.07em;margin:0}.article-deck{font-size:clamp(1.08rem,1.7vw,1.35rem);line-height:1.65;color:#aab9c0;max-width:860px;margin:30px 0}.article-meta{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:#253640;border:1px solid #253640}.article-meta span{background:#091218;padding:14px;color:#8ba0aa;font-size:.72rem}.article-meta b{display:block;color:#e6eff0;margin-bottom:4px}.article-visual{margin:0;background:#071014}.article-visual svg{display:block;width:100%;height:auto}.article-state{padding-top:36px}.article-state .state-plate{color:#edf5f4}.article-delta{padding:70px 0}
.delta-block{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid #aebbb8;border-bottom:1px solid #aebbb8;isolation:isolate}.delta-block article{padding:34px 32px;min-height:310px}.delta-block article+article{border-left:1px solid #b9c4c1}.delta-block h2{font-size:clamp(2.2rem,4vw,4.5rem);line-height:.9;letter-spacing:-.055em;margin:42px 0 18px}.delta-block p{line-height:1.7;color:#46555c}.delta-label{font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;font-weight:850;color:#617078}.delta-evidence{background:#071014;color:#eef5f4;transform:translateY(-18px);box-shadow:0 18px 50px rgba(7,16,20,.16)}.delta-evidence p{color:#a8b8bf}.delta-evidence .delta-label{color:#d9ff74}.delta-evidence a{display:inline-flex;align-items:center;gap:8px;color:#bfefff;font-weight:750;font-size:.82rem;margin-top:16px}.delta-line{position:absolute;left:12%;right:12%;top:74px;height:2px;background:#829198;z-index:-1}.delta-line span,.delta-line i{position:absolute;width:9px;height:9px;border-radius:50%;top:-4px;background:#071014}.delta-line span:first-child{left:0}.delta-line i{left:50%;background:#d9ff74}.delta-line span:last-child{right:0}
.article-summary-band{background:#d9ff74;padding:36px 0}.article-summary-band>.shell{display:grid;grid-template-columns:1fr auto;gap:50px;align-items:end}.article-summary-band span,.boundary-kicker,.watch-heading>span,.article-agent-dock span{font-size:.66rem;letter-spacing:.14em;font-weight:850}.article-summary-band p{font-size:clamp(1.35rem,2.6vw,2.4rem);line-height:1.1;letter-spacing:-.03em;margin:10px 0 0;max-width:980px}.article-summary-band a{font-weight:800;display:flex;align-items:center;gap:8px}
.article-reading-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:74px;padding-top:85px;padding-bottom:100px}.article-section{display:grid;grid-template-columns:190px 1fr;gap:35px;padding-bottom:70px}.article-section-title>span{font:700 .65rem ui-monospace,monospace;letter-spacing:.12em;color:#6d7a80}.article-section-title h2{font-size:1.35rem;line-height:1.1;margin:10px 0}.evidence-paragraph{border-top:1px solid #c1cac7;padding:24px 0}.evidence-paragraph>p{font:400 1.16rem/1.78 Georgia,serif;margin:0;color:#1e292e}.evidence-inline{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}.evidence-inline a{display:flex;gap:8px;align-items:center;border:1px solid #aebbb8;padding:6px 8px;font:700 .63rem ui-monospace,monospace;color:#506169}.evidence-inline b{background:#071014;color:#d9ff74;padding:2px 5px}
.evidence-spine{border-left:1px solid #aebbb8;padding-left:24px}.spine-head{position:sticky;top:100px;background:#edf1ee;padding:0 0 18px;z-index:2;display:flex;justify-content:space-between;border-bottom:2px solid #071014;font-size:.65rem;letter-spacing:.1em}.evidence-node{display:grid;grid-template-columns:32px 1fr;gap:12px;padding:22px 0;border-bottom:1px solid #c3cdca}.evidence-node-index{font:700 .66rem ui-monospace,monospace;color:#7a898f}.evidence-node span{font:700 .61rem ui-monospace,monospace;color:#63747b}.evidence-node strong{display:block;font-size:.9rem;line-height:1.25;margin:7px 0}.evidence-node p{font-size:.76rem;color:#68777e;margin:0 0 8px}.evidence-node small{display:inline-block;background:#071014;color:#d9ff74;padding:4px 6px}.evidence-node a{display:flex;align-items:center;gap:5px;margin-top:9px;color:#0d697d;font-size:.75rem;font-weight:800}
.article-boundaries{background:#071014;color:#edf5f4;padding:42px;margin:10px 0 60px}.article-boundaries h2{font-size:clamp(2rem,4vw,4rem);line-height:.95;letter-spacing:-.05em}.article-boundaries ul{padding:0;margin:30px 0 0;list-style:none}.article-boundaries li{padding:14px 0;border-top:1px solid #2b3d46;color:#b3c1c6}.article-boundaries li:before{content:"≠";color:#d9ff74;font-weight:900;margin-right:12px}.article-limitations{border-top:2px solid #071014;padding-top:25px}.article-limitations p{color:#536268;line-height:1.7}
.watch-horizon{background:#071014;color:#edf5f4;padding:90px 0}.watch-heading{display:grid;grid-template-columns:160px 1fr 1fr;gap:35px;align-items:start}.watch-heading>span{color:#d9ff74}.watch-heading h2{font-size:clamp(2.8rem,5vw,5.8rem);line-height:.9;letter-spacing:-.06em;margin:0}.watch-heading p{color:#93a6ae;line-height:1.7;margin:0}.watch-grid{display:grid;grid-template-columns:repeat(3,1fr);margin-top:55px;border-top:1px solid #2a3e47}.watch-grid article{padding:28px 24px 10px 0;border-right:1px solid #2a3e47}.watch-grid article+article{padding-left:24px}.watch-grid span{font:700 .66rem ui-monospace,monospace;color:#718791}.watch-grid h3{font-size:1.5rem;line-height:1.05;margin:18px 0}.watch-grid p{color:#8fa3ac}
.article-agent-dock{padding:75px 0;display:grid;grid-template-columns:1fr auto;gap:60px;align-items:end}.article-agent-dock h2{font-size:clamp(2.5rem,5vw,5rem);line-height:.92;letter-spacing:-.055em;margin:10px 0}.article-agent-dock p{max-width:700px;color:#536268}
.reality-index>a{display:block;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:35px 0}.reality-index span,.reality-proof-path span{color:var(--cyan);font-size:.67rem;letter-spacing:.12em}.reality-index h2{font-size:clamp(2rem,4.5vw,4.6rem);line-height:.95;letter-spacing:-.05em;max-width:980px}.reality-index p{color:#93a5ae;max-width:700px}.reality-index b{display:inline-flex;gap:7px;align-items:center;color:#bfefff}
.reality-hero{padding:82px 0;background:#edf1ee;color:#071014}.reality-hero h1{font-size:clamp(3rem,7vw,7rem);line-height:.87;letter-spacing:-.065em;max-width:1120px;margin:30px 0}.reality-verdict{display:grid;grid-template-columns:180px 1fr;gap:1px;background:#abb8b4;margin-top:48px}.reality-verdict>*{background:#f5f7f4;padding:18px}.reality-verdict span{font-size:.66rem;letter-spacing:.11em;font-weight:850}.reality-verdict strong{font-size:1.15rem}.reality-proof-path{display:grid;grid-template-columns:repeat(3,1fr);padding:75px 0}.reality-proof-path>div{padding:26px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.reality-proof-path>div+div{border-left:1px solid var(--line)}.reality-proof-path h2{font-size:2rem;line-height:1.05}.reality-proof-path p{color:#8fa1ac}.reality-proof-path a{color:var(--cyan);display:flex;align-items:center;gap:6px}
.ask-preview{display:grid;grid-template-columns:1.25fr .75fr;gap:1px;background:var(--line);margin-bottom:100px}.ask-preview>div{background:#0a1218;padding:42px}.ask-preview span,.search-types span{color:var(--cyan);font-size:.66rem;letter-spacing:.12em}.ask-preview h2{font-size:clamp(2rem,4vw,4.5rem);line-height:.95}.ask-preview p{color:#92a4ae}.ask-status strong{display:block;font-size:2rem;color:#d9ff74;margin:25px 0}
.search-types{width:min(1240px,calc(100% - 48px));margin:0 auto 100px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);border-left:1px solid var(--line)}.search-types>div{padding:30px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.search-types h2{font-size:2rem}.search-types a{display:flex;justify-content:space-between;gap:12px;padding:14px 0;border-top:1px solid #1c2a33;color:#aebec6}.search-types a svg{color:var(--cyan);flex:none}
.r1-reality-actions{display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin-top:28px}.r1-reality-actions .r1-inline-link{margin-top:0}
@media(max-width:1050px){.article-hero-grid,.article-reading-grid{grid-template-columns:1fr}.evidence-spine{border-left:0;border-top:2px solid #071014;padding:25px 0 0}.spine-head{position:static}.article-summary-band>.shell,.article-agent-dock{grid-template-columns:1fr}.watch-heading{grid-template-columns:1fr}.search-types{grid-template-columns:1fr 1fr}}
@media(max-width:700px){body{padding-bottom:62px}.desktop-nav{display:none}.mobile-dock{position:fixed;display:grid;grid-template-columns:repeat(5,1fr);left:0;right:0;bottom:0;height:62px;background:rgba(6,11,16,.96);border-top:1px solid #263943;z-index:40;backdrop-filter:blur(16px)}.mobile-dock a{display:grid;place-items:center;text-align:center;color:#81949d;font-size:.62rem;font-weight:750}.mobile-dock a.active{color:#d9ff74}.article-hero{padding-top:48px}.article-title h1{font-size:clamp(3rem,15vw,5.6rem)}.article-visual{margin-top:10px}.article-meta{grid-template-columns:1fr}.state-meta{grid-template-columns:1fr}.article-delta{padding:48px 0}.delta-block{grid-template-columns:1fr;border:0}.delta-block article{min-height:auto;border-top:1px solid #aebbb8;padding:28px 0}.delta-block article+article{border-left:0}.delta-evidence{transform:none;margin:0 -14px;padding:30px 14px!important}.delta-line{display:none}.article-summary-band>.shell{display:block}.article-summary-band a{margin-top:24px}.article-reading-grid{padding-top:55px;gap:50px}.article-section{grid-template-columns:1fr;gap:10px;padding-bottom:50px}.article-section-title h2{font-size:2rem}.evidence-paragraph>p{font-size:1.08rem}.article-boundaries{margin-left:-14px;margin-right:-14px;padding:30px 14px}.watch-horizon{padding:65px 0}.watch-grid{grid-template-columns:1fr}.watch-grid article,.watch-grid article+article{border-right:0;border-bottom:1px solid #2a3e47;padding:22px 0}.article-agent-dock{padding:55px 0}.reality-verdict{grid-template-columns:1fr}.reality-proof-path{grid-template-columns:1fr}.reality-proof-path>div+div{border-left:0}.ask-preview{grid-template-columns:1fr;margin-left:14px;margin-right:14px}.search-types{width:min(100% - 28px,1240px);grid-template-columns:1fr}.nav{justify-content:flex-start}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
`);

await mkdir(new URL("data/", out), { recursive: true });
await writeFile(new URL("data/future-graph.json", out), JSON.stringify(graph, null, 2) + "\n");

const urls = [
  "/", "/aujourdhui/", "/questions/", "/methodologie/", "/reality-check/", "/reality-check/ignition-nest-pas-electricite-commerciale/", "/ask/", "/recherche/",
  ...questions.map((q) => "/questions/" + q.slug + "/"),
  ...articles.map((a) => "/avance/" + a.slug + "/"),
  ...events.map((e) => "/preuves/" + e.id.toLowerCase() + "/")
];
await writeFile(
  new URL("sitemap.xml", out),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>https://future-edition.pages.dev${u}</loc></url>`).join("")}</urlset>`
);
await writeFile(new URL("robots.txt", out), "User-agent: *\nAllow: /\nSitemap: https://future-edition.pages.dev/sitemap.xml\n");

console.log(`FE06_PUBLIC_MEDIA_BUILT|pages=${urls.length}|observatories=${observatories.length}|events=${events.length}|claims=${claims.length}|graph_nodes=${graph.nodes.length}`);