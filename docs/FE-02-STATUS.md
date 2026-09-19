# FE-02 — Status

## Objectif
Construire un Future Graph temporel, traçable, append-only pour les décisions sensibles et déterministe.

## Déjà matérialisé
- sources canoniques séparées du registre de fournisseurs ;
- schémas Source, Event, Claim, Evidence, Provenance, Technology, Organization, Person, Review ;
- Evidence reliée explicitement au Claim concerné ;
- temps d’observation et fenêtres de validité ;
- corrections par `supersedes` ;
- provenance avec `independence_group` ;
- Review comme journal de décision ;
- MilestoneAssessment séparé de la définition du jalon ;
- questions et jalons rendus **state-free** : aucun statut scientifique mutable dans leur définition ;
- modèle de graphe déterministe avec hash canonique ;
- validation JSON Schema sans dépendance ;
- validation des relations et types ;
- tests synthétiques pour contradiction et correction ;
- tests négatifs prévus pour orphelins, doublons, incohérences temporelles et mismatches.

## Invariant ajouté
L’état courant d’un jalon est dérivé des Assessment approuvés ; il n’est jamais écrit directement dans le jalon.

## Gate restant
- exécuter le pipeline officiel mis à jour sur le repo ;
- confirmer le test synthétique enrichi ;
- confirmer deux builds byte-identical ;
- documenter le verdict final.
