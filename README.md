# Future Edition

> **Nous suivons ce qui devient possible.**

Future Edition est un média vivant conçu pour l’ère de l’IA. Il détecte, vérifie, mesure et explique les avancées scientifiques et technologiques qui peuvent changer notre vie.

## Mission

Transformer le flux mondial de découvertes en une cartographie vérifiable du progrès :

**Question → Technologie → Jalon → Événement → Affirmation → Preuve → Source**

Future Edition ne cherche pas à publier le plus vite ni le plus souvent. Il cherche à répondre à trois questions :

1. **Où en sommes-nous ?**
2. **Qu’est-ce qui vient réellement de changer ?**
3. **Quelle preuve permet de l’affirmer ?**

## Principes non négociables

- La source primaire est privilégiée.
- Un LLM ne peut pas transformer seul une hypothèse en fait établi.
- Une information non vérifiable peut être rejetée.
- Les résultats négatifs et les rétractations sont conservés.
- Aucun score spectaculaire n’est publié sans méthode explicable.
- Le graphe de données est l’actif principal ; les articles en sont une représentation.
- Le site public reste rapide, accessible et statique autant que possible.
- Le dépôt est la source d’autorité du projet.

## Programme

Le projet progresse par stages gelés : **FE-00 → FE-15 → FE-CONTINUOUS**.

Voir `docs/PROGRAM.md`, `docs/CONSTITUTION.md` et `project-state.json`.

## Développement local

Pré-requis : **Node.js 22+ uniquement**.

Aucun `npm install`, aucun framework et aucune GitHub Action ne sont requis pour construire la fondation.

```bash
node pipeline/run-local.mjs
node pipeline/serve.mjs
```

Ou :

```bash
npm run build
npm run dev
```

Le build exécute : validation des données → validation des relations → Future Graph → site statique → validation des sorties.

## Structure

```text
data/               données canoniques du Future Graph
schemas/            contrats de données
pipeline/           validation, graphe, publication
dist/               média statique généré (non versionné)
generated/          artefacts reconstruisibles (non versionnés)
docs/               constitution, méthode, architecture, décisions
project-state.json  état machine du programme
```

## Statut

**FE-01 PROVED · FE-02 PROVED · FE-03 PROVED · FE-04 PROVED · FE-05 PROVED · FE-06 PROVED · FE-07 NOT_STARTED.**

Les états scientifiques restent volontairement non évalués tant qu’ils n’ont pas été établis par une chaîne de preuve.
