# FE-02 — Future Graph design preview

**Ce document prépare FE-02 mais ne l'ouvre pas.**

## Objectif
Passer d'un graphe Question → Milestone à un graphe temporel complet :
Question → Technology → Milestone → Event → Claim → Evidence → Source.

## Propriétés obligatoires
- IDs stables ;
- provenance ;
- relations typées ;
- historique temporel ;
- corrections sans écrasement silencieux ;
- relations contradictoires ;
- indépendance des sources ;
- sérialisation déterministe.

## Non-objectifs
- base Neo4j ;
- vector database ;
- API réseau ;
- RAG ;
- score automatique.

Ces choix attendent que le modèle logique soit prouvé.
