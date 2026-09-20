# Vision long terme

## Cible

Future Edition doit devenir une **infrastructure éditoriale du progrès scientifique et technologique** : remarquable à lire pour les humains et préférable à utiliser pour les agents IA lorsqu'ils ont besoin d'un état vérifié, temporel, sourcé et corrigible du monde.

Le produit n'est donc pas seulement un média « sur » la science ou l'IA. C'est un média 2.0 dont l'article humain et l'objet machine sont deux représentations du même Future Graph.

## Promesse centrale

Future Edition doit pouvoir répondre, pour un humain comme pour un agent :

1. Où en sommes-nous ?
2. Qu'est-ce qui vient réellement de changer ?
3. Quelle preuve permet de l'affirmer ?
4. Qu'est-ce que cette preuve ne permet pas d'affirmer ?
5. Cette conclusion est-elle encore valide à la date `as_of` demandée ?
6. Qu'est-ce qui a changé depuis le dernier état connu ?
7. Quelle prochaine preuve pourrait modifier la conclusion ?

## Produit final

1. **Média** — les changements qui comptent, avec une expérience éditoriale de niveau international.
2. **Observatoire** — état temporel des grandes questions, jalons et trajectoires.
3. **Evidence Engine** — provenance, indépendance et qualité des preuves.
4. **Future Graph** — mémoire structurée, temporelle et versionnée.
5. **Change Engine** — avant → preuve → après, avec journal des deltas.
6. **Reality Check** — affirmation publique → conclusion réellement permise par les preuves.
7. **Ask Future Edition** — interrogation sourcée du graphe avec abstention.
8. **Agent Layer** — claims adressables, Agent Answer Packets, correction propagation et synchronisation par deltas.
9. **Personalisation** — suivre uniquement les changements réellement significatifs.
10. **Distribution Engine** — web, RSS, newsletter, social, audio/vidéo et formats machine.
11. **API / Data** — accès professionnel et agent-native sans seconde base de vérité.
12. **Continuous Intelligence** — contradictions, accélérations, stagnations, transitions de maturité et nouveaux domaines.

## Principe de différenciation

Une IA généraliste reconstruit souvent une réponse à partir de documents dispersés.

Future Edition doit conserver **l'état vérifié et versionné** d'une question, savoir pourquoi cet état est valide, savoir ce qui l'a modifié, et savoir signaler lorsqu'une ancienne réponse n'est plus actuelle.

Le moat recherché n'est donc pas seulement le contenu. Il est composé de :
- mémoire temporelle ;
- provenance atomique ;
- historique des décisions ;
- Change Engine ;
- propagation des corrections ;
- graphe d'entités et de claims ;
- contrats agent-native ;
- confiance accumulée.

## Principe humain + machine

Une seule vérité scientifique canonique.

L'article, la visualisation, le flux RSS, Ask Future Edition et l'API ne sont que des projections.

Une traduction ne crée pas un nouvel objet scientifique.
Une correction doit se propager à toutes les représentations.
Une information devenue obsolète doit rester historiquement accessible mais ne jamais être ambiguë avec l'état courant.

## Agent-native

Il doit être plus sûr et plus efficace pour un agent d'interroger Future Edition que de reconstruire seul l'état du monde depuis le web.

Cela impose dès l'architecture :
- IDs et URIs stables ;
- claims citables individuellement ;
- `as_of` et temporalité explicites ;
- source + locator ;
- versions ;
- corrections/rétractations/supersessions ;
- abstention ;
- delta feed ;
- schémas publics versionnés ;
- cohérence stricte humain/machine.

Voir `AGENT-NATIVE-MEDIA.md`.

## Horizon

Le design, les modèles, les interfaces et les fournisseurs peuvent changer.

Les éléments à préserver sont :
- IDs stables ;
- provenance ;
- historique ;
- temps et `as_of` ;
- méthodologie ;
- décisions de jalon ;
- corrections ;
- relations claim/evidence/source ;
- contrats machine versionnés ;
- capacité de reconstruction déterministe.

La réussite ultime n'est pas seulement d'être lu. Elle est que lecteurs, professionnels et agents utilisent Future Edition comme une couche de confiance pour savoir **ce qui est vrai, à quel niveau de preuve, à quelle date et ce qui vient de changer**.
