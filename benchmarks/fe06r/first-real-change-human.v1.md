# FE-06R1 — Premier Change canonique réel

**Statut :** représentation humaine canonique gelée  
**Change :** `CHANGE-000001`  
**Question :** Q-008 — Une IA peut-elle faire des découvertes scientifiques originales ?  
**Jalon :** Q-008-M3 — Validation expérimentale  
**État valable au :** 19 mai 2026

## Ce qui a réellement changé

Le jalon Q-008-M3 reste **atteint**. Ce que Robin change n’est pas le statut du jalon, mais le niveau de confiance associé à cet état.

Avant Robin, le corpus Future Edition contenait déjà plusieurs exemples où un système d’IA avait produit une sortie ensuite confrontée au monde expérimental ou à une validation externe. Cet ensemble permettait de soutenir Q-008-M3 avec une confiance **solid_preliminary**.

L’article évalué par les pairs sur Robin ajoute un cas distinct : le système a généré des hypothèses thérapeutiques et des directions expérimentales pour la dégénérescence maculaire liée à l’âge sèche, puis des chercheurs humains ont testé en laboratoire des candidats proposés. Les essais ont notamment trouvé une amélioration de la phagocytose de l’épithélium pigmentaire rétinien avec ripasudil et KL001, avec reproduction de l’effet du ripasudil dans des cellules RPE humaines primaires.

Future Edition enregistre donc un **evidence_upgrade** : Q-008-M3 reste `met`, tandis que la confiance passe de `solid_preliminary` à `confirmed`.

## Avant

- Assessment : `ASSESS-000001`
- État : `met`
- Confiance : `solid_preliminary`
- Valide à partir du : 29 novembre 2023
- Hash d’état : `ac63c074bccd3c87c7eda49dab6c3f909115a668663202e254ce68a13378ecbf`

## Nouvelle preuve

- Événement : `EV-2026-008006`
- Claim : `CLAIM-050051`
- Evidence : `EVID-050051`
- Source : `SRC-050051`
- Publication : *A multi-agent system for automating scientific discovery*
- Source originale : https://doi.org/10.1038/s41586-026-10652-y
- Locator : Abstract; Results around Fig. 4; Methods and author-contribution sections.

## Maintenant

- Assessment : `ASSESS-000002`
- État : `met`
- Confiance : `confirmed`
- Valide à partir du : 19 mai 2026
- Hash d’état : `34fa5b9b6d44790534db98877644e64b9d133a29928a142b246793cc5f0c1ff8`

## Ce que cela ne prouve pas

- Robin n’a pas exécuté de manière autonome les expériences de laboratoire : elles ont été réalisées par des chercheurs humains.
- Le workflow Robin n’a pas, à lui seul, fait l’objet d’une réplication indépendante démontrée ici.
- Le résultat n’établit pas une efficacité clinique contre la dégénérescence maculaire liée à l’âge sèche.
- Cette preuve ne suffit pas à satisfaire Q-008-M4 ou Q-008-M5.

## Revue humaine

- `REVIEW-000001` approuve l’état précédent.
- `REVIEW-000002` approuve l’état après Robin et la classification `evidence_upgrade`.

## Chaîne vérifiable

`SRC-050051 → EVID-050051 → CLAIM-050051 → EV-2026-008006 → ASSESS-000002 → REVIEW-000002 → CHANGE-000001`

Cette page est une projection humaine du registre canonique. Elle ne crée aucune vérité scientifique indépendante du Future Graph.
