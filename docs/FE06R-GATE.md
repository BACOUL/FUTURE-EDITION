# FE-06R — Gate MEDIA × INTELLIGENCE × REFERENCE × AGENT-NATIVE

Status initial : `BLOCKED`

Verdicts possibles : `BLOCKED` · `FAIL` · `PROVED`

## 1. Objet

FE-06R ne prouve pas simplement qu'un site existe, qu'il est responsive ou que ses liens fonctionnent.

FE-06R doit prouver que Future Edition possède le noyau d'un **média 2.0 de référence**, utilisable simultanément par :
- des lecteurs exigeants ;
- des chercheurs, journalistes et professionnels ;
- des systèmes et agents IA.

La proposition de valeur à démontrer est :

> Future Edition dit ce qui vient réellement de changer, pourquoi cela compte, ce que la nouvelle preuve permet d'affirmer, ce qu'elle ne permet pas d'affirmer, ce qu'il faut surveiller ensuite, et permet de remonter de chaque conclusion jusqu'à la preuve originale.

Le gate repose sur quatre portes non compensables :
- **MEDIA**
- **INTELLIGENCE**
- **REFERENCE**
- **AGENT-NATIVE**

Un excellent score sur une porte ne compense jamais l'échec d'une autre.

## 2. Surfaces de référence obligatoires

FE-06R ne peut être évalué que si quatre surfaces existent réellement :

### R1 — Home
Une véritable une éditoriale présentant :
- une avancée principale ;
- des avancées secondaires ;
- fraîcheur réelle ;
- niveau de preuve ;
- changement avant → preuve → après ;
- Reality Checks ;
- observatoires actifs ;
- ce qu'il faut surveiller ;
- accès aux articles.

### R2 — Article / Avancée
Au moins un véritable article Future Edition, distinct d'un dossier de preuve.

Chaîne obligatoire :

`Home → Article → Dossier de preuve → Source originale`

### R3 — Observatoire
Au moins un observatoire complet avec état, statut, historique, jalons, technologies, avancées, contradictions, chronologie et prochaines preuves attendues.

### R4 — Méthodologie
Présentation fidèle de la chaîne réelle :

`Signal → Source primaire → Authenticité → Statut → Claim → Evidence → Limites → Contradiction → Réplication → État précédent → Change → Revue → Publication`

Si une surface manque : **BLOCKED**.

## 3. Seuils de sortie

Pour être `PROVED` :

- MEDIA ≥ **85/100**
- INTELLIGENCE ≥ **90/100**
- REFERENCE ≥ **95/100**
- AGENT-NATIVE ≥ **95/100**
- zéro veto ;
- zéro erreur scientifique critique ;
- zéro rupture critique de provenance ;
- QA responsive PASS ;
- toutes les preuves du gate versionnées.

Les scores ne sont jamais moyennés.

---

# 4. MEDIA — 100 points

Question : **un humain exigeant comprend-il immédiatement la valeur et a-t-il une raison de revenir ?**

## M1 — Compréhension immédiate — 15
Sur au moins 5 évaluations indépendantes :
- ≥ 4/5 identifient la proposition de valeur ;
- ≥ 4/5 identifient le sujet principal ;
- ≥ 4/5 comprennent la distinction entre information, preuve et incertitude.

## M2 — Fraîcheur éditoriale — 15
Chaque contenu expose :
- date de l'événement ;
- date de publication Future Edition ;
- dernière mise à jour ;
- statut temporel `CURRENT | RECENT | HISTORICAL_BASELINE | ARCHIVE`.

Seuil :
- 100 % des contenus classés sans ambiguïté ;
- 0 archive présentée comme actualité.

Une section « Aujourd'hui » peut afficher honnêtement zéro nouvelle avancée.

## M3 — Article de référence — 20
R2 contient 15/15 :
1. titre ;
2. chapô ;
3. visuel informatif ;
4. contexte ;
5. état précédent ;
6. nouvelle preuve ;
7. ce qui change ;
8. pourquoi cela compte ;
9. ce que cela ne prouve pas ;
10. limites ;
11. prochaine preuve à surveiller ;
12. niveau de preuve ;
13. références ;
14. dossier de preuve ;
15. publication + mise à jour.

## M4 — Hiérarchie éditoriale — 10
Home :
- 1 sujet principal ;
- au moins 3 niveaux de hiérarchie ;
- Reality Check ;
- Watch / À surveiller ;
- accès aux observatoires.

## M5 — Identité visuelle — 15
R1-R4 doivent avoir des compositions fonctionnellement distinctes.

Seuil :
- maximum 40 % de structure dominante commune entre deux surfaces, hors chrome/design system ;
- pas plus de 2 sections successives utilisant exactement le même pattern de carte ;
- au moins un langage visuel informatif propre : data-viz, timeline, schéma, photo ou illustration pertinente.

