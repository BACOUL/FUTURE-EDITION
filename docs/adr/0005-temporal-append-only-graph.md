# ADR-0005 — Temporal append-only Future Graph

**Décision :** les objets sensibles du Future Graph portent un temps d’observation et, lorsque pertinent, une fenêtre de validité. Les corrections utilisent `supersedes_*` et des objets Review au lieu d’écraser silencieusement l’état précédent.

## Pourquoi
Future Edition doit pouvoir répondre non seulement « qu’est-ce qui est vrai maintenant ? », mais aussi « qu’est-ce que nous pensions avant, qu’est-ce qui a changé et pourquoi ? ».

## Règles
- IDs stables et non réutilisés ;
- correction = nouvel objet ou nouvelle décision, pas mutation historique opaque ;
- contradictions coexistent ;
- `independence_group` évite de compter plusieurs reprises comme plusieurs confirmations ;
- graph build déterministe et sans timestamp de génération dans le contenu canonique ;
- `content_hash` identifie le graphe logique.

## Conséquence
Le Future Graph devient une mémoire temporelle auditable, compatible avec les futurs Change Engine, Ask Future Edition et API.
