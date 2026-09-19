# Résilience et sauvegarde

## Objectif
Pouvoir reconstruire Future Edition sans dépendre d’un fournisseur unique.

## Mesures
- Git comme historique principal ;
- export périodique du repo ;
- artefacts générés reproductibles ;
- hashes des données critiques ;
- documentation de build ;
- pas de dépendance runtime obligatoire à GitHub Actions ;
- pas de dépendance au front-end pour l’état scientifique ;
- stockage des identifiants externes canoniques.

## À maturité
- miroir Git secondaire ;
- snapshots chiffrés ;
- test de restauration ;
- export du Future Graph dans un format portable.
