# Repository map

```text
apps/
  web/                    média public Astro
data/
  questions/              questions et jalons de lancement
  technologies/           technologies canoniques
  events/                 événements vérifiés/candidats
  claims/                 affirmations atomiques
  evidence/               preuves reliées aux claims
  provenance/             origine/version/indépendance
  organizations/          institutions, entreprises, agences
  people/                 personnes citées dans le graphe
  sources/                registre des sources
  benchmarks/             jeux d'évaluation
schemas/                  contrats JSON
pipeline/                 validation, build graph, futurs ingestors
generated/                artefacts reconstruisibles
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
- artefacts web : dérivés, jamais source primaire de vérité.
