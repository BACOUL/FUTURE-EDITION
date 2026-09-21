import { mkdir, rm, writeFile, readFile, cp } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const out = new URL("../dist-v2/", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const [
  questions, events, claims, evidence, sources, assessments, changes, reviews, editorial, editorialEventsFr, r2
] = await Promise.all([
  readJson("data/questions/questions.json"),
  readJson("data/events/events.json"),
  readJson("data/claims/claims.json"),
  readJson("data/evidence/evidence.json"),
  readJson("data/sources/sources.json"),
  readJson("data/assessments/assessments.json"),
  readJson("data/changes/changes.json"),
  readJson("data/reviews/reviews.json"),
  readJson("data/editorial/fr/v2-slice.json"),
  readJson("data/editorial/fr/events.json"),
  readJson("benchmarks/fe06r/r2-living-slice.proof.json")
]);

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});

const q = questions.find((x)=>x.id==="Q-008");
const change = changes.find((x)=>x.id==="CHANGE-000001");
const before = assessments.find((x)=>x.id===change.before_assessment_id);
const after = assessments.find((x)=>x.id===change.after_assessment_id);
const event = events.find((x)=>x.id===change.trigger_event_ids[0]);
const claim = claims.find((x)=>x.id===change.trigger_claim_ids[0]);
const ev = evidence.find((x)=>x.id===change.trigger_evidence_ids[0]);
const source = sources.find((x)=>x.id===ev.source_id);
const review = reviews.find((x)=>x.id===change.review_id);
if(!q||!change||!before||!after||!event||!claim||!ev||!source||!review) throw new Error("R3 canonical chain incomplete");

const esc=(v)=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const fmtDate=(value)=>new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(value));
const articlePath="/avance/"+editorial.article.slug+"/";
const obsPath="/observatoires/"+editorial.observatory.slug+"/";
const evidencePath="/preuves/"+event.id.toLowerCase()+"/";
const machinePath="/machine/changes/"+change.id.toLowerCase()+".json";
const siteBase="https://future-edition.pages.dev";

