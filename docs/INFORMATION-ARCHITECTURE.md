# Future Edition — Information Architecture v2

## Principe

L'architecture humaine est organisée autour de **la compréhension des changements et des grandes questions persistantes**, pas autour du modèle d'objet interne.

L'architecture machine est organisée autour d'objets canoniques stables.

Les deux se rejoignent par les IDs canoniques, mais ne partagent pas la même navigation.

## Navigation humaine principale

V2 :
- **Aujourd'hui** — changements récents réellement significatifs ;
- **Observatoires** — grandes questions persistantes ;
- **Reality Check** — affirmations publiques confrontées aux preuves ;
- **Recherche** — retrouver questions, histoires et entités.

Ask Future Edition devient une destination primaire uniquement lorsqu'il est suffisamment fonctionnel pour mériter cette place.

Méthodologie, Sources, Corrections, Machine Access et pages de confiance restent secondaires.

## Home

La Home répond :
1. Qu'est-ce qui compte maintenant ?
2. Qu'est-ce qui a changé d'autre ?
3. Quelles grandes questions évoluent ?
4. Que faut-il surveiller ?
5. Où explorer ensuite ?

Structure recommandée :
- histoire éditoriale dominante ;
- histoires secondaires multi-domaines ;
- changements matériels récents ;
- Observatoires en mouvement ;
- Reality Check / correction lorsqu'il y en a ;
- exploration des grandes questions ;
- accès secondaire à la confiance et aux preuves.

La Home ne doit pas exposer tout le modèle interne.

## Article

Route humaine type : `/avance/:slug/`.

Profondeur par défaut :
- titre / chapô / visuel ;
- narration ;
- ce qui a changé ;
- pourquoi cela compte ;
- limites ;
- preuve à la demande ;
- sources ;
- ce qu'il faut surveiller ;
- historique/corrections ;
- vue expert/machine.

Une source originale reste accessible rapidement depuis une affirmation importante, mais les IDs ne sont pas une navigation primaire.

## Observatoire

Route humaine type : `/observatoires/:slug/`.

Ordre :
1. question ;
2. réponse/état actuel en langage naturel ;
3. date `as_of` ;
4. trajectoire et changements ;
5. jalons ;
6. approches ;
7. paysage de preuves ;
8. ce qu'il faut surveiller ;
9. historique ;
10. détail expert/machine.

## Reality Check

Entrée : une affirmation répétée publiquement.

Sortie :
- affirmation exacte ;
- preuves disponibles ;
- conclusion permise ;
- conclusion excessive ;
- confiance actuelle ;
- date `as_of` ;
- sources et corrections pertinentes.

## Recherche

Les résultats changent selon le type.

Question → état actuel.  
Article → changement + date.  
Source → provenance.  
Technologie → observatoires et changements récents.

Éviter de tout aplatir en cartes identiques.

## Machine IA

La découverte machine expose :
- index de types ;
- versions de schémas ;
- IDs / URIs canoniques ;
- état par `as_of` ;
- citations au niveau claim ;
- delta/change feed ;
- corrections/rétractations ;
- locators de source ;
- politique d'usage machine.

Les agents ne doivent pas devoir naviguer comme des humains.

## Parcours

Humain :

`Home → Article → Observatoire → Evidence → Source originale`

Machine :

`Question/Entity → Current State → Claims → Evidence → Source → Delta/History`

Ces parcours partagent la même vérité canonique.

## Mobile

Les destinations éditoriales principales restent accessibles en une action.

Ne pas imposer un dock de cinq destinations techniques uniquement parce qu'elles existent dans le modèle objet.

Le mobile peut simplifier plus fortement la navigation tout en conservant l'accès aux preuves et corrections.

## Conditions de rejet

Rejeter l'IA si :
- la Home est organisée autour de primitives internes ;
- l'utilisateur a besoin d'IDs pour naviguer ;
- historique et état courant sont ambigus ;
- un Observatoire est surtout une liste d'articles ;
- un Article commence par la méthodologie ;
- les représentations machine deviennent une seconde vérité ;
- la navigation technique étouffe la découverte éditoriale.
