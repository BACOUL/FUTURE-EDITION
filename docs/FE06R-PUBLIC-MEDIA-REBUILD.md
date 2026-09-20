# FE-06R — Public Media Rebuild

## Pourquoi FE-06R existe

FE-06 a prouvé la chaîne technique de publication : pages statiques, relations de preuve, accessibilité de base, responsive, absence de surclassement scientifique et traçabilité vers les sources.

Cette preuve technique ne suffit pas à matérialiser la cible produit décrite dans `MEDIA-PRODUCT.md`, `VISION.md`, `METHODOLOGY.md` et `LAUNCH-GATES.md`.

FE-06R reconstruit la couche publique sans modifier FE-01 → FE-05.

## Positionnement produit

Future Edition doit devenir la couche de référence qui permet de comprendre :

1. ce qui vient réellement de changer ;
2. pourquoi ce changement compte ;
3. quel était l'état précédent ;
4. ce que les preuves permettent d'affirmer ;
5. ce qu'elles ne permettent pas encore d'affirmer ;
6. ce qu'il faut surveiller ensuite.

Le média visible doit servir trois publics simultanément :
- grand public exigeant ;
- professionnels, chercheurs et journalistes ;
- systèmes IA et usages machine-readable.

## Architecture publique cible

### Parcours éditorial
Accueil → Aujourd'hui → Avancée / Article → Dossier de preuve → Source originale

### Parcours observatoire
Observatoires → Question → État actuel → Jalons → Chronologie → Avancées associées → Preuves

### Surfaces transversales
Reality Check · Recherche · Méthodologie · Sources · Corrections · À propos · Responsabilité éditoriale

## Règles éditoriales

- Les 50 événements FE-05 sont un socle historique, pas un flux d'actualité.
- Une page « Aujourd'hui » ne recycle pas un événement ancien comme s'il était récent.
- Une preuve n'est pas un article.
- Un article n'est jamais la base de vérité : il représente des objets du Future Graph.
- Toute affirmation importante descend vers une preuve et une source.
- Les limites, contradictions, résultats négatifs, corrections et rétractations restent visibles.
- Une absence de nouveauté validée peut être affichée honnêtement.

## Modèle Avancée / Article

Chaque article de référence doit exposer au minimum :
- titre éditorial ;
- chapô ;
- visuel éditorial original ou sous licence compatible ;
- date de publication et dernière mise à jour ;
- question / observatoire ;
- technologie ;
- niveau de preuve ;
- ce qui vient de changer ;
- état précédent ;
- nouvelle preuve ;
- conséquence raisonnable ;
- pourquoi cela compte ;
- ce que cela ne prouve pas ;
- limites ;
- prochaine étape à surveiller ;
- références numérotées ;
- lien vers le dossier de preuve ;
- provenance machine-readable ;
- historique des corrections lorsque nécessaire.

## Système visuel

Le design ne doit pas être une succession uniforme de cartes sombres bordées.

Il doit utiliser :
- hiérarchie éditoriale forte ;
- photographie, illustration ou data-visualisation quand elle apporte une information ;
- compositions différentes selon le type de contenu ;
- rythme typographique de magazine ;
- couleurs et signatures visuelles par domaine ;
- visualisations de temps, maturité, preuve et changement ;
- densité réduite sur mobile ;
- accessibilité et performance conservées.

Les visuels doivent respecter `COPYRIGHT-AND-SOURCES.md`.

## Les 4 surfaces de référence

Aucune généralisation aux 64 pages avant validation de ces quatre surfaces.

### R1 — Home
Doit rendre immédiatement visibles :
- la proposition de valeur ;
- un sujet éditorial majeur ;
- ce qui est nouveau vs historique ;
- le niveau de preuve ;
- les observatoires ;
- le principe avant → preuve → après ;
- la profondeur Future Graph ;
- des éléments visuels de niveau média international.

### R2 — Article / Avancée
Doit démontrer le parcours lecteur → explication → limites → preuve → source.

### R3 — Observatoire
Doit remplacer le faux « radar décoratif » par une représentation informative :
- état évalué si disponible ;
- sinon absence d'évaluation clairement expliquée ;
- jalons ;
- trajectoire temporelle ;
- technologies ;
- dernières avancées ;
- prochaines preuves attendues.

### R4 — Méthodologie
Doit matérialiser la vraie chaîne :
Signal → Source primaire → Authenticité → Statut → Claim → Evidence → Limites → Contradiction → Réplication → État précédent → Changement proposé → Revue humaine → Publication.

Elle doit également exposer :
- hiérarchie de sources A-D ;
- échelles M0-M7, T0-T7, S0-S5 ;
- confiance ;
- rôle exact de l'IA ;
- corrections et rétractations ;
- Change Engine ;
- Future Graph.

## Gate FE-06R

FE-06R ne peut être PROVED que si :

### Produit
- Home de référence validée.
- Au moins 1 véritable article/avancée complet.
- Au moins 1 observatoire de référence complet.
- Méthodologie complète et crédible.
- Distinction explicite entre actualité et historique.
- Aucune preuve brute utilisée comme substitut à un article.

### Visuel
- QA réelle à 360, 390, 768, 1440 px.
- Aucun overflow critique.
- Les 4 surfaces ne partagent pas une composition répétitive unique.
- Au moins un langage visuel propre : illustration, photo licenciée ou data-viz.
- Le mobile possède sa propre hiérarchie de contenu.

### Scientifique
- Aucun changement d'état de jalon sans Change validé.
- Toute affirmation importante possède une chaîne de preuve.
- Les limites pertinentes sont visibles.
- Les titres ne dépassent pas la preuve.
- Les sources originales et leur provenance restent accessibles.

### Confiance
- Méthodologie complète.
- À propos.
- Responsabilité éditoriale.
- Politique de correction.
- Sources.
- Signaler une erreur / contact.

### Machine-readable
- IDs stables.
- Article relié aux objets Question, Technology, Event, Claim, Evidence et Source concernés.
- Métadonnées structurées préparées pour FE-15/API.
- Aucune duplication de vérité scientifique par langue.

## Ordre d'exécution

1. Geler cette spécification.
2. Construire R1 Home.
3. QA R1.
4. Construire R2 Article.
5. Construire R3 Observatoire.
6. Construire R4 Méthodologie.
7. QA des 4 surfaces.
8. Généraliser aux autres routes.
9. Ajouter les pages de confiance.
10. QA complète et preuve FE-06R.
11. Débloquer FE-07.

## Interdiction de progression

FE-07 peut être préparé techniquement mais ne doit pas définir le modèle public de publication tant que FE-06R n'est pas PROVED.
