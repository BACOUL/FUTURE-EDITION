# FE-06R — Capability Gate v2

**Status:** BLOCKED tant que le premier vrai Change canonique et la tranche verticale V2 n'existent pas.

Ce gate remplace le modèle de score MEDIA v1 pour l'acceptation produit.

Les anciens résultats FE-06R restent conservés comme historique ; ils ne prouvent pas la qualité du produit V2.

## Objet

Déterminer si Future Edition peut réellement devenir :

1. un média humain exceptionnel ;
2. une mémoire vivante et vérifiable des changements de connaissance ;
3. une couche de recherche structurée et fiable pour les agents IA.

Le gate doit pouvoir retourner **FAIL même si le HTML, les liens et tous les tests automatisés passent**.

## Préconditions

Avant d'évaluer la façade :

- au moins un vrai Change canonique issu d'une information réelle existe ;
- il relie état précédent → preuve → revue → nouvel état ;
- ce Change possède une représentation humaine et machine cohérente ;
- la Home contient plusieurs éléments éditoriaux réels ou indique honnêtement qu'il n'y a pas assez de matière actuelle ;
- le SHA candidat évalué est gelé.

Si une précondition manque : **BLOCKED**.

## G1 — Compréhension immédiate

Sans explication préalable, le premier écran doit rendre clair :
- qu'il s'agit d'un média ;
- quel sujet/changement important est présenté ;
- pourquoi il mérite l'attention.

**FAIL** si le lecteur doit comprendre le vocabulaire interne ou la méthodologie avant le sujet.

## G2 — Désir de poursuivre

La Home et l'Article doivent donner une raison crédible de continuer à lire.

**FAIL** si l'expérience ressemble d'abord à une documentation, un dashboard, une base de données ou une landing page produit.

## G3 — Densité éditoriale vivante

La Home doit démontrer un système média, pas un seul objet de démonstration.

Cible de la tranche V2 lorsque les données réelles existent :
- 1 histoire/changement dominant ;
- au moins 4 éléments secondaires significatifs ;
- plusieurs domaines ;
- Observatoires en mouvement ;
- Reality Check / correction / élément à surveiller lorsque pertinent.

**FAIL** si une seule archive historique, notamment la fusion 2022, porte l'essentiel de l'expérience.

## G4 — Direction artistique

Typographie, imagerie, rythme, composition et visualisation doivent former une identité éditoriale cohérente.

**FAIL** si la page pourrait être reproduite par un template SaaS/dashboard en changeant le texte, ou si l'originalité vient surtout de glow, gradients ou labels techniques.

## G5 — Qualité Article

Avec les panneaux expert/preuve fermés, les deux premiers écrans doivent rester un excellent article.

**FAIL** si la lecture est dominée par Before/Evidence/After, métadonnées ou dossier de preuve.

## G6 — Qualité Observatoire

L'Observatoire doit répondre d'abord à sa grande question en langage naturel, puis montrer trajectoire, jalons, approches, incertitudes et prochaines preuves.

**FAIL** si sa première impression est principalement celle d'un dashboard scientifique.

## G7 — Valeur distinctive Future Edition

Au moins trois capacités visibles doivent apporter quelque chose de réellement différent d'un média classique sans demander d'apprendre nos noms internes.

Exemples possibles :
- expliquer explicitement ce qui a réellement changé ;
- montrer l'évolution temporelle d'une grande question ;
- historique correction-aware ;
- Reality Check fondé sur les preuves ;
- expliquer quelle prochaine preuve changerait la réponse.

Ces exemples ne sont pas des composants UI imposés.

**FAIL** si la différence se résume à « nous utilisons l'IA », « nous citons des sources » ou à notre vocabulaire interne.

## G8 — Exécution mobile et desktop

360, 390, 768 et 1440 px doivent posséder une composition volontaire.

La QA géométrique automatique est nécessaire mais insuffisante.

**FAIL** si une surface s'effondre visuellement, devient dominée par les métadonnées ou perd sa hiérarchie éditoriale.

## Invariants scientifiques et de référence

Restent non négociables :
- aucune affirmation majeure non soutenue ;
- priorité aux sources primaires ;
- Claim → Evidence → Source → Locator ;
- temps et `as_of` explicites ;
- aucune correction/rétractation masquée ;
- aucun surclassement scientifique ;
- aucun état de jalon fabriqué ;
- objets canoniques déterministes ;
- human gate quand requis.

Toute violation critique : **FAIL**.

## Invariants agent-native

Le même état canonique doit supporter :
- identité stable ;
- citation au niveau claim ;
- source locator ;
- temporalité ;
- propagation des corrections ;
- abstention ;
- Agent Answer Packet ;
- représentation delta/change.

Toute divergence entre vérité humaine et vérité machine : **FAIL**.

## Règle d'automatisation

Les tests automatiques peuvent juger :
- intégrité ;
- liens ;
- géométrie ;
- accessibilité ;
- performance ;
- provenance ;
- schémas machine ;
- déterminisme.

Ils ne peuvent **pas attribuer de points affirmant que l'expérience média est bonne**.

Le champ `automated_points_passed` n'a plus d'autorité produit dans v2.

## Test des dix premières secondes

Une surface V2 est montrée sans explication.

Elle doit permettre de répondre :

1. Qu'est-ce que c'est ?
2. Qu'est-ce qui compte ici maintenant ?
3. Pourquoi Future Edition est-il différent ?

Si le produit lui-même ne répond pas à ces questions : itération ou FAIL.

## Verdict

**BLOCKED** — préconditions manquantes.

**FAIL** — un seul gate fondamental G1–G8 échoue ou un veto scientifique/référence/agent est déclenché.

**PROVED** — G1–G8 passent sur la tranche V2 gelée, les invariants scientifiques et machine passent, et un vrai Change canonique est démontré de bout en bout.

FE-07 à pleine échelle reste fermé tant que ce verdict n'est pas PROVED.
