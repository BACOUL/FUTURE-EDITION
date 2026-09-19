# Handoff — reprendre Future Edition sans contexte oral

## Ordre de lecture obligatoire
1. `project-state.json`
2. `docs/CONSTITUTION.md`
3. `docs/VISION.md`
4. `docs/PROGRAM.md`
5. `docs/OPERATING-MODEL.md`
6. `docs/ARCHITECTURE.md`
7. `docs/METHODOLOGY.md`
8. ADR liés au stage actif
9. derniers commits du stage actif

## Règles
- Ne pas demander au propriétaire de reconstruire le contexte si le repo permet de le déduire.
- Ne pas déclarer un stage PROVED sans artefact/test correspondant.
- Ne pas inventer de données scientifiques pour compléter l’UI.
- Ne pas sauter un gate.
- Toute décision d’architecture durable reçoit un ADR.

## Reprise en 60 secondes
Lire `project-state.json`. Le champ `current_stage` donne le stage actif et `next_gate.required` la prochaine preuve attendue.

## En cas de divergence entre conversation et repo
La conversation la plus récente peut proposer un changement, mais le repo reste l’état exécutable. Mettre à jour le repo explicitement avant de considérer la décision durable.
