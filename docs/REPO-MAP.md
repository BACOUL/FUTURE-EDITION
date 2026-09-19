# Repository map

```text
data/
  questions/              questions et jalons de lancement
  technologies/           technologies canoniques
  events/                 événements vérifiés/candidats
  claims/                 affirmations atomiques
  evidence/               preuves reliées aux claims
  provenance/             origine/version/indépendance
  organizations/          institutions, entreprises, agences
  people/                 personnes citées dans le graphe
  sources/                registres et futures sources canoniques
  benchmarks/             jeux d'évaluation
schemas/                  contrats JSON
pipeline/
  validate-data.mjs       invariants de données
  validate-relations.mjs  intégrité référentielle
  build-graph.mjs         graphe machine-readable
  build-site.mjs          média statique
  validate-output.mjs     QA du build
  serve.mjs               preview locale sans dépendance
generated/                artefacts reconstruisibles, non versionnés
dist/                     site généré, non versionné
docs/
  adr/                    décisions d'architecture
  ...                     vision, programme, méthode, gouvernance
project-state.json        état machine du projet
```

## Source de vérité
- état projet : `project-state.json`
- vérité scientifique structurée : `data/`
- contrats : `schemas/`
- règles : `docs/CONSTITUTION.md` + ADR
- `generated/` et `dist/` sont dérivés et reconstruisibles.
