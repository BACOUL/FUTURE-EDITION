# FE-01 — Status

## Objectif
Obtenir une fondation locale reproductible, sans dépendance à GitHub Actions ni à un registre npm.

## Proved
- repo public initialisé ;
- constitution et programme présents ;
- 10 questions présentes ;
- 51 jalons présents ;
- IDs question uniques ;
- slugs uniques ;
- ordre des jalons vérifié ;
- pipeline Node local défini ;
- build Future Graph déterministe ;
- générateur statique zéro dépendance testé localement ;
- 14 routes de lancement générables (home, Aujourd’hui, Questions, Méthodologie + 10 observatoires) ;
- sitemap et robots.txt générables ;
- contrôle de sortie défini ;
- preflight FE-00B documenté ;
- aucune question présentée publiquement comme évaluée scientifiquement.

## Incident trouvé et corrigé pendant le gate
Le premier test du générateur écrivait la route `/` hors du dossier `dist` à cause de la résolution d’URL. Le bug a été reproduit, corrigé puis le build de test a produit toutes les pages attendues.

## Gate final
Après commit de l’architecture zéro dépendance :
1. validation des données ;
2. validation des relations ;
3. build du Future Graph ;
4. build statique ;
5. validation des sorties ;
6. mise à jour de `project-state.json` vers FE-01 PROVED.

Le réseau externe n’est plus requis par le build.
