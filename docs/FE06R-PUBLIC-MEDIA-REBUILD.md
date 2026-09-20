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

La définition normative du verdict est désormais `docs/FE06R-GATE.md`.

Cette spécification décrit le produit à construire ; `FE06R-GATE.md` décrit comment il est accepté ou rejeté.

Les autorités d'expérience sont :
- `DESIGN-SYSTEM-VISION.md` pour la grammaire visuelle et les primitives propriétaires ;
- `INFORMATION-ARCHITECTURE.md` pour la navigation, les routes, la profondeur de lecture et les relations entre surfaces.

La Home R1 déjà prouvée techniquement avant ces documents doit être réévaluée et peut nécessiter une reconstruction. Sa preuve historique n'est pas une preuve du gate v1.

### Machine-readable / agent-native
- IDs stables.
- Article relié aux objets Question, Technology, Event, Claim, Evidence et Source concernés.
- Une seule vérité scientifique canonique, indépendante de la langue et de la présentation.
- Temporalité explicite : événement, observation/récupération, publication, mise à jour, validité et `as_of`.
- Claims majeurs adressables individuellement avec preuve, source, locator, confiance et version.
- Corrections, rétractations et supersessions détectables par une machine.
- Contrat Agent Answer Packet et delta/change feed défini avant généralisation.
- L'API commerciale complète reste FE-14, mais son modèle sémantique ne peut pas être inventé après le média.

Voir `AGENT-NATIVE-MEDIA.md`.

## Gate d'autorité

Le gate complet et mesurable est `FE06R-GATE.md`.

Les quatre portes sont non compensables :
- MEDIA ≥ 85/100 ;
- INTELLIGENCE ≥ 90/100 ;
- REFERENCE ≥ 95/100 ;
- AGENT-NATIVE ≥ 95/100.

Toute condition éliminatoire du gate entraîne `FAIL`, quel que soit le score total.

## Ordre d'exécution

1. Geler spécification, design system et information architecture.
2. Construire le shell global et la navigation desktop/mobile.
3. Construire les primitives Delta et State Plate.
4. Construire R2 Article de référence + Evidence Spine sur un vrai sujet.
5. Reconstruire R1 Home autour de ce même sujet réel.
6. Construire R3 Observatory + temporalité.
7. Construire R4 Méthodologie.
8. Construire un Reality Check complet.
9. Implémenter la représentation machine du même objet scientifique.
10. QA des surfaces et test de reconnaissance Future Edition.
11. Généraliser seulement après PASS.
12. Ajouter les pages de confiance.
13. QA complète et preuve FE-06R.
14. Débloquer FE-07.

## Interdiction de progression

FE-07 peut être préparé techniquement mais ne doit pas définir le modèle public de publication tant que FE-06R n'est pas PROVED.
