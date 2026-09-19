# Operating model

## But
Empêcher Future Edition de dériver au fil des conversations, modèles IA et versions techniques.

## Au début de chaque mission
1. Lire `project-state.json`.
2. Lire la Constitution.
3. Lire le programme du stage actif.
4. Examiner les artefacts existants avant toute modification.
5. Ne pas ouvrir un stage futur pour contourner un échec du stage courant.

## Pendant une mission
- Les changements structurants reçoivent un ADR.
- Les données scientifiques ne sont pas inventées pour rendre l’interface plus convaincante.
- Un test échoué reste visible jusqu’à correction.
- Une fonctionnalité ne justifie pas de casser un invariant.

## Fin de mission
Mettre à jour `project-state.json` uniquement si une preuve matérialisée dans le repo justifie le nouvel état.

## Politique de freeze
Un stage PROVED devient une dépendance gelée. Toute modification ultérieure doit :
1. expliquer pourquoi elle est nécessaire ;
2. démontrer la non-régression ;
3. mettre à jour l’ADR concerné si l’architecture change.

## GitHub Actions
Les Actions ne définissent pas le moteur. Elles ne font qu’exécuter automatiquement des commandes locales déjà prouvées. Jusqu’à leur activation, le projet avance normalement via les mêmes scripts exécutés manuellement.