## M6 — Mobile / responsive — 10
QA : 360 / 390 / 768 / 1440 px.

Seuil :
- 0 overflow critique ;
- 0 texte tronqué ;
- 0 CTA inaccessible ;
- 0 interaction impossible ;
- aucun premier écran mobile dominé par de la métadonnée technique.

## M7 — Désir de poursuivre — 15
Sur évaluation indépendante :
- ≥ 80 % veulent poursuivre après le premier écran de R2 ;
- ≥ 80 % comprennent ce qu'ils obtiendront en ouvrant le sujet principal depuis R1.

### Veto MEDIA
FAIL immédiat si :
- Home principalement assimilable à une landing page produit ;
- archive maquillée en actualité ;
- R2 remplacé par un dossier de preuve ;
- contenu de remplissage ;
- majorité des surfaces fondées sur un même motif de cartes ;
- visualisation décorative suggérant une mesure inexistante ;
- image sans rapport avec le contenu ;
- surface R1-R4 inutilisable à 360 px.

---

# 5. INTELLIGENCE — 100 points

Question : **Future Edition apporte-t-il davantage qu'un résumé ou une agrégation ?**

## I1 — Before → Evidence → After — 20
100 % des avancées qualifiées exposent :
- BEFORE ;
- EVIDENCE ;
- AFTER.

AFTER ne doit pas être une simple reformulation de la source.

## I2 — Delta informationnel — 15
Chaque publication produit un `Change` explicite ou `NO_CHANGE`.

Seuil :
- 100 % classés ;
- 0 article présenté comme avancée si `NO_CHANGE`.

## I3 — Limites / non-conclusions — 15
100 % des articles exposent :
- limites pertinentes ;
- ce que le résultat ne démontre pas ;
- incertitudes restantes.

## I4 — Contexte historique — 10
100 % des avancées sont reliées :
- à l'état précédent ;
- aux événements antérieurs pertinents ;
- aux contradictions connues.

## I5 — Signal ≠ avancée — 10
Statuts obligatoires :
`SIGNAL | CANDIDATE | QUALIFIED_ADVANCE | REJECTED | WATCH | CORRECTION | RETRACTION`.

0 SIGNAL seul publié comme QUALIFIED_ADVANCE.

## I6 — Reality Check — 10
Au moins un cas complet :
- affirmation publique ;
- preuves ;
- conclusion permise ;
- conclusion excessive ;
- confiance ;
- sources.

## I7 — Watch Next — 10
100 % des articles définissent au moins une prochaine condition observable ou falsifiable.

## I8 — Absence de surinterprétation — 10
Sur toutes les affirmations majeures de R1-R4 :
- précision factuelle : 100 % ;
- support par preuve : 100 % ;
- titre dépassant la preuve : 0 ;
- causalité non justifiée : 0 ;
- milestone promu sans Change valide : 0.

### Veto INTELLIGENCE
FAIL immédiat si :
- article = simple résumé ;
- BEFORE ou AFTER absent ;
- promesse confondue avec preuve ;
- étude animale implicitement présentée comme résultat humain ;
- preprint présenté comme publication validée ;
- correction/rétractation pertinente ignorée ;
- état de jalon inventé ;
- titre surclassant la preuve.

---

# 6. REFERENCE — 100 points

Question : **un professionnel peut-il remonter de la conclusion à la preuve sans rupture ?**

## Rf1 — Provenance complète — 20
Chaîne obligatoire :

`Article → Claim → Evidence → Source → Locator`

Seuil sur les affirmations principales :
- Claim : 100 % ;
- Evidence : 100 % ;
- Source canonique : 100 % ;
- locator vérifiable : 100 % ;
- URL disponible ou indisponibilité documentée : 100 %.

## Rf2 — IDs stables — 10
IDs stables pour Question, Observatory, Technology, Event, Article, Claim, Evidence, Source, Change.

Seuil :
- collision : 0 ;
- relation orpheline : 0 ;
- changement d'ID non migré : 0.

## Rf3 — Machine-readable — 15
Chaque article expose au minimum :
- id ;
- canonical_url ;
- published_at ;
- updated_at ;
- question_ids ;
- technology_ids ;
- claim_ids ;
- evidence_ids ;
- source_ids ;
- change_id ;
- confidence ;
- evidence_level ;
- previous_state ;
- resulting_state ou NO_CHANGE ;
- limitations ;
- watch_next.

100 % présents ou explicitement nuls avec raison.

## Rf4 — Source originale — 15
- au moins une source externe canonique pour chaque affirmation primaire ;
- source primaire privilégiée ;
- source secondaire explicitement distinguée ;
- 0 auto-référence Future Edition comme preuve primaire.

