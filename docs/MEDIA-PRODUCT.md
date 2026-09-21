# Future Edition — Media Product v2

## Produit

Future Edition n'est ni un site d'actualité classique avec un widget de preuve, ni un dashboard scientifique.

C'est l'interface humaine d'un système de connaissance vivant.

Le produit public doit permettre de comprendre naturellement :

- ce qui compte maintenant ;
- ce qui a réellement changé ;
- pourquoi cela compte ;
- ce que les preuves permettent d'affirmer ;
- ce qui reste incertain ;
- où en est la grande question concernée ;
- ce qui pourrait changer ensuite.

## Deux produits, une seule vérité

### Human Edition

L'édition humaine doit être désirable même si le lecteur n'ouvre jamais la méthodologie.

Elle comprend :

- une Home éditoriale vivante ;
- des Articles / Avancées ;
- des Observatoires persistants ;
- des Reality Checks ;
- la recherche ;
- l'historique des corrections ;
- les preuves et sources accessibles à la demande.

### Machine Edition

L'édition machine expose la même connaissance canonique via :

- IDs et URIs stables ;
- citations au niveau claim ;
- source + locator ;
- temps et `as_of` explicites ;
- versions ;
- correction / rétractation / supersession ;
- Agent Answer Packets ;
- delta feeds ;
- future API et adaptateurs agents.

La couche machine ne doit jamais être reconstruite en parsant la prose humaine.

## Home

La Home est une une de média, pas une démonstration du produit.

Elle doit contenir, lorsque les données réelles le permettent :

1. une histoire/changement principal ;
2. plusieurs changements secondaires dans des domaines différents ;
3. une vue compacte de ce qui a réellement changé récemment ;
4. des Observatoires / grandes questions qui évoluent ;
5. un Reality Check ou une correction lorsque pertinent ;
6. des routes claires vers la lecture, les preuves et l'exploration.

Le contenu historique peut servir de contexte ou d'archive. Il ne doit jamais être maquillé en actualité.

## Article

Ordre de lecture par défaut :

1. titre ;
2. visuel ;
3. chapô ;
4. narration et contexte ;
5. ce qui change ;
6. pourquoi cela compte ;
7. limites / ce que cela ne prouve pas ;
8. preuves et sources ;
9. ce qu'il faut surveiller ;
10. historique / corrections ;
11. détails expert et machine.

L'article doit être excellent avant même que les panneaux de preuve soient ouverts.

## Observatoire

Un Observatoire est un objet éditorial persistant autour d'une grande question.

Il répond d'abord en langage humain, puis montre :

- état actuel ;
- date `as_of` ;
- trajectoire ;
- jalons ;
- approches concurrentes ;
- changements matériels ;
- contradictions / incertitudes ;
- prochaines preuves attendues ;
- historique.

Il ne doit pas donner d'abord l'impression d'un dashboard.

## Progressive disclosure

Un même objet canonique peut avoir plusieurs profondeurs :

**30 secondes** — comprendre le changement et pourquoi il compte.  
**3 minutes** — comprendre le contexte, les preuves, les limites et la suite.  
**Expert** — claims, locators, contradictions, chronologie et revue.  
**Agent** — objet structuré, versions, citations et deltas.

Ce sont des vues de la même vérité, pas des contenus indépendants.

## Règle de langage

Le vocabulaire interne n'est pas le langage éditorial par défaut.

Les IDs, noms de schémas et concepts comme STATE ROOM, EVIDENCE SPINE, Agent Dock ou équivalents peuvent exister dans les vues expert/machine si utiles, mais ne doivent jamais être nécessaires pour comprendre le média.

## Règle visuelle

L'identité vient de la hiérarchie éditoriale et de la valeur de l'information, pas d'un futurisme décoratif.

Utiliser :
- typographie forte ;
- photographie, imagerie scientifique, illustration et data-viz lorsque pertinentes ;
- compositions variées selon le contenu ;
- repères temporels et de preuve clairs ;
- densité mobile maîtrisée ;
- accessibilité.

Éviter :
- glow/gradients IA génériques ;
- grilles de cartes répétitives ;
- chrome de dashboard ;
- labels techniques décoratifs ;
- visualisations suggérant une mesure inexistante.

## Fraîcheur éditoriale

Future Edition est événementiel, pas piloté par un quota.

« Rien d'important n'a changé » est une sortie valide.

Le site ne doit jamais utiliser une archive comme faux contenu actuel.

## Critère humain

Un visiteur doit pouvoir répondre sans explication :

1. Qu'est-ce que c'est ?
2. Qu'est-ce qui est important maintenant ?
3. Pourquoi ce média est-il différent ?
4. Pourquoi revenir ?

## Critère machine

Un agent doit pouvoir obtenir le même état de connaissance avec moins de reconstruction et une meilleure provenance qu'en repartant du web brut.
