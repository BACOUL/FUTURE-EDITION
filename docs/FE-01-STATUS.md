# FE-01 — Status

## Objectif
Obtenir une fondation locale reproductible, sans dépendance à GitHub Actions.

## Proved
- repo public initialisé ;
- constitution et programme présents ;
- 10 questions présentes ;
- 51 jalons présents ;
- IDs question uniques ;
- slugs uniques ;
- ordre des jalons vérifié ;
- site Astro statique défini ;
- pipeline local défini ;
- snapshots générés prévus ;
- preflight FE-00B documenté ;
- aucune question présentée publiquement comme évaluée scientifiquement.

## Non prouvé dans l’environnement actuel
- `pnpm install` ;
- build Astro de production.

La tentative de build externe n’a pas pu atteindre github.com depuis l’environnement d’exécution. Ce blocage n’est pas assimilé à un PASS.

## Gate restant
1. exécuter `pnpm install` ;
2. exécuter `pnpm validate:data` ;
3. exécuter `pnpm build:graph` ;
4. exécuter `pnpm --filter @future-edition/web build` ;
5. enregistrer le résultat dans ce document ;
6. seulement ensuite passer FE-01 à PROVED et ouvrir FE-02.