## Rf5 — Corrections / historique — 10
Toute modification substantielle conserve :
- version ;
- date ;
- raison ;
- champs affectés ;
- ancien état ;
- nouvel état.

Suppression silencieuse : 0.

## Rf6 — Reproductibilité — 10
Échantillon d'au moins 10 affirmations, ou toutes si moins de 10.

Un évaluateur doit retrouver :
- la source ;
- le passage / locator ;
- la relation avec l'affirmation.

Seuil : 100 %.

## Rf7 — Adressabilité — 10
- broken internal links : 0 ;
- duplicate canonical : 0 ;
- page orpheline : 0.

## Rf8 — Robustesse scientifique — 10
Contradictions, négatifs, corrections, rétractations et confiance restent visibles dans 100 % des cas pertinents.

### Veto REFERENCE
FAIL immédiat si :
- affirmation principale sans source ;
- locator invérifiable ;
- mauvaise relation scientifique ;
- correction effacée silencieusement ;
- source secondaire présentée comme primaire ;
- provenance inventée ;
- deux langues créent deux vérités scientifiques distinctes ;
- IDs recréés au build.

---

# 7. AGENT-NATIVE — 100 points

Question : **un agent IA peut-il utiliser Future Edition comme infrastructure de connaissance sans reconstruire la vérité depuis le HTML ?**

FE-06R n'implémente pas encore l'API commerciale FE-14, mais il doit geler les contrats qui empêcheront le média humain et le média machine de diverger.

## A1 — Identité machine canonique — 10
Chaque objet public possède :
- ID stable ;
- URI canonique ;
- type ;
- version ;
- langue de représentation ;
- lien vers l'objet scientifique canonique.

Seuil : 100 %.

## A2 — Temps explicite — 15
Tout objet pertinent distingue au minimum :
- `event_at` ;
- `observed_at` ou `retrieved_at` ;
- `published_at` ;
- `updated_at` ;
- `valid_from` ;
- `superseded_at` lorsque applicable ;
- `as_of` pour les états calculés.

Seuil :
- 100 % des objets temporels non ambigus ;
- 0 confusion entre date de source, date d'événement et date de publication.

## A3 — Citation atoms — 15
Chaque claim majeur est adressable individuellement.

Il doit être possible pour un agent de citer :
- claim ID ;
- evidence ID ;
- source ID ;
- locator ;
- état de confiance ;
- version.

Seuil : 100 % des claims principaux.

## A4 — Correction propagation — 15
Lorsqu'un claim est corrigé, contesté, rétracté ou superseded :
- ancien ID conservé ;
- nouvel état relié ;
- machine-readable status modifié ;
- historique exposé ;
- consommateurs capables de détecter qu'une ancienne citation est obsolète.

Test obligatoire : au moins 3 scénarios synthétiques correction/rétractation/supersession, 3/3 PASS.

## A5 — Agent answer packet — 15
Le modèle machine de toute réponse Future Edition doit pouvoir produire un paquet contenant :
- answer / state ;
- as_of ;
- claims ;
- evidence ;
- sources ;
- confidence ;
- limitations ;
- contradictions ;
- watch_next ;
- citations ;
- abstention reason si preuve insuffisante.

Un agent ne doit jamais devoir parser la prose pour reconstruire ces champs.

## A6 — Abstention et insuffisance — 10
Sur un benchmark d'au moins 20 requêtes négatives/insuffisantes :
- fausse réponse affirmative critique : 0 ;
- source inventée : 0 ;
- citation inventée : 0 ;
- réponse sans preuve suffisante explicitement marquée : 100 %.

## A7 — Discovery / interoperability — 10
Préparer un contrat de découverte machine documenté pour les futurs endpoints :
- schémas JSON versionnés ;
- JSON-LD/Schema.org lorsque pertinent ;
- manifeste machine public ;
- relations canoniques ;
- content negotiation ou routes JSON prévues ;
- politique claire de crawl/licence/usage machine.

Le choix technique final peut arriver en FE-14 ; le contrat sémantique doit être gelé avant généralisation.

## A8 — Delta feed — 10
Les agents doivent pouvoir savoir **ce qui a changé depuis un état précédent**.

Le contrat prévoit :
- cursor/version ;
- changements créés ;
- corrections ;
- rétractations ;
- supersessions ;
- objets affectés ;
- `as_of`.

Test : reconstruction déterministe d'un delta sur au moins 10 changements synthétiques = 100 %.

