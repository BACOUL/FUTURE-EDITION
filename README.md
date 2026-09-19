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

Voir `docs/PROGRAM.md` et `docs/CONSTITUTION.md`.

## Développement local

Pré-requis : Node.js 22+ et pnpm.

```bash
pnpm install
pnpm validate:data
pnpm build:graph
pnpm dev
```

Les GitHub Actions ne sont pas requises pour construire ou tester le projet. Toute l’automatisation doit d’abord être reproductible localement.

## Structure

```text
apps/web/           média public
data/               Future Graph versionné
schemas/            contrats de données
pipeline/           ingestion, vérification, graph, publication
docs/               constitution, méthode, architecture, décisions
generated/          artefacts reconstruisibles
```

## Statut

**FE-00 / FE-01 en construction.** Les états scientifiques des grandes questions restent volontairement non renseignés tant qu’ils n’ont pas été établis par le pipeline de preuve.
