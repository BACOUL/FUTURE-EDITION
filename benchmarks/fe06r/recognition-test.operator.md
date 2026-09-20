# FE-06R — Protocole opérateur du test de reconnaissance

Autorité : `recognition-test.protocol.json`

Ce test est un **human gate**. Aucun modèle IA, agent, contributeur du projet ou évaluateur préalablement briefé ne peut être compté parmi les cinq évaluateurs.

## Échantillon obligatoire
- exactement 5 évaluateurs humains indépendants ;
- familiers avec les médias numériques ;
- non contributeurs au projet ;
- aucune explication préalable de Future Edition, de ses primitives ou de sa proposition de valeur.

## Stimulus
Montrer les cinq captures dans l’ordre figé par le protocole :
1. R1 Home — 1440
2. R1 Home — 390
3. R2 Article — 1440
4. R3 Observatory — 390
5. R4 Methodology — 1440

Ne pas expliquer le produit entre les captures.

## Collecte
Pour chaque évaluateur :
1. utiliser la fiche `recognition-test.evaluator.md` ;
2. enregistrer la réponse verbatim à Q1–Q7 ;
3. ne jamais reformuler une réponse pour la rendre conforme ;
4. une fois les 7 réponses obtenues, appliquer les rubriques binaires ci-dessous ;
5. geler l’enregistrement avant de passer au verdict agrégé.

## Rubriques binaires
- `value_proposition_identified` : l’évaluateur comprend que le produit aide à savoir ce qui a réellement changé/progressé et sur quelles preuves.
- `change_evidence_state_identified` : la réponse identifie explicitement le lien entre changement, preuve et état/conclusion résultante.
- `main_subject_identified` : le sujet scientifique principal présenté est correctement reconnu.
- `information_evidence_uncertainty_distinguished` : l’évaluateur distingue contenu/affirmation, éléments de preuve, et limites/incertitude.
- `proprietary_representation_identified` : sans vocabulaire suggéré, l’évaluateur remarque au moins une représentation inhabituelle de la connaissance (par ex. avant→preuve→après, état, chronologie, contradiction, chaîne de preuve).
- `generic_news_or_saas_primary_description` : TRUE uniquement si l’évaluateur décrit le produit principalement comme un site d’actualité générique ou un dashboard SaaS sans reconnaître une fonction différente de représentation/validation de connaissance.
- `r2_continue` : l’évaluateur dit qu’il poursuivrait après le premier écran de l’article.
- `r1_lead_expectation_understood` : il attend en ouvrant le sujet une explication plus profonde du changement, de la preuve, des limites/état ou de la suite à surveiller.

## Saisie
Copier `recognition-test.responses.template.json` vers `recognition-test.results.json`, remplir les cinq évaluateurs, puis mettre le statut à `COLLECTED_FROZEN`.

Ne jamais modifier les seuils après collecte.

## Calcul
Exécuter :

`node benchmarks/fe06r/evaluate-recognition.mjs`

Le script refuse :
- moins ou plus de 5 évaluateurs ;
- un évaluateur non humain, non indépendant ou briefé ;
- une réponse verbatim vide ;
- une rubrique manquante ;
- un candidat différent du protocole ;
- un statut non gelé.

Le verdict est PASS uniquement si les huit seuils sont satisfaits.
