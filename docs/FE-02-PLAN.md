# FE-02 — Future Graph

## Objectif

Construire un graphe temporel, traçable et indépendant de l’interface capable de représenter :

**Question → Technology → Milestone → Event → Claim → Evidence → Source → Provenance**

sans perdre les contradictions, corrections et versions.

## Livrables obligatoires

1. schémas complets pour toutes les entités ;
2. collection canonique `sources.json` distincte du registre de fournisseurs ;
3. modèle temporel : `observed_at`, `valid_from`, `valid_to`, `supersedes` ;
4. modèle de revue : état machine vs état humain ;
5. relations typées et vérifiées ;
6. indépendance des sources / groupes de provenance ;
7. historique append-only pour les décisions sensibles ;
8. sérialisation déterministe ;
9. fixtures synthétiques couvrant support, contradiction, correction et invalidation ;
10. tests négatifs démontrant le rejet des relations orphelines.

## Non-objectifs FE-02

- ingestion web réelle ;
- scoring scientifique ;
- article automatique ;
- RAG ;
- base vectorielle ;
- Neo4j ;
- API réseau.

## Gate FE-02

FE-02 devient PROVED si :

- toutes les collections valident leurs schémas ;
- aucune relation orpheline n’est acceptée ;
- une chaîne synthétique complète est reconstruite dans le graphe ;
- une contradiction est représentable sans écraser la preuve initiale ;
- une correction crée un nouvel état sans supprimer l’ancien ;
- deux builds consécutifs sur les mêmes données produisent un graphe byte-identical ;
- les fixtures invalides échouent avec la raison attendue.
