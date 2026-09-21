# Future Edition — Vision

## Définition

Future Edition construit une **mémoire vérifiable et continuellement mise à jour de l'évolution des connaissances scientifiques et technologiques**.

Cette mémoire possède deux faces qui utilisent la même vérité canonique :

- **média humain** — comprendre ce qui vient réellement de changer, pourquoi cela compte, ce que l'on savait avant, ce que la nouvelle preuve permet d'affirmer, ce qu'elle ne permet pas d'affirmer et ce qu'il faut surveiller ensuite ;
- **infrastructure machine** — permettre aux systèmes et agents IA d'obtenir le même état sous forme structurée, temporelle, sourcée, versionnée et corrigible sans devoir reconstruire la vérité depuis des pages dispersées.

Le média humain est l'interface.  
Le Future Graph est la mémoire.  
L'Evidence Engine vérifie les preuves.  
Le Change Engine enregistre les changements.  
La couche agent-native expose cette mémoire aux machines.

## North Star

> Future Edition doit devenir un endroit où un humain vient comprendre **ce qui a réellement changé**, tandis qu'un agent IA vient obtenir **le même changement** sous une forme directement vérifiable.

Il doit être plus sûr et plus efficace pour un agent d'utiliser Future Edition que de reconstruire seul l'état d'une question depuis le web.

## Questions fondamentales

Pour tout sujet couvert, Future Edition doit pouvoir répondre :

1. Où en sommes-nous maintenant ?
2. Qu'est-ce qui vient réellement de changer ?
3. Quelle preuve a provoqué ce changement ?
4. Quelle était la situation avant ?
5. Qu'est-ce que cette preuve ne permet pas de conclure ?
6. À quelle date cet état est-il valide ?
7. Quelles contradictions, corrections ou incertitudes existent ?
8. Quelle prochaine preuve pourrait modifier la conclusion ?

## Boucle produit canonique

```
Source du monde
   ↓
Evidence Engine
   ↓
Claim / Evidence / Source / Locator
   ↓
État précédent
   ↓
Revue
   ↓
Change canonique
   ↓
Nouvel état du Future Graph
   ↓
┌─────────────────────┬─────────────────────┐
│ Média humain        │ Représentation IA   │
│ récit / explication │ objet / delta / API │
└─────────────────────┴─────────────────────┘
```

Une publication ne crée jamais la vérité scientifique. Elle représente un état du graphe.

## Moat recherché

Le moat n'est pas une esthétique, un volume d'articles ou un modèle IA propriétaire. Il repose sur :

- mémoire temporelle ;
- provenance atomique ;
- claims adressables ;
- historique des états ;
- corrections et supersessions ;
- indépendance des sources ;
- décisions de revue ;
- Change Engine ;
- graphe d'entités et de relations ;
- delta feed ;
- confiance accumulée par la qualité et la traçabilité.

## Une vérité, plusieurs représentations

Il n'existe qu'une seule vérité scientifique canonique.

L'article, l'observatoire, Ask Future Edition, RSS, JSON, API et les futurs protocoles agents sont des projections du même Future Graph.

Une traduction ne crée pas une nouvelle vérité.  
Une correction doit se propager partout.  
Une ancienne réponse corrigée reste historiquement accessible mais ne peut pas être confondue avec l'état actuel.

## Règle de façade

**Façade simple, infrastructure profonde.**

Le lecteur humain ne doit pas avoir à comprendre le vocabulaire interne du système.

Les IDs, noms de schémas, niveaux techniques et contrats machine restent disponibles à la demande dans les couches preuve, méthodologie et machine, mais ne structurent jamais la lecture ordinaire.

## Réussite

Future Edition réussit lorsque :

- les humains reviennent pour comprendre des changements réels plutôt que suivre du bruit ;
- les professionnels peuvent remonter de toute conclusion importante à sa preuve ;
- les grandes questions possèdent un état actuel, un historique et des prochaines conditions observables ;
- les corrections sont visibles et propagées ;
- des agents IA utilisent Future Edition comme couche de recherche et de confiance parce que cela leur fait économiser du crawling, de la résolution, de la vérification et de la reconstruction temporelle.

Voir aussi : `CONSTITUTION.md`, `MEDIA-PRODUCT.md`, `AGENT-NATIVE-MEDIA.md` et `PRODUCT-RESET.md`.