### Veto AGENT-NATIVE
FAIL immédiat si :
- l'agent doit scraper le texte pour retrouver un claim ;
- la représentation machine contredit la page humaine ;
- une ancienne citation corrigée reste indistinguable de la version valide ;
- aucune sémantique `as_of` ;
- source/locator absent du paquet machine ;
- un état insuffisamment prouvé est retourné comme certain ;
- l'objet scientifique dépend de sa traduction ;
- une route future d'API nécessiterait de recréer une seconde base de vérité.

---

# 8. Sous-gate Observatoire

R3 doit exposer :
- question canonique ;
- état actuel ;
- statut de cet état ;
- `as_of` ;
- historique ;
- jalons ;
- technologies ;
- preuves récentes ;
- contradictions ;
- avancées ;
- prochaines preuves attendues ;
- chronologie ;
- liens vers articles et preuves.

Si l'état n'est pas évalué, afficher explicitement `ÉTAT NON ÉVALUÉ`.

Interdit sans donnée traçable :
- jauge ;
- score ;
- pourcentage ;
- radar ;
- position approximative.

---

# 9. Sous-gate Méthodologie

R4 explique fidèlement :
- sources A-D ;
- niveaux M0-M7, T0-T7, S0-S5 ;
- confidence states ;
- rôle de l'IA ;
- rôle humain ;
- Change Engine ;
- Future Graph ;
- corrections ;
- rétractations ;
- conflits ;
- insuffisance de preuve ;
- temporalité ;
- fonctionnement de la représentation machine.

Toute affirmation sur le système doit correspondre au code réel.

---

# 10. Pages de confiance

Avant PROVED :
- À propos ;
- Méthodologie ;
- Responsabilité éditoriale ;
- Politique de correction ;
- Signaler une erreur ;
- Sources ;
- Contact ;
- Mentions légales ;
- Confidentialité ;
- politique d'accès et d'usage machine.

Broken links : 0.

---

# 11. Qualité technique

Sur R1-R4 :
- HTML et navigation accessibles ;
- alt text pertinent ;
- reduced-motion ;
- canonical URLs ;
- metadata sociales ;
- sitemap ;
- robots ;
- données structurées.

Cibles :
- Accessibility ≥ 95 ;
- Best Practices ≥ 95 ;
- SEO ≥ 95 ;
- Performance mobile ≥ 85 ;
- LCP ≤ 2,5 s ;
- CLS ≤ 0,1 ;
- INP ≤ 200 ms si applicable.

Une métrique de performance seule ne peut jamais prouver FE-06R.

---

# 12. Dossier de preuve du gate

Créer `benchmarks/fe06r/` avec au minimum :
- `gate.v1.json`
- `media-evaluation.json`
- `intelligence-evaluation.json`
- `reference-evaluation.json`
- `agent-native-evaluation.json`
- `scientific-claims-audit.json`
- `responsive-qa.json`
- `link-audit.json`
- `structured-data-audit.json`
- `provenance-audit.json`
- `temporal-audit.json`
- `correction-propagation-audit.json`
- `screenshots/`
- `verdict.json`

Chaque critère contient :
- métrique ;
- seuil ;
- valeur mesurée ;
- PASS/FAIL ;
- preuve ;
- surface/fichier concerné.

Aucune validation uniquement déclarative.

---

# 13. Verdict

## BLOCKED
Si :
- R1, R2, R3 ou R4 manque ;
- la chaîne Article → Preuve → Source n'existe pas ;
- les contrats agent-native ne sont pas définis ;
- le protocole de test est incomplet.

## FAIL
Si :
- MEDIA < 85 ;
- INTELLIGENCE < 90 ;
- REFERENCE < 95 ;
- AGENT-NATIVE < 95 ;
- un veto est déclenché ;
- erreur scientifique critique ;
- provenance cassée ;
- archive maquillée en actualité ;
- delta informationnel non démontré.

Un seuil ne peut pas être abaissé après observation pour transformer un FAIL en PASS.

## PROVED
Uniquement si :
- MEDIA ≥ 85 ;
- INTELLIGENCE ≥ 90 ;
- REFERENCE ≥ 95 ;
- AGENT-NATIVE ≥ 95 ;
- R1-R4 PASS ;
- zéro veto ;
- zéro erreur scientifique critique ;
- zéro provenance cassée ;
- temporalité PASS ;
- correction propagation PASS ;
- QA responsive PASS ;
- représentations humaine et machine cohérentes ;
- dossier de preuve complet et reproductible.

---

# 14. Règle finale

> FE-06R n'est pas réussi parce que le site fonctionne.

> FE-06R est réussi lorsque Future Edition démontre sur un vrai sujet qu'il peut transformer une nouvelle preuve en information humaine excellente, intelligence réellement nouvelle, référence scientifique traçable et objet de connaissance directement exploitable par un agent IA.

Tant que cette démonstration n'existe pas :

**FE-06R = NOT PROVED.**
