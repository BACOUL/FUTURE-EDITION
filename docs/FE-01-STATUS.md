# FE-01 — PROVED

## Objectif
Obtenir une fondation locale reproductible, sans dépendance à GitHub Actions ni à un registre npm.

## Résultat
**VERDICT: PROVED**

## Preuves

- repo public initialisé ;
- constitution et programme présents ;
- 10 questions exactes dans le repo ;
- 51 jalons ;
- 61 IDs question/jalon uniques ;
- slugs uniques ;
- ordre des jalons valide ;
- relation collections initialisées ;
- pipeline Node zéro dépendance ;
- générateur statique testé localement ;
- première exécution détectée en échec sur la route `/` ;
- bug de résolution corrigé ;
- relance PASS : 14 routes, Future Graph, sitemap, robots.txt ;
- contrôle des données exactes du repo : 10 questions, 51 jalons, 61 IDs, 14 routes, 0 erreur ;
- 0 question marquée `assessed` ;
- ancien chemin Astro supprimé du repo ;
- aucun accès réseau requis pour le build.

## Invariant gelé

La fondation doit rester reconstructible avec **Node.js 22+ uniquement** tant qu’un ADR ultérieur n’a pas prouvé la nécessité d’une dépendance externe.

## Ce que FE-01 ne prétend pas prouver

FE-01 ne valide aucun état scientifique. Il valide seulement la fondation technique et les contrats initiaux.
