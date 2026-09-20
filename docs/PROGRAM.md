# Programme FE-00 → FE-CONTINUOUS

Chaque stage possède : objectifs, artefacts, tests, critères de sortie et éléments gelés.

## FE-00 — Constitution
Mission, vocabulaire, principes, méthode, critères de réussite.
**Gate :** aucune ambiguïté majeure sur ce qu’est Future Edition.

## FE-01 — Foundation
Monorepo, scripts locaux, conventions, validation des données, site statique minimal.
**Gate :** install, validate, graph build et web build reproductibles localement.

## FE-02 — Future Graph
Contrats Question, Technology, Milestone, Event, Claim, Evidence, Source, Organization, Person.
**Gate :** données valides, IDs stables, relations vérifiées.

## FE-03 — Evidence Engine
Résolution de source primaire, statut publication, claims, preuves, limites, contradictions, rétractations.
**Gate :** benchmark indépendant d’exemples vrais/faux/trompeurs.

## FE-04 — Change Engine
État avant → nouvelle preuve → état après ; type de changement.
**Gate :** zéro modification de jalon sans justification traçable.

## FE-05 — Ten Observatories
10 grandes questions, jalons, technologies, historique fondateur.
**Gate :** minimum 5 événements vérifiés par question.

## FE-06 — Public Media
Home, Aujourd’hui, questions, fiches avancées, preuves, radar, chronologie, méthode.
**Gate :** QA mobile/desktop, accessibilité, performance, aucune affirmation orpheline.

## FE-06R — Public Media Rebuild
Reconstruction du produit public à partir du socle FE-06 : Home éditoriale, véritable modèle Avancée/Article, observatoire de référence, méthodologie complète, identité visuelle, distinction actualité/historique et pages de confiance.
**Gate :** les quatre surfaces de référence (Home, Article, Observatoire, Méthodologie) passent la QA visuelle/éditoriale/scientifique décrite dans `docs/FE06R-PUBLIC-MEDIA-REBUILD.md`, puis généralisation sans casser les preuves FE-01 → FE-06.

## FE-07 — Editorial Intelligence
Détection, déduplication, classification, source primaire, brouillon.
**Gate :** précision mesurée sur benchmark gelé.

## FE-08 — Editorial Console
File de validation : publier / rejeter / investiguer / corriger.
**Gate :** opérable en quelques décisions quotidiennes.

## FE-09 — Distribution Engine
RSS, newsletter, social cards, scripts vidéo/audio, sitemaps, données structurées.
**Gate :** une validation produit des formats cohérents sans modifier les faits.

## FE-10 — Ask Future Edition
RAG sur Future Graph uniquement pour les affirmations Future Edition.
**Gate :** citations obligatoires, refus en cas de preuve insuffisante.

## FE-11 — Personalization
Suivi de sujets et alertes uniquement lors d’un changement significatif.
**Gate :** aucune notification de bruit.

## FE-12 — Continuous Observatory
Ingestion et analyse régulières.
**Gate :** supervision humaine limitée aux cas importants/sensibles.

## FE-13 — Scientific Intelligence
Contradictions, accélérations, stagnations, transitions de maturité, convergences.
**Gate :** analyses explicables et benchmarkées.

## FE-14 — API
Données et statuts structurés pour tiers.
**Gate :** versionnage, provenance et limites documentés.

## FE-15 — AI-native Media
Représentation humaine + machine-readable de chaque fait important.
**Gate :** cohérence stricte entre article, graphe et API.

## FE-CONTINUOUS
Boucle permanente : Observe → Propose → Test → Evaluate → Approve → Deploy → Measure.

### Règle de progression
Un stage n’est déclaré PROVED que si ses critères de sortie sont matérialisés dans le dépôt. « Ça marche » n’est pas une preuve.
