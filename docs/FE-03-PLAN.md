# FE-03 — Evidence Engine

## Mission

Transformer un **signal** (URL, DOI, titre, registre, communiqué, publication) en un **dossier de preuve auditable** sans confondre popularité et vérité.

## Entrée

Un `Candidate` peut venir de :
- DOI / Crossref ;
- PubMed ;
- ClinicalTrials.gov ;
- arXiv / bioRxiv / medRxiv ;
- régulateur ;
- institution ;
- communiqué ;
- média ;
- réseau social comme simple signal.

## Sortie

Un `EvidenceDossier` doit contenir :
1. source primaire résolue ou raison d’échec ;
2. identité canonique de la source ;
3. statut publication : actif / corrigé / concern / rétracté ;
4. provenance et groupe d’indépendance ;
5. claims atomiques proposés ;
6. evidence locators associés ;
7. limites explicites ;
8. contradictions trouvées ;
9. niveau de preuve proposé selon le domaine ;
10. décision recommandée : `publish`, `hold`, `reject`, `investigate` ;
11. drapeau `human_review_required`.

## Pipeline

```text
Candidate
  ↓
Normalize
  ↓
Resolve primary source
  ↓
Verify identity/status
  ↓
Fetch permitted metadata/text
  ↓
Extract atomic claims
  ↓
Attach evidence locators
  ↓
Extract limitations
  ↓
Find contradictions / related sources
  ↓
Group source independence
  ↓
Classify evidence level
  ↓
Safety gate
  ↓
EvidenceDossier
  ↓
Human review
```

## Règles de sécurité

- un média ou communiqué ne devient jamais source primaire par répétition ;
- source inexistante / DOI introuvable → pas de confirmation ;
- préprint ≠ peer-reviewed ;
- animal ≠ humain ;
- phase I ≠ efficacité démontrée ;
- correction / rétractation peut invalider un dossier précédent ;
- 10 reprises d’une origine = 1 origine ;
- un LLM peut proposer des claims, jamais certifier seul leur vérité.

## Adapters V1

Priorité :
1. Crossref ;
2. PubMed ;
3. ClinicalTrials.gov ;
4. arXiv ;
5. bioRxiv / medRxiv ;
6. EMA / FDA pour décisions réglementaires.

Les adapters doivent être interchangeables et ne pas contaminer le modèle de données.

## Benchmark

Avant PROVED :
- ≥ 200 cas labellisés ;
- dev / validation / holdout séparés ;
- cas adversariaux ;
- rétractations ;
- faux DOI ;
- animal présenté comme humain ;
- communiqué amplifié ;
- sources dépendantes ;
- contradiction réelle ;
- résultat négatif.

## Métriques minimales

Les seuils exacts seront gelés avant le premier holdout, mais le moteur doit mesurer séparément :
- précision résolution source primaire ;
- rappel source primaire ;
- précision statut publication ;
- précision claim ↔ evidence ;
- précision classification niveau de preuve ;
- détection de dépendance entre sources ;
- faux `confirmed` — métrique de sécurité prioritaire.

## Gate FE-03

FE-03 ne devient PROVED que si :
- contrats Candidate/Dossier versionnés ;
- adapters de base testables hors interface ;
- benchmark reproductible ;
- holdout non utilisé pour le tuning ;
- aucun cas connu rétracté/faux n’est promu `confirmed` ;
- les erreurs sont explicables par dossier ;
- sortie directement compatible avec FE-02.
