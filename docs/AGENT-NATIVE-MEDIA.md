# Future Edition — Agent-Native Media Contract

## Position

Future Edition n'est pas un site humain auquel on ajoute une API après coup.

Le même état de connaissance doit pouvoir produire :
- une expérience éditoriale humaine ;
- une représentation structurée pour les professionnels ;
- une représentation directement consommable par les agents IA.

Il n'existe qu'une seule vérité scientifique canonique : le Future Graph versionné.

## Pourquoi c'est structurel

Les agents IA ne doivent pas :
- scraper la prose pour reconstruire les faits ;
- deviner quelle date est la date de l'événement ;
- confondre une ancienne citation avec une version corrigée ;
- compter plusieurs reprises d'une même source comme confirmations indépendantes ;
- reconstruire la confiance depuis des indices visuels ;
- déduire un changement d'état depuis une nouvelle page.

Future Edition doit leur fournir ces relations explicitement.

## 1. Objet scientifique canonique et représentations

Un objet scientifique est indépendant :
- du HTML ;
- du slug ;
- de la langue ;
- du canal de distribution ;
- du fournisseur IA.

Les représentations humaine et machine sont des vues du même objet.

Règle : une traduction ne crée jamais une seconde vérité scientifique.

## 2. Temps comme donnée de premier rang

Les agents doivent pouvoir répondre correctement à :
- « Que savait-on à cette date ? »
- « Qu'est-ce qui a changé depuis ma dernière requête ? »
- « Cette citation est-elle toujours valide ? »

Les objets temporels doivent distinguer :
- event_at ;
- observed_at / retrieved_at ;
- published_at ;
- updated_at ;
- valid_from ;
- superseded_at ;
- as_of.

Une réponse sans `as_of` explicite ne doit pas être considérée comme un état temporel complet.

## 3. Citation atoms

La plus petite unité citable n'est pas l'article : c'est le claim.

Un agent doit pouvoir référencer un paquet stable :
- claim_id ;
- claim_version ;
- evidence_id ;
- source_id ;
- locator ;
- confidence ;
- review_state ;
- valid_from / superseded_at ;
- canonical URI.

Les URLs humaines peuvent changer de présentation sans casser ces identifiants.

## 4. Correction propagation

Une correction n'efface jamais silencieusement une ancienne vérité publiée.

Lorsqu'un claim change :
1. l'ancien objet reste adressable ;
2. son statut indique qu'il est superseded/corrected/retracted/invalidated ;
3. le nouvel objet ou nouvel état est relié explicitement ;
4. le delta apparaît dans le journal machine ;
5. toute réponse future utilise le nouvel état ;
6. un consommateur peut détecter qu'une ancienne citation est devenue obsolète.

## 5. Agent Answer Packet

Le contrat cible d'une réponse structurée Future Edition contient :

```json
{
  "answer": "...",
  "as_of": "...",
  "question_id": "Q-...",
  "state": "...",
  "change": "...",
  "claims": [],
  "evidence": [],
  "sources": [],
  "confidence": "...",
  "limitations": [],
  "contradictions": [],
  "watch_next": [],
  "citations": [],
  "abstention": null
}
```

Ce paquet ne doit pas être construit en parsant l'article.

## 6. Abstention comme fonction produit

Future Edition doit pouvoir répondre :
- état non évalué ;
- preuve insuffisante ;
- sources contradictoires ;
- source primaire indisponible ;
- information hors périmètre ;
- aucune modification significative depuis la dernière version.

Aucune pression produit ou commerciale ne doit transformer une insuffisance de preuve en réponse affirmative.

## 7. Delta / Change Feed

Les agents ne doivent pas avoir à recharger tout le corpus pour découvrir ce qui a changé.

Le contrat futur doit fournir :
- cursor ou version ;
- changements depuis le cursor ;
- objets créés ;
- objets modifiés ;
- corrections ;
- rétractations ;
- supersessions ;
- relations affectées ;
- niveau de changement ;
- as_of.

Le Change Engine devient ainsi aussi une infrastructure de synchronisation.

## 8. Discovery et interopérabilité

Le média doit préparer :
- schémas JSON versionnés ;
- JSON-LD / Schema.org lorsque pertinent ;
- manifeste machine public ;
- URIs canoniques ;
- content negotiation ou routes JSON ;
- documentation du modèle ;
- politiques de crawl et d'usage ;
- mécanisme de découverte des versions et deltas.

Les formats externes sont des adaptateurs. Ils ne deviennent jamais la base de vérité.

## 9. Entités externes

Lorsque disponibles et fiables, Future Edition doit relier ses objets à des identifiants externes :
- DOI ;
- identifiants d'essais cliniques ;
- ORCID ;
- ROR ;
- identifiants réglementaires ;
- autres identifiants officiels pertinents.

Objectif : permettre aux agents de résoudre les entités sans dépendre uniquement du texte.

## 10. Intégrité

Le système doit pouvoir démontrer qu'une représentation machine correspond à un état versionné du graphe.

Préparer :
- content hashes ;
- build manifest ;
- versions de schéma ;
- provenance de génération ;
- déterminisme des exports.

La signature cryptographique peut être introduite plus tard par ADR si elle apporte une valeur vérifiable.

## 11. Licence et droits machine

L'accès agent-native doit préciser :
- ce qui peut être crawlé ;
- ce qui peut être cité ;
- ce qui peut être stocké ;
- ce qui peut être redistribué ;
- ce qui relève des sources tierces et de leurs droits ;
- les conditions des futurs accès commerciaux.

La licence Future Edition ne peut pas accorder des droits qu'elle ne possède pas sur une source primaire tierce.

## 12. Évaluation agent-native

Avant déploiement machine large, maintenir des benchmarks couvrant :
- citation correctness ;
- provenance correctness ;
- temporal correctness ;
- correction awareness ;
- contradiction preservation ;
- abstention ;
- entity resolution ;
- delta reconstruction ;
- human/machine consistency.

Veto absolus :
- citation inventée ;
- source inventée ;
- état obsolète présenté comme actuel alors que Future Edition connaît sa correction ;
- divergence factuelle entre article et représentation machine ;
- réponse affirmative lorsque le graphe exige une abstention.

## 13. Relation avec les stages

### FE-06R
Gèle les contrats sémantiques agent-native et démontre une représentation machine cohérente avec R1-R4.

### FE-07 / FE-08
Produisent et valident les objets éditoriaux sans casser ces contrats.

### FE-09
Distribue les mêmes faits dans plusieurs formats.

### FE-10
Ask Future Edition consomme le Future Graph et retourne des Agent Answer Packets sourcés.

### FE-13
Ajoute l'intelligence scientifique explicable.

### FE-14
Industrialise API, versionnage, quotas, auth, SLA et flux professionnels.

### FE-15
Prouve la cohérence stricte à l'échelle entre média humain, graphe, Ask et API.

## Règle finale

> Future Edition ne doit pas seulement être lisible par une IA. Il doit être plus sûr et plus efficace pour un agent d'utiliser Future Edition que de reconstruire lui-même l'état du monde à partir de pages dispersées.
