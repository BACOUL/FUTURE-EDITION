# Milestone state resolution

## Règle
Le statut d’un jalon n’est jamais stocké dans sa définition.

Il est dérivé des objets `Assessment`.

## Résolution
1. ignorer les propositions non approuvées pour l’état public ;
2. prendre les Assessment `human_approved` du jalon ;
3. éliminer les Assessment explicitement superseded par un Assessment approuvé plus récent ;
4. il doit rester exactement un terminal ;
5. s’il n’existe aucun Assessment approuvé : `unassessed` ;
6. s’il existe plusieurs terminaux : **ambiguïté bloquante**, aucune sélection arbitraire.

## Pourquoi
Cette règle permet :
- historique complet ;
- recul ou invalidation ;
- correction sans effacement ;
- reconstruction de l’état à une date donnée à terme ;
- audit de la décision qui a fait changer le radar.

## Extension future
FE-04 utilisera cette chaîne pour calculer le delta avant/après et déterminer si un événement change réellement un jalon.
