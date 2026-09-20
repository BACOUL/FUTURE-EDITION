import { readFile, mkdir, rm, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const [questions, observatories, events, claims, evidence, sources, technologies, graph, editorialFr] = await Promise.all([
  read("data/questions/questions.json"),
  read("data/observatories/observatories.json"),
  read("data/events/events.json"),
  read("data/claims/claims.json"),
  read("data/evidence/evidence.json"),
  read("data/sources/sources.json"),
  read("data/technologies/technologies.json"),
  read("generated/future-graph.json"),
  read("data/editorial/fr/events.json")
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
  graph: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 7l3 9M16 7l-3 9M8 6h8"/></svg>'
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
<nav aria-label="Navigation principale">
<a class="${active === "today" ? "active" : ""}" href="/aujourdhui/">Aujourd’hui</a>
<a class="${active === "questions" ? "active" : ""}" href="/questions/">Observatoires</a>
<a class="${active === "method" ? "active" : ""}" href="/methodologie/">Méthode</a>
</nav>
</div></header>
<main id="contenu">${body}</main>
<footer><div class="shell footer-grid"><div><div class="brand footer-brand"><span class="brand-mark">F</span><span>FUTURE<br><b>EDITION</b></span></div><p>Nous suivons ce qui devient possible.</p></div><div><strong>Explorer</strong><a href="/aujourdhui/">Aujourd’hui</a><a href="/questions/">Observatoires</a><a href="/methodologie/">Méthode</a></div><div><strong>État des preuves</strong><p>50 événements fondateurs sourcés.<br>51 jalons encore non évalués.</p></div></div></footer>
</body></html>`;

const qEvents = (qid) => events.filter((e) => e.question_ids.includes(qid)).sort((a, b) => b.event_date.localeCompare(a.event_date));
const latestByQuestion = questions
  .map((q) => ({ q, event: qEvents(q.id)[0] }))
  .filter((x) => x.event)
  .sort((a, b) => b.event.event_date.localeCompare(a.event.event_date));

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
   <a class="proof-link" href="/preuves/${esc(event.id.toLowerCase())}/">${icon("proof")} Ouvrir la preuve</a></div>
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
    <div class="r1-story-bottom"><span>${esc(confidenceLabel[claim?.confidence] ?? "Non évalué")}</span><a href="/preuves/${esc(event.id.toLowerCase())}/">Voir la preuve ${icon("arrow")}</a></div>
  </article>`;
}).join("");

const r1Topics = questions.map((q, i) => `<a href="/questions/${esc(q.slug)}/"><span>${String(i + 1).padStart(2, "0")}</span><strong>${esc(q.title)}</strong><em>${esc(profileLabel[q.evidence_profile] ?? q.evidence_profile)}</em>${icon("arrow")}</a>`).join("");

await writePage("/", layout(
  "Future Edition — L’intelligence du progrès",
  "Future Edition cartographie ce qui devient possible, ce que les preuves changent et ce qu’il reste à démontrer.",
  `<section class="r1-cover">
    <div class="shell r1-cover-grid">
      <div class="r1-cover-copy">
        <div class="r1-eyebrow"><span class="r1-live"></span><span>Future Graph · édition de référence</span><span>50 événements vérifiés</span></div>
        <h1>Ce qui devient<br><em>possible.</em></h1>
        <p class="r1-deck">Nous ne suivons pas le bruit. Nous suivons le moment précis où une nouvelle preuve change ce que l’on peut raisonnablement dire sur une technologie, une thérapie ou une découverte.</p>
        <div class="r1-actions">
          <a class="r1-primary" href="/questions/">Explorer les observatoires ${icon("arrow")}</a>
          <a class="r1-text-link" href="/methodologie/">Voir comment nous vérifions ${icon("arrow")}</a>
        </div>
      </div>
      <figure class="r1-hero-visual" aria-label="Visualisation du Future Graph appliqué à la fusion">
        <svg viewBox="0 0 760 680" role="img" aria-labelledby="fg-title fg-desc">
          <title id="fg-title">Future Graph — trajectoire de la fusion</title>
          <desc id="fg-desc">Visualisation éditoriale reliant des événements vérifiés à une grande question scientifique sans déclarer de jalon atteint.</desc>
          <defs>
            <radialGradient id="glow" cx="50%" cy="46%" r="62%"><stop offset="0" stop-color="#7ce7ff" stop-opacity=".24"/><stop offset=".65" stop-color="#7ce7ff" stop-opacity=".03"/><stop offset="1" stop-color="#7ce7ff" stop-opacity="0"/></radialGradient>
            <linearGradient id="trace" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9ff74"/><stop offset="1" stop-color="#73e4ff"/></linearGradient>
          </defs>
          <circle cx="385" cy="328" r="286" fill="url(#glow)"/>
          <circle cx="385" cy="328" r="230" fill="none" stroke="#29404a"/><circle cx="385" cy="328" r="160" fill="none" stroke="#22343d"/><circle cx="385" cy="328" r="92" fill="none" stroke="#1e2c34"/>
          <path d="M118 502 C210 420 220 252 340 250 S500 320 610 152" fill="none" stroke="url(#trace)" stroke-width="3"/>
          <path d="M118 502 C208 452 295 500 365 430 S505 300 640 375" fill="none" stroke="#50646e" stroke-width="1.5" stroke-dasharray="7 9"/>
          <g fill="#081015" stroke="#d9ff74" stroke-width="3"><circle cx="118" cy="502" r="10"/><circle cx="340" cy="250" r="10"/><circle cx="610" cy="152" r="10"/></g>
          <g fill="#081015" stroke="#73e4ff" stroke-width="3"><circle cx="365" cy="430" r="10"/><circle cx="640" cy="375" r="10"/></g>
          <g fill="#eef6f7" font-family="system-ui,sans-serif">
            <text x="84" y="542" font-size="17" font-weight="700">NIF</text><text x="84" y="565" font-size="13" fill="#8ba0aa">2021 · 1,35 MJ</text>
            <text x="307" y="218" font-size="17" font-weight="700">Ignition</text><text x="307" y="239" font-size="13" fill="#8ba0aa">2022</text>
            <text x="560" y="115" font-size="17" font-weight="700">JET</text><text x="560" y="137" font-size="13" fill="#8ba0aa">2024 · 69,26 MJ</text>
            <text x="318" y="468" font-size="17" font-weight="700">W7-X</text><text x="318" y="491" font-size="13" fill="#8ba0aa">2025 · 43 s</text>
            <text x="580" y="414" font-size="17" font-weight="700">Commercial</text><text x="580" y="437" font-size="13" fill="#8ba0aa">non évalué</text>
          </g>
          <g transform="translate(285 292)"><rect width="200" height="88" rx="44" fill="#eef6f7"/><text x="100" y="38" text-anchor="middle" fill="#071017" font-size="13" font-weight="800" letter-spacing="2">QUESTION</text><text x="100" y="62" text-anchor="middle" fill="#071017" font-size="16" font-weight="700">Fusion commerciale ?</text></g>
        </svg>
        <figcaption><span>Observatoire 06 · Fusion</span><strong>5 preuves du socle · aucun jalon automatiquement atteint</strong></figcaption>
      </figure>
    </div>
    <div class="shell r1-metrics" aria-label="État du graphe">
      <div><b>10</b><span>questions suivies sur le long terme</span></div>
      <div><b>50</b><span>événements fondateurs reliés à leurs sources</span></div>
      <div><b>354</b><span>objets dans le Future Graph</span></div>
      <div><b>0</b><span>changement de jalon publié sans revue</span></div>
    </div>
  </section>

  <section class="r1-editorial">
    <div class="shell">
      <div class="r1-section-label"><span>Reality Check</span><span>Fusion · comprendre le niveau de preuve</span></div>
      <div class="r1-reality-grid">
        <div class="r1-reality-art" aria-hidden="true">
          <svg viewBox="0 0 640 620">
            <defs><linearGradient id="plasma" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9ff74"/><stop offset=".52" stop-color="#7ce7ff"/><stop offset="1" stop-color="#926cff"/></linearGradient></defs>
            <rect width="640" height="620" fill="#0b1317"/><ellipse cx="320" cy="310" rx="230" ry="74" fill="none" stroke="#263941" stroke-width="62"/><ellipse cx="320" cy="310" rx="182" ry="42" fill="none" stroke="url(#plasma)" stroke-width="9"/><ellipse cx="320" cy="310" rx="122" ry="25" fill="none" stroke="#edf7f7" stroke-width="2" opacity=".6"/>
            <path d="M96 122h180M96 144h108M432 492h112M476 470h68" stroke="#59727d"/><text x="96" y="96" fill="#8fa4ad" font-size="14" font-family="system-ui">EVIDENCE / 06</text><text x="96" y="520" fill="#f2f6f5" font-size="44" font-family="system-ui" font-weight="800">IGNITION</text><text x="96" y="558" fill="#8fa4ad" font-size="20" font-family="system-ui">≠ électricité commerciale</text>
          </svg>
        </div>
        <article class="r1-reality-copy">
          <p class="r1-kicker">Ce que la preuve change — et ce qu’elle ne change pas</p>
          <h2>L’ignition en laboratoire n’est pas encore une centrale électrique.</h2>
          <p class="r1-lead">Le NIF a démontré l’ignition de fusion en laboratoire. JET et Wendelstein 7-X ont depuis ajouté d’autres repères importants. Mais ces résultats ne suffisent pas, à eux seuls, à démontrer une production électrique commerciale durable.</p>
          <div class="r1-before-after">
            <div><span>Avant</span><strong>L’ignition restait un seuil expérimental non franchi au NIF.</strong></div>
            <div><span>Preuve</span><strong>Le tir du 5 décembre 2022 a produit davantage d’énergie de fusion que l’énergie laser délivrée à la cible.</strong></div>
            <div><span>Après</span><strong>Une étape scientifique est démontrée ; la viabilité commerciale reste une question distincte.</strong></div>
          </div>
          <a class="r1-inline-link" href="/questions/energie-de-fusion-commerciale/">Explorer l’observatoire Fusion ${icon("arrow")}</a>
        </article>
      </div>
    </div>
  </section>

  <section class="shell r1-foundation">
    <div class="r1-section-heading"><div><p class="r1-kicker">Base de référence</p><h2>Des repères, pas un faux fil d’actualité.</h2></div><p>Les 50 événements actuels construisent l’histoire vérifiable des dix observatoires. Ils restent dans les chronologies tant que l’intelligence éditoriale continue n’est pas ouverte.</p></div>
    <div class="r1-story-grid">${r1Stories}</div>
  </section>

  <section class="r1-system">
    <div class="shell r1-system-grid">
      <div class="r1-system-copy"><p class="r1-kicker">Pourquoi Future Edition existe</p><h2>Un média qui conserve l’état du monde, au lieu de reconstruire une réponse à chaque requête.</h2><p>Chaque événement rejoint un graphe temporel. Une nouvelle étude ne remplace pas l’ancienne : elle est comparée à l’état précédent, reliée à ses preuves et peut proposer un changement qui reste soumis à revue.</p><a class="r1-inline-link" href="/methodologie/">Comprendre Evidence Engine + Change Engine ${icon("arrow")}</a></div>
      <div class="r1-pipeline" aria-label="Chaîne Future Edition"><div><span>01</span><b>Signal</b><small>quelque chose mérite une enquête</small></div><div><span>02</span><b>Preuve</b><small>source primaire, statut, limites</small></div><div><span>03</span><b>État</b><small>comparaison avec ce que nous savions</small></div><div><span>04</span><b>Changement</b><small>avant → preuve → après</small></div><div><span>05</span><b>Publication</b><small>explication humaine + données traçables</small></div></div>
    </div>
  </section>

  <section class="shell r1-observatories">
    <div class="r1-section-heading"><div><p class="r1-kicker">Observatoires</p><h2>Dix questions qui valent des années de suivi.</h2></div><a class="r1-inline-link" href="/questions/">Voir les dix observatoires ${icon("arrow")}</a></div>
    <div class="r1-topic-list">${r1Topics}</div>
  </section>

  <section class="r1-closing">
    <div class="shell r1-closing-grid"><p class="r1-kicker">La règle</p><blockquote>Une avancée n’est pas ce qu’un communiqué promet. C’est ce qu’une nouvelle preuve permet réellement d’ajouter à l’état du monde.</blockquote><a class="r1-primary inverse" href="/methodologie/">Voir la méthode complète ${icon("arrow")}</a></div>
  </section>`
));

await writePage("/aujourdhui", layout(
  "Aujourd’hui — Future Edition",
  "Les événements et changements suivis par Future Edition.",
  `<section class="page-hero shell"><p class="kicker">Aujourd’hui</p><h1>Ce qui mérite<br>d’être retenu.</h1><p>Le socle contient déjà 50 événements historiques vérifiés. Le flux « Aujourd’hui » deviendra dynamique à FE-12 ; pour l’instant, voici les événements les plus récents de chaque observatoire.</p></section>
 <section class="shell section"><div class="status-callout"><span>État scientifique</span><strong>0 changement de jalon approuvé</strong><p>C’est volontaire : nous préférons afficher « non évalué » plutôt que transformer automatiquement un événement en progrès scientifique.</p></div>
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
  <section class="shell split-section"><div><p class="kicker">Radar</p><h2>Où en sommes-nous ?</h2><p class="section-copy">Nous avons une base historique, mais aucun jalon n’est automatiquement marqué comme atteint. C’est le Change Engine qui décidera, après revue humaine, si une nouvelle preuve change réellement l’état.</p></div><div class="radar-card"><div class="radar-ring r1"></div><div class="radar-ring r2"></div><div class="radar-ring r3"></div><div class="radar-axis"></div><span class="radar-center">?</span><small>État non évalué</small></div></section>
  <section class="shell section"><div class="section-head"><div><p class="kicker">Jalons</p><h2>La route vers une réponse.</h2></div></div><ol class="milestone-list">${milestoneHtml}</ol></section>
  <section class="shell section"><div class="section-head"><div><p class="kicker">Chronologie fondatrice</p><h2>${qe.length} événements vérifiés.</h2></div><p class="section-copy">Chaque entrée ci-dessous remonte à une source canonique et conserve son niveau de confiance.</p></div><div class="timeline">${timeline}</div></section>`,
    { active: "questions" }
  ));
}


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
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
`);

await mkdir(new URL("data/", out), { recursive: true });
await writeFile(new URL("data/future-graph.json", out), JSON.stringify(graph, null, 2) + "\n");

const urls = ["/", "/aujourdhui/", "/questions/", "/methodologie/", ...questions.map((q) => "/questions/" + q.slug + "/"), ...events.map((e) => "/preuves/" + e.id.toLowerCase() + "/")];
await writeFile(
  new URL("sitemap.xml", out),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>https://future-edition.pages.dev${u}</loc></url>`).join("")}</urlset>`
);
await writeFile(new URL("robots.txt", out), "User-agent: *\nAllow: /\nSitemap: https://future-edition.pages.dev/sitemap.xml\n");

console.log(`FE06_PUBLIC_MEDIA_BUILT|pages=${urls.length}|observatories=${observatories.length}|events=${events.length}|claims=${claims.length}|graph_nodes=${graph.nodes.length}`);