const css=`
:root{--paper:#f3efe6;--paper2:#e8e2d6;--ink:#121212;--muted:#625f59;--line:#cbc3b4;--red:#d94832;--blue:#2749d8;--acid:#d7ef62;--white:#fffdf8;--serif:Georgia,"Times New Roman",serif;--sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}html{background:var(--paper);color:var(--ink);font-family:var(--sans);scroll-behavior:smooth}body{margin:0;background:var(--paper);font-size:16px;line-height:1.55}a{color:inherit;text-decoration:none}a:focus-visible,button:focus-visible{outline:3px solid var(--blue);outline-offset:4px}.skip{position:absolute;left:-9999px}.skip:focus{left:14px;top:14px;z-index:100;background:var(--white);padding:12px 16px}.shell{width:min(1220px,calc(100% - 48px));margin:auto}.top{border-bottom:1px solid var(--line);background:rgba(243,239,230,.94);position:sticky;top:0;z-index:30;backdrop-filter:blur(14px)}.nav{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:30px}.brand{display:flex;align-items:center;gap:12px;font-weight:900;letter-spacing:-.04em}.brand-mark{width:36px;height:36px;border:2px solid var(--ink);display:grid;place-items:center;font-family:var(--serif);font-style:italic}.desktop-nav{display:flex;gap:24px;align-items:center;font-size:.82rem;font-weight:750}.desktop-nav a:last-child{border-bottom:1px solid var(--ink)}.mobile-menu{display:none}.edition-line{border-bottom:1px solid var(--line);font:700 .67rem/1 var(--sans);letter-spacing:.13em;text-transform:uppercase}.edition-line .shell{padding:11px 0;display:flex;justify-content:space-between;color:var(--muted)}.hero{padding:54px 0 72px;border-bottom:1px solid var(--line)}.hero-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(380px,.92fr);gap:62px;align-items:center}.kicker{font-size:.7rem;font-weight:850;letter-spacing:.14em;text-transform:uppercase;color:var(--red)}h1,h2,h3{font-family:var(--serif);font-weight:500;letter-spacing:-.045em}.hero h1{font-size:clamp(4rem,7.7vw,8.2rem);line-height:.86;margin:18px 0 28px;max-width:900px}.hero-deck{font-size:clamp(1.12rem,1.8vw,1.45rem);line-height:1.55;max-width:780px}.hero-note{border-left:3px solid var(--red);padding-left:18px;color:var(--muted);max-width:680px;margin:28px 0}.hero-actions{display:flex;gap:18px;align-items:center;margin-top:34px;flex-wrap:wrap}.button{display:inline-flex;align-items:center;justify-content:center;padding:13px 18px;background:var(--ink);color:var(--white);font-weight:800;font-size:.84rem}.text-link{font-weight:800;border-bottom:1px solid var(--ink);padding-bottom:3px}.hero-visual{margin:0;position:relative;min-height:610px;background:var(--blue);overflow:hidden}.hero-visual svg{display:block;width:100%;height:100%;position:absolute;inset:0}.hero-visual figcaption{position:absolute;left:24px;bottom:22px;right:24px;color:#fff;font-size:.76rem;line-height:1.45}.proof-strip{background:var(--ink);color:var(--white)}.proof-strip .shell{display:grid;grid-template-columns:1.1fr .9fr;gap:60px;padding:31px 0;align-items:center}.proof-strip strong{font-family:var(--serif);font-size:clamp(1.45rem,2.5vw,2.4rem);font-weight:500}.proof-strip p{margin:0;color:#cbc7bd}.section{padding:84px 0;border-bottom:1px solid var(--line)}.section-heading{display:grid;grid-template-columns:1.1fr .9fr;gap:70px;align-items:end;margin-bottom:48px}.section-heading h2{font-size:clamp(3rem,5.7vw,6rem);line-height:.9;margin:10px 0}.section-heading p{color:var(--muted);font-size:1.04rem;max-width:560px}.signals{display:grid;grid-template-columns:repeat(12,1fr);border-top:1px solid var(--ink)}.signal{padding:24px 20px 32px;border-bottom:1px solid var(--ink);min-height:275px;position:relative}.signal:nth-child(1){grid-column:span 7;border-right:1px solid var(--ink)}.signal:nth-child(2){grid-column:span 5}.signal:nth-child(3){grid-column:span 4;border-right:1px solid var(--ink)}.signal:nth-child(4){grid-column:span 4;border-right:1px solid var(--ink)}.signal:nth-child(5){grid-column:span 4}.signal .tag{display:flex;justify-content:space-between;gap:12px;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--muted)}.signal h3{font-size:clamp(1.7rem,3vw,3rem);line-height:1.02;margin:34px 0 18px}.signal p{color:var(--muted);margin:0}.signal em{position:absolute;bottom:18px;left:20px;font-style:normal;font-size:.68rem;font-weight:800;color:var(--red)}.observatory-band{background:var(--blue);color:white}.observatory-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px;padding:85px 0}.observatory-band h2{font-size:clamp(3.4rem,6.8vw,7rem);line-height:.88;margin:12px 0}.observatory-answer{font-family:var(--serif);font-size:clamp(1.55rem,2.8vw,2.8rem);line-height:1.2;margin:0 0 28px}.observatory-grid p{color:#e4e7ff}.observatory-grid .button{background:white;color:var(--blue)}.watch{background:var(--acid)}.watch-grid{display:grid;grid-template-columns:.82fr 1.18fr;gap:70px;padding:72px 0}.watch h2{font-size:clamp(2.6rem,5vw,5rem);line-height:.92;margin:8px 0}.watch p{font-family:var(--serif);font-size:clamp(1.45rem,2.8vw,2.7rem);line-height:1.25;margin:0}.footer{padding:55px 0 90px;background:var(--ink);color:white}.footer-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:60px}.footer p{color:#bcb8b0}.footer-links{display:flex;gap:18px;flex-wrap:wrap;justify-content:flex-end;font-size:.78rem}.article-hero{padding:64px 0 48px;border-bottom:1px solid var(--line)}.article-hero h1{font-size:clamp(4rem,8.5vw,8.9rem);line-height:.84;margin:18px 0 28px;max-width:1150px}.article-deck{font-family:var(--serif);font-size:clamp(1.5rem,2.6vw,2.65rem);line-height:1.2;max-width:980px}.article-meta{display:flex;gap:16px 26px;flex-wrap:wrap;margin-top:35px;font-size:.76rem;color:var(--muted)}.article-figure{width:min(1220px,calc(100% - 48px));margin:0 auto 70px;background:var(--red);height:520px;position:relative;overflow:hidden}.article-figure svg{width:100%;height:100%}.article-figure figcaption{position:absolute;left:24px;bottom:20px;color:white;font-size:.73rem}.article-body{width:min(760px,calc(100% - 48px));margin:0 auto;padding:20px 0 80px}.article-body .lead{font-family:var(--serif);font-size:1.9rem;line-height:1.35}.article-body p{font-size:1.08rem;line-height:1.78}.pull{width:min(1040px,calc(100% - 48px));margin:0 auto 80px;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);display:grid;grid-template-columns:.45fr 1.55fr;gap:50px;padding:32px 0}.pull span{font-size:.7rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:var(--red)}.pull p{font-family:var(--serif);font-size:clamp(1.8rem,3.6vw,3.7rem);line-height:1.08;margin:0}.limits{background:var(--ink);color:white;padding:78px 0}.limits-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px}.limits h2{font-size:clamp(3rem,5.5vw,5.8rem);line-height:.9;margin:8px 0}.limits ol{margin:0;padding:0;list-style:none}.limits li{font-family:var(--serif);font-size:1.45rem;line-height:1.3;padding:18px 0;border-bottom:1px solid #4b4b48}.verify{padding:80px 0;background:var(--white)}.verify-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:70px;align-items:start}.verify h2{font-size:clamp(3rem,5.6vw,5.8rem);line-height:.9;margin:8px 0}.source-card{border:1px solid var(--ink);padding:28px}.source-card small{display:block;color:var(--muted);margin-bottom:16px}.source-card strong{display:block;font-family:var(--serif);font-size:2rem;line-height:1.1}.source-card p{color:var(--muted)}.source-card a{display:inline-block;margin-top:16px;font-weight:850;border-bottom:2px solid var(--red)}.obs-hero{padding:72px 0 65px;background:var(--blue);color:white}.obs-hero h1{font-size:clamp(4rem,8.2vw,8.5rem);line-height:.85;margin:16px 0 34px}.obs-answer{display:grid;grid-template-columns:.55fr 1.45fr;gap:50px;border-top:1px solid rgba(255,255,255,.5);padding-top:28px}.obs-answer strong{font-family:var(--serif);font-size:clamp(2rem,4vw,4.3rem);font-weight:500}.obs-answer p{font-size:1.1rem;color:#e4e7ff}.timeline{padding:82px 0}.timeline h2,.milestones h2{font-size:clamp(3rem,5.6vw,5.8rem);line-height:.9;margin:8px 0 45px}.timeline-list{border-top:1px solid var(--ink)}.time-row{display:grid;grid-template-columns:150px 1fr 220px;gap:35px;padding:26px 0;border-bottom:1px solid var(--ink);align-items:start}.time-row time{font-size:.74rem;font-weight:850}.time-row h3{font-size:2rem;margin:0 0 8px}.time-row p{margin:0;color:var(--muted)}.time-row em{font-style:normal;font-size:.72rem;font-weight:850;color:var(--red)}.milestones{padding:82px 0;background:var(--white)}.milestone-list{display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid var(--ink);border-left:1px solid var(--ink)}.milestone{min-height:310px;border-right:1px solid var(--ink);border-bottom:1px solid var(--ink);padding:22px}.milestone span{font-size:.7rem;font-weight:850;color:var(--muted)}.milestone h3{font-size:1.7rem;line-height:1.05;margin:45px 0 18px}.milestone p{font-size:.83rem;color:var(--muted)}.milestone b{display:block;margin-top:26px;font-size:.72rem}.milestone.current{background:var(--acid)}.next-proof{padding:80px 0}.next-grid{display:grid;grid-template-columns:.7fr 1.3fr;gap:70px}.next-proof h2{font-size:clamp(3rem,5.6vw,5.8rem);line-height:.9;margin:8px 0}.next-proof ul{list-style:none;margin:0;padding:0}.next-proof li{font-family:var(--serif);font-size:1.55rem;line-height:1.3;padding:20px 0;border-bottom:1px solid var(--ink)}.evidence-hero{padding:72px 0 55px;border-bottom:1px solid var(--line)}.evidence-hero h1{font-size:clamp(3.8rem,7vw,7.2rem);line-height:.86;margin:16px 0}.evidence-layout{display:grid;grid-template-columns:1fr 1fr;gap:70px;padding:75px 0}.evidence-layout h2{font-size:2.6rem;margin:0 0 16px}.claim-quote{font-family:var(--serif);font-size:clamp(1.65rem,3vw,3rem);line-height:1.2;border-left:4px solid var(--red);padding-left:24px}.evidence-box{border-top:1px solid var(--ink);padding:24px 0}.evidence-box span{font-size:.68rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}.evidence-box p{font-size:1rem}.evidence-box code{font-size:.78rem;overflow-wrap:anywhere}.machine-note{margin-top:50px;padding-top:22px;border-top:1px solid var(--line);font-size:.76rem;color:var(--muted)}.candidate-warning{display:inline-block;background:var(--ink);color:white;padding:5px 8px;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;font-weight:900}
@media(max-width:900px){.hero-grid,.proof-strip .shell,.section-heading,.observatory-grid,.watch-grid,.limits-grid,.verify-grid,.obs-answer,.next-grid,.evidence-layout,.footer-grid{grid-template-columns:1fr}.hero-visual{min-height:460px}.signals{display:block}.signal{border-right:0!important}.milestone-list{grid-template-columns:1fr 1fr}.time-row{grid-template-columns:110px 1fr}.time-row em{grid-column:2}.footer-links{justify-content:flex-start}}
@media(max-width:620px){.shell{width:min(100% - 28px,1220px)}.nav{min-height:68px}.desktop-nav{display:none}.mobile-menu{display:block;font-size:.75rem;font-weight:850}.edition-line .shell{display:block;line-height:1.5}.hero{padding:38px 0 48px}.hero h1{font-size:clamp(3.3rem,16vw,5.4rem)}.hero-grid{gap:35px}.hero-visual{min-height:390px}.hero-actions{align-items:stretch;flex-direction:column}.button{width:100%}.section{padding:58px 0}.section-heading{gap:18px;margin-bottom:30px}.section-heading h2{font-size:3.15rem}.signal{min-height:235px;padding-left:0;padding-right:0}.signal em{left:0}.observatory-grid,.watch-grid{padding:58px 0;gap:26px}.article-hero{padding:42px 0 34px}.article-hero h1{font-size:clamp(3.4rem,16vw,5.5rem)}.article-deck{font-size:1.45rem}.article-figure{width:100%;height:360px}.article-body{width:min(100% - 28px,760px);padding-bottom:55px}.article-body .lead{font-size:1.55rem}.pull{width:min(100% - 28px,1040px);grid-template-columns:1fr;gap:12px;margin-bottom:55px}.pull p{font-size:2.2rem}.limits{padding:58px 0}.limits-grid{gap:25px}.limits li{font-size:1.2rem}.verify{padding:58px 0}.obs-hero{padding:46px 0}.obs-hero h1{font-size:clamp(3.2rem,15vw,5.3rem)}.obs-answer{gap:16px}.timeline,.milestones,.next-proof{padding:58px 0}.time-row{grid-template-columns:1fr;gap:8px}.time-row em{grid-column:auto}.milestone-list{grid-template-columns:1fr}.milestone{min-height:auto}.evidence-hero{padding:46px 0}.evidence-layout{padding:52px 0;gap:36px}.claim-quote{font-size:1.6rem}.footer{padding-bottom:55px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;

const iconArrow='<span aria-hidden="true">↗</span>';

const heroSvg=`<svg viewBox="0 0 620 700" role="img" aria-labelledby="v2heroTitle v2heroDesc">
<title id="v2heroTitle">De l’hypothèse générée par IA à l’expérience humaine</title>
<desc id="v2heroDesc">Illustration éditoriale abstraite : un réseau algorithmique conduit vers des cellules observées en laboratoire.</desc>
<rect width="620" height="700" fill="#2749d8"/>
<circle cx="465" cy="180" r="130" fill="#d7ef62"/>
<circle cx="465" cy="180" r="74" fill="#f3efe6"/>
<circle cx="465" cy="180" r="30" fill="#d94832"/>
<path d="M64 530 C150 390, 220 600, 318 430 S455 340, 545 390" fill="none" stroke="#fffdf8" stroke-width="4"/>
<g fill="#fffdf8"><circle cx="80" cy="510" r="10"/><circle cx="155" cy="430" r="10"/><circle cx="238" cy="505" r="10"/><circle cx="325" cy="424" r="10"/><circle cx="410" cy="370" r="10"/><circle cx="540" cy="390" r="10"/></g>
<text x="52" y="72" fill="#fffdf8" font-family="Georgia,serif" font-size="42">hypothèse</text>
<text x="374" y="342" fill="#fffdf8" font-family="system-ui" font-size="14" letter-spacing="2">EXPÉRIENCE HUMAINE</text>
<text x="52" y="640" fill="#fffdf8" font-family="system-ui" font-size="16">IA → direction expérimentale → laboratoire</text>
</svg>`;

const articleSvg=`<svg viewBox="0 0 1200 520" role="img" aria-labelledby="articleVisTitle articleVisDesc">
<title id="articleVisTitle">La boucle Robin entre calcul et laboratoire</title>
<desc id="articleVisDesc">Trois étapes : hypothèses générées par IA, expérimentation réalisée par des chercheurs, résultat mesuré.</desc>
<rect width="1200" height="520" fill="#d94832"/>
<g fill="none" stroke="#fffdf8" stroke-width="2"><path d="M120 260H1080"/><circle cx="200" cy="260" r="72"/><circle cx="600" cy="260" r="72"/><circle cx="1000" cy="260" r="72"/></g>
<g fill="#fffdf8" font-family="Georgia,serif"><text x="128" y="132" font-size="42">01</text><text x="528" y="132" font-size="42">02</text><text x="928" y="132" font-size="42">03</text></g>
<g fill="#fffdf8" font-family="system-ui" font-size="18"><text x="128" y="390">Hypothèses produites</text><text x="528" y="390">Expériences humaines</text><text x="928" y="390">Effets mesurés</text></g>
<g fill="#d7ef62"><circle cx="200" cy="260" r="18"/><rect x="576" y="236" width="48" height="48"/><path d="M1000 225l35 60h-70z"/></g>
</svg>`;

const meta=(title,description,canonical)=>`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(description)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(siteBase+canonical)}"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${esc(siteBase+canonical)}"><link rel="alternate" type="application/json" href="${machinePath}" title="Représentation machine"><title>${esc(title)}</title><link rel="stylesheet" href="/assets/styles.css">`;

const header=()=>`<a class="skip" href="#contenu">Aller au contenu</a><header class="top"><div class="shell nav"><a class="brand" href="/"><span class="brand-mark">F</span><span>FUTURE EDITION</span></a><nav class="desktop-nav" aria-label="Navigation principale"><a href="/">Aujourd’hui</a><a href="${obsPath}">Observatoires</a><a href="#enquetes">Enquêtes</a><a href="${evidencePath}">Preuves</a></nav><span class="mobile-menu">MENU · ÉDITION</span></div></header>`;
const footer=()=>`<footer class="footer"><div class="shell footer-grid"><div><a class="brand" href="/"><span class="brand-mark">F</span><span>FUTURE EDITION</span></a><p>Comprendre ce qui change dans la connaissance — et pouvoir remonter jusqu’à la preuve.</p></div><div class="footer-links"><a href="${obsPath}">Observatoire</a><a href="${evidencePath}">Preuve</a><a href="${machinePath}">Version machine</a></div></div></footer>`;
const layout=(title,description,canonical,body)=>`<!doctype html><html lang="fr"><head>${meta(title,description,canonical)}</head><body>${header()}<main id="contenu">${body}</main>${footer()}</body></html>`;

const candidateCards=r2.selected_candidates.map((c)=>{
  const note=editorial.candidate_notes[c.id]??"Enquête ouverte";
  const label=editorial.candidate_labels[c.question_id]??c.question_id;
  const publicTitle=editorial.candidate_titles?.[c.id]??c.title;
  return `<article class="signal"><div class="tag"><span>${esc(label)}</span><span>2026</span></div><h3>${esc(publicTitle)}</h3><p>${esc(note)}</p><em>ENQUÊTE OUVERTE · PAS ENCORE UNE AVANCÉE</em></article>`;
}).join("");

const home=layout(
  "Future Edition — Ce qui a réellement changé",
  "Future Edition suit les changements de connaissance, distingue les signaux des avancées et permet de remonter jusqu’à la preuve.",
  "/",
  `<div class="edition-line"><div class="shell"><span>${esc(editorial.home.edition_label)}</span><span>1 changement confirmé · 5 enquêtes ouvertes</span></div></div>
  <section class="hero"><div class="shell hero-grid"><div><p class="kicker">${esc(editorial.home.hero_kicker)}</p><h1>${esc(editorial.home.hero_title)}</h1><p class="hero-deck">${esc(editorial.home.hero_deck)}</p><p class="hero-note">${esc(editorial.home.hero_note)}</p><div class="hero-actions"><a class="button" href="${articlePath}">Lire l’histoire ${iconArrow}</a><a class="text-link" href="${evidencePath}">Vérifier la preuve</a></div></div><figure class="hero-visual">${heroSvg}<figcaption>Illustration éditoriale : la boucle décrite dans l’étude Robin relie génération d’hypothèses et expérimentation humaine.</figcaption></figure></div></section>
  <section class="proof-strip"><div class="shell"><strong>Le jalon ne change pas. Le niveau de confiance, oui.</strong><p>Validation expérimentale : atteinte. Confiance : solide mais préliminaire → confirmée. Cette évolution résulte d’une revue humaine de la nouvelle preuve, pas d’un score automatique.</p></div></section>
  <section class="section" id="enquetes"><div class="shell"><div class="section-heading"><div><p class="kicker">VEILLE EN COURS</p><h2>${esc(editorial.home.section_open)}</h2></div><p>${esc(editorial.home.section_open_deck)}</p></div><div class="signals">${candidateCards}</div></div></section>
  <section class="observatory-band"><div class="shell observatory-grid"><div><p class="kicker" style="color:#d7ef62">OBSERVATOIRE · IA & SCIENCE</p><h2>${esc(editorial.home.observatory_title)}</h2></div><div><p class="observatory-answer">${esc(editorial.home.observatory_answer)}</p><a class="button" href="${obsPath}">Ouvrir la grande question ${iconArrow}</a></div></div></section>
  <section class="watch"><div class="shell watch-grid"><div><p class="kicker">À SURVEILLER</p><h2>${esc(editorial.home.watch_title)}</h2></div><p>${esc(editorial.home.watch_text)}</p></div></section>`
);

const articleParagraphs=editorial.article.paragraphs.map((p)=>`<p>${esc(p)}</p>`).join("");
const article=layout(
  editorial.article.title+" — Future Edition",
  editorial.article.deck,
  articlePath,
  `<article><header class="article-hero"><div class="shell"><p class="kicker">${esc(editorial.article.kicker)}</p><h1>${esc(editorial.article.title)}</h1><p class="article-deck">${esc(editorial.article.deck)}</p><div class="article-meta"><span>19 mai 2026</span><span>Publication évaluée par les pairs</span><span>Mis à jour le 21 septembre 2026</span></div></div></header>
  <figure class="article-figure">${articleSvg}<figcaption>La publication distingue la génération algorithmique d’hypothèses de l’exécution humaine des expériences.</figcaption></figure>
  <div class="article-body"><p class="lead">${esc(editorial.article.intro)}</p>${articleParagraphs}</div>
  <section class="pull"><span>${esc(editorial.article.changed_title)}</span><p>${esc(editorial.article.changed_text)}</p></section>
  <section class="limits"><div class="shell limits-grid"><div><p class="kicker" style="color:#d7ef62">LIMITES</p><h2>${esc(editorial.article.limits_title)}</h2></div><ol>${editorial.article.limits.map((x,i)=>`<li><b>0${i+1}</b> · ${esc(x)}</li>`).join("")}</ol></div></section>
  <section class="verify"><div class="shell verify-grid"><div><p class="kicker">VÉRIFIER</p><h2>${esc(editorial.article.evidence_cta)}</h2><p>Future Edition conserve l’affirmation, son repère dans la source, les frontières de conclusion et la décision de revue. Ces détails restent secondaires pendant la lecture, mais ne sont jamais cachés.</p><a class="button" href="${evidencePath}">Ouvrir le dossier de preuve ${iconArrow}</a></div><div class="source-card"><small>PUBLICATION PRIMAIRE · NATURE · 2026</small><strong>${esc(source.title)}</strong><p>${esc(editorial.evidence.locator_public)}</p><a href="${esc(source.canonical_url)}" rel="noopener noreferrer">${esc(editorial.article.source_cta)} ${iconArrow}</a></div></div></section>
  <section class="article-body"><p class="machine-note">Pour les agents et outils : la représentation structurée de ce même changement est disponible sans parser cet article. <a href="${machinePath}">Ouvrir le JSON canonique →</a></p></section></article>`
);

const qEvents=events.filter((x)=>x.question_ids?.includes("Q-008")).sort((a,b)=>a.event_date.localeCompare(b.event_date));
const timeline=qEvents.map((item)=>{
  const c=claims.find((x)=>item.claim_ids?.includes(x.id));
  const fr=item.id===event.id?editorial.robin_event:editorialEventsFr.entries?.[item.id];
  const status=item.id===event.id?"Renforcement confirmé":"Contexte historique vérifié";
  return `<article class="time-row"><time datetime="${esc(item.event_date)}">${esc(fmtDate(item.event_date))}</time><div><h3>${esc(fr?.title??item.title)}</h3><p>${esc(fr?.claim??c?.text??"")}</p></div><em>${status}</em></article>`;
}).join("");
const milestones=q.milestones.map((m)=>{
  const isCurrent=m.id==="Q-008-M3";
  const stateText=isCurrent?"ATTEINT · CONFIANCE CONFIRMÉE":"PAS ENCORE ÉVALUÉ SÉPARÉMENT";
  return `<article class="milestone ${isCurrent?"current":""}"><span>ÉTAPE ${String(m.order).padStart(2,"0")}</span><h3>${esc(m.title)}</h3><p>${esc(m.criterion)}</p><b>${stateText}</b></article>`;
}).join("");

const observatory=layout(
  editorial.observatory.question+" — Future Edition",
  editorial.observatory.answer_detail,
  obsPath,
  `<section class="obs-hero"><div class="shell"><p class="kicker" style="color:#d7ef62">${esc(editorial.observatory.kicker)}</p><h1>${esc(editorial.observatory.question)}</h1><div class="obs-answer"><strong>${esc(editorial.observatory.answer)}</strong><div><p>${esc(editorial.observatory.answer_detail)}</p><a class="button" href="${articlePath}">Lire le dernier changement ${iconArrow}</a></div></div></div></section>
  <section class="timeline"><div class="shell"><p class="kicker">TRAJECTOIRE</p><h2>${esc(editorial.observatory.trajectory_title)}</h2><div class="timeline-list">${timeline}</div></div></section>
  <section class="milestones"><div class="shell"><p class="kicker">CE QUI EST ÉVALUÉ — ET CE QUI NE L’EST PAS</p><h2>Cinq étapes. Une seule possède aujourd’hui un état validé.</h2><div class="milestone-list">${milestones}</div></div></section>
  <section class="next-proof"><div class="shell next-grid"><div><p class="kicker">PROCHAINE FRONTIÈRE</p><h2>${esc(editorial.observatory.watch_title)}</h2></div><ul>${editorial.observatory.watch_items.map((x)=>`<li>${esc(x)}</li>`).join("")}</ul></div></section>
  <section class="verify"><div class="shell verify-grid"><div><p class="kicker">DERNIÈRE MISE À JOUR</p><h2>Pourquoi Robin renforce la réponse.</h2><p>Le dernier changement enregistré ne prétend pas que l’IA scientifique autonome est résolue. Il fait une mise à jour plus précise : le niveau de preuve sur la validation expérimentale devient plus fort.</p><a class="button" href="${evidencePath}">Voir la preuve ${iconArrow}</a></div><div class="source-card"><small>ÉTAT AU 19 MAI 2026</small><strong>Validation expérimentale : atteinte</strong><p>Confiance confirmée. Réplication indépendante et usage scientifique récurrent : non établis par ce Change.</p><a href="${machinePath}">Voir la même réponse pour une machine ${iconArrow}</a></div></div></section>`
);

const evidencePage=layout(
  editorial.evidence.title+" — Future Edition",
  "Dossier de preuve du changement Robin : affirmation, source primaire, locator, limites et revue.",
  evidencePath,
  `<section class="evidence-hero"><div class="shell"><p class="kicker">${esc(editorial.evidence.kicker)}</p><h1>${esc(editorial.evidence.title)}</h1><p class="hero-deck">Ce dossier existe pour vérifier la conclusion sans transformer l’article en documentation technique.</p></div></section>
  <section class="shell evidence-layout"><div><div class="evidence-box"><span>${esc(editorial.evidence.claim_label)}</span><p class="claim-quote">${esc(editorial.evidence.claim_public)}</p></div><div class="evidence-box"><span>${esc(editorial.evidence.boundaries_label)}</span><p>${esc(editorial.evidence.boundaries_public)}</p></div></div><div><div class="evidence-box"><span>SOURCE PRIMAIRE</span><h2>${esc(source.title)}</h2><p>Publiée le ${esc(fmtDate(source.published_at))}. Publication primaire évaluée par les pairs.</p><a class="button" href="${esc(source.canonical_url)}" rel="noopener noreferrer">Ouvrir la source originale ${iconArrow}</a></div><div class="evidence-box"><span>${esc(editorial.evidence.locator_label)}</span><p>${esc(ev.locator)}</p></div><div class="evidence-box"><span>${esc(editorial.evidence.review_label)}</span><p>${esc(editorial.evidence.review_text)}</p></div><div class="evidence-box"><span>DÉTAIL EXPERT</span><code>${esc(claim.id)} → ${esc(ev.id)} → ${esc(source.id)} · ${esc(change.id)} · ${esc(review.id)}</code></div></div></section>
  <section class="watch"><div class="shell watch-grid"><div><p class="kicker">RETOUR À LA LECTURE</p><h2>Une preuve n’a de valeur que replacée dans la question.</h2></div><p><a class="text-link" href="${articlePath}">Revenir à l’article</a><br><br><a class="text-link" href="${obsPath}">Ouvrir l’Observatoire</a></p></div></section>`
);

const machine={
  schema_version:"fe/agent-answer-packet/v2",
  id:change.id,
  type:"canonical_change",
  canonical_url:siteBase+articlePath,
  human_routes:{
    home:siteBase+"/",
    article:siteBase+articlePath,
    observatory:siteBase+obsPath,
    evidence:siteBase+evidencePath
  },
  question:{
    id:q.id,
    slug:q.slug,
    title:q.title,
    current_answer:editorial.observatory.answer,
    as_of:after.effective_at
  },
  milestone:{
    id:change.milestone_id,
    title:q.milestones.find((m)=>m.id===change.milestone_id)?.title??null
  },
  change:{
    id:change.id,
    type:change.change_type,
    observed_at:change.observed_at,
    valid_from:change.valid_from,
    review_id:change.review_id,
    justification:change.justification
  },
  previous_state:{
    assessment_id:before.id,
    status:before.status,
    confidence:before.confidence,
    valid_from:before.valid_from,
    valid_to:before.valid_to,
    state_hash:change.before_state_hash
  },
  current_state:{
    assessment_id:after.id,
    status:after.status,
    confidence:after.confidence,
    valid_from:after.valid_from,
    valid_to:after.valid_to,
    state_hash:change.after_state_hash
  },
  trigger:{
    event_id:event.id,
    event_date:event.event_date,
    claim:{
      id:claim.id,
      text:claim.text,
      confidence:claim.confidence
    },
    evidence:{
      id:ev.id,
      support:ev.support,
      locator:ev.locator,
      notes:ev.notes
    },
    source:{
      id:source.id,
      title:source.title,
      kind:source.kind,
      tier:source.tier,
      canonical_url:source.canonical_url,
      published_at:source.published_at,
      status:source.status
    }
  },
  limitations:editorial.article.limits,
  watch_next:editorial.observatory.watch_items,
  corrections:[],
  abstention:null
};

const manifest={
  schema_version:"fe/machine-manifest/v2",
  as_of:editorial.as_of,
  human_machine_truth_model:"single_canonical_truth",
  reference_change:change.id,
  routes:{
    change:machinePath,
    human_article:articlePath,
    human_observatory:obsPath,
    human_evidence:evidencePath
  }
};

async function writeRoute(path,html){
  const clean=path.replace(/^\/+|\/+$/g,"");
  const dir=clean?new URL(clean+"/",out):out;
  await mkdir(dir,{recursive:true});
  await writeFile(new URL("index.html",dir),html);
}

await writeRoute("/",home);
await writeRoute(articlePath,article);
await writeRoute(obsPath,observatory);
await writeRoute(evidencePath,evidencePage);
await mkdir(new URL("assets/",out),{recursive:true});
await writeFile(new URL("assets/styles.css",out),css);
await mkdir(new URL("machine/changes/",out),{recursive:true});
await writeFile(new URL("machine/changes/"+change.id.toLowerCase()+".json",out),JSON.stringify(machine,null,2)+"\n");
await mkdir(new URL("machine/",out),{recursive:true});
await writeFile(new URL("machine/manifest.json",out),JSON.stringify(manifest,null,2)+"\n");
await writeFile(new URL("robots.txt",out),"User-agent: *\nAllow: /\nSitemap: "+siteBase+"/sitemap.xml\n");
const routes=["/",articlePath,obsPath,evidencePath,machinePath,"/machine/manifest.json"];
await writeFile(new URL("sitemap.xml",out),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.filter((x)=>!x.endsWith(".json")).map((x)=>'<url><loc>'+siteBase+x+'</loc></url>').join("")+"</urlset>");
console.log("FE06R_R3_V2_BUILD_PASS|human_routes=4|machine_routes=2|canonical_change="+change.id+"|candidate_signals="+r2.selected_candidates.length);
